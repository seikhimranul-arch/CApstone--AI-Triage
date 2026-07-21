#!/usr/bin/env python3
"""Run batch evaluation on all patients."""
from engine.summarizer import ClinicalSummarizer
from engine.parser import parse_fhir_bundle
from eval.checklist import evaluate_summary
import glob

summarizer = ClinicalSummarizer(api_key='fallback')
files = glob.glob('data/patients/*.json')
passed = 0
total = 0
for f in files:
    ctx = parse_fhir_bundle(f)
    summary = summarizer.summarize(ctx)
    eval_result = evaluate_summary(summary.model_dump(), ctx)
    status = 'PASS' if eval_result['pass'] else 'FAIL'
    if eval_result['pass']:
        passed += 1
    total += 1
    name = f.split('\\')[-1]
    print(status + ' ' + name + ': ' + str(eval_result['score']) + '/10')
print('Total: ' + str(passed) + '/' + str(total) + ' passed')