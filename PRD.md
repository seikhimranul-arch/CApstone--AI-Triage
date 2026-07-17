# Product Requirements Document (PRD)
## AI Diagnostic Triage Assistant — ABHA-Integrated Decision Support for PHC Doctors

**Author:** Seikh Imran Ul Minhaj  
**Status:** v2.0 — Unified (Chart Review + Symptom Triage)  
**Date:** July 2026  
**Capstone Target:** MVP Demo Ready

---

## 1. Problem Statement

**Core Problem:** PHC doctors in India see 80-120 patients/day with 3-5 minutes per consultation. They spend 40-60% of that time re-collecting history already documented elsewhere, and start differential diagnosis from scratch for common presentations.

**Two Complementary Pain Points:**
1. **Pre-Visit Blindness:** Doctor walks in with no synthesized view of patient's longitudinal record (ABHA exists but fragmented)
2. **Intake-to-Diagnosis Gap:** Nurse/ASHA collects symptoms but doctor still builds differential from scratch

---

## 2. Product Vision

> **"Every PHC doctor opens a patient's chart and sees a 3-second clinical summary + ranked differential before the patient sits down. Every consultation ends with a structured note that enriches the next visit — anywhere in India."**

---

## 3. Target Users

| Primary | Secondary | Tertiary |
|---------|-----------|----------|
| **PHC Medical Officers** (MBBS, 80-120 pts/day) | **Staff Nurses/ASHA** (symptom intake) | **State Health IT** (dashboards, compliance) |
| Needs: 3-sec scan, red flags, differential | Needs: structured checklist, offline | Needs: ABDM compliance, outcome metrics |

---

## 4. Unified User Flow (MVP)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRE-VISIT (Chart Review)                         │
│  1. Doctor selects patient from daily list                          │
│  2. System shows: 3-sec one-liner + red flags + chronic snapshot   │
│  3. Doctor reviews timeline (encounters, vitals, meds, labs)       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    IN-VISIT (Symptom Triage)                        │
│  4. Nurse/ASHA enters: structured symptoms + vitals + duration     │
│  5. System pulls ABHA history (if consented) → merges with intake  │
│  6. AI generates: ranked differential + red flags + suggested Qs   │
│  7. Doctor reviews, confirms/edits, finalizes diagnosis            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    POST-VISIT (Write-Back)                          │
│  8. Structured note pushed to ABHA (HIP)                            │
│  9. Next visit — anywhere — starts with better context             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Feature Matrix (MVP Scope)

| Feature | Module | Status | Notes |
|---------|--------|--------|-------|
| **Chart Review** | | | |
| Synthetic FHIR bundle generator (5 archetypes × 3) | Data | ✅ Done | `data/generator.py` |
| Deterministic FHIR parser → structured context | Engine | ✅ Done | `engine/parser.py` |
| Clinical summarizer (one-liner, red flags, snapshot, meds) | Engine | ✅ Done | `engine/summarizer.py` |
| Day-level timeline (encounters, vitals, labs, meds, dx) | Engine | ✅ Done | `engine/parser.get_day_timeline()` |
| 10-criterion eval framework (target ≥8/10) | Eval | ✅ Done | `eval/checklist.py` — 9.4/10 avg |
| **Symptom Triage** | | | |
| Structured symptom intake form (checklist + free text) | Frontend | 🔴 Missing | **Gap** |
| ABHA ID lookup + consent flow (ABDM sandbox) | Backend | 🔴 Missing | **Gap** |
| HIU-style prior history pull + merge with intake | Backend | 🔴 Missing | **Gap** |
| AI differential generator (symptoms + history → ranked Dx) | Engine | 🔴 Missing | **Gap** |
| Red-flag escalation (rule-based + model) | Engine | 🟡 Partial | Parser has red flags |
| Doctor confirm/edit/override UI | Frontend | 🔴 Missing | **Gap** |
| **Write-Back** | | | |
| HIP-style structured note push to ABHA | Backend | 🔴 Missing | **Gap** |
| **Infrastructure** | | | |
| FastAPI backend (patients, summarize, timeline, evaluate) | API | ✅ Done | `api.py` |
| Next.js frontend (3 UI variants: Card, Table, Timeline) | Frontend | ✅ Done | `lovable-variants/` |
| Offline fallback (deterministic summaries) | Engine | ✅ Done | No LLM needed |

---

## 6. Technical Architecture (Current + Planned)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │  Variant A  │ │  Variant B  │ │  Variant C  │  ← 3 UI modes │
│  │ Card Dash   │ │ Dense Table │ │  Timeline   │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────────┐
│                      FASTAPI BACKEND (Port 8000)                │
│  /api/patients          → list/filter 15 synthetic patients     │
│  /api/patients/{id}     → raw FHIR context                       │
│  /api/patients/{id}/timeline → day-level timeline (NEW)        │
│  /api/summarize         → clinical summary (fallback/LLM)      │
│  /api/evaluate/batch    → 10-criterion eval                     │
│  /api/intake            → symptom intake → differential (PLAN)  │
│  /api/abha/consent      → ABDM consent flow (PLAN)             │
│  /api/abha/history      → HIU pull (PLAN)                       │
│  /api/abha/writeback    → HIP push (PLAN)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      ENGINE (Pure Python, No LLM Required)      │
│  data/generator.py      → 15 FHIR R4 bundles (5 archetypes)    │
│  engine/parser.py       → deterministic FHIR → structured ctx   │
│  engine/summarizer.py   → LLM (Gemini) + deterministic fallback │
│  eval/checklist.py      → 10-criterion clinical quality score   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Data Models (Key)

### 7.1 Patient Context (Parser Output)
```python
{
  "patient": {"age": 52, "gender": "F", "name": "Anita Patel", "patient_id": "..."},
  "active_problems": [{"code": "44054006", "display": "Type 2 diabetes mellitus"}],
  "vitals": {"hba1c": {"value": 10.6, "unit": "%", "trend": "stable"}, ...},
  "red_flags": [{"type": "critical", "key": "hba1c", "value": 10.6, "threshold": 9.0}],
  "chronic_snapshot": {"diabetes": {"last_hba1c": "10.6%", "control": "uncontrolled"}},
  "medications": [{"name": "Metformin 500mg", "dose": "500 mg BD", "status": "active"}],
  "day_timeline": [{"date": "2026-07-12", "encounters": [...], "labs": [...], ...}, ...]
}
```

### 7.2 Clinical Summary (Summarizer Output)
```python
{
  "patient_id": "...",
  "one_liner": "52F, Type 2 diabetes mellitus, Hypertensive disorder, 2 critical flags",
  "active_problems": [...],
  "red_flags": [{"type": "critical", "key": "hba1c", "message": "HbA1c 10.6% — intensify glycemic control"}],
  "chronic_snapshot": {...},
  "medications": [...],
  "missing_data": [],
  "encounter_count": 5
}
```

### 7.3 Symptom Intake (Planned)
```python
{
  "abha_id": "14-1234-5678-9012",  # optional
  "symptoms": [{"code": "R05", "display": "Cough", "duration_days": 7, "severity": "moderate"}],
  "vitals": {"temp": 38.2, "rr": 24, "spo2": 96, "bp": "120/80"},
  "free_text": "Worsening at night, productive cough"
}
```

### 7.4 Differential Output (Planned)
```python
{
  "differential": [
    {"rank": 1, "diagnosis": "Community-acquired pneumonia", "probability": 0.72, "supporting": ["fever", "productive cough", "RR 24"]},
    {"rank": 2, "diagnosis": "Pulmonary TB", "probability": 0.18, "supporting": ["duration >2wk", "night worsening"]}
  ],
  "red_flags": [{"type": "critical", "message": "SpO2 96% — monitor for deterioration"}],
  "suggested_questions": ["Any hemoptysis?", "Weight loss?", "Contact with TB?"],
  "suggested_tests": ["CBC", "CXR", "Sputum AFB"]
}
```

---

## 8. Clinical Archetypes (5 Synthetic Personas)

| Archetype | Count | Key Features |
|-----------|-------|--------------|
| `uncontrolled_dm` | 3 | T2DM + HTN, rising HbA1c, missed follow-up |
| `missed_tb_fu` | 3 | Pulmonary TB, weight loss, LFT elevation |
| `polypharmacy_elderly` | 3 | 7+ meds, triple whammy (NSAID+ACEi+diuretic), CKD |
| `high_risk_anc` | 3 | GHTN + GDM + anemia, 28 weeks |
| `faltering_growth` | 3 | Severe wasting, MUAC 112mm, recurrent LRI |

**All 15 patients pass eval (9.4/10 avg, 15/15 ≥8/10)**

---

## 9. Evaluation Framework (Live)

| Criterion | Description | Current Avg |
|-----------|-------------|-------------|
| All active problems captured | FHIR conditions → summary | ✅ 100% |
| No hallucinated medications | Summary meds ⊆ FHIR meds | ✅ 100% |
| No hallucinated conditions | Summary dx ⊆ FHIR dx | ✅ 100% |
| Red flags match rules | Threshold-based validation | ✅ 100% |
| One-liner scannable | ≤160 chars, age/gender/top2/flag | ✅ 100% |
| Chronic snapshot accurate | Matches latest vitals | ✅ 100% |
| Missing data actionable | No "normal" items listed | ✅ 100% |
| Medication doses preserved | Exact match FHIR | ✅ 100% |
| Trend direction correct | 3-point trend validation | ⚠️ 90% |
| Clinical tone appropriate | No conversational fluff | ✅ 100% |

**Overall: 9.4/10 average, 15/15 patients PASS (≥8/10)**

---

## 10. MVP Success Criteria (Measurable)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Chart review time** | <3 seconds scan | Frontend load + one-liner visible |
| **Eval score** | ≥8/10 all patients | Automated batch eval |
| **Offline fallback** | Works without API key | `use_fallback: true` |
| **Timeline depth** | ≥10 day-entries/patient | `day_timeline` entries |
| **API latency** | <500ms p95 | `/api/summarize` fallback |
| **Frontend build** | Zero TS/ESLint errors | `npm run build` ✅ |
| **Symptom intake** | Form submits structured JSON | `/api/intake` (Phase 2) |
| **Differential quality** | Doctor accepts top-1 ≥70% | Pilot metric (Phase 4) |

---

## 11. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ABDM sandbox unavailable | High | Blocks Phase 2 | Mock HIU/HIP for demo; decoupled interfaces |
| LLM quota exhausted | Medium | Degrades to fallback | Deterministic fallback always works (9.4/10) |
| Clinical liability | Low | Critical | Disclaimer UI, human-in-loop, eval transparency |
| Nurse adoption of intake form | Medium | High | Co-design, 3 UI variants, Hindi support |
| State HMIS integration | Medium | High | FHIR-native = easier; partner early |

---

## 12. Phased Roadmap

| Phase | Timeline | Deliverable | Status |
|-------|----------|-------------|--------|
| **0: Foundation** | Week 1-2 | Generator, Parser, Summarizer, Eval, API, Frontend | ✅ **DONE** |
| **1: Timeline & Polish** | Week 3 | Day-timeline, 3 UI variants, batch eval, offline mode | ✅ **DONE** |
| **2: Symptom Intake** | Week 4 | Structured intake form, ABDM consent mock, HIU pull mock | 🔴 **NEXT** |
| **3: Differential Engine** | Week 5 | Symptoms+history → ranked Dx + red flags + suggested Qs | 🔴 **PLANNED** |
| **4: Doctor Override UI** | Week 6 | Confirm/edit differential, finalize diagnosis | 🔴 **PLANNED** |
| **5: ABHA Write-Back** | Week 7 | HIP push to sandbox, consent audit trail | 🔴 **PLANNED** |
| **6: Pilot Prep** | Week 8-10 | Real PHC pilot, Hindi/Tamil, metrics dashboard | 🔴 **FUTURE** |

---

## 13. Non-Functional Requirements

| Requirement | Spec |
|-------------|------|
| **Offline-first** | Full deterministic fallback (no LLM) |
| **Latency** | <500ms API p95 (fallback), <3s LLM |
| **Privacy** | Zero PHI egress; synthetic data only; local LLM option |
| **Standards** | FHIR R4, ABDM sandbox compatible |
| **Accessibility** | WCAG AA, Hindi/Tamil labels (Phase 2) |
| **Deploy** | Docker + Vercel (frontend) + Railway/Render (API) |

---

## 14. Appendix: Current Repository Structure

```
/tmp/capstone-ai-triage/
├── CLAUDE.md                    # Karpathy principles + Ponytail framework
├── PRD.md                       # THIS DOCUMENT
├── MRD.md                       # Market Requirements
├── COMPETITOR_ANALYSIS.md       # Landscape + positioning
├── .env                         # GOOGLE_API_KEY (Gemini)
├── api.py                       # FastAPI server (7 endpoints)
├── pyproject.toml / requirements*.txt
├── data/
│   ├── generator.py             # 15 FHIR bundles (5 archetypes)
│   └── patients/                # Generated JSON bundles
├── engine/
│   ├── __init__.py
│   ├── parser.py                # FHIR → context + day_timeline
│   └── summarizer.py            # Gemini + deterministic fallback
├── eval/
│   ├── checklist.py             # 10-criterion clinical eval
│   └── run_eval.py              # Batch runner
└── frontend/
    ├── package.json             # Next.js 14, Tailwind
    ├── src/app/page.tsx         # Main dashboard
    └── src/components/
        ├── PatientList, ClinicalSummaryPanel, SummaryCard
        └── lovable-variants/
            ├── VariantA.tsx     # Card dashboard
            ├── VariantB.tsx     # Dense table
            └── VariantC.tsx     # Timeline view
```

---

## 15. Immediate Next Actions (This Week)

1. ✅ **Fix parser import** — `engine/__init__.py` created
2. ✅ **Load .env in API** — `load_dotenv()` added
3. ✅ **PATIENTS_DIR path** — Fixed to `.parent / "data" / "patients"`
4. ✅ **Evaluation field mapping** — `pass` → `pass_threshold`
5. ✅ **Frontend TS errors** — `any` → proper types, unused vars removed
6. ✅ **Day-timeline extraction** — Added to parser, exposed via `/api/patients/{id}/timeline`
7. 🔴 **Build symptom intake form** — `/frontend/src/components/SymptomIntake.tsx`
8. 🔴 **Add `/api/intake` endpoint** — Structured intake → context merge
9. 🔴 **Add ABDM consent mock** — `/api/abha/consent`, `/api/abha/history`
10. 🔴 **Differential generator** — New `engine/triage.py` using Gemini
11. 🔴 **Push to GitHub** — Initialize repo, commit all

---

*Document Version: 2.0 | Aligns old PRD (symptom triage) + current work (chart review) | MVP-targeted*