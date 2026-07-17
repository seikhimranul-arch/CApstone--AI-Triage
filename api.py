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

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

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
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
# Helper Functions
# ──────────────────────────────────────────────

def get_patient_files(archetype: Optional[str] = None) -> List[PatientFile]:
    """Get list of available patient files"""
    if not PATIENTS_DIR.exists():
        return []
    
    files = []
    for f in PATIENTS_DIR.glob("*.json"):
        if archetype and not f.name.startswith(archetype):
            continue
        parts = f.stem.split("_")
        if len(parts) >= 2:
            files.append(PatientFile(
                filename=f.name,
                archetype=parts[0],
                id=f.stem
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