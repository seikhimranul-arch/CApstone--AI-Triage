# PRD Comparison: Old (Symptom Triage) vs New (Unified Chart Review + Symptom Triage)

---

## Executive Summary

| Aspect | Old PRD (v1) | New PRD (v2 Unified) |
|--------|--------------|----------------------|
| **Primary Workflow** | Symptom intake → Differential diagnosis | **Chart Review (pre-visit) + Symptom Triage (in-visit) + Write-Back** |
| **ABHA Role** | HIU pull + HIP push (core) | **Chart review context + optional intake merge + HIP push** |
| **AI Task** | Symptoms + history → Ranked differential | **Chart summary + (future) history-aware differential** |
| **Scope** | Single workflow (triage) | **Two complementary workflows** |

---

## Detailed Section-by-Section Comparison

### 1. Problem Statement

| Old PRD | New PRD (v2) |
|---------|--------------|
| "Doctors re-collect history & build differential from scratch" | **Two pain points:** (1) Pre-visit blindness — no chart synthesis (2) Intake-to-diagnosis gap — differential from scratch |
| Focus: reduce history-taking time | **Focus: reduce BOTH chart review time AND intake-to-diagnosis time** |

### 2. Goal

| Old PRD | New PRD (v2) |
|---------|--------------|
| Reduce history-taking + differential time via ABHA pull + AI differential | **Dual goal:** (1) 3-sec chart scan replaces 3-min dig (2) History-aware differential from structured intake |

### 3. Target Users

| Old PRD | New PRD (v2) |
|---------|--------------|
| Primary: PHC doctors<br>Secondary: Nurses/ASHA (intake) | **Same** + **Tertiary: State Health IT** (dashboards, compliance) |

### 4. Core User Flow

| Old PRD (Linear) | New PRD (v2) — Three-Stage Pipeline |
|------------------|-------------------------------------|
| 1. Intake (symptoms)<br>2. ABHA history pull<br>3. AI differential<br>4. Doctor review<br>5. ABHA write-back | **PRE-VISIT:** Select patient → 3-sec summary + timeline<br>**IN-VISIT:** Nurse intake → merge with history → differential<br>**POST-VISIT:** Structured note → ABHA write-back |

### 5. Features (MVP Scope) — MAJOR DIFFERENCE

| Feature | Old PRD | New PRD (v2) | Status |
|---------|---------|--------------|--------|
| **Chart Review Module** | ❌ Not mentioned | ✅ **Core** — summary, red flags, timeline | ✅ DONE |
| Synthetic FHIR generator | ❌ | ✅ | ✅ DONE |
| Deterministic FHIR parser | ❌ | ✅ | ✅ DONE |
| Clinical summarizer (LLM + fallback) | ❌ | ✅ | ✅ DONE |
| Day-timeline extraction | ❌ | ✅ | ✅ DONE |
| 10-criterion eval framework | ❌ | ✅ | ✅ DONE |
| **Symptom Intake Form** | ✅ Core | ✅ **Planned (Phase 2)** | 🔴 GAP |
| ABHA ID lookup + consent | ✅ Core | ✅ **Planned (Phase 2)** | 🔴 GAP |
| HIU prior history pull | ✅ Core | ✅ **Planned (Phase 2)** | 🔴 GAP |
| AI differential generator | ✅ Core | ✅ **Planned (Phase 3)** | 🔴 GAP |
| Red-flag escalation | ✅ Core | ✅ **Partial (parser has rules)** | 🟡 PARTIAL |
| Doctor override UI | ✅ Core | ✅ **Planned (Phase 4)** | 🔴 GAP |
| HIP write-back | ✅ Core | ✅ **Planned (Phase 5)** | 🔴 GAP |
| **Infrastructure** | | | |
| FastAPI backend | ❌ | ✅ | ✅ DONE |
| Next.js frontend (3 variants) | ❌ | ✅ | ✅ DONE |
| Offline fallback | ❌ | ✅ | ✅ DONE |

---

## What's NEW in v2 (Not in Old PRD)

| New Capability | Description | Value |
|----------------|-------------|-------|
| **Chart Review Workflow** | Pre-visit chart synthesis via FHIR parsing | Solves "doctor walks in blind" |
| **Deterministic Parser** | Zero-LLM fact extraction from FHIR | Zero hallucination, offline works |
| **Red Flag Engine** | Rule-based (HbA1c>9%, BP>160/100, missed FU>90d) | Clinically safe without LLM |
| **Day Timeline** | Encounters + vitals + labs + meds + dx by date | Longitudinal view |
| **Eval Framework** | 10-criterion automated quality gate (9.4/10 avg) | Measurable clinical quality |
| **3 UI Variants** | Card, Table, Timeline for different workflows | PHC workflow fit |
| **Offline-First** | Deterministic fallback (no LLM needed) | Works in rural PHCs |
| **Archetype Library** | 5 clinical personas covering 60% PHC burden | Testable, extensible |

---

## What's PRESERVED from Old PRD

| Preserved Element | How It's Integrated |
|-------------------|---------------------|
| Symptom intake form | Phase 2 frontend component |
| ABHA consent flow | Phase 2 backend endpoints |
| HIU history pull | Phase 2 — merges with intake context |
| AI differential | Phase 3 — now **history-aware** (uses chart context) |
| Red-flag highlighting | Already in parser + summarizer |
| Doctor override UI | Phase 4 |
| HIP write-back | Phase 5 |
| Phased roadmap | Extended from 4 → 6 phases |

---

## Architecture Comparison

| Component | Old PRD | New PRD (Implemented) |
|-----------|---------|----------------------|
| **Data** | Real ABHA (sandbox) | Synthetic FHIR (15 pts) + ABDM-ready |
| **Parser** | Not specified | Deterministic FHIR R4 parser |
| **LLM** | Claude API | Gemini + deterministic fallback |
| **Eval** | Not specified | 10-criterion automated (9.4/10) |
| **API** | Not specified | FastAPI (7 endpoints) |
| **Frontend** | Not specified | Next.js 14, 3 variants |
| **Offline** | Not specified | Full fallback mode |

---

## Roadmap Alignment

| Phase | Old PRD | New PRD v2 | Status |
|-------|---------|------------|--------|
| 1 | Intake + Claude differential | Foundation (generator, parser, summarizer, eval, API, frontend) | ✅ DONE |
| 2 | ABDM sandbox integration | Timeline + Polish (day-timeline, 3 UI, batch eval) | ✅ DONE |
| 3 | Write-back (HIP) | Symptom Intake (form, consent, HIU merge) | 🔴 NEXT |
| 4 | — | Differential Engine (history-aware) | 🔴 PLANNED |
| 5 | — | Doctor Override UI | 🔴 PLANNED |
| 6 | — | ABHA Write-Back (HIP) | 🔴 PLANNED |
| 7 | Pilot | Pilot Prep + Real PHC | 🔴 FUTURE |

---

## Key Decisions Needed Before GitHub Push

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **1. Keep both workflows unified?** | Yes (v2) / No (separate PRDs) | **Yes** — they're complementary; chart review enables better triage |
| **2. Symptom intake in MVP?** | Yes (delay chart review) / No (chart review first) | **Chart review first** — already working, 9.4/10 eval |
| **3. Old PRD as appendix?** | Archive / Integrate / Discard | **Archive as `PRD_v1_symptom_triage.md`** |
| **4. ABHA integration approach** | Real sandbox / Mock for demo | **Mock for demo** (sandbox unstable); real in Phase 5 |
| **5. LLM choice** | Gemini / Ollama local / Both | **Gemini + fallback** (Ollama in Phase 4) |
| **6. Language support** | English only / Hindi+Tamil MVP | **English MVP, Hindi/Tamil Phase 2** |

---

## Files to Push to GitHub

### Core Documentation (NEW/UPDATED)
- [x] `PRD.md` — **Unified v2** (this comparison)
- [x] `PRD_v1_symptom_triage.md` — **Archived old PRD**
- [x] `MRD.md` — Market Requirements
- [x] `COMPETITOR_ANALYSIS.md` — Landscape + positioning
- [x] `LAUNCH_PLAN.md` — Phase-gated launch plan
- [x] `CLAUDE.md` — Karpathy + Ponytail principles

### Implementation (WORKING)
- [x] `api.py` — FastAPI (7 endpoints)
- [x] `data/generator.py` — 15 FHIR bundles
- [x] `engine/parser.py` — FHIR parser + day_timeline
- [x] `engine/summarizer.py` — Gemini + fallback
- [x] `eval/checklist.py` — 10-criterion eval
- [x] `frontend/` — Next.js 14, 3 variants

### Config
- [x] `requirements.txt`, `requirements-api.txt`, `pyproject.toml`
- [x] `.env.example` (no keys)
- [x] `.gitignore`

---

## GitHub Repository Structure

```
capstone-ai-triage/
├── README.md                    # Project overview + quickstart
├── CLAUDE.md                    # Development principles
├── PRD.md                       # Unified v2 (this doc)
├── PRD_v1_symptom_triage.md     # Archived old PRD
├── MRD.md                       # Market Requirements
├── COMPETITOR_ANALYSIS.md       # Competitive landscape
├── LAUNCH_PLAN.md               # Phase-gated launch
├── .gitignore
├── .env.example
├── api.py
├── pyproject.toml
├── requirements.txt
├── requirements-api.txt
├── data/
│   ├── generator.py
│   └── patients/                # 15 generated bundles (gitignored)
├── engine/
│   ├── __init__.py
│   ├── parser.py
│   └── summarizer.py
├── eval/
│   ├── checklist.py
│   └── run_eval.py
└── frontend/
    ├── package.json
    └── src/
```

---

## Confirmation Required

**Please confirm before I push:**

1. ✅ **Unified PRD v2 is correct** — chart review + symptom triage as complementary workflows
2. ✅ **Archive old PRD** as `PRD_v1_symptom_triage.md` for reference
3. ✅ **Current implementation matches v2** — chart review working (9.4/10), symptom intake is Phase 2
4. ✅ **All 5 new docs created** — MRD, Competitor Analysis, Launch Plan, updated PRD, archived v1
5. ❓ **Any old PRD sections to resurrect?** — (e.g., specific differential algorithms, consent UX details)
6. ❓ **Push now or review docs first?**