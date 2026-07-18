"""
History-Aware Differential Diagnosis Engine
Generates ranked DDx + suggested questions/tests from TriageContext.
Gemini-powered with deterministic fallback.
"""
from __future__ import annotations
import json
import os
from typing import Any

import google.generativeai as genai
from pydantic import BaseModel, Field

from engine.models import (
    TriageContext, Symptom, Vitals, ConditionSummary, 
    MedicationSummary, LabReport, Conflict, ConflictSeverity,
    SymptomSeverity
)


class DifferentialDiagnosis(BaseModel):
    """Single differential diagnosis entry."""
    rank: int
    icd11_code: str
    display: str
    probability: str  # "high" | "moderate" | "low"
    reasoning: str
    supporting_evidence: list[str] = Field(default_factory=list)
    contradicting_evidence: list[str] = Field(default_factory=list)
    urgency: str = "routine"  # "emergent" | "urgent" | "routine"


class SuggestedAction(BaseModel):
    """Suggested clinical action (question, test, or referral)."""
    type: str  # "question" | "test" | "referral"
    priority: str  # "high" | "medium" | "low"
    description: str
    rationale: str
    icd11_link: list[str] = Field(default_factory=list)  # linked DDx codes


class TriageOutput(BaseModel):
    """Complete triage output from differential engine."""
    differential: list[DifferentialDiagnosis]
    red_flags: list[dict] = Field(default_factory=list)
    suggested_actions: list[SuggestedAction]
    clinical_summary: str
    block_reason: str | None = None
    generated_at: str
    model_used: str


SYSTEM_PROMPT = """You are a senior clinical decision support AI for Indian Primary Health Centers.
Generate a ranked differential diagnosis from structured triage context.

INPUT: TriageContext with:
- Intake symptoms (ICD-11 coded, with duration/severity)
- Current vitals
- Merged chronic conditions from ABHA history
- Current medications
- Historical lab trends
- Detected conflicts (Flag/Warn/Block)
- Red flags from thresholds

OUTPUT: Strict JSON matching TriageOutput schema.

RULES:
1. Rank DDx by clinical probability given history + current presentation
2. Each DDx must have: rank, ICD-11 code, display, probability (high/moderate/low), reasoning, supporting/contradicting evidence, urgency
3. Evidence MUST reference specific data points from context (HbA1c values, medication names, symptom durations, etc.)
4. Suggested actions: questions to ask, tests to order, referrals - each with priority and rationale linked to DDx
5. Red flags: escalate any Block conflicts, critical vitals, or emergency presentations
6. If Block conflicts exist, set block_reason and urgency=emergent for relevant DDx
7. Clinical summary: ≤200 chars, actionable for PHC doctor
8. NEVER hallucinate - only use data from context
9. Consider Indian PHC context: common conditions, resource constraints, referral pathways

ICD-11 CODES (common PHC):
- Infections: 1A00 (Malaria), 1B12 (Dengue), 1B50 (Typhoid), 1C40 (UTI), 1D70 (LRTI)
- Chronic: 5A11 (T2DM), BA00 (HTN), 8A20 (CKD), 8B10 (COPD), 6A00 (TB)
- Cardiac: BA01 (Heart failure), BC81 (ACS)
- OBGYN: JA00 (Pregnancy), JA01 (Pre-eclampsia), JA02 (GDM)
- Peds: KB00 (Faltering growth), 5B50 (SAM/MAM)
- Neuro: 8A00 (Stroke), 8A80 (Seizure)"""


FEW_SHOT = [{
    "input": {
        "intake": {
            "age": 57, "gender": "M",
            "symptoms": [
                {"icd11": "MG44", "display": "Fever", "duration_days": 3, "severity": "moderate"},
                {"icd11": "MD12", "display": "Shortness of breath", "duration_days": 2, "severity": "moderate"},
            ],
            "vitals": {"bp_sys": 150, "bp_dia": 95, "temp": 38.2, "spo2": 94, "pulse": 102}
        },
        "merged_conditions": [
            {"display": "Type 2 diabetes mellitus", "source": "history"},
            {"display": "Hypertensive disorder", "source": "history"},
        ],
        "merged_medications": [
            {"name": "Metformin 500mg", "dose": "500 mg BD"},
            {"name": "Glimepiride 2mg", "dose": "2 mg OD"},
            {"name": "Amlodipine 5mg", "dose": "5 mg OD"},
        ],
        "merged_labs": [
            {"display": "HbA1c", "value": 9.7, "unit": "%", "abnormal": "HH"},
            {"display": "Fasting glucose", "value": 198, "unit": "mg/dL", "abnormal": "H"},
            {"display": "Creatinine", "value": 1.3, "unit": "mg/dL", "abnormal": "H"},
        ],
        "conflicts": [
            {"severity": "warn", "message": "Uncontrolled diabetes (HbA1c 9.7%) with current symptoms suggests acute complication risk"}
        ],
        "red_flags": [
            {"type": "critical", "key": "hba1c", "value": 9.7},
            {"type": "critical", "key": "bp_diastolic", "value": 100.1},
        ]
    },
    "output": {
        "differential": [
            {
                "rank": 1,
                "icd11_code": "5A11",
                "display": "Diabetic ketoacidosis (DKA)",
                "probability": "high",
                "reasoning": "Uncontrolled T2DM (HbA1c 9.7%) + fever + SOB + tachycardia + hyperglycemia (fasting 198) + possible metabolic acidosis",
                "supporting_evidence": ["HbA1c 9.7% (HH)", "Fasting glucose 198 mg/dL (H)", "Fever 38.2°C", "SOB 2 days", "Pulse 102 bpm", "On metformin + glimepiride - inadequate control"],
                "contradicting_evidence": ["No ketone data", "SpO2 94% not severely hypoxic"],
                "urgency": "emergent"
            },
            {
                "rank": 2,
                "icd11_code": "1D70",
                "display": "Lower respiratory tract infection / Pneumonia",
                "probability": "high",
                "reasoning": "Fever + SOB + tachycardia + diabetic immunocompromise + possible aspiration",
                "supporting_evidence": ["Fever 38.2°C x3 days", "SOB 2 days", "Pulse 102", "Diabetes (immunocompromise)", "Creatinine 1.3 (possible dehydration/sepsis)"],
                "contradicting_evidence": ["No cough reported", "SpO2 94%"],
                "urgency": "urgent"
            },
            {
                "rank": 3,
                "icd11_code": "BA01",
                "display": "Acute decompensated heart failure",
                "probability": "moderate",
                "reasoning": "HTN + DM + SOB + tachycardia + elevated BP + possible fluid overload",
                "supporting_evidence": ["HTN on 2 agents", "SOB", "BP 150/95", "Pulse 102", "Creatinine 1.3 (cardiorenal)"],
                "contradicting_evidence": ["No orthopnea/PND reported", "No edema noted", "No JVP data"],
                "urgency": "urgent"
            },
            {
                "rank": 4,
                "icd11_code": "1C40",
                "display": "Urinary tract infection / Pyelonephritis",
                "probability": "moderate",
                "reasoning": "Diabetes + fever + possible urinary symptoms + elevated creatinine",
                "supporting_evidence": ["DM (UTI risk)", "Fever", "Creatinine 1.3", "On metformin (renal adjustment needed)"],
                "contradicting_evidence": ["No dysuria/frequency reported", "No flank pain"],
                "urgency": "urgent"
            }
        ],
        "red_flags": [
            {"type": "critical", "key": "hba1c", "message": "HbA1c 9.7% - DKA/HHS risk"},
            {"type": "critical", "key": "bp_diastolic", "message": "Diastolic 100.1 - hypertensive urgency"},
            {"type": "warning", "key": "creatinine", "message": "Creatinine 1.3 - adjust metformin"}
        ],
        "suggested_actions": [
            {"type": "test", "priority": "high", "description": "Blood ketones / ABG for DKA workup", "rationale": "Rule out DKA given HbA1c 9.7% + hyperglycemia + SOB", "icd11_link": ["5A11"]},
            {"type": "test", "priority": "high", "description": "Chest X-ray", "rationale": "Evaluate for pneumonia/LRTI given fever + SOB", "icd11_link": ["1D70"]},
            {"type": "test", "priority": "high", "description": "Urinalysis + culture", "rationale": "UTI common in DM, check for pyelonephritis", "icd11_link": ["1C40"]},
            {"type": "test", "priority": "high", "description": "ECG + Trop I", "rationale": "Rule out ACS given DM + HTN + SOB", "icd11_link": ["BA01", "BC81"]},
            {"type": "question", "priority": "high", "description": "Any chest pain, palpitations, orthopnea, PND?", "rationale": "Differentiate cardiac vs pulmonary SOB", "icd11_link": ["BA01", "1D70"]},
            {"type": "question", "priority": "medium", "description": "Any dysuria, frequency, flank pain?", "rationale": "Assess for UTI/pyelonephritis", "icd11_link": ["1C40"]},
            {"type": "test", "priority": "medium", "description": "CBC, CRP, lactate", "rationale": "Sepsis screen, inflammatory markers", "icd11_link": ["1D70", "5A11"]},
            {"type": "referral", "priority": "high", "description": "Refer to CHC/DH for IV fluids, insulin drip, monitoring if DKA confirmed", "rationale": "PHC cannot manage DKA", "icd11_link": ["5A11"]}
        ],
        "clinical_summary": "57M uncontrolled T2DM (HbA1c 9.7%) + HTN presents with fever x3d, SOB x2d. DKA, pneumonia, ADHF, UTI in DDx. Needs urgent ketones, CXR, ECG, urinalysis. Refer if DKA.",
        "block_reason": None,
        "model_used": "gemini-1.5-flash"
    }
}]


class DifferentialEngine:
    """History-aware differential diagnosis generator."""
    
    def __init__(self, model: str = "gemini-1.5-flash", api_key: str | None = None):
        api_key = api_key or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        self.model = None
        self.model_name = model
        if api_key and api_key != "fallback":
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel(model)
            except Exception:
                pass  # Will use fallback
    
    def _build_context_summary(self, context: TriageContext) -> dict[str, Any]:
        """Extract structured summary from TriageContext for prompt."""
        intake = context.intake
        
        return {
            "intake": {
                "age": intake.age,
                "gender": intake.gender,
                "symptoms": [
                    {
                        "icd11": s.icd11_code,
                        "display": s.display,
                        "duration_days": s.duration_days,
                        "severity": s.severity.value if hasattr(s.severity, 'value') else str(s.severity)
                    }
                    for s in intake.symptoms
                ],
                "vitals": {
                    "bp_sys": intake.vitals.bp_systolic,
                    "bp_dia": intake.vitals.bp_diastolic,
                    "temp": intake.vitals.temperature,
                    "spo2": intake.vitals.spo2,
                    "pulse": intake.vitals.pulse,
                    "weight": intake.vitals.weight,
                    "height": intake.vitals.height,
                    "bmi": intake.vitals.bmi,
                },
                "free_text": intake.free_text
            },
            "merged_conditions": [
                {"display": c.display, "source": c.source, "icd11": c.icd11_code, "snomed": c.snomed_code}
                for c in context.merged_conditions
            ],
            "merged_medications": [
                {"name": m.name, "dose": m.dose, "source": m.source}
                for m in context.merged_medications
            ],
            "merged_labs": [
                {
                    "display": l.display,
                    "value": l.value,
                    "unit": l.unit,
                    "abnormal": l.abnormal_flag,
                    "ref_range": l.reference_range
                }
                for l in context.merged_lab_reports
            ],
            "conflicts": [
                {
                    "severity": c.severity.value,
                    "type": c.type.value,
                    "message": c.message,
                    "disclaimer": c.disclaimer
                }
                for c in context.conflicts
            ],
            "red_flags": context.red_flags
        }
    
    def _build_prompt(self, context_summary: dict[str, Any]) -> str:
        parts = [SYSTEM_PROMPT, "\n\nEXAMPLES:"]
        for ex in FEW_SHOT:
            parts.append(f"\nInput: {json.dumps(ex['input'], default=str)}")
            parts.append(f"\nOutput: {json.dumps(ex['output'], default=str)}")
        parts.append(f"\n\nTRIAGE CONTEXT:\n{json.dumps(context_summary, default=str)}")
        parts.append("\n\nOUTPUT (JSON only):")
        return "".join(parts)
    
    def generate(self, context: TriageContext) -> TriageOutput:
        """Generate differential diagnosis from triage context."""
        if context.has_block_conflicts:
            # Block conflicts require acknowledgment before proceeding
            block_conflicts = context.get_conflicts_by_severity(ConflictSeverity.BLOCK)
            return TriageOutput(
                differential=[],
                red_flags=context.red_flags,
                suggested_actions=[
                    SuggestedAction(
                        type="question",
                        priority="high",
                        description=f"ACKNOWLEDGE BLOCK: {c.message}",
                        rationale="Block conflict must be acknowledged before triage can proceed",
                        icd11_link=[]
                    )
                    for c in block_conflicts
                ],
                clinical_summary=f"BLOCKED: {len(block_conflicts)} critical conflict(s) require acknowledgment",
                block_reason="; ".join(c.message for c in block_conflicts),
                generated_at=__import__("datetime").datetime.utcnow().isoformat(),
                model_used="blocked"
            )
        
        context_summary = self._build_context_summary(context)
        
        if self.model is None:
            return self._fallback_triage(context, context_summary)
        
        prompt = self._build_prompt(context_summary)
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=4096,
                    response_mime_type="application/json",
                ),
            )
            
            data = json.loads(response.text)
            data["model_used"] = self.model_name
            data["generated_at"] = __import__("datetime").datetime.utcnow().isoformat()
            return TriageOutput.model_validate(data)
            
        except Exception as e:
            return self._fallback_triage(context, context_summary, str(e))
    
    def _fallback_triage(self, context: TriageContext, context_summary: dict, error: str = "fallback") -> TriageOutput:
        """Deterministic rule-based differential generation."""
        intake = context.intake
        differential = []
        rank = 1
        
        # Extract key clinical features
        has_fever = any(s.icd11_code == "MG44" for s in intake.symptoms)
        has_sob = any(s.icd11_code == "MD12" for s in intake.symptoms)
        has_cough = any(s.icd11_code == "MD11" for s in intake.symptoms)
        has_chest_pain = any(s.icd11_code == "MD13" for s in intake.symptoms)
        has_hemoptysis = any(s.icd11_code == "MD15" for s in intake.symptoms)
        has_weight_loss = any(s.icd11_code == "MB23" for s in intake.symptoms)
        has_abdo_pain = any(s.icd11_code == "ME00" for s in intake.symptoms)
        has_diarrhea = any(s.icd11_code == "ME01" for s in intake.symptoms)
        has_vomiting = any(s.icd11_code == "ME02" for s in intake.symptoms)
        has_dysuria = any(s.icd11_code == "MF00" for s in intake.symptoms)
        has_frequency = any(s.icd11_code == "MF01" for s in intake.symptoms)
        has_hematuria = any(s.icd11_code == "MF02" for s in intake.symptoms)
        has_headache = any(s.icd11_code == "MB40" for s in intake.symptoms)
        has_dizziness = any(s.icd11_code == "MB41" for s in intake.symptoms)
        has_seizure = any(s.icd11_code == "MB42" for s in intake.symptoms)
        has_edema = any(s.icd11_code == "MB01" for s in intake.symptoms)
        has_palpitations = any(s.icd11_code == "MB00" for s in intake.symptoms)
        has_poor_feeding = any(s.icd11_code == "KB00" for s in intake.symptoms)
        has_irritability = any(s.icd11_code == "KB01" for s in intake.symptoms)
        has_dev_delay = any(s.icd11_code == "KB02" for s in intake.symptoms)
        
        # Chronic conditions from history
        conditions = {c.display.lower(): c for c in context.merged_conditions}
        has_dm = any("diabetes" in k for k in conditions)
        has_htn = any("hypertens" in k for k in conditions)
        has_tb = any("tuberculosis" in k for k in conditions)
        has_ckd = any("kidney" in k or "renal" in k for k in conditions)
        has_preg = any("pregnan" in k for k in conditions)
        has_heart = any("heart" in k or "cardiac" in k for k in conditions)
        
        # Key labs - LabReport objects have .value attribute
        labs = {l.display.lower(): l for l in context.merged_lab_reports}
        hba1c = labs.get("hba1c").value if labs.get("hba1c") else None
        creat = labs.get("creatinine").value if labs.get("creatinine") else None
        hb = labs.get("hb").value if labs.get("hb") else None
        
        # Vitals
        v = intake.vitals
        bp_sys = v.bp_systolic
        bp_dia = v.bp_diastolic
        temp = v.temperature
        spo2 = v.spo2
        pulse = v.pulse
        
        # High-priority rule-based DDx
        if has_dm and (hba1c and hba1c > 9.0) and (has_fever or has_sob or has_vomiting or has_abdo_pain):
            differential.append(DifferentialDiagnosis(
                rank=rank,
                icd11_code="5A11",
                display="Diabetic ketoacidosis (DKA) / Hyperosmolar hyperglycemic state (HHS)",
                probability="high",
                reasoning=f"Uncontrolled T2DM (HbA1c {hba1c}%) + acute symptoms (fever={has_fever}, SOB={has_sob}, vomiting={has_vomiting}, abd pain={has_abdo_pain}) suggest acute metabolic decompensation",
                supporting_evidence=[f"HbA1c {hba1c}%", "Uncontrolled DM on history", "Acute symptoms present"] + (["Fever"] if has_fever else []) + (["SOB"] if has_sob else []),
                contradicting_evidence=["No ketone/ABG data", "No glucose value from intake"],
                urgency="emergent"
            ))
            rank += 1
        
        if has_fever and has_cough and (has_sob or has_hemoptysis):
            differential.append(DifferentialDiagnosis(
                rank=rank,
                icd11_code="1D70" if not has_tb else "6A00",
                display="Pulmonary tuberculosis" if has_tb else "Lower respiratory tract infection / Pneumonia",
                probability="high" if has_tb else "high",
                reasoning=f"Fever + cough + {'hemoptysis' if has_hemoptysis else 'SOB'} + {'TB history' if has_tb else 'acute presentation'}",
                supporting_evidence=["Fever", "Cough"] + (["Hemoptysis"] if has_hemoptysis else []) + (["TB in history"] if has_tb else []) + (["SOB"] if has_sob else []),
                contradicting_evidence=["No CXR", "No sputum AFB data"],
                urgency="urgent"
            ))
            rank += 1
        
        if has_sob and (has_htn or has_dm or has_heart) and (bp_sys and bp_sys > 140 or bp_dia and bp_dia > 90):
            differential.append(DifferentialDiagnosis(
                rank=rank,
                icd11_code="BA01",
                display="Acute decompensated heart failure",
                probability="moderate",
                reasoning=f"SOB + {'HTN' if has_htn else ''} {'DM' if has_dm else ''} + elevated BP ({bp_sys}/{bp_dia}) + tachycardia ({pulse})",
                supporting_evidence=["SOB", f"BP {bp_sys}/{bp_dia}"] + (["HTN history"] if has_htn else []) + (["DM history"] if has_dm else []) + (["Pulse {pulse}"] if pulse else []),
                contradicting_evidence=["No orthopnea/PND", "No edema", "No JVP", "No BNP"],
                urgency="urgent"
            ))
            rank += 1
        
        if (has_dysuria or has_frequency or has_hematuria) and (has_fever or has_dm):
            differential.append(DifferentialDiagnosis(
                rank=rank,
                icd11_code="1C40",
                display="Urinary tract infection / Pyelonephritis",
                probability="high" if has_fever else "moderate",
                reasoning=f"Urinary symptoms + {'fever' if has_fever else ''} + {'DM (risk factor)' if has_dm else ''}" + (f" + Creatinine {creat}" if creat else ""),
                supporting_evidence=(["Dysuria"] if has_dysuria else []) + (["Frequency"] if has_frequency else []) + (["Fever"] if has_fever else []) + (["DM"] if has_dm else []) + ([f"Creatinine {creat}"] if creat else []),
                contradicting_evidence=["No urinalysis", "No flank pain"],
                urgency="urgent" if has_fever else "routine"
            ))
            rank += 1
        
        if has_headache and has_htn and bp_sys and bp_sys > 160:
            differential.append(DifferentialDiagnosis(
                rank=rank,
                icd11_code="BA00",
                display="Hypertensive encephalopathy / Urgency",
                probability="high",
                reasoning=f"Severe HTN (BP {bp_sys}/{bp_dia}) + headache + HTN history",
                supporting_evidence=[f"BP {bp_sys}/{bp_dia}", "Headache", "HTN history"],
                contradicting_evidence=["No neuro deficits", "No papilledema data"],
                urgency="emergent"
            ))
            rank += 1
        
        if has_chest_pain and (has_dm or has_htn or has_htn):
            differential.append(DifferentialDiagnosis(
                rank=rank,
                icd11_code="BC81",
                display="Acute coronary syndrome",
                probability="moderate",
                reasoning=f"Chest pain + cardiovascular risk factors (DM={has_dm}, HTN={has_htn})",
                supporting_evidence=["Chest pain"] + (["DM"] if has_dm else []) + (["HTN"] if has_htn else []),
                contradicting_evidence=["No ECG", "No troponin", "No radiation description"],
                urgency="emergent"
            ))
            rank += 1
        
        if has_seizure or (has_headache and has_dizziness):
            differential.append(DifferentialDiagnosis(
                rank=rank,
                icd11_code="8A80",
                display="Seizure disorder / Cerebrovascular event",
                probability="moderate",
                reasoning=f"Neurological symptoms: seizure={has_seizure}, headache={has_headache}, dizziness={has_dizziness}" + (f" + HTN" if has_htn else ""),
                supporting_evidence=(["Seizure"] if has_seizure else []) + (["Headache"] if has_headache else []) + (["Dizziness"] if has_dizziness else []) + (["HTN"] if has_htn else []),
                contradicting_evidence=["No neuro exam", "No imaging"],
                urgency="emergent" if has_seizure else "urgent"
            ))
            rank += 1
        
        if has_weight_loss and has_fever and has_cough:
            differential.append(DifferentialDiagnosis(
                rank=rank,
                icd11_code="6A00",
                display="Tuberculosis (active/reactivation)",
                probability="high" if has_tb else "moderate",
                reasoning=f"Weight loss + fever + cough + {'TB history' if has_tb else 'chronic presentation'}",
                supporting_evidence=["Weight loss", "Fever", "Cough"] + (["TB history"] if has_tb else []),
                contradicting_evidence=["No sputum AFB", "No CXR", "No night sweats confirmed"],
                urgency="urgent"
            ))
            rank += 1
        
        if has_preg and (has_headache or has_edema or bp_sys and bp_sys > 140):
            differential.append(DifferentialDiagnosis(
                rank=rank,
                icd11_code="JA01" if bp_sys and bp_sys > 140 else "JA00",
                display="Pre-eclampsia" if bp_sys and bp_sys > 140 else "Pregnancy-related concern",
                probability="high" if bp_sys and bp_sys > 140 else "moderate",
                reasoning=f"Pregnancy + {'HTN' if bp_sys and bp_sys > 140 else 'symptoms'} + headache={has_headache} + edema={has_edema}",
                supporting_evidence=["Pregnancy"] + ([f"BP {bp_sys}/{bp_dia}"] if bp_sys else []) + (["Headache"] if has_headache else []) + (["Edema"] if has_edema else []),
                contradicting_evidence=["No proteinuria data", "No GA data"],
                urgency="emergent" if bp_sys and bp_sys > 160 else "urgent"
            ))
            rank += 1
        
        if intake.age and intake.age < 5 and (has_fever or has_weight_loss or has_diarrhea or has_poor_feeding or has_irritability):
            differential.append(DifferentialDiagnosis(
                rank=rank,
                icd11_code="KB00",
                display="Pediatric faltering growth / Severe acute malnutrition",
                probability="high" if (has_weight_loss or has_poor_feeding) else "moderate",
                reasoning=f"Child <5y + fever={has_fever} + weight loss={has_weight_loss} + diarrhea={has_diarrhea} + poor feeding={has_poor_feeding} + irritability={has_irritability}" + (f" + Hb {hb}" if hb else ""),
                supporting_evidence=[f"Age {intake.age}y"] + (["Fever"] if has_fever else []) + (["Weight loss"] if has_weight_loss else []) + (["Diarrhea"] if has_diarrhea else []) + (["Poor feeding"] if has_poor_feeding else []) + (["Irritability"] if has_irritability else []) + ([f"Hb {hb}"] if hb else []),
                contradicting_evidence=["No MUAC", "No WFH z-score"],
                urgency="urgent"
            ))
            rank += 1
        
        # Generic viral/prodromal if nothing else
        if not differential and has_fever:
            differential.append(DifferentialDiagnosis(
                rank=1,
                icd11_code="1A00",
                display="Viral syndrome / Undifferentiated fever",
                probability="moderate",
                reasoning="Fever without localizing signs",
                supporting_evidence=["Fever"],
                contradicting_evidence=["No specific localizing symptoms"],
                urgency="routine"
            ))
        
        # Deduplicate by ICD-11 code (keep highest probability/urgency)
        seen_codes = set()
        deduped = []
        for dx in differential:
            if dx.icd11_code not in seen_codes:
                seen_codes.add(dx.icd11_code)
                deduped.append(dx)
        differential = deduped
        # Re-rank
        for i, dx in enumerate(differential):
            dx.rank = i + 1
        
        # Suggested actions
        actions = []
        
        # Tests based on DDx
        for dx in differential:
            if "DKA" in dx.display:
                actions.extend([
                    SuggestedAction(type="test", priority="high", description="Blood ketones / VBG / ABG", rationale="Confirm DKA/HHS", icd11_link=[dx.icd11_code]),
                    SuggestedAction(type="test", priority="high", description="Blood glucose (POC)", rationale="Quantify hyperglycemia", icd11_link=[dx.icd11_code]),
                    SuggestedAction(type="test", priority="high", description="Serum electrolytes, renal function", rationale="Assess dehydration, renal function, K+ for insulin safety", icd11_link=[dx.icd11_code]),
                    SuggestedAction(type="referral", priority="high", description="Refer to CHC/DH for IV insulin/fluids", rationale="PHC cannot manage DKA", icd11_link=[dx.icd11_code]),
                ])
            if "pneumonia" in dx.display.lower() or "LRTI" in dx.display or "TB" in dx.display:
                actions.extend([
                    SuggestedAction(type="test", priority="high", description="Chest X-ray", rationale="Evaluate consolidation, cavitation", icd11_link=[dx.icd11_code]),
                    SuggestedAction(type="test", priority="high", description="Sputum AFB x2" if "TB" in dx.display else "Sputum gram stain/culture", rationale="TB diagnosis" if "TB" in dx.display else "Bacterial etiology", icd11_link=[dx.icd11_code]),
                    SuggestedAction(type="test", priority="medium", description="CBC, CRP", rationale="Inflammatory markers", icd11_link=[dx.icd11_code]),
                ])
            if "heart failure" in dx.display.lower():
                actions.extend([
                    SuggestedAction(type="test", priority="high", description="ECG", rationale="Assess for ischemia, strain", icd11_link=[dx.icd11_code]),
                    SuggestedAction(type="test", priority="high", description="Troponin I", rationale="Rule out ACS", icd11_link=[dx.icd11_code]),
                    SuggestedAction(type="test", priority="medium", description="BNP/NT-proBNP if available", rationale="Confirm HF", icd11_link=[dx.icd11_code]),
                ])
            if "UTI" in dx.display or "pyelonephritis" in dx.display.lower():
                actions.extend([
                    SuggestedAction(type="test", priority="high", description="Urinalysis + culture", rationale="Confirm UTI, guide antibiotics", icd11_link=[dx.icd11_code]),
                    SuggestedAction(type="test", priority="medium", description="Renal ultrasound if available", rationale="Rule out obstruction", icd11_link=[dx.icd11_code]),
                ])
            if "ACS" in dx.display or "coronary" in dx.display.lower():
                actions.extend([
                    SuggestedAction(type="test", priority="high", description="ECG (serial)", rationale="STEMI/NSTEMI detection", icd11_link=[dx.icd11_code]),
                    SuggestedAction(type="test", priority="high", description="Troponin I (serial)", rationale="Myocardial injury", icd11_link=[dx.icd11_code]),
                    SuggestedAction(type="referral", priority="high", description="Refer to cath-capable center", rationale="ACS needs higher care", icd11_link=[dx.icd11_code]),
                ])
            if "pre-eclampsia" in dx.display.lower():
                actions.extend([
                    SuggestedAction(type="test", priority="high", description="Urine protein/creatinine ratio", rationale="Confirm proteinuria", icd11_link=[dx.icd11_code]),
                    SuggestedAction(type="test", priority="high", description="LFTs, platelets, creatinine", rationale="HELLP screen", icd11_link=[dx.icd11_code]),
                    SuggestedAction(type="referral", priority="high", description="Refer to FRU/CHC for obstetric care", rationale="Pre-eclampsia needs delivery planning", icd11_link=[dx.icd11_code]),
                ])
        
        # Questions
        actions.extend([
            SuggestedAction(type="question", priority="high", description="Onset, progression, aggravating/relieving factors for each symptom", rationale="Refine DDx probability", icd11_link=[]),
            SuggestedAction(type="question", priority="high", description="Medication adherence (especially metformin, antihypertensives, ATT)", rationale="Non-adherence common cause of decompensation", icd11_link=[]),
            SuggestedAction(type="question", priority="medium", description="Recent antibiotic/steroid use, contrast exposure", rationale="Drug-induced causes", icd11_link=[]),
            SuggestedAction(type="question", priority="medium", description="Immunization status (COVID, influenza, pneumococcal)", rationale="VPD consideration", icd11_link=[]),
        ])
        
        # Red flags from context
        red_flags = context.red_flags.copy()
        if context.has_warnings:
            for c in context.get_conflicts_by_severity(ConflictSeverity.WARN):
                red_flags.append({"type": "warning", "key": c.type.value, "message": c.message})
        
        # Clinical summary
        age = intake.age or "?"
        gender = intake.gender or "?"
        top_dx = differential[0].display if differential else "Undifferentiated"
        flags_summary = f"{len([f for f in red_flags if f.get('type')=='critical'])} critical, {len([f for f in red_flags if f.get('type')=='warning'])} warning" if red_flags else "no critical flags"
        clinical_summary = f"{age}{gender}, {top_dx}, {flags_summary}. {len(differential)} DDx, {len(actions)} actions."
        if len(clinical_summary) > 200:
            clinical_summary = clinical_summary[:197] + "..."
        
        return TriageOutput(
            differential=differential,
            red_flags=red_flags,
            suggested_actions=actions,
            clinical_summary=clinical_summary,
            block_reason=None,
            generated_at=__import__("datetime").datetime.utcnow().isoformat(),
            model_used=f"fallback-{error}"
        )


def get_differential_engine(model: str = "gemini-1.5-flash", api_key: str | None = None) -> DifferentialEngine:
    """Get or create singleton differential engine."""
    global _differential_engine
    if _differential_engine is None:
        _differential_engine = DifferentialEngine(model=model, api_key=api_key)
    return _differential_engine


_differential_engine: DifferentialEngine | None = None


if __name__ == "__main__":
    import asyncio
    from engine.models import SymptomIntake, Symptom, Vitals
    from engine.merge import get_context_merger
    from engine.parser import parse_fhir_bundle
    
    # Test with a patient
    intake = SymptomIntake(
        abha_id="12345678901234",
        age=57,
        gender="M",
        symptoms=[
            Symptom(icd11_code="MG44", display="Fever", duration_days=3, severity=SymptomSeverity.MODERATE),
            Symptom(icd11_code="MD12", display="Shortness of breath", duration_days=2, severity=SymptomSeverity.MODERATE),
        ],
        vitals=Vitals(bp_systolic=150, bp_diastolic=95, temperature=38.2, spo2=94, pulse=102),
        free_text="Fever for 3 days, shortness of breath, history of uncontrolled diabetes"
    )
    
    history = parse_fhir_bundle("data/patients/uncontrolled_dm_000.json")
    merger = get_context_merger()
    context = merger.merge(intake, history)
    
    engine = get_differential_engine()
    output = engine.generate(context)
    
    print(f"Model: {output.model_used}")
    print(f"Clinical Summary: {output.clinical_summary}")
    print(f"Blocked: {output.block_reason is not None}")
    print(f"Differential ({len(output.differential)}):")
    for dx in output.differential:
        print(f"  {dx.rank}. [{dx.probability}/{dx.urgency}] {dx.display} ({dx.icd11_code})")
        print(f"     Reasoning: {dx.reasoning}")
        print(f"     Supporting: {dx.supporting_evidence}")
    print(f"Red flags ({len(output.red_flags)}):")
    for rf in output.red_flags:
        print(f"  [{rf.get('type')}] {rf.get('message', rf.get('key'))}")
    print(f"Suggested actions ({len(output.suggested_actions)}):")
    for a in output.suggested_actions:
        print(f"  [{a.priority}] {a.type}: {a.description} - {a.rationale}")