"""
Engine package initialization
"""
from engine.parser import parse_fhir_bundle, FHIRParser
from engine.summarizer import ClinicalSummarizer, summarize_patient, ClinicalSummary
from engine.triage import DifferentialEngine, get_differential_engine, TriageOutput, DifferentialDiagnosis, SuggestedAction
from eval.checklist import evaluate_summary, print_evaluation, CHECKLIST

__all__ = [
    "parse_fhir_bundle",
    "FHIRParser",
    "ClinicalSummarizer",
    "summarize_patient",
    "ClinicalSummary",
    "DifferentialEngine",
    "get_differential_engine",
    "TriageOutput",
    "DifferentialDiagnosis",
    "SuggestedAction",
    "evaluate_summary",
    "print_evaluation",
    "CHECKLIST",
]