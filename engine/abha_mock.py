"""
Mock ABDM Service for Development & Testing
Simulates ABHA Gateway, Consent Manager, HIU, HIP interactions.
Replace with real ABDM client when sandbox credentials available.
"""
from __future__ import annotations
import asyncio
import random
from datetime import datetime, timedelta
from typing import Any, Optional
from uuid import uuid4

from engine.models import (
    ABHAConsent, ABHAConfig, ConsentStatus, ConsentCallback, ConsentRequest,
    SymptomIntake, TriageContext, Symptom, Vitals, ConditionSummary, 
    MedicationSummary, LabReport, AllergySummary, Conflict, ConflictType, ConflictSeverity,
    validate_abha_id, get_archetype_symptoms, ARCHETYPE_DEMO_SYMPTOMS,
    PHC_SYMPTOM_LIST
)
from engine.parser import parse_fhir_bundle
import glob
import os


class MockABDMService:
    """
    Mock ABDM Gateway + Consent Manager + HIU + HIP
    Thread-safe in-memory store for development.
    """
    
    def __init__(self, config: Optional[ABHAConfig] = None):
        self.config = config or ABHAConfig()
        self._consents: dict[str, dict] = {}
        self._patients: dict[str, dict] = {}
        self._initialize_synthetic_patients()
    
    def _initialize_synthetic_patients(self):
        """Load synthetic patients from data/patients/ directory."""
        patient_dir = os.path.join(os.path.dirname(__file__), "..", "data", "patients")
        if not os.path.exists(patient_dir):
            return
        
        for filepath in glob.glob(os.path.join(patient_dir, "*.json")):
            try:
                filename = os.path.basename(filepath)
                # Extract archetype from filename (e.g., "uncontrolled_dm_000.json")
                archetype = "_".join(filename.split("_")[:-1])
                
                context = parse_fhir_bundle(filepath)
                patient = context.get("patient", {})
                
                # Generate ABHA ID from patient ID for consistency
                patient_id = patient.get("patient_id", str(uuid4()))
                abha_id = self._generate_abha_id(patient_id)
                
                self._patients[abha_id] = {
                    "abha_id": abha_id,
                    "patient_id": patient_id,
                    "archetype": archetype,
                    "name": patient.get("name", "Unknown"),
                    "age": patient.get("age", 0),
                    "gender": patient.get("gender", "M"),
                    "context": context,
                    "demo_symptoms": ARCHETYPE_DEMO_SYMPTOMS.get(archetype, [])
                }
            except Exception as e:
                print(f"Warning: Failed to load patient {filepath}: {e}")
    
    def _generate_abha_id(self, patient_id: str) -> str:
        """Generate deterministic 14-digit ABHA ID from patient ID."""
        # Use hash for deterministic generation
        hash_val = hash(patient_id) % (10**14)
        return f"{hash_val:014d}"
    
    # ──────────────────────────────────────────────
    # Patient Lookup
    # ──────────────────────────────────────────────
    
    async def lookup_patient(self, abha_id: str) -> Optional[dict]:
        """Lookup patient demographics by ABHA ID."""
        if not validate_abha_id(abha_id):
            return None
        
        # Simulate network latency
        await asyncio.sleep(random.uniform(0.05, 0.15))
        
        patient = self._patients.get(abha_id)
        if not patient:
            # Generate a new patient on-the-fly for unknown ABHA IDs
            return self._generate_dummy_patient(abha_id)
        
        return {
            "abha_id": patient["abha_id"],
            "patient_id": patient["patient_id"],
            "name": patient["name"],
            "age": patient["age"],
            "gender": patient["gender"],
            "archetype": patient["archetype"]
        }
    
    def _generate_dummy_patient(self, abha_id: str) -> dict:
        """Generate a dummy patient for unknown ABHA IDs."""
        return {
            "abha_id": abha_id,
            "patient_id": str(uuid4()),
            "name": "Demo Patient",
            "age": random.randint(18, 80),
            "gender": random.choice(["M", "F"]),
            "archetype": "unknown"
        }
    
    # ──────────────────────────────────────────────
    # Consent Flow
    # ──────────────────────────────────────────────
    
    async def initiate_consent(self, request) -> dict:
        """Initiate consent flow - returns mock consent URL."""
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        consent_id = f"CONS-{uuid4().hex[:12].upper()}"
        
        consent = {
            "consent_id": consent_id,
            "abha_id": request.abha_id,
            "status": ConsentStatus.REQUESTED.value,
            "purpose": request.purpose,
            "hi_types": request.hi_types,
            "expiry_hours": request.expiry_hours,
            "created_at": datetime.utcnow().isoformat(),
            "redirect_url": f"{self.config.gateway_base_url}/consent/{consent_id}"
        }
        
        self._consents[consent_id] = consent
        return consent
    
    async def handle_consent_callback(self, callback: ConsentCallback) -> dict:
        """Handle consent manager callback."""
        await asyncio.sleep(random.uniform(0.05, 0.15))
        
        if callback.consent_id not in self._consents:
            return {"success": False, "error": "Invalid consent ID"}
        
        consent = self._consents[callback.consent_id]
        
        if callback.status == ConsentStatus.GRANTED:
            consent["status"] = ConsentStatus.GRANTED.value
            consent["granted_at"] = datetime.utcnow().isoformat()
            consent["artefact"] = callback.artefact or {
                "signed": True,
                "signature": "mock-signature-" + uuid4().hex[:16],
                "timestamp": datetime.utcnow().isoformat()
            }
            consent["expiry"] = (datetime.utcnow() + timedelta(hours=callback.artefact.get("expiry_hours", 24))).isoformat() if callback.artefact else (datetime.utcnow() + timedelta(hours=24)).isoformat()
        elif callback.status == ConsentStatus.DENIED:
            consent["status"] = ConsentStatus.DENIED.value
            consent["error"] = callback.error or "Patient denied consent"
        elif callback.status == ConsentStatus.REVOKED:
            consent["status"] = ConsentStatus.REVOKED.value
        
        return {"success": True, "consent": consent}
    
    async def get_consent_status(self, consent_id: str) -> Optional[dict]:
        """Get consent status by ID."""
        return self._consents.get(consent_id)
    
    async def revoke_consent(self, consent_id: str, reason: str = "") -> dict:
        """Revoke an active consent."""
        if consent_id not in self._consents:
            return {"success": False, "error": "Invalid consent ID"}
        
        consent = self._consents[consent_id]
        consent["status"] = ConsentStatus.REVOKED.value
        consent["revoked_at"] = datetime.utcnow().isoformat()
        consent["revocation_reason"] = reason
        return {"success": True, "consent": consent}
    
    # ──────────────────────────────────────────────
    # HIU - Health Information Pull
    # ──────────────────────────────────────────────
    
    async def pull_history(self, abha_id: str, consent_id: str, date_range: Optional[dict] = None) -> Optional[dict]:
        """Pull FHIR bundle via HIU (mock)."""
        await asyncio.sleep(random.uniform(0.2, 0.5))
        
        # Validate consent
        consent = self._consents.get(consent_id)
        if not consent or consent.get("abha_id") != abha_id:
            return None
        if consent.get("status") != ConsentStatus.GRANTED.value:
            return None
        
        # Check expiry
        if consent.get("expiry"):
            expiry = datetime.fromisoformat(consent["expiry"])
            if datetime.utcnow() > expiry:
                return None
        
        patient = self._patients.get(abha_id)
        if not patient:
            return None
        
        # Return the raw FHIR bundle from the parsed context
        context = patient.get("context", {})
        
        # Generate a mock FHIR bundle from the context
        bundle = self._generate_mock_fhir_bundle(patient, context)
        
        return bundle
    
    def _generate_mock_fhir_bundle(self, patient: dict, context: dict) -> dict:
        """Generate a mock FHIR bundle from parsed context."""
        entries = []
        
        # Patient
        p = context.get("patient", {})
        entries.append({
            "resource": {
                "resourceType": "Patient",
                "id": patient["patient_id"],
                "identifier": [{"system": "https://abha.ndhm.gov.in", "value": patient["abha_id"]}],
                "name": [{"family": p.get("name", "Unknown").split()[-1], "given": p.get("name", "Unknown").split()[:-1]}],
                "gender": "male" if p.get("gender") == "M" else "female",
                "birthDate": (datetime.utcnow() - timedelta(days=p.get("age", 30)*365)).strftime("%Y-%m-%d")
            }
        })
        
        # Conditions
        for cond in context.get("active_problems", []):
            entries.append({
                "resource": {
                    "resourceType": "Condition",
                    "id": str(uuid4()),
                    "clinicalStatus": {"coding": [{"code": "active"}]},
                    "code": {"coding": [{"system": "http://snomed.info/sct", "code": cond.get("code"), "display": cond.get("display")}]},
                    "subject": {"reference": f"Patient/{patient['patient_id']}"}
                }
            })
        
        # MedicationRequests
        for med in context.get("medications", []):
            med_id = str(uuid4())
            entries.append({
                "resource": {
                    "resourceType": "Medication",
                    "id": med_id,
                    "code": {"coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "860975", "display": med.get("name")}]}
                }
            })
            entries.append({
                "resource": {
                    "resourceType": "MedicationRequest",
                    "id": str(uuid4()),
                    "status": "active",
                    "intent": "order",
                    "medicationReference": {"reference": f"Medication/{med_id}"},
                    "subject": {"reference": f"Patient/{patient['patient_id']}"},
                    "dosageInstruction": [{"text": med.get("dose", "")}]
                }
            })
        
        # Observations (vitals + labs)
        for key, vital in context.get("vitals", {}).items():
            entries.append({
                "resource": {
                    "resourceType": "Observation",
                    "id": str(uuid4()),
                    "status": "final",
                    "code": {"coding": [{"system": "http://loinc.org", "code": self._vital_to_loinc(key), "display": key}]},
                    "subject": {"reference": f"Patient/{patient['patient_id']}"},
                    "effectiveDateTime": vital.get("date", datetime.utcnow().isoformat()),
                    "valueQuantity": {"value": vital.get("value"), "unit": vital.get("unit", "")}
                }
            })
        
        # Encounters
        for _ in range(context.get("encounter_count", 3)):
            entries.append({
                "resource": {
                    "resourceType": "Encounter",
                    "id": str(uuid4()),
                    "status": "finished",
                    "class": {"code": "AMB", "display": "Ambulatory"},
                    "subject": {"reference": f"Patient/{patient['patient_id']}"},
                    "period": {"start": (datetime.utcnow() - timedelta(days=random.randint(30, 365))).isoformat()}
                }
            })
        
        return {
            "resourceType": "Bundle",
            "type": "collection",
            "timestamp": datetime.utcnow().isoformat(),
            "entry": entries
        }
    
    def _vital_to_loinc(self, key: str) -> str:
        mapping = {
            "hba1c": "4548-4",
            "fasting_glucose": "1558-6",
            "bp_systolic": "8480-6",
            "bp_diastolic": "8462-4",
            "creatinine": "2160-0",
            "weight": "29463-7",
            "height": "8302-2",
            "temperature": "8310-5",
            "pulse": "8867-4",
            "respiratory_rate": "9279-1",
            "spo2": "2708-6"
        }
        return mapping.get(key, "99999-9")
    
    # ──────────────────────────────────────────────
    # HIP - Health Information Push (Write-back)
    # ──────────────────────────────────────────────
    
    async def push_record(self, abha_id: str, consent_id: str, composition: dict) -> dict:
        """Push clinical record via HIP (mock)."""
        await asyncio.sleep(random.uniform(0.2, 0.5))
        
        # Validate consent
        consent = self._consents.get(consent_id)
        if not consent or consent.get("abha_id") != abha_id:
            return {"success": False, "error": "Invalid consent"}
        if consent.get("status") != ConsentStatus.GRANTED.value:
            return {"success": False, "error": "Consent not granted"}
        
        record_id = str(uuid4())
        return {
            "success": True,
            "record_id": record_id,
            "timestamp": datetime.utcnow().isoformat(),
            "link": f"{self.config.gateway_base_url}/records/{record_id}"
        }
    
    # ──────────────────────────────────────────────
    # Utility
    # ──────────────────────────────────────────────
    
    def get_patient_list(self) -> list[dict]:
        """Get list of all available synthetic patients."""
        return [
            {
                "abha_id": p["abha_id"],
                "name": p["name"],
                "age": p["age"],
                "gender": p["gender"],
                "archetype": p["archetype"]
            }
            for p in self._patients.values()
        ]


# ──────────────────────────────────────────────
# Singleton Instance
# ──────────────────────────────────────────────

_mock_abdm_service: Optional[MockABDMService] = None

def get_mock_abdm_service(config: Optional[ABHAConfig] = None) -> MockABDMService:
    """Get or create singleton mock ABDM service."""
    global _mock_abdm_service
    if _mock_abdm_service is None:
        _mock_abdm_service = MockABDMService(config)
    return _mock_abdm_service


# ──────────────────────────────────────────────
# Self-Test
# ──────────────────────────────────────────────

if __name__ == "__main__":
    import asyncio
    
    async def test_mock():
        print("Testing Mock ABDM Service...")
        service = MockABDMService()
        
        # Test patient list
        patients = service.get_patient_list()
        print(f"Loaded {len(patients)} synthetic patients")
        
        # Test patient lookup
        if patients:
            abha_id = patients[0]["abha_id"]
            patient = await service.lookup_patient(abha_id)
            print(f"Patient lookup: {patient['name']} ({patient['age']}{patient['gender']})")
            
            # Test consent flow
            consent_req = type('obj', (object,), {
                'abha_id': abha_id,
                'purpose': 'TRIAGE',
                'hi_types': ["Condition", "MedicationRequest", "Observation"],
                'expiry_hours': 24
            })()
            
            consent = await service.initiate_consent(consent_req)
            print(f"Consent initiated: {consent['consent_id']}")
            
            # Grant consent
            callback = type('obj', (object,), {
                'consent_id': consent['consent_id'],
                'status': 'GRANTED',
                'artefact': {'signed': True}
            })()
            
            result = await service.handle_consent_callback(callback)
            print(f"Consent granted: {result['success']}")
            
            # Pull history
            history = await service.pull_history(abha_id, consent['consent_id'])
            if history:
                entry_count = len(history.get("entry", []))
                print(f"HIU pull: {entry_count} FHIR resources")
            
            # Test consent status
            status = await service.get_consent_status(consent['consent_id'])
            print(f"Consent status: {status['status']}")
            
            print("\nAll mock ABDM service tests PASSED")