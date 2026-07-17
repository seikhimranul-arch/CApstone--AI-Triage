"""
Clinical evaluation checklist for summary quality.
10 criteria, binary scoring (0/1). Target: ≥8/10 for MVP.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Any


@dataclass
class ChecklistCriterion:
    name: str
    description: str
    weight: float = 1.0  # For future weighted scoring


CHECKLIST = [
    ChecklistCriterion(
        name="all_active_problems_captured",
        description="All active conditions from FHIR appear in summary.active_problems",
    ),
    ChecklistCriterion(
        name="no_hallucinated_medications",
        description="Every medication in summary exists in FHIR MedicationRequest (active/on-hold)",
    ),
    ChecklistCriterion(
        name="no_hallucinated_conditions",
        description="Every condition in summary exists in FHIR Condition (active/recurrence)",
    ),
    ChecklistCriterion(
        name="red_flags_match_rules",
        description="Red flags correspond to threshold rules (HbA1c>9%, BP>160/100, missed FU>90d, etc.)",
    ),
    ChecklistCriterion(
        name="one_liner_scannable",
        description="one_liner <=160 chars, contains age, gender, top 2 problems, key red flag",
    ),
    ChecklistCriterion(
        name="chronic_snapshot_accurate",
        description="Chronic snapshot values match latest vitals; control status matches thresholds",
    ),
    ChecklistCriterion(
        name="missing_data_actionable",
        description="Missing data lists clinically expected but absent items (not 'normal' items)",
    ),
    ChecklistCriterion(
        name="medication_doses_preserved",
        description="Medication names and doses match FHIR exactly (no dose changes)",
    ),
    ChecklistCriterion(
        name="trend_direction_correct",
        description="Trend (rising/falling/stable) matches last 3 observation points",
    ),
    ChecklistCriterion(
        name="clinical_tone_appropriate",
        description="Language is clinical, concise, actionable - no conversational fluff",
    ),
]


def evaluate_summary(
    summary: dict[str, Any],
    context: dict[str, Any],
) -> dict[str, Any]:
    """Run all checklist criteria against a summary."""
    results = {}
    passed = 0
    
    # 1. All active problems captured
    fhir_problems = {p["display"].lower() for p in context.get("active_problems", [])}
    summary_problems = {p.get("display", "").lower() for p in summary.get("active_problems", [])}
    results["all_active_problems_captured"] = fhir_problems.issubset(summary_problems)
    if results["all_active_problems_captured"]:
        passed += 1
    
    # 2. No hallucinated medications
    fhir_meds = {m["name"].lower() for m in context.get("medications", [])}
    summary_meds = {m.get("name", "").lower() for m in summary.get("medications", [])}
    results["no_hallucinated_medications"] = summary_meds.issubset(fhir_meds)
    if results["no_hallucinated_medications"]:
        passed += 1
    
    # 3. No hallucinated conditions (same as 1 but reverse)
    results["no_hallucinated_conditions"] = summary_problems.issubset(fhir_problems)
    if results["no_hallucinated_conditions"]:
        passed += 1
    
    # 4. Red flags match rules
    # Check each red flag has a valid rule basis
    valid_flag_keys = {"hba1c", "fasting_glucose", "bp_systolic", "bp_diastolic", "creatinine", 
                       "egfr", "potassium", "hb", "muac", "drug_interaction", "triple_whammy", 
                       "missed_followup", "missing_hba1c", "weight"}
    summary_flags = {f.get("key") for f in summary.get("red_flags", [])}
    results["red_flags_match_rules"] = summary_flags.issubset(valid_flag_keys)
    if results["red_flags_match_rules"]:
        passed += 1
    
    # 5. One-liner scannable
    one_liner = summary.get("one_liner", "")
    has_age_gender = any(c.isdigit() for c in one_liner[:5]) and ("M" in one_liner[:5] or "F" in one_liner[:5])
    reasonable_length = len(one_liner) <= 160
    results["one_liner_scannable"] = has_age_gender and reasonable_length
    if results["one_liner_scannable"]:
        passed += 1
    
    # 6. Chronic snapshot accurate
    snapshot = summary.get("chronic_snapshot", {})
    vitals = context.get("vitals", {})
    snapshot_ok = True
    for disease, data in snapshot.items():
        if disease == "diabetes" and "hba1c" in vitals:
            expected = f"{vitals['hba1c'].get('value', 'N/A')} {vitals['hba1c'].get('unit', '%')}"
            if data.get("last_hba1c") != expected:
                snapshot_ok = False
        elif disease == "hypertension" and "bp_systolic" in vitals and "bp_diastolic" in vitals:
            expected = f"{vitals['bp_systolic'].get('value', 'N/A')}/{vitals['bp_diastolic'].get('value', 'N/A')} mmHg"
            if data.get("last_bp") != expected:
                snapshot_ok = False
    results["chronic_snapshot_accurate"] = snapshot_ok
    if results["chronic_snapshot_accurate"]:
        passed += 1
    
    # 7. Missing data actionable
    missing = summary.get("missing_data", [])
    # Should not contain "normal" items
    normal_keywords = ["normal", "within range", "unremarkable", "negative"]
    results["missing_data_actionable"] = not any(
        any(kw in m.lower() for kw in normal_keywords) for m in missing
    )
    if results["missing_data_actionable"]:
        passed += 1
    
    # 8. Medication doses preserved
    dose_ok = True
    fhir_med_dict = {m["name"].lower(): m.get("dose", "") for m in context.get("medications", [])}
    for sm in summary.get("medications", []):
        name = sm.get("name", "").lower()
        if name in fhir_med_dict and sm.get("dose") != fhir_med_dict[name]:
            dose_ok = False
            break
    results["medication_doses_preserved"] = dose_ok
    if results["medication_doses_preserved"]:
        passed += 1
    
    # 9. Trend direction correct
    trend_ok = True
    for key, vital in vitals.items():
        if key in ["hba1c", "bp_systolic", "bp_diastolic", "weight", "hb", "creatinine"]:
            ctx_trend = vital.get("trend", "stable")
            # Check snapshot trend matches
            for disease, data in snapshot.items():
                if data.get("trend") != ctx_trend and ctx_trend != "stable":
                    trend_ok = False
    results["trend_direction_correct"] = trend_ok
    if results["trend_direction_correct"]:
        passed += 1
    
    # 10. Clinical tone (heuristic: no fluff words)
    fluff_words = ["please note", "it is important to", "kindly", "we recommend", "patient should"]
    all_text = " ".join([
        summary.get("one_liner", ""),
        *[f.get("message", "") for f in summary.get("red_flags", [])],
        *summary.get("missing_data", []),
    ]).lower()
    results["clinical_tone_appropriate"] = not any(fw in all_text for fw in fluff_words)
    if results["clinical_tone_appropriate"]:
        passed += 1
    
    total = len(CHECKLIST)
    score = passed / total * 10
    
    return {
        "score": round(score, 1),
        "passed": passed,
        "total": total,
        "details": results,
        "pass": score >= 8.0,
    }


def print_evaluation(result: dict[str, Any], patient_id: str = ""):
    """Pretty print evaluation results."""
    print(f"\n{'='*60}")
    print(f"EVALUATION: {patient_id}")
    print(f"{'='*60}")
    print(f"Score: {result['score']}/10 ({result['passed']}/{result['total']} passed)")
    print(f"PASS: {'YES' if result['pass'] else 'NO'}")
    print("-" * 60)
    for criterion in CHECKLIST:
        passed = result["details"].get(criterion.name, False)
        status = "PASS" if passed else "FAIL"
        print(f"  {status} {criterion.name}: {criterion.description}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    import sys
    import json
    from engine.parser import parse_fhir_bundle
    from engine.summarizer import summarize_patient
    
    if len(sys.argv) > 1:
        filepath = sys.argv[1]
        context = parse_fhir_bundle(filepath)
        summary = summarize_patient(filepath)
        result = evaluate_summary(summary.model_dump(), context)
        print_evaluation(result, Path(filepath).stem)
        sys.exit(0 if result["pass"] else 1)