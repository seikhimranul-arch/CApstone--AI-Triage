# PRD v1 — AI Diagnostic Triage Assistant (Symptom Triage Focus)
**Archived for Reference — Superseded by PRD.md (Unified v2)**

---

**Author:** Sk Imran (Seikh Imran Ul Minhaj)  
**Status:** Draft v1 — Capstone  
**Date:** July 2026  
**Note:** This version focused exclusively on symptom-intake → differential workflow. Chart review / pre-visit synthesis was not included. See `PRD.md` for unified v2.

---

## 1. Problem Statement

Doctors at Primary Health Centres (PHCs) in India see high patient volumes with limited consultation time per patient. A significant share of that time goes into re-collecting history the patient has already given elsewhere, and into working through a differential diagnosis from scratch for common presentations. This reduces the time available for actual clinical judgment, patient communication, and complex cases.

**Core problem:** Doctors need to reach a confident, effective diagnosis in less time — without cutting corners on quality or safety.

---

## 2. Goal

Reduce the time a doctor spends per patient on history-gathering and differential narrowing, by:
- Surfacing relevant prior health records automatically (via ABHA/ABDM), removing redundant history-taking.
- Generating a ranked, evidence-based differential and suggested next questions/tests from structured symptom input, so the doctor starts from a shortlist instead of a blank slate.

**Explicit non-goal:** This is a decision-support tool. It does not diagnose autonomously and does not replace clinical judgment. The doctor confirms or overrides every suggestion.

---

## 3. Target User

**Primary:** PHC doctors (general physicians, high patient-volume, time-constrained).  
**Secondary:** Nurses/ASHA workers who may do initial symptom intake before the doctor sees the patient.

---

## 4. Core User Flow

1. **Intake** — Patient (or nurse/ASHA) enters symptoms via a structured checklist + short free-text field, plus basic vitals and duration.
2. **History pull** — If the patient has an ABHA ID and has granted consent, the system fetches relevant prior records (past diagnoses, medications, recent visits) via ABDM.
3. **Triage output** — System generates a ranked differential (most-likely-first), flags anything urgent/red-flag, and suggests 2–3 clarifying questions or tests the doctor may want to order.
4. **Doctor review** — Doctor sees the shortlist and prior-history summary in one screen, confirms/edits/overrides, and finalizes the diagnosis and plan.
5. **Write-back** — The finalized note and outcome are written back as a structured record linked to the patient's ABHA ID (if consented), so the next visit — anywhere in the system — starts with better context.

---

## 5. Features (MVP Scope Only)

| Feature | Included in MVP | Notes |
|---------|-----------------|-------|
| Structured symptom intake form | Yes | Checklist + short free text, not ambient audio |
| ABHA ID lookup + consent request | Yes | Via ABDM sandbox, Consent Manager flow |
| Prior history retrieval | Yes | HIU-style pull, summarized for the doctor |
| AI-generated ranked differential | Yes | Claude API, structured input → structured output |
| Red-flag / urgent-case highlighting | Yes | Simple rule-based + model-assisted flagging |
| Doctor override/edit before finalizing | Yes | Doctor is always the final decision-maker |
| Structured note write-back to ABHA | Yes | HIP-style push |

| Feature | Included in MVP | Notes |
|---------|-----------------|-------|
| Ambient audio transcription / scribe | No | Adds time and infra, doesn't serve the "minimize time" goal |
| Abuse/protocol-deviation flagging | No | Out of scope, unrelated to stated goal |
| Multi-service microservice architecture | No | Thin orchestration layer only for capstone scope |

---

## 6. Why ABHA, Specifically

ABHA/ABDM is not used here as a data warehouse for this tool — it's the interoperability layer that makes "skip repeat history-taking" possible in the first place:
- Consent Manager handles patient consent to share past records in a structured, revocable way — no need to invent a consent mechanism.
- HIU role lets the tool pull existing records so the doctor isn't re-asking what's already documented elsewhere.
- HIP role lets the tool push the new triage note back, so the next doctor (anywhere) benefits too — this is the compounding value case.

**Scope caveat:** Full HIP/HIU production integration requires ABDM certification and security audit. For capstone purposes, integration will be demonstrated against the ABDM sandbox environment, not production.

---

## 7. Success Metrics (Hypotheses — Unvalidated Without a Pilot)

- Reduction in average history-taking time per patient with an existing ABHA record, vs. without.
- Doctor-reported confidence/agreement rate with the AI-suggested differential (target: doctor accepts or lightly edits, rather than fully discards, most of the time).
- Time from patient intake to finalized note.

**Flagging clearly:** these are target metrics to validate with a pilot, not claims this PRD is making about proven outcomes.

---

## 8. Risks & Open Questions

- **Language/input variability:** Structured intake avoids the ASR-accuracy problem entirely, but relies on nurses/ASHA workers correctly capturing symptoms — worth a usability check.
- **Over-reliance risk:** Doctors may start rubber-stamping AI suggestions under time pressure. Needs a UX safeguard (e.g., require explicit doctor action, not just a "confirm" default).
- **ABDM integration complexity:** Sandbox access and API stability should be confirmed early — this is the highest-uncertainty dependency in the plan.
- **Retention/compliance details:** Specific data retention periods and DPDP health-data provisions should be confirmed against current official guidance before finalizing the data model — not assumed from general research.

---

## 9. Out of Scope (for this Capstone)

- Ambient audio recording/transcription of consultations
- Medico-legal dispute documentation use case
- Autonomous diagnosis or treatment recommendation without doctor sign-off
- Production ABDM certification (sandbox only)

---

## 10. Phased Roadmap

| Phase | Deliverable |
|-------|-------------|
| **Phase 1** | Structured intake + Claude API differential generation, no ABHA (validate core value first) |
| **Phase 2** | ABDM sandbox integration — consent flow + prior history pull |
| **Phase 3** | Write-back of structured notes (HIP-style) to close the loop |
| **Phase 4** (beyond capstone) | Pilot with real PHC, measure actual time-saved, production ABDM certification |

---

*Archived: 2026-07-17 | Replaced by unified PRD.md v2*