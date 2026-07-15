"""
Batch evaluation runner. CLI: python -m eval.run_eval [--all|--heroes]
"""
from __future__ import annotations
import sys
from pathlib import Path

from engine.parser import parse_fhir_bundle
from engine.summarizer import summarize_patient, ClinicalSummarizer
from eval.checklist import evaluate_summary, print_evaluation


HERO_PATIENTS = [
    "uncontrolled_dm_000.json",
    "missed_tb_fu_000.json", 
    "polypharmacy_elderly_000.json",
    "high_risk_anc_000.json",
    "faltering_growth_000.json",
]


def run_one(filepath: Path, summarizer: ClinicalSummarizer) -> dict:
    context = parse_fhir_bundle(filepath)
    summary = summarizer.summarize(context)
    result = evaluate_summary(summary.model_dump(), context)
    print_evaluation(result, filepath.stem)
    return result


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true", help="Evaluate all 50 patients")
    parser.add_argument("--heroes", action="store_true", help="Evaluate 5 hero patients (default)")
    parser.add_argument("--model", default="llama3.1:8b", help="Ollama model")
    args = parser.parse_args()
    
    data_dir = Path("data/patients")
    if not data_dir.exists():
        print(f"Run generator first: python data/generator.py --count 50 --out data/patients")
        sys.exit(1)
    
    summarizer = ClinicalSummarizer(model=args.model)
    
    if args.all:
        files = sorted(data_dir.glob("*.json"))
    else:
        files = [data_dir / f for f in HERO_PATIENTS if (data_dir / f).exists()]
    
    if not files:
        print("No patient files found")
        sys.exit(1)
    
    results = []
    for f in files:
        try:
            results.append(run_one(f, summarizer))
        except Exception as e:
            print(f"ERROR {f.name}: {e}")
    
    passed = sum(1 for r in results if r["pass"])
    total = len(results)
    avg_score = sum(r["score"] for r in results) / total if total else 0
    
    print(f"\n{'='*60}")
    print(f"SUMMARY: {passed}/{total} passed, avg score {avg_score:.1f}/10")
    print(f"{'='*60}")
    
    # Save aggregate
    import json
    Path("eval").mkdir(exist_ok=True)
    (Path("eval") / "summary.json").write_text(json.dumps({
        "total": total,
        "passed": passed,
        "avg_score": round(avg_score, 1),
        "results": [{"patient": f.stem, **r} for f, r in zip(files, results)]
    }, indent=2))
    
    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()