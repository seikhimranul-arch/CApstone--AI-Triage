"""
Data Models for AI Triage Assistant
Pydantic-based models with validation for production use.
"""
from __future__ import annotations
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional, Literal
from pydantic import BaseModel, Field, field_validator, model_validator
from uuid import uuid4
import json


# ──────────────────────────────────────────────
# Enums
# ──────────────────────────────────────────────

class ConsentStatus(str, Enum):
    REQUESTED = "REQUESTED"
    GRANTED = "GRANTED"
    DENIED = "DENIED"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"

    @classmethod
    def active_statuses(cls) -> list["ConsentStatus"]:
        return [cls.GRANTED]


class ConflictSeverity(str, Enum):
    FLAG = "flag"
    WARN = "warn"
    BLOCK = "block"

    @property
    def requires_acknowledgment(self) -> bool:
        return self == ConflictSeverity.BLOCK


class SymptomSeverity(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"

    @property
    def priority(self) -> int:
        return {"mild": 1, "moderate": 2, "severe": 3}[self.value]


class ConflictType(str, Enum):
    CONDITION_MISMATCH = "condition_mismatch"
    MEDICATION_MISSING = "medication_missing"
    HISTORY_GAP = "history_gap"
    VITALS_DISCREPANCY = "vitals_discrepancy"
    ALLERGY_MISMATCH = "allergy_mismatch"
    LAB_DISCREPANCY = "lab_discrepancy"


# ──────────────────────────────────────────────
# Configuration Models
# ──────────────────────────────────────────────

class ABHAConfig(BaseModel):
    """ABHA integration configuration."""
    id_pattern: str = r"^\d{14}$"
    consent_default_expiry_hours: int = 24
    consent_max_expiry_hours: int = 168  # 7 days
    hi_types: list[str] = Field(default_factory=lambda: [
        "Condition", "MedicationRequest", "Observation", 
        "Encounter", "DiagnosticReport", "AllergyIntolerance"
    ])
    gateway_base_url: str = "https://gateway.abdm.gov.in"
    timeout_seconds: int = 30
    retry_attempts: int = 3
    retry_backoff_seconds: float = 1.5


class TriageConfig(BaseModel):
    """Triage engine configuration."""
    max_symptoms_per_intake: int = 10
    max_duration_days: int = 3650  # 10 years
    min_age: int = 0
    max_age: int = 150
    conflict_warn_threshold: int = 2
    conflict_block_threshold: int = 3
    enable_lab_history_merge: bool = True
    enable_vitals_history_merge: bool = True


# Global config instances (can be overridden via env)
abha_config = ABHAConfig()
triage_config = TriageConfig()


# ──────────────────────────────────────────────
# Core Domain Models
# ──────────────────────────────────────────────

class Symptom(BaseModel):
    """Single symptom entry from structured intake."""
    icd11_code: str = Field(..., pattern=r"^[A-Z]{2}\d{2}$", description="ICD-11 code (e.g., MG44)")
    display: str = Field(..., min_length=1, max_length=100, description="Human-readable name")
    duration_days: int = Field(..., ge=0, le=3650, description="Duration in days")
    severity: SymptomSeverity = Field(default=SymptomSeverity.MODERATE)
    onset_date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    notes: str = Field(default="", max_length=500)

    @field_validator("onset_date")
    @classmethod
    def validate_onset_date(cls, v: Optional[str], info) -> Optional[str]:
        if v:
            try:
                onset = datetime.fromisoformat(v).date()
                if onset > datetime.utcnow().date():
                    raise ValueError("Onset date cannot be in the future")
            except ValueError as e:
                if "future" not in str(e):
                    raise ValueError("Invalid onset date format (YYYY-MM-DD)")
        return v


class Vitals(BaseModel):
    """Vital signs from intake or history."""
    bp_systolic: Optional[int] = Field(default=None, ge=40, le=300)
    bp_diastolic: Optional[int] = Field(default=None, ge=20, le=200)
    temperature: Optional[float] = Field(default=None, ge=30.0, le=45.0)
    respiratory_rate: Optional[int] = Field(default=None, ge=0, le=100)
    spo2: Optional[int] = Field(default=None, ge=0, le=100)
    pulse: Optional[int] = Field(default=None, ge=0, le=300)
    weight: Optional[float] = Field(default=None, ge=0.5, le=300.0)
    height: Optional[float] = Field(default=None, ge=20.0, le=250.0)
    bmi: Optional[float] = Field(default=None, ge=5.0, le=80.0)
    recorded_at: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")

    @model_validator(mode="after")
    def compute_bmi(self) -> "Vitals":
        if self.weight and self.height and self.height > 0:
            self.bmi = round(self.weight / ((self.height / 100) ** 2), 1)
        return self


class LabReport(BaseModel):
    """Laboratory report from history."""
    loinc_code: str
    display: str
    value: float
    unit: str
    reference_range: Optional[str] = None
    abnormal_flag: Optional[Literal["H", "L", "HH", "LL"]] = None
    specimen_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}")
    specimen_datetime: Optional[str] = None
    status: Literal["final", "preliminary", "corrected"] = "final"

    @property
    def is_abnormal(self) -> bool:
        return self.abnormal_flag is not None


class MedicationSummary(BaseModel):
    """Medication from intake or history (deduplicated)."""
    rxnorm_code: Optional[str] = None
    name: str
    dose: str
    frequency: Optional[str] = None
    route: Optional[str] = None
    status: Literal["active", "on-hold", "completed", "stopped"] = "active"
    source: Literal["intake", "history", "merged"] = "intake"
    prescribed_date: Optional[str] = None
    prescribed_by: Optional[str] = None

    @property
    def deduplication_key(self) -> str:
        return (self.rxnorm_code or self.name.lower()).strip()


class ConditionSummary(BaseModel):
    """Condition/diagnosis from intake or history (deduplicated)."""
    snomed_code: Optional[str] = None
    icd11_code: Optional[str] = None
    display: str
    clinical_status: Literal["active", "recurrence", "relapse", "inactive", "remission", "resolved"] = "active"
    onset_date: Optional[str] = None
    source: Literal["intake", "history", "merged"] = "intake"
    verified: bool = False  # Doctor-confirmed

    @property
    def deduplication_key(self) -> str:
        return (self.snomed_code or self.icd11_code or self.display.lower()).strip()


class AllergySummary(BaseModel):
    """Allergy from intake or history."""
    substance_code: Optional[str] = None
    substance_display: str
    reaction: list[str] = Field(default_factory=list)
    severity: Optional[Literal["mild", "moderate", "severe"]] = None
    status: Literal["active", "inactive", "resolved"] = "active"
    source: Literal["intake", "history", "merged"] = "intake"


# ──────────────────────────────────────────────
# ABHA Consent Models
# ──────────────────────────────────────────────

class ABHAConsent(BaseModel):
    """ABHA consent artifact with full audit trail."""
    consent_id: str = Field(default_factory=lambda: f"CONS-{uuid4().hex[:12].upper()}")
    abha_id: str = Field(..., pattern=r"^\d{14}$")
    patient_id: str
    status: ConsentStatus = ConsentStatus.REQUESTED
    purpose: str = "TRIAGE"
    hi_types: list[str] = Field(default_factory=lambda: [
        "Condition", "MedicationRequest", "Observation", 
        "Encounter", "DiagnosticReport", "AllergyIntolerance"
    ])
    date_range: dict[str, str] = Field(default_factory=lambda: {
        "from": "2020-01-01",
        "to": datetime.utcnow().strftime("%Y-%m-%d")
    })
    expiry_hours: int = Field(default=24, ge=1, le=168)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    granted_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    artefact: dict = Field(default_factory=dict)
    audit_trail: list[dict] = Field(default_factory=list)

    def add_audit(self, action: str, details: dict = None) -> None:
        self.audit_trail.append({
            "timestamp": datetime.utcnow().isoformat(),
            "action": action,
            "details": details or {}
        })

    def is_valid(self) -> bool:
        if self.status != ConsentStatus.GRANTED:
            return False
        if self.granted_at:
            expiry = self.granted_at + timedelta(hours=self.expiry_hours)
            return datetime.utcnow() < expiry
        return False

    def grant(self, artefact: dict) -> None:
        self.status = ConsentStatus.GRANTED
        self.granted_at = datetime.utcnow()
        self.artefact = artefact
        self.add_audit("GRANTED", {"expiry_hours": self.expiry_hours})

    def revoke(self, reason: str = "") -> None:
        self.status = ConsentStatus.REVOKED
        self.revoked_at = datetime.utcnow()
        self.add_audit("REVOKED", {"reason": reason})


class ConsentRequest(BaseModel):
    """Request to initiate consent flow."""
    abha_id: str = Field(..., pattern=r"^\d{14}$")
    purpose: str = "TRIAGE"
    hi_types: list[str] = Field(default_factory=lambda: [
        "Condition", "MedicationRequest", "Observation", 
        "Encounter", "DiagnosticReport", "AllergyIntolerance"
    ])
    expiry_hours: int = Field(default=24, ge=1, le=168)
    redirect_url: Optional[str] = None


class ConsentCallback(BaseModel):
    """Callback from consent manager."""
    consent_id: str
    status: ConsentStatus
    artefact: Optional[dict] = None
    error: Optional[str] = None


# ──────────────────────────────────────────────
# Symptom Intake Models
# ──────────────────────────────────────────────

class SymptomIntake(BaseModel):
    """Complete symptom intake from nurse/ASHA."""
    intake_id: str = Field(default_factory=lambda: f"INTAKE-{uuid4().hex[:12].upper()}")
    abha_id: Optional[str] = Field(default=None, pattern=r"^\d{14}$")
    patient_name: Optional[str] = Field(default=None, max_length=100)
    age: Optional[int] = Field(default=None, ge=0, le=150)
    gender: Optional[Literal["M", "F", "O"]] = None
    symptoms: list[Symptom] = Field(default_factory=list)
    vitals: Vitals = Field(default_factory=Vitals)
    free_text: str = Field(default="", max_length=2000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = Field(default="nurse", pattern=r"^(nurse|asha|doctor)$")

    @field_validator("symptoms")
    @classmethod
    def validate_symptoms(cls, v: list[Symptom]) -> list[Symptom]:
        if len(v) > triage_config.max_symptoms_per_intake:
            raise ValueError(f"Maximum {triage_config.max_symptoms_per_intake} symptoms allowed")
        return v

    @model_validator(mode="after")
    def validate_intake(self) -> "SymptomIntake":
        if self.abha_id and not self.abha_id.isdigit():
            raise ValueError("ABHA ID must be 14-digit numeric")
        if self.age is not None and not (triage_config.min_age <= self.age <= triage_config.max_age):
            raise ValueError(f"Age must be between {triage_config.min_age} and {triage_config.max_age}")
        return self


# ──────────────────────────────────────────────
# Conflict Models
# ──────────────────────────────────────────────

class Conflict(BaseModel):
    """Discrepancy between intake and history."""
    conflict_id: str = Field(default_factory=lambda: f"CONF-{uuid4().hex[:8].upper()}")
    type: ConflictType
    severity: ConflictSeverity
    message: str
    intake_value: Optional[Any] = None
    history_value: Optional[Any] = None
    disclaimer: Optional[str] = None
    requires_acknowledgment: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @model_validator(mode="after")
    def set_block_disclaimer(self) -> "Conflict":
        if self.severity == ConflictSeverity.BLOCK:
            self.requires_acknowledgment = True
            if not self.disclaimer:
                self.disclaimer = (
                    "⚠️ CRITICAL DISCREPANCY: This conflict must be acknowledged before proceeding. "
                    "Clinical judgment required."
                )
        return self


# ──────────────────────────────────────────────
# Triage Context (Merged Output)
# ──────────────────────────────────────────────

class TriageContext(BaseModel):
    """Complete merged context ready for differential generation."""
    intake: SymptomIntake
    abha_history: Optional[dict] = None
    merged_conditions: list[ConditionSummary] = Field(default_factory=list)
    merged_medications: list[MedicationSummary] = Field(default_factory=list)
    merged_vitals: Vitals = Field(default_factory=Vitals)
    merged_lab_reports: list[LabReport] = Field(default_factory=list)
    merged_allergies: list[AllergySummary] = Field(default_factory=list)
    conflicts: list[Conflict] = Field(default_factory=list)
    red_flags: list[dict] = Field(default_factory=list)
    ready_for_triage: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def has_block_conflicts(self) -> bool:
        return any(c.severity == ConflictSeverity.BLOCK for c in self.conflicts)

    @property
    def has_warnings(self) -> bool:
        return any(c.severity == ConflictSeverity.WARN for c in self.conflicts)

    @property
    def flag_count(self) -> int:
        return len([c for c in self.conflicts if c.severity == ConflictSeverity.FLAG])

    def get_conflicts_by_severity(self, severity: ConflictSeverity) -> list[Conflict]:
        return [c for c in self.conflicts if c.severity == severity]

    def add_conflict(self, conflict: Conflict) -> None:
        self.conflicts.append(conflict)
        if conflict.severity == ConflictSeverity.BLOCK:
            self.ready_for_triage = False


# ──────────────────────────────────────────────
# Standard PHC Symptom List (ICD-11)
# ──────────────────────────────────────────────

PHC_SYMPTOM_LIST: list[dict] = [
    # General
    {"icd11": "MG44", "display": "Fever", "category": "General"},
    {"icd11": "MG40", "display": "Fatigue/Weakness", "category": "General"},
    {"icd11": "MB23", "display": "Weight loss", "category": "General"},
    {"icd11": "MB24", "display": "Weight gain", "category": "General"},
    {"icd11": "MG45", "display": "Night sweats", "category": "General"},
    
    # Respiratory
    {"icd11": "MD11", "display": "Cough", "category": "Respiratory"},
    {"icd11": "MD12", "display": "Shortness of breath", "category": "Respiratory"},
    {"icd11": "MD13", "display": "Chest pain", "category": "Respiratory"},
    {"icd11": "MD14", "display": "Wheezing", "category": "Respiratory"},
    {"icd11": "MD15", "display": "Hemoptysis", "category": "Respiratory"},
    
    # Gastrointestinal
    {"icd11": "ME00", "display": "Abdominal pain", "category": "GI"},
    {"icd11": "ME01", "display": "Diarrhea", "category": "GI"},
    {"icd11": "ME02", "display": "Vomiting", "category": "GI"},
    {"icd11": "ME03", "display": "Nausea", "category": "GI"},
    {"icd11": "ME04", "display": "Constipation", "category": "GI"},
    {"icd11": "ME05", "display": "Blood in stool", "category": "GI"},
    
    # Cardiovascular
    {"icd11": "MB00", "display": "Palpitations", "category": "Cardio"},
    {"icd11": "MB01", "display": "Edema/Swelling", "category": "Cardio"},
    
    # Neurological
    {"icd11": "MB40", "display": "Headache", "category": "Neuro"},
    {"icd11": "MB41", "display": "Dizziness", "category": "Neuro"},
    {"icd11": "MB42", "display": "Seizures", "category": "Neuro"},
    
    # Genitourinary
    {"icd11": "MF00", "display": "Dysuria", "category": "GU"},
    {"icd11": "MF01", "display": "Frequency/Urgency", "category": "GU"},
    {"icd11": "MF02", "display": "Hematuria", "category": "GU"},
    
    # Skin
    {"icd11": "MH00", "display": "Rash", "category": "Skin"},
    {"icd11": "MH01", "display": "Itching", "category": "Skin"},
    {"icd11": "MH02", "display": "Wound/Ulcer", "category": "Skin"},
    
    # Women's Health
    {"icd11": "GA00", "display": "Amenorrhea", "category": "OBGYN"},
    {"icd11": "GA01", "display": "Vaginal bleeding", "category": "OBGYN"},
    {"icd11": "GA02", "display": "Vaginal discharge", "category": "OBGYN"},
    
    # Pediatric
    {"icd11": "KB00", "display": "Poor feeding", "category": "Peds"},
    {"icd11": "KB01", "display": "Irritability", "category": "Peds"},
    {"icd11": "KB02", "display": "Developmental delay", "category": "Peds"},
]


# ──────────────────────────────────────────────
# Archetype-Aligned Symptoms (Demo Matching)
# ──────────────────────────────────────────────

ARCHETYPE_DEMO_SYMPTOMS: dict[str, list[str]] = {
    "uncontrolled_dm": ["MG44", "MD12", "ME00", "MB23"],
    "missed_tb_fu": ["MG44", "MD11", "MB23", "MD15"],
    "polypharmacy_elderly": ["MB40", "MB41", "MB01", "ME00"],
    "high_risk_anc": ["MB01", "MG44", "MG40", "GA01"],
    "faltering_growth": ["KB00", "KB01", "MB23", "MD11"],
}


# ──────────────────────────────────────────────
# Validation & Utility Functions
# ──────────────────────────────────────────────

def validate_abha_id(abha_id: str) -> bool:
    """Validate ABHA ID format."""
    return bool(abha_id and abha_id.isdigit() and len(abha_id) == 14)


def validate_icd11_code(code: str) -> bool:
    """Validate ICD-11 code format."""
    import re
    return bool(re.match(r"^[A-Z]{2}\d{2}$", code))


def get_symptom_by_code(code: str) -> Optional[dict]:
    """Look up symptom display by ICD-11 code."""
    for s in PHC_SYMPTOM_LIST:
        if s["icd11"] == code:
            return s
    return None


def get_archetype_symptoms(archetype: str) -> list[dict]:
    """Get demo symptoms for an archetype."""
    codes = ARCHETYPE_DEMO_SYMPTOMS.get(archetype, [])
    return [get_symptom_by_code(c) for c in codes if get_symptom_by_code(c)]


# ──────────────────────────────────────────────
# Model Serialization Helpers
# ──────────────────────────────────────────────

class ModelEncoder(json.JSONEncoder):
    """Custom JSON encoder for Pydantic models and enums."""
    def default(self, obj):
        if isinstance(obj, Enum):
            return obj.value
        if isinstance(obj, datetime):
            return obj.isoformat()
        if hasattr(obj, "model_dump"):
            return obj.model_dump(mode="json")
        return super().default(obj)


def to_json(obj: Any) -> str:
    """Serialize model to JSON."""
    return json.dumps(obj, cls=ModelEncoder)


def from_json(json_str: str, model_class: type[BaseModel]) -> BaseModel:
    """Deserialize JSON to model."""
    return model_class.model_validate_json(json_str)


# ──────────────────────────────────────────────
# Self-Test (Run on Import)
# ──────────────────────────────────────────────

if __name__ == "__main__":
    # Quick validation tests
    print("Running model validation tests...")
    
    # Test Symptom
    s = Symptom(icd11_code="MG44", display="Fever", duration_days=3, severity=SymptomSeverity.MODERATE)
    assert s.icd11_code == "MG44"
    print("✅ Symptom validation passed")
    
    # Test Vitals with BMI computation
    v = Vitals(weight=70.0, height=170.0)
    assert v.bmi == 24.2
    print("✅ Vitals BMI computation passed")
    
    # Test ABHA ID validation
    assert validate_abha_id("12345678901234")
    assert not validate_abha_id("12345")
    assert not validate_abha_id("abcdefghijklmn")
    print("✅ ABHA ID validation passed")
    
    # Test SymptomIntake
    intake = SymptomIntake(
        abha_id="12345678901234",
        age=45,
        gender="M",
        symptoms=[s],
        vitals=Vitals(bp_systolic=140, bp_diastolic=90)
    )
    assert intake.intake_id.startswith("INTAKE-")
    print("✅ SymptomIntake creation passed")
    
    # Test ABHAConsent
    consent = ABHAConsent(
        abha_id="12345678901234",
        patient_id="PAT-123",
        expiry_hours=48
    )
    assert consent.status == ConsentStatus.REQUESTED
    consent.grant({"signed": True})
    assert consent.status == ConsentStatus.GRANTED
    assert consent.is_valid()
    print("✅ ABHAConsent lifecycle passed")
    
    # Test Conflict
    conflict = Conflict(
        type=ConflictType.CONDITION_MISMATCH,
        severity=ConflictSeverity.BLOCK,
        message="Intake says no diabetes, history shows T2DM",
        intake_value={"diabetes": False},
        history_value={"diabetes": True}
    )
    assert conflict.requires_acknowledgment
    assert conflict.disclaimer is not None
    print("✅ Conflict BLOCK severity passed")
    
    # Test TriageContext
    context = TriageContext(intake=intake)
    context.add_conflict(conflict)
    assert context.has_block_conflicts
    assert not context.ready_for_triage
    print("✅ TriageContext conflict handling passed")
    
    # Test Symptom list lookups
    symptom = get_symptom_by_code("MG44")
    assert symptom["display"] == "Fever"
    archetype_symptoms = get_archetype_symptoms("uncontrolled_dm")
    assert len(archetype_symptoms) == 4
    print("✅ Symptom lookups passed")
    
    print("\n✅ All model validation tests PASSED")