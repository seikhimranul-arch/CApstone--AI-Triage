#!/usr/bin/env python3
"""Test the triage/differential API endpoint."""
import uvicorn
import threading
import time
import requests
import json
import asyncio
import io

from engine.abha_mock import get_mock_abdm_service
from engine.merge import get_context_merger
from engine.parser import parse_fhir_bundle
from engine.models import SymptomIntake

def run_server():
    uvicorn.run('api:app', host='127.0.0.1', port=8000, log_level='error')

async def setup():
    abdm = get_mock_abdm_service()
    consent_req = type('obj', (object,), {'abha_id': '12345678901234', 'purpose': 'TRIAGE', 
        'hi_types': ['Condition','MedicationRequest','Observation'], 'expiry_hours': 24})()
    consent = await abdm.initiate_consent(consent_req)
    callback = type('obj', (object,), {'consent_id': consent['consent_id'], 'status': 'GRANTED', 'artefact': {'signed': True}})()
    await abdm.handle_consent_callback(callback)
    return consent['consent_id']

async def get_context(consent_id):
    abdm = get_mock_abdm_service()
    bundle = await abdm.pull_history('12345678901234', consent_id)
    # Save bundle to temp file for parser
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(bundle, f)
        temp_path = f.name
    abha_context = parse_fhir_bundle(temp_path)
    import os
    os.unlink(temp_path)
    intake = {
        'abha_id': '12345678901234',
        'age': 57,
        'gender': 'M',
        'symptoms': [
            {'icd11_code': 'MG44', 'display': 'Fever', 'duration_days': 3, 'severity': 'moderate'},
            {'icd11_code': 'MD12', 'display': 'Shortness of breath', 'duration_days': 2, 'severity': 'moderate'}
        ],
        'vitals': {'bp_systolic': 150, 'bp_diastolic': 95, 'temperature': 38.2, 'spo2': 94, 'pulse': 102},
        'free_text': 'Fever 3 days, SOB 2 days, uncontrolled DM'
    }
    intake_obj = SymptomIntake(**intake)
    merger = get_context_merger()
    context = merger.merge(intake_obj, abha_context)
    return context

if __name__ == '__main__':
    # Start server
    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()
    time.sleep(3)
    
    consent_id = asyncio.run(setup())
    print('Consent ID:', consent_id)
    
    context = asyncio.run(get_context(consent_id))
    print('Context ready:', context.ready_for_triage)
    
    # Test API
    r = requests.post('http://127.0.0.1:8000/api/triage/differential', 
        json={'context': context.model_dump(mode='json')})
    print('API Response:', r.status_code)
    data = r.json()
    print('DDx count:', len(data.get('differential', [])))
    for dx in data.get('differential', [])[:3]:
        print('  ' + str(dx['rank']) + '. [' + dx['probability'] + '/' + dx['urgency'] + '] ' + dx['display'] + ' (' + dx['icd11_code'] + ')')
    print('Summary:', data.get('clinical_summary'))
    print('Model:', data.get('model_used'))