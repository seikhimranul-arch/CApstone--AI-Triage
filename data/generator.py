#!/usr/bin/env python3
"""
Synthetic FHIR R4 patient generator for PHC demo.
Generates 5 clinical archetypes common in Indian Primary Health Centers.
"""
import json
import random
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from fhir.resources.bundle import Bundle
from fhir.resources.patient import Patient
from fhir.resources.condition import Condition
from fhir.resources.medicationrequest import MedicationRequest
from fhir.resources.observation import Observation
from fhir.resources.encounter import Encounter
from fhir.resources.medication import Medication
from fhir.resources.diagnosticreport import DiagnosticReport
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.coding import Coding
from fhir.resources.quantity import Quantity
from fhir.resources.reference import Reference
from fhir.resources.identifier import Identifier
from fhir.resources.humanname import HumanName
from fhir.resources.contactpoint import ContactPoint
from fhir.resources.address import Address


# ──────────────────────────────────────────────
# Clinical Archetypes (Indian PHC Context)
# ──────────────────────────────────────────────

ARCHETYPES = {
    "uncontrolled_dm": {
        "display": "Uncontrolled Type 2 Diabetes",
        "age_range": (40, 65),
        "gender_weight": {"male": 0.55, "female": 0.45},
        "conditions": [
            {"code": "44054006", "display": "Type 2 diabetes mellitus", "clinical_status": "active"},
            {"code": "38341003", "display": "Hypertensive disorder", "clinical_status": "active"},
        ],
        "medications": [
            {"name": "Metformin 500mg", "dose": "500 mg", "freq": "BD", "code": "860975"},
            {"name": "Glimepiride 2mg", "dose": "2 mg", "freq": "OD", "code": "329487"},
            {"name": "Amlodipine 5mg", "dose": "5 mg", "freq": "OD", "code": "197361"},
        ],
        "observations": {
            "hba1c": {"code": "4548-4", "unit": "%", "range": (8.5, 11.5), "trend": "rising"},
            "fasting_glucose": {"code": "1558-6", "unit": "mg/dL", "range": (160, 280)},
            "bp_systolic": {"code": "8480-6", "unit": "mmHg", "range": (140, 165)},
            "bp_diastolic": {"code": "8462-4", "unit": "mmHg", "range": (90, 105)},
            "weight": {"code": "29463-7", "unit": "kg", "range": (65, 95)},
            "creatinine": {"code": "2160-0", "unit": "mg/dL", "range": (0.9, 1.4)},
        },
        "red_flags": ["HbA1c >9%", "No follow-up >90 days", "Metformin + contrast risk"],
        "missing_data": ["No lipid panel in 18mo", "No foot exam recorded", "No fundoscopy in 2yr"],
    },
    "missed_tb_fu": {
        "display": "Missed TB Follow-up",
        "age_range": (20, 50),
        "gender_weight": {"male": 0.65, "female": 0.35},
        "conditions": [
            {"code": "60963004", "display": "Pulmonary tuberculosis", "clinical_status": "active"},
            {"code": "409586006", "display": "Drug susceptible tuberculosis", "clinical_status": "active"},
        ],
        "medications": [
            {"name": "Isoniazid 300mg", "dose": "300 mg", "freq": "OD", "code": "373430"},
            {"name": "Rifampicin 450mg", "dose": "450 mg", "freq": "OD", "code": "435722"},
            {"name": "Pyrazinamide 1.5g", "dose": "1500 mg", "freq": "OD", "code": "352286"},
            {"name": "Ethambutol 800mg", "dose": "800 mg", "freq": "OD", "code": "318734"},
        ],
        "observations": {
            "weight": {"code": "29463-7", "unit": "kg", "range": (45, 65), "trend": "falling"},
            "alt": {"code": "1742-6", "unit": "U/L", "range": (40, 120)},
            "ast": {"code": "1920-8", "unit": "U/L", "range": (35, 110)},
            "bilirubin": {"code": "1975-2", "unit": "mg/dL", "range": (0.8, 2.5)},
            "sputum_afb": {"code": "637-4", "unit": "", "range": (0, 1)},
        },
        "red_flags": ["Missed >2 DOTS doses", "Weight loss >5%", "LFTs elevated 2x ULN"],
        "missing_data": ["No sputum conversion at 2mo", "No HIV status recorded", "No contact tracing done"],
    },
    "polypharmacy_elderly": {
        "display": "Polypharmacy Elderly",
        "age_range": (65, 85),
        "gender_weight": {"male": 0.45, "female": 0.55},
        "conditions": [
            {"code": "38341003", "display": "Hypertensive disorder", "clinical_status": "active"},
            {"code": "44054006", "display": "Type 2 diabetes mellitus", "clinical_status": "active"},
            {"code": "428911000124107", "display": "Osteoarthritis of knee", "clinical_status": "active"},
            {"code": "42343007", "display": "Chronic kidney disease stage 3", "clinical_status": "active"},
        ],
        "medications": [
            {"name": "Amlodipine 5mg", "dose": "5 mg", "freq": "OD", "code": "197361"},
            {"name": "Telmisartan 40mg", "dose": "40 mg", "freq": "OD", "code": "457391"},
            {"name": "Metformin 500mg", "dose": "500 mg", "freq": "BD", "code": "860975"},
            {"name": "Glimepiride 1mg", "dose": "1 mg", "freq": "OD", "code": "329487"},
            {"name": "Atorvastatin 20mg", "dose": "20 mg", "freq": "ON", "code": "379509"},
            {"name": "Pantoprazole 40mg", "dose": "40 mg", "freq": "OD", "code": "457391"},
            {"name": "Diclofenac 50mg", "dose": "50 mg", "freq": "SOS", "code": "300862"},
        ],
        "observations": {
            "bp_systolic": {"code": "8480-6", "unit": "mmHg", "range": (130, 155)},
            "bp_diastolic": {"code": "8462-4", "unit": "mmHg", "range": (75, 90)},
            "hba1c": {"code": "4548-4", "unit": "%", "range": (7.0, 8.5)},
            "creatinine": {"code": "2160-0", "unit": "mg/dL", "range": (1.3, 2.0)},
            "egfr": {"code": "33914-3", "unit": "mL/min/1.73m2", "range": (30, 55)},
            "potassium": {"code": "2823-3", "unit": "mmol/L", "range": (4.5, 5.5)},
        },
        "red_flags": ["NSAID + ACEi + Diuretic triple whammy", "eGFR <45 on Metformin", "Fall risk: 7+ meds"],
        "missing_data": ["No medication reconciliation in 6mo", "No fall assessment", "No cognitive screen"],
    },
    "high_risk_anc": {
        "display": "High-Risk Antenatal Care",
        "age_range": (18, 35),
        "gender_weight": {"female": 1.0},
        "conditions": [
            {"code": "8012006", "display": "Pregnancy", "clinical_status": "active"},
            {"code": "401277000", "display": "Gestational hypertension", "clinical_status": "active"},
            {"code": "117067006", "display": "Gestational diabetes mellitus", "clinical_status": "active"},
        ],
        "medications": [
            {"name": "Methyldopa 250mg", "dose": "250 mg", "freq": "TDS", "code": "457391"},
            {"name": "Metformin 500mg", "dose": "500 mg", "freq": "BD", "code": "860975"},
            {"name": "Calcium 500mg + Vit D3", "dose": "500 mg", "freq": "OD", "code": "379509"},
            {"name": "Folic acid 5mg", "dose": "5 mg", "freq": "OD", "code": "405500"},
            {"name": "Iron sucrose 100mg", "dose": "100 mg", "freq": "Weekly IV", "code": "300862"},
        ],
        "observations": {
            "bp_systolic": {"code": "8480-6", "unit": "mmHg", "range": (140, 160)},
            "bp_diastolic": {"code": "8462-4", "unit": "mmHg", "range": (90, 105)},
            "hba1c": {"code": "4548-4", "unit": "%", "range": (6.0, 7.5)},
            "hb": {"code": "718-7", "unit": "g/dL", "range": (8.5, 10.5)},
            "proteinuria": {"code": "2888-6", "unit": "mg/dL", "range": (30, 300)},
            "fundal_height": {"code": "11878-2", "unit": "cm", "range": (24, 32)},
        },
        "red_flags": ["BP >150/100 on meds", "Hb <9 g/dL at 28wks", "Proteinuria >300mg"],
        "missing_data": ["No uterine artery Doppler", "No 24hr urine protein", "No fetal growth scan >4wks"],
    },
    "faltering_growth": {
        "display": "Pediatric Faltering Growth",
        "age_range": (0, 5),
        "gender_weight": {"male": 0.52, "female": 0.48},
        "conditions": [
            {"code": "24834000", "display": "Failure to thrive", "clinical_status": "active"},
            {"code": "419199007", "display": "Protein energy malnutrition", "clinical_status": "active"},
            {"code": "840539006", "display": "Recurrent lower respiratory infection", "clinical_status": "recurrent"},
        ],
        "medications": [
            {"name": "RUTF (Plumpy'nut)", "dose": "1 sachet", "freq": "TDS", "code": "457391"},
            {"name": "Zinc 20mg", "dose": "20 mg", "freq": "OD x 14d", "code": "300862"},
            {"name": "Vitamin A 200000 IU", "dose": "200000 IU", "freq": "Single dose", "code": "405500"},
            {"name": "Amoxicillin 250mg", "dose": "250 mg", "freq": "TDS x 5d", "code": "379509"},
        ],
        "observations": {
            "weight": {"code": "29463-7", "unit": "kg", "range": (4.5, 8.5), "trend": "falling"},
            "height": {"code": "8302-2", "unit": "cm", "range": (55, 95)},
            "muac": {"code": "8281-8", "unit": "mm", "range": (105, 120)},
            "hb": {"code": "718-7", "unit": "g/dL", "range": (7.0, 9.5)},
            "vitamin_d": {"code": "1234-5", "unit": "ng/mL", "range": (8, 18)},
        },
        "red_flags": ["Weight < -3 SD", "MUAC <115mm", "No weight gain in 3mo"],
        "missing_data": ["No developmental assessment", "No TB contact history", "No dietary recall documented"],
    },
}


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

INDIAN_FIRST_NAMES = {
    "male": ["Rajesh", "Amit", "Suresh", "Vikram", "Prakash", "Mohan", "Ravi", "Sunil", "Anil", "Deepak"],
    "female": ["Priya", "Sunita", "Anita", "Kavita", "Meena", "Geeta", "Seema", "Rekha", "Pooja", "Neha"],
}

INDIAN_LAST_NAMES = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Yadav", "Patel", "Joshi", "Reddy", "Nair"]

PHC_CODES = ["PHC-{}".format(i).zfill(3) for i in range(1, 51)]


def random_date_within(days_back: int) -> str:
    """Random date within last N days."""
    delta = random.randint(0, days_back)
    return (datetime.now() - timedelta(days=delta)).date().isoformat()


def random_choice_weighted(weights: dict) -> str:
    """Weighted random choice."""
    return random.choices(list(weights.keys()), weights=list(weights.values()))[0]


def make_patient(archetype_key: str, idx: int) -> dict:
    """Generate a complete FHIR Bundle for one patient."""
    arch = ARCHETYPES[archetype_key]
    age = random.randint(*arch["age_range"])
    gender = random_choice_weighted(arch["gender_weight"])
    sex = "M" if gender == "male" else "F"
    
    # Patient
    patient_id = str(uuid.uuid4())
    patient = Patient(
        id=patient_id,
        identifier=[Identifier(system="https://abha.ndhm.gov.in", value=f"ABHA-{random.randint(1000000000, 9999999999)}")],
        name=[HumanName(family=random.choice(INDIAN_LAST_NAMES), given=[random.choice(INDIAN_FIRST_NAMES[gender])])],
        gender=sex.lower(),
        birthDate=(datetime.now() - timedelta(days=age*365)).date().isoformat(),
        address=[Address(state="Maharashtra", district="Pune", use="home")],
        telecom=[ContactPoint(system="phone", value=f"+91-9{random.randint(100000000, 999999999)}")],
    )
    
    entries = [{"resource": patient.model_dump(exclude_none=True)}]
    
    # Conditions
    for cond_data in arch["conditions"]:
        cond = Condition(
            id=str(uuid.uuid4()),
            clinicalStatus=CodeableConcept(coding=[Coding(system="http://terminology.hl7.org/CodeSystem/condition-clinical", code=cond_data["clinical_status"], display=cond_data["clinical_status"])]),
            code=CodeableConcept(coding=[Coding(system="http://snomed.info/sct", code=cond_data["code"], display=cond_data["display"])]),
            subject=Reference(reference=f"Patient/{patient_id}"),
            recordedDate=random_date_within(365),
        )
        entries.append({"resource": cond.model_dump(exclude_none=True)})
    
    # Medications & MedicationRequests
    med_resources = {}
    for med_data in arch["medications"]:
        med_id = str(uuid.uuid4())
        medication = Medication(
            id=med_id,
            code=CodeableConcept(coding=[Coding(system="http://www.nlm.nih.gov/research/umls/rxnorm", code=med_data["code"], display=med_data["name"])]),
        )
        med_resources[med_data["name"]] = med_id
        entries.append({"resource": medication.model_dump(exclude_none=True)})
        
        # MedicationRequest
        mr = MedicationRequest(
            id=str(uuid.uuid4()),
            status="active",
            intent="order",
            medicationReference=Reference(reference=f"Medication/{med_id}"),
            subject=Reference(reference=f"Patient/{patient_id}"),
            authoredOn=random_date_within(90),
            dosageInstruction=[{
                "text": f"{med_data['dose']} {med_data['freq']}",
                "timing": {"repeat": {"frequency": 1, "period": 1, "periodUnit": "d"}},
            }],
        )
        entries.append({"resource": mr.model_dump(exclude_none=True)})
    
    # Observations (multiple time points for trends)
    for obs_key, obs_config in arch["observations"].items():
        num_points = random.randint(3, 6)
        for i in range(num_points):
            days_ago = random.randint(0, 180) if i == 0 else random.randint(0, 365)
            value = random.uniform(*obs_config["range"])
            
            # Apply trend if specified
            if "trend" in obs_config and i > 0:
                if obs_config["trend"] == "rising":
                    value *= 1.05 ** i
                elif obs_config["trend"] == "falling":
                    value *= 0.95 ** i
            
            obs = Observation(
                id=str(uuid.uuid4()),
                status="final",
                category=[CodeableConcept(coding=[Coding(system="http://terminology.hl7.org/CodeSystem/observation-category", code="vital-signs", display="Vital Signs")])],
                code=CodeableConcept(coding=[Coding(system="http://loinc.org", code=obs_config["code"], display=obs_key.replace("_", " ").title())]),
                subject=Reference(reference=f"Patient/{patient_id}"),
                effectiveDateTime=datetime.now() - timedelta(days=days_ago),
                valueQuantity=Quantity(value=round(value, 1), unit=obs_config["unit"], system="http://unitsofmeasure.org", code=obs_config["unit"]),
            )
            entries.append({"resource": obs.model_dump(exclude_none=True)})
    
    # Encounters (3-6 visits)
    for i in range(random.randint(3, 6)):
        enc = Encounter(
            id=str(uuid.uuid4()),
            status="finished",
            class_fhir=CodeableConcept(coding=[Coding(system="http://terminology.hl7.org/CodeSystem/v3-ActCode", code="AMB", display="Ambulatory")]),
            type=[CodeableConcept(coding=[Coding(system="http://snomed.info/sct", code="185349003", display="General examination")])],
            subject=Reference(reference=f"Patient/{patient_id}"),
            period={"start": random_date_within(365), "end": random_date_within(365)},
            serviceProvider=Reference(reference=f"Organization/{random.choice(PHC_CODES)}", display="Primary Health Center"),
        )
        entries.append({"resource": enc.model_dump(exclude_none=True)})
    
    # DiagnosticReports (1-2)
    for _ in range(random.randint(1, 2)):
        dr = DiagnosticReport(
            id=str(uuid.uuid4()),
            status="final",
            category=[CodeableConcept(coding=[Coding(system="http://terminology.hl7.org/CodeSystem/v2-0074", code="LAB", display="Laboratory")])],
            code=CodeableConcept(coding=[Coding(system="http://loinc.org", code="58410-2", display="Comprehensive metabolic panel")]),
            subject=Reference(reference=f"Patient/{patient_id}"),
            effectiveDateTime=random_date_within(90),
            issued=datetime.now().isoformat(),
        )
        entries.append({"resource": dr.model_dump(exclude_none=True)})
    
    bundle = Bundle(
        id=str(uuid.uuid4()),
        type="collection",
        timestamp=datetime.now(),
        entry=entries,
    )
    
    return bundle.model_dump(exclude_none=True)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate synthetic FHIR patient bundles")
    parser.add_argument("--count", type=int, default=50, help="Number of patients to generate")
    parser.add_argument("--out", type=str, default="data/patients", help="Output directory")
    args = parser.parse_args()
    
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    archetypes_list = list(ARCHETYPES.keys())
    per_archetype = args.count // len(archetypes_list)
    remainder = args.count % len(archetypes_list)
    
    generated = 0
    for i, arch_key in enumerate(archetypes_list):
        count = per_archetype + (1 if i < remainder else 0)
        for j in range(count):
            bundle = make_patient(arch_key, generated)
            filename = f"{arch_key}_{j:03d}.json"
            (out_dir / filename).write_text(json.dumps(bundle, indent=2))
            generated += 1
    
    print(f"Generated {generated} patients in {out_dir}")
    print(f"Archetypes: {', '.join(ARCHETYPES.keys())}")


if __name__ == "__main__":
    main()