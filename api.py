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
    
    callback = ConsentCallbackRequest(
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