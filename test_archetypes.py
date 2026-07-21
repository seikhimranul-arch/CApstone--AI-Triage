#!/usr/bin/env python3
"""Test differential engine with one patient per archetype."""
import asyncio
from engine.triage import get_differential_engine
from engine.models import SymptomIntake, Symptom, Vitals, SymptomSeverity
from engine.merge import get_context_merger
from engine.parser import parse_fhir_bundle
from engine.abha_mock import get_mock_abdm_service
import glob

async def test():
    abdm = get_mock_abdm_service()
    patients = abdm.get_patient_list()
    
    # Get one patient per archetype
    archetypes = ['uncontrolled_dm', 'missed_tb_fu', 'faltering_growth', 'high_risk_anc', 'polypharmacy_elderly']
    
    for arch in archetypes:
        p = next((p for p in patients if p['archetype'] == arch), None)
        if not p:
            print('No patient for', arch)
            continue
        abha_id = p['abha_id']
        
        # Create intake matching archetype
        if arch == 'uncontrolled_dm':
            symptoms = [Symptom(icd11_code='MG44', display='Fever', duration_days=3, severity=SymptomSeverity.MODERATE),
                       Symptom(icd11_code='MD12', display='Shortness of breath', duration_days=2, severity=SymptomSeverity.MODERATE)]
            vitals = Vitals(bp_systolic=150, bp_diastolic=95, temperature=38.2, spo2=94, pulse=102)
        elif arch == 'missed_tb_fu':
            symptoms = [Symptom(icd11_code='MD11', display='Cough', duration_days=60, severity=SymptomSeverity.MODERATE),
                       Symptom(icd11_code='MG44', display='Fever', duration_days=14, severity=SymptomSeverity.MILD),
                       Symptom(icd11_code='MB23', display='Weight loss', duration_days=60, severity=SymptomSeverity.MODERATE),
                       Symptom(icd11_code='MD15', display='Hemoptysis', duration_days=7, severity=SymptomSeverity.SEVERE)]
            vitals = Vitals(temperature=37.5, spo2=94, pulse=98, weight=48.0)
        elif arch == 'faltering_growth':
            symptoms = [Symptom(icd11_code='KB00', display='Poor feeding', duration_days=7, severity=SymptomSeverity.SEVERE),
                       Symptom(icd11_code='KB01', display='Irritability', duration_days=7, severity=SymptomSeverity.MODERATE),
                       Symptom(icd11_code='MB23', display='Weight loss', duration_days=30, severity=SymptomSeverity.SEVERE),
                       Symptom(icd11_code='MD11', display='Cough', duration_days=14, severity=SymptomSeverity.MODERATE)]
            vitals = Vitals(temperature=37.8, spo2=92, pulse=130, weight=5.2, height=62.0)
        elif arch == 'high_risk_anc':
            symptoms = [Symptom(icd11_code='MB01', display='Edema/Swelling', duration_days=14, severity=SymptomSeverity.MODERATE),
                       Symptom(icd11_code='MG44', display='Fever', duration_days=3, severity=SymptomSeverity.MILD),
                       Symptom(icd11_code='MG40', display='Fatigue/Weakness', duration_days=30, severity=SymptomSeverity.MODERATE),
                       Symptom(icd11_code='GA01', display='Vaginal bleeding', duration_days=1, severity=SymptomSeverity.SEVERE)]
            vitals = Vitals(bp_systolic=155, bp_diastolic=102, temperature=37.0, spo2=98, pulse=88)
        elif arch == 'polypharmacy_elderly':
            symptoms = [Symptom(icd11_code='MB40', display='Headache', duration_days=7, severity=SymptomSeverity.MODERATE),
                       Symptom(icd11_code='MB41', display='Dizziness', duration_days=30, severity=SymptomSeverity.MODERATE),
                       Symptom(icd11_code='MB01', display='Edema/Swelling', duration_days=60, severity=SymptomSeverity.MILD),
                       Symptom(icd11_code='ME00', display='Abdominal pain', duration_days=14, severity=SymptomSeverity.MILD)]
            vitals = Vitals(bp_systolic=145, bp_diastolic=88, temperature=36.8, spo2=96, pulse=72)
        else:
            continue
            
        intake = SymptomIntake(abha_id=abha_id, age=p['age'], gender=p['gender'], symptoms=symptoms, vitals=vitals, free_text='Test')
        
        consent_req = type('obj', (object,), {'abha_id': abha_id, 'purpose': 'TRIAGE', 'hi_types': ['Condition', 'MedicationRequest', 'Observation', 'Encounter', 'DiagnosticReport', 'AllergyIntolerance'], 'expiry_hours': 24})()
        consent = await abdm.initiate_consent(consent_req)
        callback = type('obj', (object,), {'consent_id': consent['consent_id'], 'status': 'GRANTED', 'artefact': {'signed': True}})()
        await abdm.handle_consent_callback(callback)
        
        files = glob.glob('data/patients/' + arch + '_*.json')
        abha_context = parse_fhir_bundle(files[0])
        
        merger = get_context_merger()
        context = merger.merge(intake, abha_context)
        
        engine = get_differential_engine()
        output = engine.generate(context)
        
        print('=== ' + arch + ' (' + p['name'] + ', ' + str(p['age']) + p['gender'] + ') ===')
        for dx in output.differential:
            print('  ' + str(dx.rank) + '. [' + dx.probability + '/' + dx.urgency + '] ' + dx.display + ' (' + dx.icd11_code + ')')
        print('  Summary:', output.clinical_summary)
        print()

asyncio.run(test())