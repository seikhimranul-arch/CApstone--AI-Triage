#!/usr/bin/env python3
"""E2E test: Intake -> Triage -> Doctor Override -> Finalize -> ABHA Writeback"""
from fastapi.testclient import TestClient
from api import app
import asyncio
from engine.abha_mock import get_mock_abdm_service
from engine.models import SymptomIntake, Symptom, Vitals, SymptomSeverity

client = TestClient(app)

async def test_e2e():
    abdm = get_mock_abdm_service()
    patients = abdm.get_patient_list()
    p = next(p for p in patients if p['archetype'] == 'uncontrolled_dm')
    print('Patient:', p)
    
    # Setup consent
    consent_req = type('obj', (object,), {'abha_id': p['abha_id'], 'purpose': 'TRIAGE', 'hi_types': ['Condition','MedicationRequest','Observation'], 'expiry_hours': 24})()
    consent = await abdm.initiate_consent(consent_req)
    await abdm.handle_consent_callback(type('obj', (object,), {'consent_id': consent['consent_id'], 'status': 'GRANTED', 'artefact': {'signed': True}})())
    
    # Build intake
    intake = SymptomIntake(
        abha_id=p['abha_id'],
        age=p['age'],
        gender=p['gender'],
        symptoms=[
            Symptom(icd11_code='MG44', display='Fever', duration_days=3, severity=SymptomSeverity.MODERATE),
            Symptom(icd11_code='MD12', display='Shortness of breath', duration_days=2, severity=SymptomSeverity.MODERATE)
        ],
        vitals=Vitals(bp_systolic=150, bp_diastolic=95, temperature=38.2, spo2=94, pulse=102),
        free_text='Uncontrolled DM with fever and SOB'
    )
    
    # Get triage differential
    r = client.post('/api/triage/differential', json={
        'intake': intake.model_dump(mode='json'),
        'abha_id': p['abha_id'],
        'consent_id': consent['consent_id']
    })
    triage = r.json()
    print('Triage DDx:', len(triage['differential']), 'items')
    for dx in triage['differential'][:2]:
        print('  ' + str(dx['rank']) + '. ' + dx['display'] + ' (' + dx['icd11_code'] + ')')
    
    # Get conflicts
    context_res = client.post('/api/triage/context', json={
        'intake': intake.model_dump(mode='json'),
        'abha_id': p['abha_id'],
        'consent_id': consent['consent_id']
    })
    conflicts = context_res.json()['context']['conflicts']
    print('Conflicts:', len(conflicts))
    
    # Doctor override
    overrides = [
        {'differential_id': p['abha_id'] + '-1', 'original_rank': 1, 'icd11_code': triage['differential'][0]['icd11_code'], 'action': 'accept', 'doctor_reason': 'Agrees with DKA', 'timestamp': '2026-07-18T14:00:00'},
        {'differential_id': p['abha_id'] + '-2', 'original_rank': 2, 'icd11_code': triage['differential'][1]['icd11_code'], 'action': 'reject', 'doctor_reason': 'No HF signs on exam', 'timestamp': '2026-07-18T14:00:00'}
    ]
    
    # Finalize
    finalize_res = client.post('/api/triage/finalize', json={
        'intake_id': 'INTAKE-123',
        'patient_id': p['abha_id'],
        'abha_id': p['abha_id'],
        'consent_id': consent['consent_id'],
        'final_differential': triage['differential'],
        'overrides': overrides,
        'doctor_id': 'MO-001',
        'doctor_notes': 'DKA confirmed, HF rejected based on exam'
    })
    finalize = finalize_res.json()
    print('Finalized:', finalize['finalized_id'])
    
    # Writeback to ABHA
    writeback = client.post('/api/abha/writeback', json={
        'abha_id': p['abha_id'],
        'consent_id': consent['consent_id'],
        'composition': finalize['composition']
    })
    print('Writeback:', writeback.json())

asyncio.run(test_e2e())