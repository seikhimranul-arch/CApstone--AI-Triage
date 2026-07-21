from fastapi.testclient import TestClient
from api import app
import asyncio
from engine.abha_mock import get_mock_abdm_service

client = TestClient(app)

async def test_archetype(archetype):
    abdm = get_mock_abdm_service()
    patients = abdm.get_patient_list()
    p = next(p for p in patients if p['archetype'] == archetype)
    consent_req = type('obj', (object,), {'abha_id': p['abha_id'], 'purpose': 'TRIAGE', 
        'hi_types': ['Condition','MedicationRequest','Observation'], 'expiry_hours': 24})()
    consent = await abdm.initiate_consent(consent_req)
    callback = type('obj', (object,), {'consent_id': consent['consent_id'], 'status': 'GRANTED', 'artefact': {'signed': True}})()
    await abdm.handle_consent_callback(callback)
    
    if archetype == 'uncontrolled_dm':
        intake = {'abha_id': p['abha_id'], 'age': p['age'], 'gender': p['gender'],
            'symptoms': [{'icd11_code': 'MG44', 'display': 'Fever', 'duration_days': 3, 'severity': 'moderate'},
                        {'icd11_code': 'MD12', 'display': 'Shortness of breath', 'duration_days': 2, 'severity': 'moderate'}],
            'vitals': {'bp_systolic': 150, 'bp_diastolic': 95, 'temperature': 38.2, 'spo2': 94, 'pulse': 102},
            'free_text': 'Test'}
    elif archetype == 'missed_tb_fu':
        intake = {'abha_id': p['abha_id'], 'age': p['age'], 'gender': p['gender'],
            'symptoms': [{'icd11_code': 'MD11', 'display': 'Cough', 'duration_days': 60, 'severity': 'moderate'},
                        {'icd11_code': 'MG44', 'display': 'Fever', 'duration_days': 14, 'severity': 'mild'},
                        {'icd11_code': 'MB23', 'display': 'Weight loss', 'duration_days': 60, 'severity': 'moderate'},
                        {'icd11_code': 'MD15', 'display': 'Hemoptysis', 'duration_days': 7, 'severity': 'severe'}],
            'vitals': {'temperature': 37.5, 'spo2': 94, 'pulse': 98, 'weight': 48.0},
            'free_text': 'Test'}
    elif archetype == 'faltering_growth':
        intake = {'abha_id': p['abha_id'], 'age': p['age'], 'gender': p['gender'],
            'symptoms': [{'icd11_code': 'KB00', 'display': 'Poor feeding', 'duration_days': 7, 'severity': 'severe'},
                        {'icd11_code': 'KB01', 'display': 'Irritability', 'duration_days': 7, 'severity': 'moderate'},
                        {'icd11_code': 'MB23', 'display': 'Weight loss', 'duration_days': 30, 'severity': 'severe'},
                        {'icd11_code': 'MD11', 'display': 'Cough', 'duration_days': 14, 'severity': 'moderate'}],
            'vitals': {'temperature': 37.8, 'spo2': 92, 'pulse': 130, 'weight': 5.2, 'height': 62.0},
            'free_text': 'Test'}
    elif archetype == 'high_risk_anc':
        intake = {'abha_id': p['abha_id'], 'age': p['age'], 'gender': p['gender'],
            'symptoms': [{'icd11_code': 'MB01', 'display': 'Edema/Swelling', 'duration_days': 14, 'severity': 'moderate'},
                        {'icd11_code': 'MG44', 'display': 'Fever', 'duration_days': 3, 'severity': 'mild'},
                        {'icd11_code': 'MG40', 'display': 'Fatigue/Weakness', 'duration_days': 30, 'severity': 'moderate'},
                        {'icd11_code': 'GA01', 'display': 'Vaginal bleeding', 'duration_days': 1, 'severity': 'severe'}],
            'vitals': {'bp_systolic': 155, 'bp_diastolic': 102, 'temperature': 37.0, 'spo2': 98, 'pulse': 88},
            'free_text': 'Test'}
    elif archetype == 'polypharmacy_elderly':
        intake = {'abha_id': p['abha_id'], 'age': p['age'], 'gender': p['gender'],
            'symptoms': [{'icd11_code': 'MB40', 'display': 'Headache', 'duration_days': 7, 'severity': 'moderate'},
                        {'icd11_code': 'MB41', 'display': 'Dizziness', 'duration_days': 30, 'severity': 'moderate'},
                        {'icd11_code': 'MB01', 'display': 'Edema/Swelling', 'duration_days': 60, 'severity': 'mild'},
                        {'icd11_code': 'ME00', 'display': 'Abdominal pain', 'duration_days': 14, 'severity': 'mild'}],
            'vitals': {'bp_systolic': 145, 'bp_diastolic': 88, 'temperature': 36.8, 'spo2': 96, 'pulse': 72},
            'free_text': 'Test'}
    
    payload = {'intake': intake, 'abha_id': p['abha_id'], 'consent_id': consent['consent_id']}
    r = client.post('/api/triage/differential', json=payload)
    data = r.json()
    print(archetype + ': ' + data['clinical_summary'][:80] + '...')
    for dx in data['differential'][:2]:
        print('  ' + str(dx['rank']) + '. [' + dx['probability'] + '/' + dx['urgency'] + '] ' + dx['display'])

for arch in ['uncontrolled_dm', 'missed_tb_fu', 'faltering_growth', 'high_risk_anc', 'polypharmacy_elderly']:
    asyncio.run(test_archetype(arch))