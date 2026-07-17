# Launch Plan
## SehatAI — Phase-Gated Go-to-Market

---

### Launch Philosophy

**Principle:** Ship chart-review-ready increments that deliver standalone clinician value. Each phase must pass clinical eval (≥8/10) before next phase.

**Target:** 50 PHC pilot across 3 states by Month 6. National scale via NHA by Month 18.

---

## Phase Gate Criteria

| Phase | Gate | Must Pass |
|-------|------|-----------|
| **1: Foundation** | Code complete + eval | 15/15 pts ≥8/10, API <500ms, FE builds |
| **2: Intake** | Usability + integration | Nurse completes intake <60s, HIU mock works |
| **3: Triage** | Clinical quality | Differential top-1 acceptance ≥70% (simulated) |
| **4: Pilot** | Real-world | 50 PHCs, 200 MOs, 40% time reduction, 90% adoption |
| **5: Scale** | Procurement | State contracts, NHA integration, multi-lang |

---

## Phase 1: Foundation (Weeks 1-3) ✅ COMPLETE

| Deliverable | Status | Owner |
|-------------|--------|-------|
| Synthetic FHIR generator (5 archetypes × 3) | ✅ | Dev |
| Deterministic FHIR parser + red flags | ✅ | Dev |
| Clinical summarizer (Gemini + fallback) | ✅ | Dev |
| 10-criterion eval framework (9.4/10 avg) | ✅ | Dev |
| FastAPI backend (7 endpoints) | ✅ | Dev |
| Next.js frontend (3 UI variants) | ✅ | Dev |
| Day-timeline extraction | ✅ | Dev |
| Offline deterministic fallback | ✅ | Dev |

**Exit Criteria:** All 15 patients pass eval (≥8/10). ✅ PASSED

---

## Phase 2: Symptom Intake + ABHA Mock (Weeks 4-5)

### 2.1 Symptom Intake Form (Frontend)

| Component | Spec | Status |
|-----------|------|--------|
| `SymptomIntake.tsx` | Checklist (ICD-11 mapped) + free text + vitals + duration | 🔴 |
| Nurse/ASHA mode | Large touch targets, Hindi labels | 🔴 |
| Validation | Required fields, logical constraints (e.g., duration ≤ age) | 🔴 |
| Submission | POST `/api/intake` → returns intake_id | 🔴 |

### 2.2 ABHA Consent Flow (Mock)

| Endpoint | Spec | Status |
|----------|------|--------|
| `GET /api/abha/consent/initiate?abha_id=X` | Redirects to mock consent manager | 🔴 |
| `GET /api/abha/consent/callback?token=Y` | Exchanges token → stores consent | 🔴 |
| `GET /api/abha/history?abha_id=X&intake_id=Y` | Merges HIU pull with intake context | 🔴 |

### 2.3 Context Merger (Backend)

```python
def merge_context(intake: Intake, history: FHIRContext) -> TriageContext:
    # Combine structured symptoms + parsed FHIR history
    # Deduplicate medications, conditions
    # Flag conflicts (e.g., intake says "no diabetes" but history has T2DM)
    pass
```

**Exit Criteria:** Nurse completes intake in <60s; merged context passes eval.

---

## Phase 3: Differential Engine (Weeks 6-7)

### 3.1 Engine Design

| Component | Spec |
|-----------|------|
| Input | `TriageContext` (symptoms + vitals + history + red flags) |
| Model | Gemini 2.0 Flash (structured JSON output) |
| Output Schema | Ranked differential (diagnosis, probability, supporting evidence, DDx reasoning) |
| Red Flags | Rule-based escalation (e.g., SpO2<94% → critical) |
| Suggested Questions | 2-3 clarifying Qs per top-3 DDx |
| Suggested Tests | Evidence-based per top-3 DDx |

### 3.2 Prompt Engineering

```
SYSTEM: You are a senior PHC clinician in India. Given structured symptom intake + patient history, 
output ranked differential diagnosis in JSON. Prioritize common PHC presentations. 
Flag urgent referrals. Suggest 2-3 clarifying questions and first-line tests per top-3 DDx.
```

### 3.3 Evaluation Extension

| New Criterion | Target |
|---------------|--------|
| DDx top-1 clinical accuracy | ≥70% (vs specialist panel) |
| Red flag sensitivity | 100% (critical flags never missed) |
| Suggested test appropriateness | ≥80% (guideline-concordant) |
| Question relevance | ≥80% (would change management) |

**Exit Criteria:** Simulated eval on 50 synthetic cases passes all thresholds.

---

## Phase 4: Doctor Override UI (Week 8)

| Component | Spec |
|-----------|------|
| `DifferentialReview.tsx` | Ranked list with accept/edit/reject per item |
| Override logging | Capture doctor's reasoning for audit |
| Finalize button | Generates structured note + pushes to ABHA (mock) |
| Safety check | Require explicit action on critical red flags |

---

## Phase 5: ABHA Write-Back (Week 9)

| Endpoint | Spec |
|----------|------|
| `POST /api/abha/writeback` | HIP-style push of Composition + DiagnosticReport |
| Audit trail | Consent ID, doctor ID, timestamp, hash |
| Error handling | Retry queue, dead-letter for failed pushes |

---

## Phase 6: Pilot Prep (Weeks 10-12)

| Workstream | Deliverable |
|------------|-------------|
| **Localization** | Hindi/Tamil labels, RTL-ready |
| **Training** | 2-hour video + quick-reference card |
| **Support** | WhatsApp group + escalation SOP |
| **Metrics dashboard** | Daily active MOs, time/patient, eval scores |
| **IRB/ethics** | Pilot protocol for state ethics committee |

---

## Phase 7: Pilot Execution (Months 4-6)

### Pilot Design

| Parameter | Spec |
|-----------|------|
| **States** | Maharashtra, Tamil Nadu, Kerala |
| **PHCs** | 50 (15/15/20) |
| **MOs** | ~200 (4/PHC avg) |
| **Duration** | 8 weeks |
| **Control** | Pre/post within same MOs (first 2 weeks baseline) |

### Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **History-taking time** | 4.2 min | 2.5 min (40%↓) | Stopwatch + self-report |
| **Red flag detection** | 65% | 95% | Chart review |
| **MO daily active use** | 0% | 80% | Analytics |
| **Eval score (live)** | 9.4/10 (sim) | ≥8.5/10 | Automated batch |
| **Patient satisfaction** | N/A | ≥4/5 | 5-question SMS |

### Go/No-Go for Scale

| Condition | Action |
|-----------|--------|
| All 5 metrics hit | Proceed to state procurement |
| 3/5 metrics hit | Extend pilot 4 weeks, iterate |
| <3 metrics hit | Root-cause, redesign, re-pilot |

---

## Phase 8: State Scale (Months 7-12)

### Procurement Path

| State | Decision Maker | Budget Route | Timeline |
|-------|----------------|--------------|----------|
| Maharashtra | MD NHM | NHM flexi-fund | 3-6 mo |
| Tamil Nadu | MD NHM | State health mission | 3-6 mo |
| Kerala | MD NHM | Aardram mission | 3-6 mo |
| National | NHA/ABDM | Central scheme | 12-18 mo |

### Technical Scale Requirements

| Requirement | Target |
|-------------|--------|
| Concurrent MOs | 5,000+ |
| API latency p95 | <300ms |
| Uptime | 99.9% |
| Multi-language | Hindi, Tamil, Malayalam, Bengali |
| ABDM production | Certified HIU/HIP |

---

## Phase 9: National Integration (Months 13-18)

| Milestone | Owner | Timeline |
|-----------|-------|----------|
| ABDM HIU/HIP certification | Dev + Legal | Month 13 |
| NHA sandbox → production | DevOps | Month 14 |
| UHI network onboarding | BD | Month 15 |
| National dashboard for NHA | Dev | Month 16 |
| 500 PHCs live | State teams | Month 18 |

---

## Risk Register & Mitigations

| Risk | Phase | Probability | Impact | Mitigation |
|------|-------|-------------|--------|------------|
| ABDM sandbox down | 2,3,5 | High | Blocks integration | Mock HIU/HIP always available |
| LLM quota exhausted | 1,3 | Medium | Degrades to fallback | Fallback is 9.4/10 eval |
| Low nurse adoption | 2 | Medium | Intake incomplete | Co-design, large touch targets, Hindi |
| Clinical liability | 3,4,5 | Low | Critical | Disclaimer UI, human-in-loop, eval transparency |
| State procurement delay | 6,8 | High | Revenue slip | Grant bridge (BIRAC, Gates, state missions) |
| Internet unreliability | All | High | Rural reality | Full offline mode, sync on connect |
| Multi-language debt | 6 | Medium | Adoption barrier | i18n from Phase 2, not retrofitted |

---

## Budget Overview (Indicative)

| Category | Phase 1-3 | Phase 4-6 | Phase 7-9 | Total |
|----------|-----------|-----------|-----------|-------|
| **Engineering** | ₹15L | ₹25L | ₹40L | ₹80L |
| **Cloud/Infra** | ₹2L | ₹8L | ₹25L | ₹35L |
| **Clinical Validation** | ₹0 | ₹10L | ₹30L | ₹40L |
| **Localization** | ₹0 | ₹5L | ₹15L | ₹20L |
| **Pilot Ops** | ₹0 | ₹0 | ₹50L | ₹50L |
| **BD/Govt Relations** | ₹0 | ₹10L | ₹30L | ₹40L |
| **Contingency (20%)** | ₹3.4L | ₹11.6L | ₹38L | ₹53L |
| **TOTAL** | **₹20.4L** | **₹69.6L** | **₹228L** | **~₹3.2Cr** |

---

## Success Definition

> **"By Month 18, 500+ PHCs across 10+ states use AI Triage daily. Average MO saves 90 min/day. Red flag detection >95%. ABDM production certified. Self-sustaining via state contracts."**

---

*Document Version: 1.0 | Date: 2026-07-17 | Status: Approved for Execution*