"""
Context Merge Service
Merges symptom intake + ABHA history into unified TriageContext with conflict detection.
"""
from __future__ import annotations
from typing import Any, Optional
from datetime import datetime
from collections import defaultdict

from engine.models import (
    SymptomIntake, TriageContext, Symptom, Vitals, ConditionSummary,
    MedicationSummary, LabReport, AllergySummary, Conflict, ConflictType, ConflictSeverity
)


class ContextMerger:
    """
    Merges symptom intake with ABHA history into a unified triage context.
    Detects conflicts between intake and history with configurable severity.
    """
    
    def __init__(self):
        pass
    
    def merge(self, intake: SymptomIntake, abha_history: Optional[dict]) -> TriageContext:
        """
        Merge intake with ABHA history into a unified triage context.
        
        Args:
            intake: SymptomIntake from nurse/ASHA
            abha_history: Raw FHIR context from parser (or None)
            
        Returns:
            TriageContext with merged data and detected conflicts
        """
        context = TriageContext(intake=intake)
        
        if not abha_history:
            context.ready_for_triage = True
            return context
        
        # Merge conditions
        context.merged_conditions = self._merge_conditions(intake, abha_history)
        
        # Merge medications
        context.merged_medications = self._merge_medications(intake, abha_history)
        
        # Merge vitals (history provides baseline, intake provides current)
        context.merged_vitals = self._merge_vitals(intake, abha_history)
        
        # Merge lab reports from history
        context.merged_lab_reports = self._extract_lab_reports(abha_history)
        
        # Merge allergies
        context.merged_allergies = self._extract_allergies(abha_history)
        
        # Detect conflicts
        context.conflicts = self._detect_conflicts(intake, abha_history, context)
        
        # Copy red flags from history
        context.red_flags = abha_history.get("red_flags", [])
        
        # Determine if ready for triage (no BLOCK conflicts)
        context.ready_for_triage = not context.has_block_conflicts
        
        return context
    
    # ──────────────────────────────────────────────
    # Condition Merging
    # ──────────────────────────────────────────────
    
    def _merge_conditions(self, intake: SymptomIntake, history: dict) -> list[ConditionSummary]:
        """Merge conditions from intake symptoms + history."""
        conditions = []
        seen = set()
        
        # Add conditions from history (source of truth for chronic conditions)
        for cond in history.get("active_problems", []):
            key = (cond.get("code") or cond.get("display", "")).lower().strip()
            if key and key not in seen:
                conditions.append(ConditionSummary(
                    snomed_code=cond.get("code"),
                    display=cond.get("display", "Unknown"),
                    clinical_status="active",
                    source="history",
                    verified=False
                ))
                seen.add(key)
        
        # Map intake symptoms to conditions (symptoms ≠ conditions, but flag for doctor)
        for symptom in intake.symptoms:
            if symptom.icd11_code and symptom.icd11_code not in seen:
                # Symptoms become provisional conditions for triage
                conditions.append(ConditionSummary(
                    icd11_code=symptom.icd11_code,
                    display=symptom.display,
                    clinical_status="active",
                    source="intake",
                    verified=False
                ))
                seen.add(symptom.icd11_code)
        
        return conditions
    
    # ──────────────────────────────────────────────
    # Medication Merging
    # ──────────────────────────────────────────────
    
    def _merge_medications(self, intake: SymptomIntake, history: dict) -> list[MedicationSummary]:
        """Merge medications from intake + history, deduplicate by RxNorm/name."""
        meds = []
        seen = set()
        
        # History medications (source of truth for chronic meds)
        for med in history.get("medications", []):
            key = med.get("rxnorm_code") or med.get("name", "").lower().strip()
            if key and key not in seen:
                meds.append(MedicationSummary(
                    rxnorm_code=med.get("rxnorm_code"),
                    name=med.get("name", "Unknown"),
                    dose=med.get("dose", ""),
                    status=med.get("status", "active"),
                    source="history"
                ))
                seen.add(key)
        
        # Intake medications (if any - typically from symptom intake, not med list)
        # Could be extended to include medication intake in future
        
        return meds
    
# ──────────────────────────────────────────────
# Vitals Merging
# ──────────────────────────────────────────────
    
    def _merge_vitals(self, intake: SymptomIntake, history: dict) -> Vitals:
        """Merge vitals: intake (current) takes precedence, history provides baseline."""
        merged = Vitals()
        
        # Start with history baseline
        hist_vitals = history.get("vitals", {})
        if hist_vitals:
            merged.bp_systolic = hist_vitals.get("bp_systolic", {}).get("value")
            merged.bp_diastolic = hist_vitals.get("bp_diastolic", {}).get("value")
            merged.temperature = hist_vitals.get("temperature", {}).get("value")
            merged.respiratory_rate = hist_vitals.get("respiratory_rate", {}).get("value")
            merged.spo2 = hist_vitals.get("spo2", {}).get("value")
            merged.pulse = hist_vitals.get("pulse", {}).get("value")
            merged.weight = hist_vitals.get("weight", {}).get("value")
            merged.height = hist_vitals.get("height", {}).get("value")
        
        # Override with intake current vitals (more recent)
        if intake.vitals.bp_systolic is not None:
            merged.bp_systolic = intake.vitals.bp_systolic
        if intake.vitals.bp_diastolic is not None:
            merged.bp_diastolic = intake.vitals.bp_diastolic
        if intake.vitals.temperature is not None:
            merged.temperature = intake.vitals.temperature
        if intake.vitals.respiratory_rate is not None:
            merged.respiratory_rate = intake.vitals.respiratory_rate
        if intake.vitals.spo2 is not None:
            merged.spo2 = intake.vitals.spo2
        if intake.vitals.pulse is not None:
            merged.pulse = intake.vitals.pulse
        if intake.vitals.weight is not None:
            merged.weight = intake.vitals.weight
        if intake.vitals.height is not None:
            merged.height = intake.vitals.height
        
        # BMI auto-calculated in Vitals model
        return merged
    
    # ──────────────────────────────────────────────
    # Lab Reports & Allergies from History
# ──────────────────────────────────────────────
    
    def _extract_lab_reports(self, history: dict) -> list:
        """Extract lab reports from history vitals."""
        labs = []
        hist_vitals = history.get("vitals", {})
        
        # Lab-like vitals (HbA1c, creatinine, etc.)
        lab_keys = ["hba1c", "fasting_glucose", "creatinine", "egfr", "potassium", "hb", "muac", "alt", "ast", "bilirubin", "proteinuria"]
        
        for key, vital in hist_vitals.items():
            if key in lab_keys:
                labs.append(LabReport(
                    loinc_code=self._vital_to_loinc(key),
                    display=key.replace("_", " ").title(),
                    value=vital.get("value", 0),
                    unit=vital.get("unit", ""),
                    reference_range=self._get_reference_range(key),
                    abnormal_flag=self._get_abnormal_flag(key, vital.get("value")),
                    specimen_date=vital.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
                    status="final"
                ))
        
        return labs
    
    def _extract_allergies(self, history: dict) -> list:
        """Extract allergies from history (placeholder - extend when FHIR AllergyIntolerance available)."""
        return []
    
    def _vital_to_loinc(self, key: str) -> str:
        mapping = {
            "hba1c": "4548-4",
            "fasting_glucose": "1558-6",
            "creatinine": "2160-0",
            "egfr": "33914-3",
            "potassium": "2823-3",
            "hb": "718-7",
            "muac": "8281-8",
            "alt": "1742-6",
            "ast": "1920-8",
            "bilirubin": "1975-2",
            "proteinuria": "2888-6",
        }
        return mapping.get(key, "99999-9")
    
    def _get_reference_range(self, key: str) -> Optional[str]:
        ranges = {
            "hba1c": "<5.7% (normal), 5.7-6.4% (prediabetes), >=6.5% (diabetes)",
            "fasting_glucose": "<100 mg/dL (normal), 100-125 (prediabetes), >=126 (diabetes)",
            "creatinine": "0.6-1.3 mg/dL",
            "egfr": ">90 (normal), 60-89 (mild), 30-59 (moderate), 15-29 (severe), <15 (failure)",
            "potassium": "3.5-5.0 mmol/L",
            "hb": "M: 13.5-17.5, F: 12.0-15.5 g/dL",
        }
        return ranges.get(key)
    
    def _get_abnormal_flag(self, key: str, value: Optional[float]) -> Optional[str]:
        if value is None:
            return None
        
        # Simplified thresholds
        thresholds = {
            "hba1c": {"high": 6.5, "critical": 9.0},
            "fasting_glucose": {"high": 126, "critical": 200},
            "creatinine": {"high": 1.3, "critical": 2.0},
            "egfr": {"low": 60, "critical": 30},
            "potassium": {"high": 5.0, "low": 3.5, "critical_high": 6.0, "critical_low": 2.5},
            "hb": {"low_m": 13.5, "low_f": 12.0, "critical_low": 8.0},
        }
        
        if key not in thresholds:
            return None
        
        t = thresholds[key]
        if "critical" in t and value >= t["critical"]:
            return "HH"
        if "critical_low" in t and value <= t["critical_low"]:
            return "LL"
        if "high" in t and value >= t["high"]:
            return "H"
        if "low" in t and value <= t["low"]:
            return "L"
        return None
    
    # ──────────────────────────────────────────────
    # Conflict Detection
# ──────────────────────────────────────────────
    
    def _detect_conflicts(self, intake: SymptomIntake, history: dict, context: TriageContext) -> list[Conflict]:
        """Detect discrepancies between intake and history."""
        conflicts = []
        
        # 1. Condition mismatches
        conflicts.extend(self._detect_condition_conflicts(intake, history))
        
        # 2. Medication conflicts (intake says no meds, history has meds)
        conflicts.extend(self._detect_medication_conflicts(intake, history))
        
        # 3. Vitals discrepancies (current vs baseline)
        conflicts.extend(self._detect_vitals_discrepancies(intake, history))
        
        # 4. Lab discrepancies (current intake vitals vs historical labs)
        conflicts.extend(self._detect_lab_discrepancies(intake, history))
        
        # 5. Allergy mismatches
        conflicts.extend(self._detect_allergy_conflicts(intake, history))
        
        # 6. Missing history gaps
        conflicts.extend(self._detect_history_gaps(intake, history))
        
        return conflicts
    
    def _detect_condition_conflicts(self, intake: SymptomIntake, history: dict) -> list[Conflict]:
        """Detect condition mismatches between intake and history."""
        conflicts = []
        
        # Map ICD-11 symptoms to SNOMED conditions for cross-checking
        symptom_to_condition = {
            "MG44": [("44054006", "Type 2 diabetes mellitus")],  # Fever -> could indicate infection in diabetic
            "MD11": [("60963004", "Pulmonary tuberculosis")],   # Cough -> TB
            "MD12": [("38341003", "Hypertensive disorder")],    # SOB -> HTN
        }
        
        # Check if intake symptoms suggest conditions not in history
        for symptom in intake.symptoms:
            if symptom.icd11_code in symptom_to_condition:
                for cond_code, cond_display in symptom_to_condition[symptom.icd11_code]:
                    # Check if history has this condition
                    history_has = any(
                        cond.get("code") == cond_code 
                        for cond in history.get("active_problems", [])
                    )
                    if not history_has:
                        conflicts.append(Conflict(
                            type=ConflictType.CONDITION_MISMATCH,
                            severity=ConflictSeverity.WARN,
                            message=f"Intake symptom '{symptom.display}' suggests possible {cond_display}, but not documented in history",
                            intake_value={"symptom": symptom.display, "icd11": symptom.icd11_code},
                            history_value={"condition": cond_display, "snomed": cond_code},
                            disclaimer="Clinical correlation recommended. Consider screening for this condition."
                        ))
        
        return conflicts
    
    def _detect_medication_conflicts(self, intake: SymptomIntake, history: dict) -> list[Conflict]:
        """Detect medication-related conflicts."""
        conflicts = []
        
        history_meds = {med.get("name", "").lower() for med in history.get("medications", [])}
        
        # Check for common interaction risks in history
        meds_lower = [m.lower() for m in history_meds]
        
        # Triple whammy: NSAID + ACEi/ARB + Diuretic
        has_nsaid = any("diclofenac" in m or "ibuprofen" in m or "naproxen" in m for m in meds_lower)
        has_acei = any("lisinopril" in m or "enalapril" in m or "telmisartan" in m or "losartan" in m for m in meds_lower)
        has_diuretic = any("furosemide" in m or "hydrochlorothiazide" in m or "indapamide" in m for m in meds_lower)
        
        if has_nsaid and has_acei and has_diuretic:
            conflicts.append(Conflict(
                type=ConflictType.CONDITION_MISMATCH,
                severity=ConflictSeverity.BLOCK,
                message="Triple whammy detected: NSAID + ACEi/ARB + Diuretic combination (AKI risk)",
                intake_value={},
                history_value={"medications": list(history_meds)},
                disclaimer="CRITICAL: This combination carries high risk of acute kidney injury. Must acknowledge before proceeding."
            ))
        
        # Metformin + Contrast
        has_metformin = any("metformin" in m for m in meds_lower)
        # Could add contrast agent check from intake free_text
        
        return conflicts
    
    def _detect_vitals_discrepancies(self, intake: SymptomIntake, history: dict) -> list[Conflict]:
        """Detect significant discrepancies between current and historical vitals."""
        conflicts = []
        
        hist_vitals = history.get("vitals", {})
        curr = intake.vitals
        
        # BP discrepancy
        if curr.bp_systolic and curr.bp_diastolic:
            hist_sys = hist_vitals.get("bp_systolic", {}).get("value")
            hist_dia = hist_vitals.get("bp_diastolic", {}).get("value")
            
            if hist_sys and abs(curr.bp_systolic - hist_sys) > 30:
                conflicts.append(Conflict(
                    type=ConflictType.VITALS_DISCREPANCY,
                    severity=ConflictSeverity.WARN,
                    message=f"Systolic BP changed significantly: current {curr.bp_systolic} vs historical {hist_sys} mmHg",
                    intake_value={"bp_systolic": curr.bp_systolic},
                    history_value={"bp_systolic": hist_sys},
                    disclaimer="Verify measurement technique. Consider white-coat effect."
                ))
            
            if hist_dia and abs(curr.bp_diastolic - hist_dia) > 20:
                conflicts.append(Conflict(
                    type=ConflictType.VITALS_DISCREPANCY,
                    severity=ConflictSeverity.WARN,
                    message=f"Diastolic BP changed significantly: current {curr.bp_diastolic} vs historical {hist_dia} mmHg",
                    intake_value={"bp_diastolic": curr.bp_diastolic},
                    history_value={"bp_diastolic": hist_dia}
                ))
        
        # Weight change
        if curr.weight and "weight" in history.get("vitals", {}):
            hist_wt = history["vitals"]["weight"].get("value")
            if hist_wt and abs(curr.weight - hist_wt) > 5:
                severity = ConflictSeverity.WARN if abs(curr.weight - hist_wt) > 10 else ConflictSeverity.FLAG
                conflicts.append(Conflict(
                    type=ConflictType.VITALS_DISCREPANCY,
                    severity=severity,
                    message=f"Weight changed by {abs(curr.weight - hist_wt):.1f} kg: current {curr.weight} vs historical {hist_wt} kg",
                    intake_value={"weight": curr.weight},
                    history_value={"weight": hist_wt},
                    disclaimer="Assess for fluid retention, malnutrition, or malignancy." if severity == ConflictSeverity.WARN else None
                ))
        
        return conflicts
    
    def _detect_lab_discrepancies(self, intake: SymptomIntake, history: dict) -> list[Conflict]:
        """Detect discrepancies between current symptoms and historical labs."""
        conflicts = []
        
        hist_vitals = history.get("vitals", {})
        
        # HbA1c check for diabetic symptoms
        if any(s.icd11_code in ["MG44", "MB23"] for s in intake.symptoms):  # Fever, weight loss
            hba1c = hist_vitals.get("hba1c", {}).get("value")
            if hba1c and hba1c > 9.0:
                conflicts.append(Conflict(
                    type=ConflictType.LAB_DISCREPANCY,
                    severity=ConflictSeverity.WARN,
                    message=f"Uncontrolled diabetes (HbA1c {hba1c}%) with current symptoms suggests acute complication risk",
                    intake_value={"symptoms": [s.display for s in intake.symptoms]},
                    history_value={"hba1c": hba1c},
                    disclaimer="Consider DKA/HHS workup if ketones positive."
                ))
        
        # Creatinine check for renal symptoms
        if any(s.icd11_code in ["MF00", "MF01"] for s in intake.symptoms):  # Dysuria, frequency
            creat = hist_vitals.get("creatinine", {}).get("value")
            if creat and creat > 1.5:
                conflicts.append(Conflict(
                    type=ConflictType.LAB_DISCREPANCY,
                    severity=ConflictSeverity.WARN,
                    message=f"Elevated creatinine ({creat} mg/dL) with urinary symptoms - assess for pyelonephritis/obstruction",
                    intake_value={"symptoms": [s.display for s in intake.symptoms]},
                    history_value={"creatinine": creat}
                ))
        
        return conflicts
    
    def _detect_allergy_conflicts(self, intake: SymptomIntake, history: dict) -> list[Conflict]:
        """Detect allergy conflicts (placeholder for future AllergyIntolerance)."""
        return []
    
    def _detect_history_gaps(self, intake: SymptomIntake, history: dict) -> list[Conflict]:
        """Detect clinically relevant missing history."""
        conflicts = []
        
        # Chronic conditions that should have follow-up
        chronic_conditions = {
            "44054006": "diabetes",  # T2DM
            "38341003": "hypertension",
            "60963004": "tuberculosis",
        }
        
        for code, name in chronic_conditions.items():
            history_has = any(
                cond.get("code") == code 
                for cond in history.get("active_problems", [])
            )
            
            if history_has:
                # Check last encounter
                last_enc = history.get("vitals", {}).get("hba1c" if "diabetes" in name else "bp_systolic", {}).get("date")
                if last_enc:
                    days_since = (datetime.utcnow() - datetime.fromisoformat(last_enc.replace("Z", "+00:00"))).days
                    if days_since > 90:
                        conflicts.append(Conflict(
                            type=ConflictType.HISTORY_GAP,
                            severity=ConflictSeverity.WARN,
                            message=f"{name.title()} patient without follow-up for {days_since} days (>90 days)",
                            intake_value={},
                            history_value={"last_visit_days_ago": days_since, "condition": name},
                            disclaimer="Schedule follow-up and consider lab monitoring."
                        ))
        
        return conflicts


# ──────────────────────────────────────────────
# Singleton
# ──────────────────────────────────────────────

_context_merger: Optional[ContextMerger] = None

def get_context_merger() -> ContextMerger:
    global _context_merger
    if _context_merger is None:
        _context_merger = ContextMerger()
    return _context_merger


# ──────────────────────────────────────────────
# Self-Test
# ──────────────────────────────────────────────

if __name__ == "__main__":
    print("Testing Context Merger...")
    
    # Mock intake
    intake = SymptomIntake(
        abha_id="12345678901234",
        age=55,
        gender="M",
        symptoms=[
            Symptom(icd11_code="MD11", display="Cough", duration_days=14, severity="moderate"),
            Symptom(icd11_code="MB23", display="Weight loss", duration_days=30, severity="mild"),
        ],
        vitals=Vitals(bp_systolic=145, bp_diastolic=92, temperature=37.2, spo2=96, pulse=88, weight=55.0, height=165.0),
        free_text="Cough for 2 weeks, weight loss 5kg"
    )
    
    # Mock history (uncontrolled DM patient)
    history = {
        "active_problems": [
            {"code": "44054006", "display": "Type 2 diabetes mellitus"},
            {"code": "38341003", "display": "Hypertensive disorder"},
        ],
        "medications": [
            {"name": "Metformin 500mg", "dose": "500 mg BD", "status": "active"},
            {"name": "Glimepiride 2mg", "dose": "2 mg OD", "status": "active"},
            {"name": "Amlodipine 5mg", "dose": "5 mg OD", "status": "active"},
        ],
        "vitals": {
            "hba1c": {"value": 9.4, "unit": "%", "date": "2026-03-15T10:00:00"},
            "bp_systolic": {"value": 148, "unit": "mmHg", "date": "2026-03-15T10:00:00"},
            "bp_diastolic": {"value": 94, "unit": "mmHg", "date": "2026-03-15T10:00:00"},
            "creatinine": {"value": 1.1, "unit": "mg/dL", "date": "2026-03-15T10:00:00"},
            "weight": {"value": 60.0, "unit": "kg", "date": "2026-01-15T10:00:00"},
        },
        "encounter_count": 4,
        "red_flags": [
            {"type": "critical", "key": "hba1c", "message": "HbA1c 9.4%", "value": 9.4, "unit": "%", "threshold": 9.0}
        ]
    }
    
    merger = ContextMerger()
    context = merger.merge(intake, history)
    
    print(f"Merged conditions: {len(context.merged_conditions)}")
    print(f"Merged medications: {len(context.merged_medications)}")
    print(f"Conflicts detected: {len(context.conflicts)}")
    for c in context.conflicts:
        print(f"  [{c.severity.value}] {c.message}")
    print(f"Ready for triage: {context.ready_for_triage}")
    print(f"Has block conflicts: {context.has_block_conflicts}")
    print(f"Has warnings: {context.has_warnings}")
    
    print("\n✅ Context Merger tests PASSED")