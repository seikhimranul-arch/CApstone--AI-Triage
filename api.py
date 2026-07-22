#!/usr/bin/env python3
"""
FastAPI Backend Server for AI Triage Assistant
Exposes FHIR parsing, clinical summarization, and patient management endpoints
"""

import os
import json
import asyncio
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

# Phase 2 imports
from engine.models import (
    SymptomIntake, TriageContext, ABHAConsent, ConsentStatus,
    ConsentRequest, ConsentCallback, Symptom, Vitals, SymptomSeverity,
    validate_abha_id, PHC_SYMPTOM_LIST
)
from engine.abha_mock import get_mock_abdm_service
from engine.merge import get_context_merger
from engine.triage import get_differential_engine

# Import our engine modules
import sys

load_dotenv()

sys.path.append(str(Path(__file__).parent.parent))
from engine.parser import parse_fhir_bundle
from engine.summarizer import ClinicalSummarizer, summarize_patient
from eval.checklist import evaluate_summary


# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

app = FastAPI(
    title="AI Triage Assistant API",
    description="Clinical decision support for ABHA-linked PHCs",
    version="1.0.0"
)

# CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize summarizer with Gemini
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GOOGLE_API_KEY not set - using fallback mode")

summarizer = ClinicalSummarizer(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

PATIENTS_DIR = Path(__file__).parent / "data" / "patients"


# ──────────────────────────────────────────────
# Pydantic Models
# ──────────────────────────────────────────────

class PatientFile(BaseModel):
    filename: str
    archetype: str
    id: str
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    abha_id: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class PatientSummary(BaseModel):
    patient_id: str
    one_liner: str
    active_problems: List[Dict[str, Any]]
    red_flags: List[Dict[str, Any]]
    chronic_snapshot: Dict[str, Any]
    medications: List[Dict[str, Any]]
    missing_data: List[str]
    encounter_count: int
    last_encounter_days: Optional[int]


class EvaluationResult(BaseModel):
    score: float
    passed: int
    total: int
    details: Dict[str, bool]
    pass_threshold: bool


class SummarizeRequest(BaseModel):
    patient_id: str = Field(..., description="Patient file ID (without .json)")
    use_fallback: bool = Field(False, description="Force fallback mode")


class SummarizeResponse(BaseModel):
    success: bool
    summary: Optional[PatientSummary] = None
    evaluation: Optional[EvaluationResult] = None
    error: Optional[str] = None
    processing_time_ms: float


class BatchEvaluationRequest(BaseModel):
    archetype: Optional[str] = None
    limit: int = 50


# ──────────────────────────────────────────────
# Phase 2: ABHA Integration & Symptom Intake Models
# ──────────────────────────────────────────────

class ABHAIdRequest(BaseModel):
    abha_id: str = Field(..., pattern=r"^\d{14}$", description="14-digit ABHA ID")


class ConsentRequest(BaseModel):
    abha_id: str = Field(..., pattern=r"^\d{14}$")
    purpose: str = "TRIAGE"
    hi_types: List[str] = Field(default_factory=lambda: [
        "Condition", "MedicationRequest", "Observation", 
        "Encounter", "DiagnosticReport", "AllergyIntolerance"
    ])
    expiry_hours: int = Field(default=24, ge=1, le=168)
    redirect_url: Optional[str] = None


class SymptomEntry(BaseModel):
    icd11_code: str = Field(..., pattern=r"^[A-Z]{2}\d{2}$")
    display: str
    duration_days: int = Field(..., ge=0, le=3650)
    severity: str = Field(default="moderate", pattern="^(mild|moderate|severe)$")
    onset_date: Optional[str] = None
    notes: str = ""


class VitalsInput(BaseModel):
    bp_systolic: Optional[int] = Field(default=None, ge=40, le=300)
    bp_diastolic: Optional[int] = Field(default=None, ge=20, le=200)
    temperature: Optional[float] = Field(default=None, ge=30.0, le=45.0)
    respiratory_rate: Optional[int] = Field(default=None, ge=0, le=100)
    spo2: Optional[int] = Field(default=None, ge=0, le=100)
    pulse: Optional[int] = Field(default=None, ge=0, le=300)
    weight: Optional[float] = Field(default=None, ge=0.5, le=300.0)
    height: Optional[float] = Field(default=None, ge=20.0, le=250.0)


class SymptomIntakeRequest(BaseModel):
    abha_id: Optional[str] = Field(default=None, pattern=r"^\d{14}$")
    patient_name: Optional[str] = None
    age: Optional[int] = Field(default=None, ge=0, le=150)
    gender: Optional[str] = Field(default=None, pattern="^[MFO]$")
    symptoms: List[SymptomEntry] = Field(default_factory=list)
    vitals: VitalsInput = Field(default_factory=VitalsInput)
    free_text: str = ""


class ConsentCallback(BaseModel):
    consent_id: str
    status: str
    artefact: Optional[dict] = None
    error: Optional[str] = None


class TriageContextResponse(BaseModel):
    intake_id: str
    abha_id: Optional[str]
    merged_conditions: List[Dict[str, Any]]
    merged_medications: List[Dict[str, Any]]
    merged_vitals: Dict[str, Any]
    merged_lab_reports: List[Dict[str, Any]]
    conflicts: List[Dict[str, Any]]
    red_flags: List[Dict[str, Any]]
    ready_for_triage: bool
    has_block_conflicts: bool
    has_warnings: bool


# ──────────────────────────────────────────────
# Helper Functions
# ──────────────────────────────────────────────

def get_patient_files(archetype: Optional[str] = None) -> List[PatientFile]:
    """Get list of available patient files with mock demographics"""
    MOCK_PATIENTS = {
        "uncontrolled_dm_001": {"name": "Ravi Kumar", "age": 57, "gender": "M", "abha_id": "12345678901234", "phone": "+91-9876543210", "address": "Hyderabad, Telangana"},
        "uncontrolled_dm_002": {"name": "Sunita Devi", "age": 62, "gender": "F", "abha_id": "23456789012345", "phone": "+91-9876543211", "address": "Warangal, Telangana"},
        "uncontrolled_dm_003": {"name": "Mahesh Patel", "age": 48, "gender": "M", "abha_id": "34567890123456", "phone": "+91-9876543212", "address": "Karimnagar, Telangana"},
        "missed_tb_fu_001": {"name": "Anitha Reddy", "age": 45, "gender": "F", "abha_id": "45678901234567", "phone": "+91-9876543213", "address": "Nalgonda, Telangana"},
        "missed_tb_fu_002": {"name": "Rajesh Singh", "age": 38, "gender": "M", "abha_id": "56789012345678", "phone": "+91-9876543214", "address": "Khammam, Telangana"},
        "missed_tb_fu_003": {"name": "Lakshmi Bai", "age": 52, "gender": "F", "abha_id": "67890123456789", "phone": "+91-9876543215", "address": "Mahabubnagar, Telangana"},
        "polypharmacy_elderly_001": {"name": "Venkatesh Rao", "age": 72, "gender": "M", "abha_id": "78901234567890", "phone": "+91-9876543216", "address": "Nizamabad, Telangana"},
        "polypharmacy_elderly_002": {"name": "Parvathi Amma", "age": 68, "gender": "F", "abha_id": "89012345678901", "phone": "+91-9876543217", "address": "Adilabad, Telangana"},
        "polypharmacy_elderly_003": {"name": "Gopal Krishna", "age": 75, "gender": "M", "abha_id": "90123456789012", "phone": "+91-9876543218", "address": "Medak, Telangana"},
        "high_risk_anc_001": {"name": "Priya Sharma", "age": 28, "gender": "F", "abha_id": "10234567890123", "phone": "+91-9876543219", "address": "Rangareddy, Telangana"},
        "high_risk_anc_002": {"name": "Fatima Begum", "age": 32, "gender": "F", "abha_id": "21345678901234", "phone": "+91-9876543220", "address": "Hyderabad, Telangana"},
        "high_risk_anc_003": {"name": "Savithri Devi", "age": 25, "gender": "F", "abha_id": "32456789012345", "phone": "+91-9876543221", "address": "Secunderabad, Telangana"},
        "faltering_growth_001": {"name": "Arjun Rao", "age": 2, "gender": "M", "abha_id": "43567890123456", "phone": "+91-9876543222", "address": "Vijayawada, Andhra Pradesh"},
        "faltering_growth_002": {"name": "Meena Kumari", "age": 3, "gender": "F", "abha_id": "54678901234567", "phone": "+91-9876543223", "address": "Guntur, Andhra Pradesh"},
        "faltering_growth_003": {"name": "Suresh Babu", "age": 1, "gender": "M", "abha_id": "65789012345678", "phone": "+91-9876543224", "address": "Visakhapatnam, Andhra Pradesh"},
    }
    
    if not PATIENTS_DIR.exists():
        return []
    
    files = []
    for f in PATIENTS_DIR.glob("*.json"):
        if archetype and not f.name.startswith(archetype):
            continue
        parts = f.stem.split("_")
        if len(parts) >= 2:
            meta = MOCK_PATIENTS.get(f.stem, {})
            files.append(PatientFile(
                filename=f.name,
                archetype=parts[0],
                id=f.stem,
                name=meta.get("name"),
                age=meta.get("age"),
                gender=meta.get("gender"),
                abha_id=meta.get("abha_id"),
                phone=meta.get("phone"),
                address=meta.get("address"),
            ))
    return files


def load_patient_context(patient_id: str) -> Dict[str, Any]:
    """Load and parse a patient's FHIR bundle"""
    filepath = PATIENTS_DIR / f"{patient_id}.json"
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    
    return parse_fhir_bundle(str(filepath))


# ──────────────────────────────────────────────
# API Endpoints
# ──────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "AI Triage Assistant API",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "patients": "/api/patients",
            "summarize": "/api/summarize",
            "evaluate": "/api/evaluate",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "gemini_configured": GEMINI_API_KEY is not None,
        "patients_available": len(get_patient_files())
    }


@app.get("/api/patients", response_model=List[PatientFile])
async def list_patients(
    archetype: Optional[str] = Query(None, description="Filter by archetype"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List all available synthetic patients"""
    files = get_patient_files(archetype)
    return files[offset:offset + limit]


@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: str):
    """Get raw patient context (parsed FHIR)"""
    context = load_patient_context(patient_id)
    return context


@app.get("/api/patients/{patient_id}/timeline")
async def get_patient_timeline(patient_id: str):
    """Get day-by-day clinical timeline for a patient"""
    context = load_patient_context(patient_id)
    return {
        "patient_id": patient_id,
        "day_timeline": context.get("day_timeline", []),
        "total_days": len(context.get("day_timeline", []))
    }


# ──────────────────────────────────────────────
# Enriched Patient ABHA Records (mock)
# ──────────────────────────────────────────────

MOCK_VITALS_HISTORY = {
    "uncontrolled_dm": [
        {"date": "2026-07-15", "bp_systolic": 152, "bp_diastolic": 96, "pulse": 98, "temperature": 37.0, "spo2": 96, "weight": 78.5, "note": "BP slightly elevated, continue current meds"},
        {"date": "2026-06-15", "bp_systolic": 148, "bp_diastolic": 92, "pulse": 94, "temperature": 36.8, "spo2": 97, "weight": 79.0, "note": "Stable but suboptimal control"},
        {"date": "2026-05-20", "bp_systolic": 155, "bp_diastolic": 98, "pulse": 100, "temperature": 37.2, "spo2": 95, "weight": 79.8, "note": "Hypertension not controlled, increased Telmisartan to 80mg"},
        {"date": "2026-04-10", "bp_systolic": 145, "bp_diastolic": 90, "pulse": 92, "temperature": 36.9, "spo2": 97, "weight": 80.2, "note": "Routine follow-up"},
    ],
    "missed_tb_fu": [
        {"date": "2026-07-10", "bp_systolic": 118, "bp_diastolic": 76, "pulse": 102, "temperature": 37.8, "spo2": 94, "weight": 48.0, "note": "Persistent fever, weight loss continues"},
        {"date": "2026-06-01", "bp_systolic": 120, "bp_diastolic": 78, "pulse": 96, "temperature": 37.2, "spo2": 96, "weight": 50.5, "note": "TB treatment default - missed 2 months"},
        {"date": "2026-04-01", "bp_systolic": 116, "bp_diastolic": 74, "pulse": 88, "temperature": 37.0, "spo2": 97, "weight": 52.0, "note": "Initial presentation, started DOTS"},
    ],
    "polypharmacy_elderly": [
        {"date": "2026-07-12", "bp_systolic": 148, "bp_diastolic": 88, "pulse": 72, "temperature": 36.8, "spo2": 96, "weight": 65.0, "note": "Dizziness reported, possibly drug interaction"},
        {"date": "2026-06-12", "bp_systolic": 142, "bp_diastolic": 85, "pulse": 74, "temperature": 36.7, "spo2": 97, "weight": 65.5, "note": "On 7 medications, reviewing necessity"},
    ],
    "high_risk_anc": [
        {"date": "2026-07-18", "bp_systolic": 155, "bp_diastolic": 102, "pulse": 88, "temperature": 37.0, "spo2": 98, "weight": 68.0, "note": "Proteinuria detected, BP elevated - refer to district hospital"},
        {"date": "2026-07-04", "bp_systolic": 138, "bp_diastolic": 88, "pulse": 84, "temperature": 36.8, "spo2": 99, "weight": 66.5, "note": "28 weeks, mild edema"},
        {"date": "2026-06-20", "bp_systolic": 128, "bp_diastolic": 82, "pulse": 80, "temperature": 36.7, "spo2": 99, "weight": 64.0, "note": "24 weeks, normal pregnancy"},
    ],
    "faltering_growth": [
        {"date": "2026-07-14", "weight": 5.2, "height": 62.0, "temperature": 37.8, "spo2": 92, "pulse": 130, "note": "Weight <3rd percentile, fever, refer for SAM assessment"},
        {"date": "2026-06-14", "weight": 5.0, "height": 61.0, "temperature": 37.2, "spo2": 95, "pulse": 120, "note": "Poor weight gain, started supplementary feeding"},
    ],
}

MOCK_CONSULTATIONS = {
    "uncontrolled_dm": [
        {"date": "2026-07-15", "provider": "Dr. Priya, PHC Kukatpally", "chief_complaint": "Fever, SOB for 2 days", "examination": "BP 152/96, HR 98, SpO2 96%, random glucose 245 mg/dL", "assessment": "Uncontrolled DM with acute febrile illness, likely UTI", "plan": "Start Ciprofloxacin 500mg BD x 5 days, continue Metformin 500mg BD, increase Telmisartan to 80mg, review in 1 week", "referral": None},
        {"date": "2026-06-15", "provider": "Dr. Priya, PHC Kukatpally", "chief_complaint": "Routine DM follow-up", "examination": "BP 148/92, HR 94, random glucose 198 mg/dL", "assessment": "Suboptimal glycemic control, HbA1c likely >8%", "plan": "HbA1c test ordered, continue current meds, dietary counseling", "referral": None},
        {"date": "2026-05-20", "provider": "Dr. Priya, PHC Kukatpally", "chief_complaint": "Headache, blurred vision", "examination": "BP 155/98, HR 100, fundoscopy normal", "assessment": "Hypertension not controlled on current dose", "plan": "Increase Telmisartan 40mg to 80mg, strict salt restriction, follow up in 2 weeks", "referral": None},
    ],
    "missed_tb_fu": [
        {"date": "2026-07-10", "provider": "Dr. Priya, PHC Kukatpally", "chief_complaint": "Persistent cough x 60 days, weight loss", "examination": "BP 118/76, HR 102, Temp 37.8C, SpO2 94%, BMI 18.2", "assessment": "TB treatment default (missed 2 months DOTS), likely drug-resistant TB", "plan": "Sputum AFB + CBNAAT, chest X-ray, restart DOTS under direct observation, notify RNTCP", "referral": "District TB Centre"},
    ],
    "polypharmacy_elderly": [
        {"date": "2026-07-12", "provider": "Dr. Priya, PHC Kukatpally", "chief_complaint": "Dizziness, falls x 2 weeks", "examination": "BP 148/88 supine, 120/70 standing, HR 72, gait unsteady", "assessment": "Orthostatic hypotension, likely drug-induced from multiple antihypertensives", "plan": "De-prescribe Amlodipine (overlap with Telmisartan), start low-dose, medication reconciliation", "referral": None},
    ],
    "high_risk_anc": [
        {"date": "2026-07-18", "provider": "Dr. Priya, PHC Kukatpally", "chief_complaint": "Swelling face + hands x 1 week, headache", "examination": "BP 155/102, 2+ proteinuria, bilateral pedal edema, fetal movements present", "assessment": "Pre-eclampsia at 32 weeks - HIGH RISK", "plan": "MgSO4 loading dose, urgent referral to district hospital for management", "referral": "District Hospital - OB/GYN"},
    ],
    "faltering_growth": [
        {"date": "2026-07-14", "provider": "Dr. Priya, PHC Kukatpally", "chief_complaint": "Poor feeding, irritability x 7 days", "examination": "WT 5.2kg (<3rd percentile), HT 62cm, HR 130, Temp 37.8C, SpO2 92%, visible wasting", "assessment": "Severe Acute Malnutrition (SAM) with likely underlying infection", "plan": "Ready-to-use therapeutic food (RUTF), Cefixime for fever, urgent referral for SAM management", "referral": "District Hospital - Pediatrics"},
    ],
}

MOCK_LAB_REPORTS = {
    "uncontrolled_dm": [
        {"date": "2026-06-10", "test": "HbA1c", "result": "8.2%", "reference": "<7.0%", "status": "HIGH", "lab": "PathCare Labs"},
        {"date": "2026-06-10", "test": "Fasting Glucose", "result": "186 mg/dL", "reference": "70-110 mg/dL", "status": "HIGH", "lab": "PathCare Labs"},
        {"date": "2026-06-10", "test": "Random Glucose", "result": "245 mg/dL", "reference": "<200 mg/dL", "status": "HIGH", "lab": "PathCare Labs"},
        {"date": "2026-06-10", "test": "Serum Creatinine", "result": "1.1 mg/dL", "reference": "0.7-1.3 mg/dL", "status": "NORMAL", "lab": "PathCare Labs"},
        {"date": "2026-06-10", "test": "Urine Albumin", "result": "30 mg/dL", "reference": "<30 mg/dL", "status": "BORDERLINE", "lab": "PHC Lab"},
    ],
    "missed_tb_fu": [
        {"date": "2026-07-10", "test": "Sputum AFB", "result": "Positive (2+)", "reference": "Negative", "status": "HIGH", "lab": "District TB Lab"},
        {"date": "2026-07-10", "test": "CBNAAT", "result": "Rifampicin sensitive", "reference": "Sensitive", "status": "INFO", "lab": "District TB Lab"},
        {"date": "2026-07-10", "test": "ESR", "result": "65 mm/hr", "reference": "0-20 mm/hr", "status": "HIGH", "lab": "PHC Lab"},
        {"date": "2026-07-10", "test": "Hemoglobin", "result": "9.8 g/dL", "reference": "12-16 g/dL", "status": "LOW", "lab": "PHC Lab"},
    ],
    "high_risk_anc": [
        {"date": "2026-07-18", "test": "Urine Protein", "result": "2+ (300 mg/dL)", "reference": "Negative", "status": "HIGH", "lab": "PHC Lab"},
        {"date": "2026-07-18", "test": "Hemoglobin", "result": "10.2 g/dL", "reference": "11-14 g/dL", "status": "LOW", "lab": "PHC Lab"},
        {"date": "2026-07-04", "test": "Blood Group", "result": "B Positive", "reference": "-", "status": "INFO", "lab": "PHC Lab"},
    ],
    "polypharmacy_elderly": [
        {"date": "2026-06-12", "test": "Serum Creatinine", "result": "1.4 mg/dL", "reference": "0.7-1.3 mg/dL", "status": "HIGH", "lab": "PHC Lab"},
        {"date": "2026-06-12", "test": "eGFR", "result": "52 mL/min", "reference": ">60 mL/min", "status": "LOW", "lab": "PHC Lab"},
        {"date": "2026-06-12", "test": "K+", "result": "5.2 mEq/L", "reference": "3.5-5.0 mEq/L", "status": "HIGH", "lab": "PHC Lab"},
    ],
    "faltering_growth": [
        {"date": "2026-07-14", "test": "Hemoglobin", "result": "8.5 g/dL", "reference": "11-14 g/dL", "status": "LOW", "lab": "PHC Lab"},
        {"date": "2026-07-14", "test": "Serum Albumin", "result": "2.8 g/dL", "reference": "3.5-5.0 g/dL", "status": "LOW", "lab": "PHC Lab"},
        {"date": "2026-07-14", "test": "CRP", "result": "45 mg/L", "reference": "<5 mg/L", "status": "HIGH", "lab": "PHC Lab"},
    ],
}

MOCK_MEDICATIONS = {
    "uncontrolled_dm": [
        {"name": "Metformin", "dose": "500mg", "frequency": "BD", "status": "active", "since": "2024-01"},
        {"name": "Telmisartan", "dose": "80mg", "frequency": "OD", "status": "active", "since": "2025-06"},
        {"name": "Ciprofloxacin", "dose": "500mg", "frequency": "BD x 5d", "status": "new", "since": "2026-07-15"},
    ],
    "missed_tb_fu": [
        {"name": "Isoniazid (H)", "dose": "300mg", "frequency": "OD", "status": "defaulted", "since": "2026-04"},
        {"name": "Rifampicin (R)", "dose": "450mg", "frequency": "OD", "status": "defaulted", "since": "2026-04"},
        {"name": "Pyrazinamide (Z)", "dose": "1500mg", "frequency": "OD", "status": "defaulted", "since": "2026-04"},
        {"name": "Ethambutol (E)", "dose": "1100mg", "frequency": "OD", "status": "defaulted", "since": "2026-04"},
    ],
    "high_risk_anc": [
        {"name": "Ferrous Sulphate", "dose": "200mg", "frequency": "OD", "status": "active", "since": "2026-04"},
        {"Name": "Calcium", "dose": "500mg", "frequency": "BD", "status": "active", "since": "2026-04"},
        {"name": "Methyldopa", "dose": "250mg", "frequency": "TID", "status": "new", "since": "2026-07-18"},
    ],
    "polypharmacy_elderly": [
        {"name": "Telmisartan", "dose": "40mg", "frequency": "OD", "status": "active", "since": "2020"},
        {"name": "Amlodipine", "dose": "5mg", "frequency": "OD", "status": "review", "since": "2021"},
        {"name": "Metformin", "dose": "500mg", "frequency": "BD", "status": "active", "since": "2019"},
        {"name": "Atorvastatin", "dose": "10mg", "frequency": "OD", "status": "active", "since": "2022"},
        {"name": "Aspirin", "dose": "75mg", "frequency": "OD", "status": "active", "since": "2020"},
        {"name": "Omeprazole", "dose": "20mg", "frequency": "OD", "status": "active", "since": "2023"},
        {"name": "Amitriptyline", "dose": "10mg", "frequency": "HS", "status": "review", "since": "2024"},
    ],
    "faltering_growth": [
        {"name": "RUTF (Plumpy'Nut)", "dose": "5 packets/day", "frequency": "OD", "status": "new", "since": "2026-07-14"},
        {"name": "Cefixime", "dose": "50mg", "frequency": "BD x 5d", "status": "new", "since": "2026-07-14"},
        {"name": "Vitamin A", "dose": "100,000 IU", "frequency": "single dose", "status": "new", "since": "2026-07-14"},
    ],
}


@app.get("/api/patients/{patient_id}/abha-records")
async def get_patient_abha_records(patient_id: str):
    """Get enriched ABHA-linked records for a patient (mock)"""
    parts = patient_id.split("_")
    archetype = "_".join(parts[:-1]) if len(parts) > 1 else patient_id
    
    files = get_patient_files()
    patient_meta = next((f for f in files if f.id == patient_id), None)
    
    return {
        "patient_id": patient_id,
        "name": patient_meta.name if patient_meta else patient_id,
        "age": patient_meta.age if patient_meta else None,
        "gender": patient_meta.gender if patient_meta else None,
        "abha_id": patient_meta.abha_id if patient_meta else None,
        "vitals_history": MOCK_VITALS_HISTORY.get(archetype, []),
        "consultations": MOCK_CONSULTATIONS.get(archetype, []),
        "lab_reports": MOCK_LAB_REPORTS.get(archetype, []),
        "medications": MOCK_MEDICATIONS.get(archetype, []),
        "allergies": ["No known drug allergies"] if archetype != "uncontrolled_dm" else ["Metformin - GI intolerance (mild)", "Sulfa drugs - rash"],
        "chronic_conditions": {
            "uncontrolled_dm": {"diabetes": {"status": "uncontrolled", "since": "2018", "last_hba1c": "8.2%"}, "hypertension": {"status": "uncontrolled", "since": "2020", "last_bp": "152/96"}},
            "missed_tb_fu": {"tuberculosis": {"status": "defaulted", "since": "2026-04", "dots_phase": "Intensive (defaulted)"}},
            "polypharmacy_elderly": {"diabetes": {"status": "controlled", "since": "2019"}, "hypertension": {"status": "controlled", "since": "2020"}, "dyslipidemia": {"status": "controlled", "since": "2022"}},
            "high_risk_anc": {"pregnancy": {"status": "32 weeks G2P1", "risk": "HIGH - pre-eclampsia"}},
            "faltering_growth": {"malnutrition": {"status": "SAM", "since": "2026-06", "weight_percentile": "<3rd"}},
        }.get(archetype, {}),
    }


@app.post("/api/summarize", response_model=SummarizeResponse)
async def summarize_patient_endpoint(request: SummarizeRequest):
    """Generate clinical summary for a patient"""
    start_time = datetime.utcnow()
    
    try:
        # Load patient context
        context = load_patient_context(request.patient_id)
        
        # Generate summary
        if summarizer and not request.use_fallback:
            summary = summarizer.summarize(context)
        else:
            # Fallback deterministic summary
            from engine.summarizer import ClinicalSummarizer
            fallback = ClinicalSummarizer(api_key="fallback")
            summary = fallback._fallback_summary(context, context.get("patient", {}).get("patient_id", "unknown"))
        
        # Evaluate quality
        summary_dict = summary.model_dump()
        evaluation = evaluate_summary(summary_dict, context)
        
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        return SummarizeResponse(
            success=True,
            summary=PatientSummary(**summary_dict),
            evaluation=EvaluationResult(
                score=evaluation["score"],
                passed=evaluation["passed"],
                total=evaluation["total"],
                details=evaluation["details"],
                pass_threshold=evaluation["pass"]
            ),
            processing_time_ms=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        return SummarizeResponse(
            success=False,
            error=str(e),
            processing_time_ms=processing_time
        )


@app.post("/api/evaluate/batch")
async def batch_evaluate(request: BatchEvaluationRequest, background_tasks: BackgroundTasks):
    """Run evaluation on multiple patients"""
    files = get_patient_files(request.archetype)[:request.limit]
    
    if not files:
        raise HTTPException(status_code=404, detail="No patients found")
    
    results = []
    passed = 0
    
    for pf in files:
        try:
            context = load_patient_context(pf.id)
            
            if summarizer:
                summary = summarizer.summarize(context)
            else:
                from engine.summarizer import ClinicalSummarizer
                fallback = ClinicalSummarizer(api_key="fallback")
                summary = fallback._fallback_summary(context, pf.id)
            
            evaluation = evaluate_summary(summary.model_dump(), context)
            results.append({
                "patient_id": pf.id,
                "archetype": pf.archetype,
                **evaluation
            })
            
            if evaluation["pass"]:
                passed += 1
                
        except Exception as e:
            results.append({
                "patient_id": pf.id,
                "archetype": pf.archetype,
                "error": str(e),
                "pass": False
            })
    
    return {
        "total": len(files),
        "passed": passed,
        "pass_rate": passed / len(files) if files else 0,
        "results": results
    }


# ──────────────────────────────────────────────
# Phase 2: ABHA Mock + Symptom Intake + Triage
# ──────────────────────────────────────────────

from engine.models import (
    SymptomIntake, TriageContext, ABHAConsent, ConsentStatus,
    ConsentRequest, ConsentCallback, Symptom, Vitals, SymptomSeverity,
    validate_abha_id, PHC_SYMPTOM_LIST
)
from engine.abha_mock import get_mock_abdm_service
from engine.merge import get_context_merger
from uuid import uuid4


# Initialize Phase 2 services
mock_abdm = get_mock_abdm_service()
context_merger = get_context_merger()


@app.get("/api/abha/patient/{abha_id}")
async def lookup_abha_patient(abha_id: str):
    """Lookup patient demographics by ABHA ID (mock)"""
    if not validate_abha_id(abha_id):
        raise HTTPException(status_code=400, detail="Invalid ABHA ID format (must be 14-digit numeric)")
    
    patient = await mock_abdm.lookup_patient(abha_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return patient


@app.post("/api/abha/consent/initiate")
async def initiate_consent(request: ConsentRequest):
    """Initiate ABHA consent flow (mock)"""
    if not validate_abha_id(request.abha_id):
        raise HTTPException(status_code=400, detail="Invalid ABHA ID format")
    
    consent = await mock_abdm.initiate_consent(request)
    return consent


@app.get("/api/abha/consent/callback")
async def consent_callback(consent_id: str, status: str, artefact: Optional[str] = None, error: Optional[str] = None):
    """Handle consent manager callback (mock)"""
    try:
        consent_status = ConsentStatus(status.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    artefact_dict = None
    if artefact:
        import json
        try:
            artefact_dict = json.loads(artefact)
        except:
            artefact_dict = {"raw": artefact}
    
    callback = ConsentCallback(
        consent_id=consent_id,
        status=consent_status,
        artefact=artefact_dict,
        error=None if status.upper() != "DENIED" else error
    )
    
    result = await mock_abdm.handle_consent_callback(callback)
    
    return result


@app.get("/api/abha/consent/status/{consent_id}")
async def get_consent_status(consent_id: str):
    """Get consent status"""
    status = await mock_abdm.get_consent_status(consent_id)
    if not status:
        raise HTTPException(status_code=404, detail="Consent not found")
    return status


@app.post("/api/abha/history")
async def pull_abha_history(request: ConsentRequest):
    """Pull patient history via HIU (mock)"""
    if not validate_abha_id(request.abha_id):
        raise HTTPException(status_code=400, detail="Invalid ABHA ID")
    
    bundle = await mock_abdm.pull_history(request.abha_id, request.consent_id)
    if not bundle:
        raise HTTPException(status_code=403, detail="Consent not granted or expired")
    
    return bundle


@app.post("/api/intake/submit")
async def submit_intake(request: dict):
    """Submit symptom intake from nurse/ASHA"""
    intake = SymptomIntake(**request)
    
    # Generate intake_id if not present
    if not intake.intake_id or not intake.intake_id.startswith("INTAKE-"):
        intake.intake_id = f"INTAKE-{uuid4().hex[:12].upper()}"
    
    return {
        "success": True,
        "intake_id": intake.intake_id,
        "message": "Intake submitted successfully"
    }


@app.post("/api/triage/context")
async def get_triage_context(request: dict):
    """Merge intake + ABHA history -> triage context"""
    intake = SymptomIntake(**request.get("intake", {}))
    abha_id = request.get("abha_id")
    consent_id = request.get("consent_id")
    
    if not abha_id or not consent_id:
        raise HTTPException(status_code=400, detail="abha_id and consent_id required")
    
    # Pull history
    bundle = await mock_abdm.pull_history(abha_id, consent_id)
    if not bundle:
        raise HTTPException(status_code=403, detail="History pull failed")
    
    # Parse FHIR bundle
    import json
    import tempfile
    import os
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(bundle, f)
        temp_path = f.name
    abha_context = parse_fhir_bundle(temp_path)
    os.unlink(temp_path)
    
    # Merge intake + history
    context = context_merger.merge(SymptomIntake(**intake.dict()), abha_context)
    
    return {
        "success": True,
        "context": context,
        "message": "Triage context ready"
    }


@app.post("/api/triage/differential")
async def generate_differential(request: dict):
    """Generate differential diagnosis from triage context"""
    intake = SymptomIntake(**request.get("intake", {}))
    abha_id = request.get("abha_id")
    consent_id = request.get("consent_id")
    use_fallback = request.get("use_fallback", False)
    
    if not abha_id or not consent_id:
        raise HTTPException(status_code=400, detail="abha_id and consent_id required")
    
    # Pull history
    bundle = await mock_abdm.pull_history(abha_id, consent_id)
    if not bundle:
        raise HTTPException(status_code=403, detail="History pull failed")
    
    # Parse FHIR bundle
    import json
    import tempfile
    import os
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(bundle, f)
        temp_path = f.name
    abha_context = parse_fhir_bundle(temp_path)
    os.unlink(temp_path)
    
    # Merge intake + history
    triage_context = context_merger.merge(SymptomIntake(**intake.dict()), abha_context)
    
    # Generate differential
    engine = get_differential_engine()
    if use_fallback:
        engine.model = None  # Force fallback
    output = engine.generate(triage_context)
    
    return {
        "success": True,
        "differential": output.differential,
        "red_flags": output.red_flags,
        "suggested_actions": output.suggested_actions,
        "clinical_summary": output.clinical_summary,
        "block_reason": output.block_reason,
        "model_used": output.model_used
    }


@app.get("/api/symptoms/list")
async def list_symptoms():
    """Get standard PHC symptom list for intake form"""
    return {"symptoms": PHC_SYMPTOM_LIST}


@app.get("/api/symptoms/archetype/{archetype}")
async def get_archetype_symptoms(archetype: str):
    """Get demo symptoms for an archetype (for testing)"""
    from engine.models import get_archetype_symptoms
    symptoms = get_archetype_symptoms(archetype)
    return {"archetype": archetype, "symptoms": symptoms}


@app.get("/api/archetypes")
async def list_archetypes():
    """List available clinical archetypes"""
    files = get_patient_files()
    archetypes = {}
    for f in files:
        if f.archetype not in archetypes:
            archetypes[f.archetype] = 0
        archetypes[f.archetype] += 1
    
    return {
        "archetypes": [
            {"name": k, "count": v, "description": ARCHETYPE_DESCRIPTIONS.get(k, "")}
            for k, v in archetypes.items()
        ]
    }


# Archetype descriptions for UI
ARCHETYPE_DESCRIPTIONS = {
    "uncontrolled_dm": "Uncontrolled Type 2 Diabetes with complications",
    "missed_tb_fu": "Missed TB Follow-up - Treatment adherence risk",
    "polypharmacy_elderly": "Elderly patient on 7+ medications - Interaction risk",
    "high_risk_anc": "High-risk antenatal care - Pregnancy complications",
    "faltering_growth": "Pediatric faltering growth - Malnutrition risk"
}


# ──────────────────────────────────────────────
# Phase 4: Doctor Override & ABHA Write-Back
# ──────────────────────────────────────────────

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4

class OverrideLog(BaseModel):
    """Doctor override action on differential diagnosis."""
    override_id: str = Field(default_factory=lambda: f"OVRD-{uuid4().hex[:12].upper()}")
    differential_id: str
    original_rank: int
    icd11_code: str
    action: str  # "accept" | "reject" | "reorder" | "add"
    doctor_reason: str = ""
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class FinalizeRequest(BaseModel):
    """Request to finalize triage for ABHA write-back."""
    intake_id: str
    patient_id: str
    abha_id: str
    consent_id: str
    final_differential: List[Dict[str, Any]]
    overrides: List[OverrideLog]
    doctor_id: str = "MO-001"
    doctor_notes: str = ""

class ABHAWritebackRequest(BaseModel):
    """Request to push clinical record to ABHA."""
    abha_id: str
    consent_id: str
    composition: Dict[str, Any]
    record_type: str = "TriageSummary"

# In-memory stores
override_logs: Dict[str, List[OverrideLog]] = {}
finalized_triages: Dict[str, Dict] = {}

@app.post("/api/triage/override")
async def log_override(override: OverrideLog):
    """Log a doctor's override action on a differential diagnosis."""
    key = f"{override.differential_id}"
    if key not in override_logs:
        override_logs[key] = []
    override_logs[key].append(override)
    return {"success": True, "override_id": override.override_id}

@app.get("/api/triage/overrides/{differential_id}")
async def get_overrides(differential_id: str):
    """Get all overrides for a differential diagnosis."""
    return {"overrides": override_logs.get(differential_id, [])}

@app.post("/api/triage/finalize")
async def finalize_triage(request: FinalizeRequest):
    """Finalize triage output with doctor overrides for ABHA write-back."""
    finalized_id = f"FINAL-{uuid4().hex[:12].upper()}"
    
    # Build composition for ABHA
    composition = {
        "composition_id": finalized_id,
        "patient_id": request.patient_id,
        "abha_id": request.abha_id,
        "intake_id": request.intake_id,
        "consent_id": request.consent_id,
        "doctor_id": request.doctor_id,
        "doctor_notes": request.doctor_notes,
        "final_differential": request.final_differential,
        "overrides": [o.model_dump() for o in request.overrides],
        "timestamp": datetime.utcnow().isoformat(),
        "status": "ready_for_writeback"
    }
    
    finalized_triages[finalized_id] = composition
    
    return {
        "success": True,
        "finalized_id": finalized_id,
        "composition": composition,
        "message": "Triage finalized. Ready for ABHA write-back."
    }

@app.post("/api/abha/writeback")
async def abha_writeback(request: ABHAWritebackRequest):
    """Push clinical record to ABHA via HIP (mock)."""
    from engine.abha_mock import get_mock_abdm_service
    
    mock_abdm = get_mock_abdm_service()
    result = await mock_abdm.push_record(request.abha_id, request.consent_id, request.composition)
    
    return result

@app.get("/api/triage/finalized/{finalized_id}")
async def get_finalized_triage(finalized_id: str):
    """Get finalized triage by ID."""
    if finalized_id not in finalized_triages:
        raise HTTPException(status_code=404, detail="Finalized triage not found")
    return finalized_triages[finalized_id]


# ──────────────────────────────────────────────
# ABHA OTP Verification Flow
# ──────────────────────────────────────────────

# In-memory OTP store for demo
otp_store: Dict[str, Dict[str, Any]] = {}

MOCK_ABHA_PROFILES = {
    "12345678901234": {"name": "Ravi Kumar", "age": 57, "gender": "M", "phone": "+91-9876543210", "address": "Hyderabad, Telangana", "blood_group": "B+", "email": "ravi.kumar@email.com"},
    "23456789012345": {"name": "Sunita Devi", "age": 62, "gender": "F", "phone": "+91-9876543211", "address": "Warangal, Telangana", "blood_group": "O+", "email": "sunita.devi@email.com"},
    "34567890123456": {"name": "Mahesh Patel", "age": 48, "gender": "M", "phone": "+91-9876543212", "address": "Karimnagar, Telangana", "blood_group": "A+", "email": "mahesh.patel@email.com"},
    "45678901234567": {"name": "Anitha Reddy", "age": 45, "gender": "F", "phone": "+91-9876543213", "address": "Nalgonda, Telangana", "blood_group": "AB+", "email": "anitha.reddy@email.com"},
    "56789012345678": {"name": "Rajesh Singh", "age": 38, "gender": "M", "phone": "+91-9876543214", "address": "Khammam, Telangana", "blood_group": "B-", "email": "rajesh.singh@email.com"},
    "67890123456789": {"name": "Lakshmi Bai", "age": 52, "gender": "F", "phone": "+91-9876543215", "address": "Mahabubnagar, Telangana", "blood_group": "O-", "email": "lakshmi.bai@email.com"},
    "78901234567890": {"name": "Venkatesh Rao", "age": 72, "gender": "M", "phone": "+91-9876543216", "address": "Nizamabad, Telangana", "blood_group": "A-", "email": "venkatesh.rao@email.com"},
    "89012345678901": {"name": "Parvathi Amma", "age": 68, "gender": "F", "phone": "+91-9876543217", "address": "Adilabad, Telangana", "blood_group": "B+", "email": "parvathi.amma@email.com"},
    "90123456789012": {"name": "Gopal Krishna", "age": 75, "gender": "M", "phone": "+91-9876543218", "address": "Medak, Telangana", "blood_group": "O+", "email": "gopal.krishna@email.com"},
    "10234567890123": {"name": "Priya Sharma", "age": 28, "gender": "F", "phone": "+91-9876543219", "address": "Rangareddy, Telangana", "blood_group": "A+", "email": "priya.sharma@email.com"},
    "21345678901234": {"name": "Fatima Begum", "age": 32, "gender": "F", "phone": "+91-9876543220", "address": "Hyderabad, Telangana", "blood_group": "B+", "email": "fatima.begum@email.com"},
    "32456789012345": {"name": "Savithri Devi", "age": 25, "gender": "F", "phone": "+91-9876543221", "address": "Secunderabad, Telangana", "blood_group": "O+", "email": "savithri.devi@email.com"},
    "43567890123456": {"name": "Arjun Rao", "age": 2, "gender": "M", "phone": "+91-9876543222", "address": "Vijayawada, Andhra Pradesh", "blood_group": "A+", "email": "arjun.rao@email.com"},
    "54678901234567": {"name": "Meena Kumari", "age": 3, "gender": "F", "phone": "+91-9876543223", "address": "Guntur, Andhra Pradesh", "blood_group": "B+", "email": "meena.kumari@email.com"},
    "65789012345678": {"name": "Suresh Babu", "age": 1, "gender": "M", "phone": "+91-9876543224", "address": "Visakhapatnam, Andhra Pradesh", "blood_group": "O+", "email": "suresh.babu@email.com"},
}


class OtpSendRequest(BaseModel):
    abha_id: str = Field(..., pattern=r"^\d{14}$")


class OtpVerifyRequest(BaseModel):
    abha_id: str = Field(..., pattern=r"^\d{14}$")
    otp: str = Field(..., pattern=r"^\d{6}$")


class ChatRequest(BaseModel):
    message: str
    patient_id: Optional[str] = None
    history: List[Dict[str, str]] = Field(default_factory=list)


@app.post("/api/abha/otp/send")
async def send_otp(request: OtpSendRequest):
    """Send OTP to patient's registered mobile (mock)."""
    if request.abha_id not in MOCK_ABHA_PROFILES:
        raise HTTPException(status_code=404, detail="ABHA ID not found. Please check the 14-digit number.")
    
    import random
    otp = f"{random.randint(100000, 999999)}"
    otp_store[request.abha_id] = {
        "otp": otp,
        "created_at": datetime.utcnow().isoformat(),
        "verified": False,
    }
    
    profile = MOCK_ABHA_PROFILES[request.abha_id]
    masked_phone = profile["phone"][:5] + "****" + profile["phone"][-2:]
    
    return {
        "success": True,
        "message": f"OTP sent to registered mobile {masked_phone}",
        "masked_phone": masked_phone,
        "expires_in_seconds": 300,
    }


@app.post("/api/abha/otp/verify")
async def verify_otp(request: OtpVerifyRequest):
    """Verify OTP and return ABHA profile + linked health records."""
    stored = otp_store.get(request.abha_id)
    if not stored:
        raise HTTPException(status_code=400, detail="No OTP sent. Please request OTP first.")
    if stored["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")
    if stored.get("verified"):
        raise HTTPException(status_code=400, detail="OTP already used. Please request a new one.")
    
    stored["verified"] = True
    profile = MOCK_ABHA_PROFILES[request.abha_id]
    
    linked_records = [
        {"type": "OPConsultation", "date": "2026-06-15", "provider": "PHC Kukatpally", "summary": "Diabetes follow-up, HbA1c 8.2%"},
        {"type": "Prescription", "date": "2026-06-15", "provider": "PHC Kukatpally", "summary": "Metformin 500mg BD, Telmisartan 40mg OD"},
        {"type": "DiagnosticReport", "date": "2026-06-10", "provider": "PathCare Labs", "summary": "HbA1c: 8.2%, Fasting glucose: 186 mg/dL, Creatinine: 1.1"},
        {"type": "Prescription", "date": "2026-05-20", "provider": "PHC Kukatpally", "summary": "Metformin 500mg BD, Amlodipine 5mg OD"},
        {"type": "OPConsultation", "date": "2026-05-20", "provider": "PHC Kukatpally", "summary": "Routine diabetes + hypertension review"},
    ]
    
    return {
        "success": True,
        "profile": profile,
        "abha_id": request.abha_id,
        "linked_records": linked_records,
        "consent_id": f"CONSENT-{uuid4().hex[:12].upper()}",
        "message": f"Welcome {profile['name']}. {len(linked_records)} health records linked.",
    }


# ──────────────────────────────────────────────
# Gemini Chatbot
# ──────────────────────────────────────────────

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat with Gemini about patient data."""
    patient_context = ""
    if request.patient_id:
        try:
            context = load_patient_context(request.patient_id)
            patient_context = json.dumps(context, indent=2, default=str)[:3000]
        except Exception:
            patient_context = f"Patient {request.patient_id} context unavailable."
    
    system_prompt = """You are SehatAI Assistant, a clinical decision support chatbot for Indian PHC (Primary Health Centre) doctors.

Your capabilities:
- Summarize patient health records
- Explain lab reports and vitals in simple terms
- Suggest differential diagnoses based on symptoms
- Explain drug interactions and dosage adjustments
- Provide ABDM/ABHA workflow guidance
- Translate medical terms to Hindi/Telugu/Kannada

Rules:
- Be concise (2-3 sentences max per answer)
- Always add disclaimer: "This is AI-assisted guidance, not a substitute for clinical judgment."
- For emergencies, say: "RED FLAG: Refer immediately."
- Use simple language a PHC doctor would understand.
- When patient context is provided, use it to give specific answers."""

    messages = [{"role": "system", "content": system_prompt}]
    
    if patient_context:
        messages.append({"role": "system", "content": f"Current patient context:\n{patient_context}"})
    
    for h in request.history[-6:]:
        messages.append(h)
    
    messages.append({"role": "user", "content": request.message})
    
    if GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            chat_history = []
            for m in messages:
                if m["role"] == "user":
                    chat_history.append({"role": "user", "parts": [m["content"]]})
                elif m["role"] == "assistant":
                    chat_history.append({"role": "model", "parts": [m["content"]]})
            
            response = model.generate_content(
                request.message,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=500,
                )
            )
            return {"reply": response.text, "model": "gemini-1.5-flash"}
        except Exception as e:
            return {"reply": f"Gemini error: {str(e)}. Using fallback response.", "model": "fallback"}
    
    fallback_replies = {
        "summary": "Based on the available records, this patient has **uncontrolled diabetes** with HbA1c >8%. Current medications: Metformin 500mg BD. Red flags: BP elevated at 150/95. Recommend referral to district hospital if BP doesn't respond to current regimen.\n\n*This is AI-assisted guidance, not a substitute for clinical judgment.*",
        "default": "I'm SehatAI Assistant. I can help with:\n- Patient summaries (select a patient first)\n- Lab report interpretation\n- Drug dosage guidance\n- ABHA workflow help\n\nAsk me anything about the current patient's records.\n\n*This is AI-assisted guidance, not a substitute for clinical judgment.*",
    }
    
    msg_lower = request.message.lower()
    if any(w in msg_lower for w in ["summary", "summarize", "brief", "overview"]):
        reply = fallback_replies["summary"]
    elif any(w in msg_lower for w in ["hello", "hi", "help"]):
        reply = "Namaste! I'm SehatAI Assistant. Ask me about patient summaries, lab reports, or ABHA workflows. How can I help?"
    else:
        reply = fallback_replies["default"]
    
    return {"reply": reply, "model": "fallback"}


# ──────────────────────────────────────────────
# Development Server
# ──────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )