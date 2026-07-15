"""
LLM-powered clinical summarizer using Google Gemini API.
Replaces Ollama with cloud API for faster iteration.
"""
from __future__ import annotations
import json
import os
from typing import Any

import google.generativeai as genai
from pydantic import BaseModel, Field, ValidationError

from engine.parser import parse_fhir_bundle


# ──────────────────────────────────────────────
# Output Schema (Strict JSON)
# ──────────────────────────────────────────────

class RedFlag(BaseModel):
    type: str  # critical | warning | info
    key: str
    message: str
    value: float | None = None
    unit: str | None = None
    threshold: float | None = None


class ClinicalSummary(BaseModel):
    patient_id: str
    one_liner: str = Field(..., max_length=200)
    active_problems: list[dict[str, Any]]
    red_flags: list[RedFlag]
    chronic_snapshot: dict[str, Any]
    medications: list[dict[str, Any]]
    missing_data: list[str]
    encounter_count: int
    last_encounter_days: int | None


# ──────────────────────────────────────────────
# Prompt Engineering
# ──────────────────────────────────────────────

SYSTEM_PROMPT = """You are a senior clinical assistant for Indian Primary Health Centers.
Generate a concise, structured clinical summary from structured patient data.

RULES:
1. Output ONLY valid JSON matching the ClinicalSummary schema.
2. one_liner: ≤160 chars, scannable in 3 seconds. Format: "52M, uncontrolled T2DM (HbA1c 9.2%↑), HTN on 3 meds, missed FU 105d"
3. active_problems: Copy from input, add clinical_status.
4. red_flags: Use input red_flags exactly. Enhance message with clinical action.
5. chronic_snapshot: Use input snapshot. Add control status.
6. medications: Copy name + dose from input.
7. missing_data: Copy from input.
8. NEVER hallucinate medications, conditions, or values not in input.
9. If data missing, say "Not recorded" not "Normal".
10. Prioritize actionable information for PHC doctor decision-making."""

FEW_SHOT = [{
    "input": {
        "patient": {"age": 52, "gender": "M", "name": "Rajesh Sharma", "patient_id": "test-123"},
        "active_problems": [
            {"code": "44054006", "display": "Type 2 diabetes mellitus", "clinical_status": "active"},
            {"code": "38341003", "display": "Hypertensive disorder", "clinical_status": "active"},
        ],
        "vitals": {
            "hba1c": {"value": 9.2, "unit": "%", "trend": "rising"},
            "bp_systolic": {"value": 148, "unit": "mmHg", "trend": "stable"},
            "bp_diastolic": {"value": 94, "unit": "mmHg", "trend": "stable"},
            "creatinine": {"value": 1.1, "unit": "mg/dL", "trend": "stable"},
        },
        "red_flags": [
            {"type": "critical", "key": "hba1c", "message": "HbA1c 9.2% (critical threshold: 9.0%)", "value": 9.2, "unit": "%", "threshold": 9.0},
            {"type": "warning", "key": "bp_systolic", "message": "BP systolic 148 mmHg (warning threshold: 140)", "value": 148, "unit": "mmHg", "threshold": 140},
            {"type": "warning", "key": "missed_followup", "message": "No encounter in 105 days"},
        ],
        "chronic_snapshot": {
            "diabetes": {"last_hba1c": "9.2%", "trend": "rising", "control": "uncontrolled"},
            "hypertension": {"last_bp": "148/94 mmHg", "trend": "stable", "control": "uncontrolled"},
        },
        "medications": [
            {"name": "Metformin 500mg", "dose": "500 mg BD"},
            {"name": "Glimepiride 2mg", "dose": "2 mg OD"},
            {"name": "Amlodipine 5mg", "dose": "5 mg OD"},
        ],
        "missing_data": ["No lipid panel in 18mo", "No foot exam recorded", "No fundoscopy in 2yr"],
        "encounter_count": 4,
        "last_encounter_days": 105,
    },
    "output": {
        "patient_id": "test-123",
        "one_liner": "52M, uncontrolled T2DM (HbA1c 9.2%↑), HTN uncontrolled (148/94), on 3 meds, missed FU 105d",
        "active_problems": [
            {"code": "44054006", "display": "Type 2 diabetes mellitus", "clinical_status": "active"},
            {"code": "38341003", "display": "Hypertensive disorder", "clinical_status": "active"},
        ],
        "red_flags": [
            {"type": "critical", "key": "hba1c", "message": "HbA1c 9.2% — intensify glycemic control; consider insulin", "value": 9.2, "unit": "%", "threshold": 9.0},
            {"type": "warning", "key": "bp_systolic", "message": "BP 148/94 — uptitrate/add agent; check adherence", "value": 148, "unit": "mmHg", "threshold": 140},
            {"type": "warning", "key": "missed_followup", "message": "No visit 105d — schedule follow-up this week", "value": 105, "unit": "days", "threshold": 90},
        ],
        "chronic_snapshot": {
            "diabetes": {"last_hba1c": "9.2%", "trend": "rising", "control": "uncontrolled"},
            "hypertension": {"last_bp": "148/94 mmHg", "trend": "stable", "control": "uncontrolled"},
        },
        "medications": [
            {"name": "Metformin 500mg", "dose": "500 mg BD"},
            {"name": "Glimepiride 2mg", "dose": "2 mg OD"},
            {"name": "Amlodipine 5mg", "dose": "5 mg OD"},
        ],
        "missing_data": ["No lipid panel in 18mo", "No foot exam recorded", "No fundoscopy in 2yr"],
        "encounter_count": 4,
        "last_encounter_days": 105,
    }
}]


# ──────────────────────────────────────────────
# Summarizer Class
# ──────────────────────────────────────────────

class ClinicalSummarizer:
    """Gemini-powered clinical summarizer."""
    
    def __init__(self, model: str = "gemini-1.5-flash", api_key: str | None = None):
        api_key = api_key or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY or GEMINI_API_KEY environment variable required")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)
    
    def _build_prompt(self, context: dict[str, Any]) -> str:
        """Build prompt with system, few-shot, and patient context."""
        parts = [SYSTEM_PROMPT, "\n\nEXAMPLES:"]
        for ex in FEW_SHOT:
            parts.append(f"\nInput: {json.dumps(ex['input'], default=str)}")
            parts.append(f"\nOutput: {json.dumps(ex['output'], default=str)}")
        parts.append(f"\n\nPATIENT CONTEXT:\n{json.dumps(context, default=str)}")
        parts.append("\n\nOUTPUT (JSON only):")
        return "".join(parts)
    
    def summarize(self, context: dict[str, Any]) -> ClinicalSummary:
        """Generate structured clinical summary."""
        prompt = self._build_prompt(context)
        
        response = self.model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                max_output_tokens=2048,
                response_mime_type="application/json",
            ),
        )
        
        try:
            data = json.loads(response.text)
            return ClinicalSummary.model_validate(data)
        except (json.JSONDecodeError, ValidationError) as e:
            # Fallback: construct minimal summary from parser output
            return self._fallback_summary(context, str(e))
    
    def _fallback_summary(self, context: dict[str, Any], error: str) -> ClinicalSummary:
        """Deterministic fallback when LLM fails."""
        patient = context.get("patient", {})
        problems = context.get("active_problems", [])
        flags = context.get("red_flags", [])
        snapshot = context.get("chronic_snapshot", {})
        meds = context.get("medications", [])
        missing = context.get("missing_data", [])
        
        # Build one-liner from available data
        age = patient.get("age", "?")
        gender = patient.get("gender", "?")
        problem_str = ", ".join(p["display"] for p in problems[:2])
        flag_str = f", {len([f for f in flags if f['type']=='critical'])} critical flags" if flags else ""
        one_liner = f"{age}{gender}, {problem_str}{flag_str}"
        
        return ClinicalSummary(
            patient_id=patient.get("patient_id", "unknown"),
            one_liner=one_liner[:160],
            active_problems=problems,
            red_flags=[RedFlag(**f) for f in flags],
            chronic_snapshot=snapshot,
            medications=meds,
            missing_data=missing,
            encounter_count=context.get("encounter_count", 0),
            last_encounter_days=context.get("last_encounter_days"),
        )


def summarize_patient(filepath: str, model: str = "gemini-1.5-flash") -> ClinicalSummary:
    """Convenience function: file path → summary."""
    context = parse_fhir_bundle(filepath)
    summarizer = ClinicalSummarizer(model=model)
    return summarizer.summarize(context)


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python -m engine.summarizer <patient.json>")
        sys.exit(1)
    
    summary = summarize_patient(sys.argv[1])
    print(summary.model_dump_json(indent=2))