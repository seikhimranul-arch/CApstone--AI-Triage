#!/usr/bin/env python3
"""Test the differential engine."""
from engine.models import SymptomIntake, Symptom, Vitals
from engine.merge import get_context_merger
from engine.parser import parse_fhir_bundle
from engine.triage import DifferentialEngine

intake = SymptomIntake(
    abha_id='12345678901234',
    age=57,
    gender='M',
    symptoms=[
        Symptom(icd11_code='MG44', display='Fever', duration_days=3, severity='moderate'),
        Symptom(icd11_code='MD12', display='Shortness of breath', duration_days=2, severity='moderate'),
    ],
    vitals=Vitals(bp_systolic=150, bp_diastolic=95, temperature=38.2, spo2=94, pulse=102),
    free_text='Fever for 3 days, shortness of breath, history of uncontrolled diabetes'
)

history = parse_fhir_bundle('data/patients/uncontrolled_dm_000.json')

merger = get_context_merger()
context = merger.merge(intake, history)

print('Merged context ready_for_triage:', context.ready_for_triage)
print('Conflicts:', len(context.conflicts))

engine = DifferentialEngine()
output = engine.generate(context)

print('\n=== DIFFERENTIAL DIAGNOSIS ===')
for dx in output.differential:
    print(f'  {dx.rank}. [{dx.probability}/{dx.urgency}] {dx.display} ({dx.icd11_code})')
    print(f'     Reasoning: {dx.reasoning}')
    print(f'     Supporting: {dx.supporting_evidence}')

print('\n=== RED FLAGS ===')
for rf in output.red_flags:
    print(f'  [{rf.get("type")}] {rf.get("message", rf.get("key"))}')

print('\n=== SUGGESTED ACTIONS ===')
for a in output.suggested_actions:
    print(f'  [{a.priority}] {a.type}: {a.description}')
    print(f'       Rationale: {a.rationale}')

print('\n=== CLINICAL SUMMARY ===')
print(output.clinical_summary)
print('\nModel used:', output.model_used)
print('Block reason:', output.block_reason)