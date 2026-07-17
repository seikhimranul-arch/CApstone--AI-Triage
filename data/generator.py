#!/usr/bin/env python3
"""Generate synthetic FHIR-like patient bundles for PHC demo. No external deps."""
import json
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path

ARCHETYPES = {
    "uncontrolled_dm": {
        "name": "Uncontrolled Type 2 Diabetes",
        "age_range": (40, 65),
        "gender_weight": {"male": 0.55, "female": 0.45},
        "conditions": [
            {"code": "44054006", "display": "Type 2 diabetes mellitus"},
            {"code": "38341003", "display": "Hypertensive disorder"},
        ],
        "medications": [
            {"name": "Metformin 500mg", "dose": "500 mg BD", "code": "860975"},
            {"name": "Glimepiride 2mg", "dose": "2 mg OD", "code": "329487"},
            {"name": "Amlodipine 5mg", "dose": "5 mg OD", "code": "197361"},
        ],
        "obs_config": {
            "hba1c": {"code": "4548-4", "unit": "%", "range": (8.5, 11.5)},
            "fasting_glucose": {"code": "1558-6", "unit": "mg/dL", "range": (160, 280)},
            "bp_systolic": {"code": "8480-6", "unit": "mmHg", "range": (140, 165)},
            "bp_diastolic": {"code": "8462-4", "unit": "mmHg", "range": (90, 105)},
            "creatinine": {"code": "2160-0", "unit": "mg/dL", "range": (0.9, 1.4)},
        },
    },
    "missed_tb_fu": {
        "name": "Missed TB Follow-up",
        "age_range": (20, 50),
        "gender_weight": {"male": 0.65, "female": 0.35},
        "conditions": [
            {"code": "60963004", "display": "Pulmonary tuberculosis"},
        ],
        "medications": [
            {"name": "Isoniazid 300mg", "dose": "300 mg OD", "code": "373430"},
            {"name": "Rifampicin 450mg", "dose": "450 mg OD", "code": "435722"},
            {"name": "Pyrazinamide 1.5g", "dose": "1500 mg OD", "code": "352286"},
        ],
        "obs_config": {
            "weight": {"code": "29463-7", "unit": "kg", "range": (45, 65)},
            "alt": {"code": "1742-6", "unit": "U/L", "range": (40, 120)},
            "ast": {"code": "1920-8", "unit": "U/L", "range": (35, 110)},
        },
    },
    "polypharmacy_elderly": {
        "name": "Polypharmacy Elderly",
        "age_range": (65, 85),
        "gender_weight": {"male": 0.45, "female": 0.55},
        "conditions": [
            {"code": "38341003", "display": "Hypertensive disorder"},
            {"code": "44054006", "display": "Type 2 diabetes mellitus"},
            {"code": "42343007", "display": "Chronic kidney disease stage 3"},
        ],
        "medications": [
            {"name": "Amlodipine 5mg", "dose": "5 mg OD", "code": "197361"},
            {"name": "Telmisartan 40mg", "dose": "40 mg OD", "code": "457391"},
            {"name": "Metformin 500mg", "dose": "500 mg BD", "code": "860975"},
            {"name": "Atorvastatin 20mg", "dose": "20 mg ON", "code": "379509"},
            {"name": "Pantoprazole 40mg", "dose": "40 mg OD", "code": "457391"},
            {"name": "Diclofenac 50mg", "dose": "50 mg SOS", "code": "300862"},
        ],
        "obs_config": {
            "bp_systolic": {"code": "8480-6", "unit": "mmHg", "range": (130, 155)},
            "bp_diastolic": {"code": "8462-4", "unit": "mmHg", "range": (75, 90)},
            "hba1c": {"code": "4548-4", "unit": "%", "range": (7.0, 8.5)},
            "creatinine": {"code": "2160-0", "unit": "mg/dL", "range": (1.3, 2.0)},
        },
    },
    "high_risk_anc": {
        "name": "High-Risk Antenatal Care",
        "age_range": (18, 35),
        "gender_weight": {"female": 1.0},
        "conditions": [
            {"code": "8012006", "display": "Pregnancy"},
            {"code": "401277000", "display": "Gestational hypertension"},
            {"code": "117067006", "display": "Gestational diabetes mellitus"},
        ],
        "medications": [
            {"name": "Methyldopa 250mg", "dose": "250 mg TDS", "code": "457391"},
            {"name": "Metformin 500mg", "dose": "500 mg BD", "code": "860975"},
            {"name": "Iron sucrose 100mg", "dose": "100 mg weekly IV", "code": "300862"},
        ],
        "obs_config": {
            "bp_systolic": {"code": "8480-6", "unit": "mmHg", "range": (140, 160)},
            "bp_diastolic": {"code": "8462-4", "unit": "mmHg", "range": (90, 105)},
            "hba1c": {"code": "4548-4", "unit": "%", "range": (6.0, 7.5)},
            "hb": {"code": "718-7", "unit": "g/dL", "range": (8.5, 10.5)},
        },
    },
    "faltering_growth": {
        "name": "Pediatric Faltering Growth",
        "age_range": (0, 5),
        "gender_weight": {"male": 0.52, "female": 0.48},
        "conditions": [
            {"code": "24834000", "display": "Failure to thrive"},
            {"code": "419199007", "display": "Protein energy malnutrition"},
        ],
        "medications": [
            {"name": "RUTF (Plumpy'nut)", "dose": "1 sachet TDS", "code": "457391"},
            {"name": "Zinc 20mg", "dose": "20 mg OD x14d", "code": "300862"},
            {"name": "Amoxicillin 250mg", "dose": "250 mg TDS x5d", "code": "379509"},
        ],
        "obs_config": {
            "weight": {"code": "29463-7", "unit": "kg", "range": (4.5, 8.5)},
            "height": {"code": "8302-2", "unit": "cm", "range": (55, 95)},
            "muac": {"code": "8281-8", "unit": "mm", "range": (105, 120)},
            "hb": {"code": "718-7", "unit": "g/dL", "range": (7.0, 9.5)},
        },
    },
}

INDIAN_FIRST_NAMES = {
    "male": ["Rajesh", "Amit", "Suresh", "Vikram", "Prakash", "Mohan", "Ravi", "Sunil", "Anil", "Deepak"],
    "female": ["Priya", "Sunita", "Anita", "Kavita", "Meena", "Geeta", "Seema", "Rekha", "Pooja", "Neha"],
}

INDIAN_LAST_NAMES = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Yadav", "Patel", "Joshi", "Reddy", "Nair"]


def make_patient(archetype_key: str, idx: int) -> dict:
    arch = ARCHETYPES[archetype_key]
    age = random.randint(*arch["age_range"])
    gender = random.choices(list(arch["gender_weight"]), weights=list(arch["gender_weight"].values()))[0]
    first = random.choice(INDIAN_FIRST_NAMES[gender])
    last = random.choice(INDIAN_LAST_NAMES)
    pid = str(uuid.uuid4())

    entries = []
    # Patient
    entries.append({"resource": {
        "resourceType": "Patient", "id": pid,
        "name": [{"family": last, "given": [first]}],
        "gender": "male" if gender == "male" else "female",
        "birthDate": (datetime.now() - timedelta(days=age*365)).isoformat()[:10],
        "identifier": [{"system": "https://abha.ndhm.gov.in", "value": f"ABHA-{random.randint(10**9, 10**10-1)}"}],
    }})

    # Conditions
    for c in arch["conditions"]:
        entries.append({"resource": {
            "resourceType": "Condition", "id": str(uuid.uuid4()),
            "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]},
            "code": {"coding": [{"system": "http://snomed.info/sct", "code": c["code"], "display": c["display"]}]},
            "subject": {"reference": f"Patient/{pid}"},
        }})

    # Medications
    for m in arch["medications"]:
        med_id = str(uuid.uuid4())
        entries.append({"resource": {"resourceType": "Medication", "id": med_id, "code": {"coding": [{"code": m["code"], "display": m["name"]}]}}})
        entries.append({"resource": {
            "resourceType": "MedicationRequest", "id": str(uuid.uuid4()),
            "status": "active", "intent": "order",
            "medication": {"reference": {"reference": f"Medication/{med_id}"}},
            "subject": {"reference": f"Patient/{pid}"},
            "dosageInstruction": [{"text": m["dose"]}],
        }})

    # Observations (3-5 timepoints for trends)
    for obs_key, obs_cfg in arch["obs_config"].items():
        for i in range(random.randint(3, 5)):
            val = round(random.uniform(*obs_cfg["range"]), 1)
            entries.append({"resource": {
                "resourceType": "Observation", "id": str(uuid.uuid4()),
                "status": "final",
                "code": {"coding": [{"system": "http://loinc.org", "code": obs_cfg["code"], "display": obs_key}]},
                "subject": {"reference": f"Patient/{pid}"},
                "effectiveDateTime": (datetime.now() - timedelta(days=random.randint(0, 180))).isoformat(),
                "valueQuantity": {"value": val, "unit": obs_cfg["unit"]},
            }})

    # Encounters (2-5)
    for _ in range(random.randint(2, 5)):
        entries.append({"resource": {
            "resourceType": "Encounter", "id": str(uuid.uuid4()),
            "status": "finished",
            "class": {"code": "AMB", "display": "Ambulatory"},
            "subject": {"reference": f"Patient/{pid}"},
            "period": {"start": (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat()},
        }})

    return {"resourceType": "Bundle", "type": "collection", "entry": entries}


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=15)
    parser.add_argument("--out", type=str, default="data/patients")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    archetypes = list(ARCHETYPES.keys())
    per_archetype = args.count // len(archetypes)
    remainder = args.count % len(archetypes)

    generated = 0
    for i, arch_key in enumerate(archetypes):
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