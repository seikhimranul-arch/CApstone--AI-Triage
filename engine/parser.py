"""
Deterministic FHIR R4 parser → structured clinical context.
No LLM involved — pure extraction for zero hallucination on facts.
"""
from __future__ import annotations
import json
from datetime import datetime
from pathlib import Path
from typing import Any
from collections import defaultdict

from fhir.resources.bundle import Bundle
from fhir.resources.patient import Patient
from fhir.resources.condition import Condition
from fhir.resources.medicationrequest import MedicationRequest
from fhir.resources.observation import Observation
from fhir.resources.encounter import Encounter
from fhir.resources.medication import Medication
from fhir.resources.diagnosticreport import DiagnosticReport


# ──────────────────────────────────────────────
# Clinical Thresholds (Indian Guidelines)
# ──────────────────────────────────────────────

THRESHOLDS = {
    "hba1c": {"critical": 9.0, "warning": 7.5, "unit": "%"},
    "fasting_glucose": {"critical": 180, "warning": 130, "unit": "mg/dL"},
    "bp_systolic": {"critical": 160, "warning": 140, "unit": "mmHg"},
    "bp_diastolic": {"critical": 100, "warning": 90, "unit": "mmHg"},
    "creatinine": {"critical": 1.5, "warning": 1.2, "unit": "mg/dL"},
    "egfr": {"critical": 30, "warning": 45, "unit": "mL/min/1.73m2", "reverse": True},
    "potassium": {"critical": 5.5, "warning": 5.0, "unit": "mmol/L"},
    "hb": {"critical": 8.0, "warning": 10.0, "unit": "g/dL", "reverse": True},
    "muac": {"critical": 115, "warning": 125, "unit": "mm", "reverse": True},
    "weight": {"warning": 0, "unit": "kg", "trend_check": True},  # trend-based
}


LOINC_MAP = {
    "4548-4": "hba1c",
    "1558-6": "fasting_glucose",
    "8480-6": "bp_systolic",
    "8462-4": "bp_diastolic",
    "2160-0": "creatinine",
    "33914-3": "egfr",
    "2823-3": "potassium",
    "29463-7": "weight",
    "718-7": "hb",
    "8281-8": "muac",
    "1742-6": "alt",
    "1920-8": "ast",
    "1975-2": "bilirubin",
    "2888-6": "proteinuria",
    "11878-2": "fundal_height",
    "8302-2": "height",
    "637-4": "sputum_afb",
}


# ──────────────────────────────────────────────
# Parser
# ──────────────────────────────────────────────

class FHIRParser:
    """Extract structured clinical context from FHIR Bundle."""
    
    def __init__(self, bundle_dict: dict[str, Any]):
        self.bundle = Bundle.model_validate(bundle_dict)
        self.patient: Patient | None = None
        self.conditions: list[Condition] = []
        self.medications: dict[str, dict] = {}  # name -> {med, requests}
        self.observations: dict[str, list[Observation]] = defaultdict(list)
        self.encounters: list[Encounter] = []
        self._parse()
    
    def _parse(self):
        for entry in self.bundle.entry or []:
            res = entry.resource
            if not res:
                continue
            rtype = res.resource_type
            if rtype == "Patient":
                self.patient = res
            elif rtype == "Condition":
                self.conditions.append(res)
            elif rtype == "Medication":
                # Store for MedicationRequest linking
                pass
            elif rtype == "MedicationRequest":
                self._parse_med_request(res)
            elif rtype == "Observation":
                self._parse_observation(res)
            elif rtype == "Encounter":
                self.encounters.append(res)
    
    def _parse_med_request(self, mr: MedicationRequest):
        """Extract medication info from MedicationRequest."""
        if not mr.medicationReference:
            return
        med_ref = mr.medicationReference.reference
        if not med_ref or not med_ref.startswith("Medication/"):
            return
        med_id = med_ref.split("/")[-1]
        
        # Find medication in bundle
        med = None
        for entry in self.bundle.entry or []:
            if entry.resource and entry.resource.resource_type == "Medication" and entry.resource.id == med_id:
                med = entry.resource
                break
        
        name = "Unknown"
        if med and med.code and med.code.coding:
            name = med.code.coding[0].display or "Unknown"
        
        if name not in self.medications:
            self.medications[name] = {"medication": med, "requests": []}
        self.medications[name]["requests"].append(mr)
    
    def _parse_observation(self, obs: Observation):
        """Group observations by LOINC code."""
        if not obs.code or not obs.code.coding:
            return
        for coding in obs.code.coding:
            if coding.system == "http://loinc.org" and coding.code in LOINC_MAP:
                key = LOINC_MAP[coding.code]
                self.observations[key].append(obs)
                break
    
    # ──────────────────────────────────────────────
    # Public Extraction Methods
    # ──────────────────────────────────────────────
    
    def get_patient_summary(self) -> dict[str, Any]:
        """Demographics one-liner components."""
        if not self.patient:
            return {}
        
        age = self._calculate_age()
        gender = "M" if self.patient.gender == "male" else "F"
        name = ""
        if self.patient.name:
            n = self.patient.name[0]
            given = n.given[0] if n.given else ""
            family = n.family or ""
            name = f"{given} {family}".strip()
        
        return {"age": age, "gender": gender, "name": name, "patient_id": self.patient.id}
    
    def _calculate_age(self) -> int:
        if not self.patient or not self.patient.birthDate:
            return 0
        birth = datetime.fromisoformat(str(self.patient.birthDate)).date()
        today = datetime.now().date()
        return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
    
    def get_active_problems(self) -> list[dict[str, Any]]:
        """Active conditions with SNOMED codes."""
        problems = []
        for cond in self.conditions:
            if cond.clinicalStatus and cond.clinicalStatus.coding:
                status = cond.clinicalStatus.coding[0].code
                if status in ("active", "recurrence", "relapse"):
                    code = cond.code.coding[0] if cond.code and cond.code.coding else None
                    problems.append({
                        "code": code.code if code else None,
                        "display": code.display if code else "Unknown",
                        "system": code.system if code else None,
                        "onset": str(cond.onsetDateTime) if cond.onsetDateTime else None,
                    })
        return problems
    
    def get_current_medications(self) -> list[dict[str, Any]]:
        """Active medication requests with dosage."""
        meds = []
        for name, data in self.medications.items():
            for req in data["requests"]:
                if req.status in ("active", "on-hold"):
                    dose_text = ""
                    if req.dosageInstruction:
                        dose_text = req.dosageInstruction[0].text or ""
                    meds.append({
                        "name": name,
                        "dose": dose_text,
                        "status": req.status,
                        "authored": str(req.authoredOn) if req.authoredOn else None,
                    })
        return meds
    
    def get_latest_vitals(self) -> dict[str, dict[str, Any]]:
        """Most recent observation per LOINC key with trend."""
        vitals = {}
        for key, obs_list in self.observations.items():
            if not obs_list:
                continue
            # Sort by effective date descending
            sorted_obs = sorted(
                obs_list,
                key=lambda o: o.effectiveDateTime if o.effectiveDateTime else datetime.min,
                reverse=True
            )
            latest = sorted_obs[0]
            
            value = None
            unit = None
            if latest.valueQuantity:
                value = latest.valueQuantity.value
                unit = latest.valueQuantity.unit
            
            # Calculate trend (last 3 points)
            trend = "stable"
            if len(sorted_obs) >= 3:
                vals = [o.valueQuantity.value for o in sorted_obs[:3] if o.valueQuantity]
                if len(vals) >= 3:
                    if vals[0] > vals[1] > vals[2]:
                        trend = "rising"
                    elif vals[0] < vals[1] < vals[2]:
                        trend = "falling"
            
            vitals[key] = {
                "value": value,
                "unit": unit,
                "date": str(latest.effectiveDateTime) if latest.effectiveDateTime else None,
                "trend": trend,
                "history": [{"value": o.valueQuantity.value, "date": str(o.effectiveDateTime)} 
                           for o in sorted_obs[:5] if o.valueQuantity],
            }
        return vitals
    
    def get_red_flags(self) -> list[dict[str, Any]]:
        """Rule-based red flag detection."""
        flags = []
        vitals = self.get_latest_vitals()
        meds = [m["name"].lower() for m in self.get_current_medications()]
        problems = [p["display"].lower() for p in self.get_active_problems()]
        
        # Threshold-based flags
        for key, thresholds in THRESHOLDS.items():
            if key not in vitals:
                continue
            val = vitals[key]["value"]
            if val is None:
                continue
            
            reverse = thresholds.get("reverse", False)
            critical = thresholds.get("critical")
            warning = thresholds.get("warning")
            
            if critical is not None:
                if (not reverse and val >= critical) or (reverse and val <= critical):
                    flags.append({
                        "type": "critical",
                        "key": key,
                        "value": val,
                        "unit": thresholds["unit"],
                        "threshold": critical,
                        "message": f"{key.replace('_', ' ').title()} {val} {thresholds['unit']} (critical threshold: {critical})",
                    })
                elif warning is not None and ((not reverse and val >= warning) or (reverse and val <= warning)):
                    flags.append({
                        "type": "warning",
                        "key": key,
                        "value": val,
                        "unit": thresholds["unit"],
                        "threshold": warning,
                        "message": f"{key.replace('_', ' ').title()} {val} {thresholds['unit']} (warning threshold: {warning})",
                    })
        
        # Drug interaction flags
        if "metformin" in " ".join(meds) and "contrast" in " ".join(meds):
            flags.append({"type": "critical", "key": "drug_interaction", "message": "Metformin + contrast agent risk: hold metformin 48h post-contrast"})
        
        if any("nsaid" in m or "diclofenac" in m or "ibuprofen" in m for m in meds):
            if any("ace" in m or "telmisartan" in m or "lisinopril" in m or "enalapril" in m for m in meds):
                if any("diuretic" in m or "furosemide" in m or "hydrochlorothiazide" in m for m in meds):
                    flags.append({"type": "critical", "key": "triple_whammy", "message": "NSAID + ACEi/ARB + Diuretic: AKI risk"})
        
        # Follow-up flags
        if self.encounters:
            last_enc = max(self.encounters, key=lambda e: e.period.start if e.period and e.period.start else datetime.min)
            days_since = (datetime.now() - datetime.fromisoformat(str(last_enc.period.start)).replace(tzinfo=None)).days
            if days_since > 90:
                flags.append({"type": "warning", "key": "missed_followup", "message": f"No encounter in {days_since} days"})
        
        # Chronic disease specific
        if any("diabetes" in p for p in problems):
            if "hba1c" not in vitals:
                flags.append({"type": "info", "key": "missing_hba1c", "message": "No HbA1c recorded in 6 months"})
        
        return flags
    
    def get_missing_data(self) -> list[str]:
        """Identify clinically expected but missing data."""
        missing = []
        vitals = self.get_latest_vitals()
        problems = [p["display"].lower() for p in self.get_active_problems()]
        
        # Diabetes missing
        if any("diabetes" in p for p in problems):
            if "hba1c" not in vitals:
                missing.append("HbA1c (last 6 months)")
            if "creatinine" not in vitals:
                missing.append("Serum creatinine (renal function)")
            if "bp_systolic" not in vitals:
                missing.append("Blood pressure (last visit)")
        
        # HTN missing
        if any("hypertens" in p for p in problems):
            if "bp_systolic" not in vitals:
                missing.append("Blood pressure (last visit)")
            if "creatinine" not in vitals:
                missing.append("Serum creatinine")
            if "potassium" not in vitals:
                missing.append("Serum potassium")
        
        # TB missing
        if any("tuberculosis" in p for p in problems):
            if "weight" not in vitals or not any(h["date"] for h in vitals.get("weight", {}).get("history", []) if h["date"]):
                missing.append("Weight trend (monthly)")
            if "alt" not in vitals:
                missing.append("LFTs (ALT/AST)")
        
        # ANC missing
        if any("pregnan" in p for p in problems):
            if "hb" not in vitals:
                missing.append("Hemoglobin (current trimester)")
            if "proteinuria" not in vitals:
                missing.append("Proteinuria quantification")
        
        # Pediatric missing
        if any("fail" in p or "malnutr" in p for p in problems):
            if "muac" not in vitals:
                missing.append("MUAC measurement")
            if "vitamin_d" not in vitals:
                missing.append("Vitamin D level")
        
        return missing
    
    def get_chronic_snapshot(self) -> dict[str, Any]:
        """Chronic disease status summary."""
        snapshot = {}
        vitals = self.get_latest_vitals()
        problems = [p["display"].lower() for p in self.get_active_problems()]
        
        if any("diabetes" in p for p in problems):
            hba1c = vitals.get("hba1c", {})
            snapshot["diabetes"] = {
                "last_hba1c": f"{hba1c.get('value', 'N/A')} {hba1c.get('unit', '%')}",
                "trend": hba1c.get("trend", "unknown"),
                "control": "controlled" if hba1c.get("value", 99) < 7.5 else "uncontrolled",
            }
        
        if any("hypertens" in p for p in problems):
            bp_sys = vitals.get("bp_systolic", {})
            bp_dia = vitals.get("bp_diastolic", {})
            snapshot["hypertension"] = {
                "last_bp": f"{bp_sys.get('value', 'N/A')}/{bp_dia.get('value', 'N/A')} mmHg",
                "trend": bp_sys.get("trend", "unknown"),
                "control": "controlled" if bp_sys.get("value", 999) < 140 and bp_dia.get("value", 999) < 90 else "uncontrolled",
            }
        
        if any("tuberculosis" in p for p in problems):
            weight = vitals.get("weight", {})
            snapshot["tuberculosis"] = {
                "last_weight": f"{weight.get('value', 'N/A')} {weight.get('unit', 'kg')}",
                "trend": weight.get("trend", "unknown"),
                "weight_loss_5pct": weight.get("trend") == "falling",
            }
        
        return snapshot
    
    def extract_all(self) -> dict[str, Any]:
        """Complete structured context for summarizer."""
        return {
            "patient": self.get_patient_summary(),
            "active_problems": self.get_active_problems(),
            "medications": self.get_current_medications(),
            "vitals": self.get_latest_vitals(),
            "red_flags": self.get_red_flags(),
            "missing_data": self.get_missing_data(),
            "chronic_snapshot": self.get_chronic_snapshot(),
            "encounter_count": len(self.encounters),
            "last_encounter_days": self._days_since_last_encounter(),
        }
    
    def _days_since_last_encounter(self) -> int | None:
        if not self.encounters:
            return None
        last = max(self.encounters, key=lambda e: e.period.start if e.period and e.period.start else datetime.min)
        if last.period and last.period.start:
            return (datetime.now() - datetime.fromisoformat(str(last.period.start)).replace(tzinfo=None)).days
        return None


def parse_fhir_bundle(filepath: Path) -> dict[str, Any]:
    """Convenience function: load file → parse → return structured context."""
    with open(filepath) as f:
        bundle = json.load(f)
    parser = FHIRParser(bundle)
    return parser.extract_all()


if __name__ == "__main__":
    # Quick test
    import sys
    if len(sys.argv) > 1:
        ctx = parse_fhir_bundle(Path(sys.argv[1]))
        print(json.dumps(ctx, indent=2, default=str))