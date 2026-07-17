# ABHA Integration Review Plan
## Current State vs Required ABHA Integration

---

## Current Architecture: ABHA-Ready but Not ABHA-Connected

| Component | Current State | ABHA Integration Needed |
|-----------|---------------|-------------------------|
| **Data Generator** | 15 synthetic FHIR R4 bundles | ✅ Generates ABHA-compatible FHIR |
| **Parser** | Parses FHIR → structured context | ✅ Outputs ABHA-compatible clinical context |
| **Summarizer** | Works on any FHIR context | ✅ Works with real ABHA data |
| **API** | Serves synthetic patients | ❌ No ABHA endpoints |
| **Frontend** | Shows synthetic patients | ❌ No ABHA consent/lookup UI |

**Gap:** The engine is ABHA-*compatible* but the product has **zero ABHA connectivity** — no consent flow, no HIU pull, no HIP push, no patient lookup by ABHA ID.

---

## Required ABHA Integration Points (Per Old PRD + ABDM Spec)

| Integration Point | ABDM Role | Current Status | Required Implementation |
|-------------------|-----------|----------------|------------------------|
| **1. Patient Lookup by ABHA ID** | HIU | ❌ | `GET /api/abha/patient/{abha_id}` |
| **2. Consent Initiation** | Consent Manager | ❌ | `POST /api/abha/consent/initiate` |
| **3. Consent Callback** | Consent Manager | ❌ | `GET /api/abha/consent/callback` |
| **4. Health Information Pull (HIU)** | HIU | ❌ | `GET /api/abha/history?abha_id=X&consent=Y` |
| **5. Context Merge** | Local | ❌ | Merge HIU FHIR + symptom intake |
| **6. Health Information Push (HIP)** | HIP | ❌ | `POST /api/abha/writeback` |
| **7. Consent Audit Trail** | Local | ❌ | Store consent artifacts |

---

## ABHA Data Flow (Required)

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   FRONTEND  │────▶│   BACKEND API    │────▶│   ABDM GATEWAY  │
│             │     │                  │     │                 │
│ 1. Nurse    │     │ 2. Consent init  │     │ 3. Consent Mgr  │
│    enters   │     │    → redirect    │     │    → patient    │
│    ABHA ID  │     │                  │     │    consents     │
│             │     │                  │     │                 │
│ 4. Patient  │◀────│ 5. HIU pull      │◀────│ 6. Returns FHIR │
│    selects  │     │    (with consent)│     │    bundles      │
│    symptoms │     │                  │     │                 │
│             │     │ 7. Merge + Triage│     │                 │
└─────────────┘     └────────┬─────────┘     └─────────────────┘
                             │
                    ┌────────▼────────┐
                    │   DOCTOR UI     │
                    │ 8. Review +     │
                    │    Finalize     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ 9. HIP Push     │────▶ ABDM Gateway
                    │    (write-back) │
                    └─────────────────┘
```

---

## Phase 2 Implementation Plan: ABHA Integration + Symptom Intake

### 2.1 Backend Endpoints (New)

| Endpoint | Method | Purpose | Mock/Real |
|----------|--------|---------|-----------|
| `/api/abha/patient/{abha_id}` | GET | Lookup patient demographics | Mock → Real |
| `/api/abha/consent/initiate` | POST | Start consent flow | Mock |
| `/api/abha/consent/callback` | GET | Handle consent redirect | Mock |
| `/api/abha/history` | GET | Pull FHIR via HIU (with consent) | Mock → Sandbox |
| `/api/abha/writeback` | POST | Push Composition via HIP | Mock → Sandbox |

### 2.2 Frontend Components (New)

| Component | Purpose |
|-----------|---------|
| `ABHALookup.tsx` | Enter ABHA ID → fetch patient |
| `ConsentFlow.tsx` | Redirect to consent manager, handle callback |
| `SymptomIntake.tsx` | Structured checklist + vitals + free text |
| `TriageContext.tsx` | Merge intake + ABHA history → triage |

### 2.3 Data Models (Extend Existing)

```python
# New: ABHA Consent Artifact
class ABHAConsent:
    consent_id: str
    abha_id: str
    patient_id: str
    status: "REQUESTED" | "GRANTED" | "DENIED" | "REVOKED"
    purpose: "TRIAGE"
    hi_types: ["Condition", "MedicationRequest", "Observation", "Encounter"]
    date_range: {"from": "2020-01-01", "to": "2026-07-17"}
    expiry: "2026-07-17T23:59:59Z"
    artifact: dict  # Signed consent artifact

# New: Triage Context (merged)
class TriageContext:
    intake: SymptomIntake
    abha_history: FHIRContext  # From parser
    merged_medications: list[Medication]
    merged_conditions: list[Condition]
    conflicts: list[str]  # e.g., "Intake: no diabetes, History: T2DM"
```

---

## Review Gates Before Implementation

| Gate | Criteria | Decision Required |
|------|----------|-------------------|
| **Gate 1: Architecture** | Confirm endpoint designs, data models, mock vs real strategy | ✅ Proceed / ❌ Redesign |
| **Gate 2: ABDM Sandbox Access** | Confirm sandbox credentials, HIU/HIP endpoints available | ✅ Proceed / ❌ Use mock only |
| **Gate 3: Consent UX** | Approve consent flow (redirect vs embedded), error handling | ✅ Proceed / ❌ Redesign |
| **Gate 4: Merge Logic** | Approve conflict resolution rules (intake vs history) | ✅ Proceed / ❌ Redesign |
| **Gate 5: Safety** | Clinical review of merge + triage output on 5 test cases | ✅ Proceed / ❌ Redesign |

---

## Decision Points for You

| Decision | Options | My Recommendation |
|----------|---------|-------------------|
| **1. Mock vs Real ABDM** | Full mock / Sandbox HIU only / Full sandbox | **Start with mock**, swap HIU endpoint when sandbox creds ready |
| **2. Consent Flow** | Redirect (standard) / Embedded iframe / Delegated | **Redirect** — ABDM standard, handles revocation |
| **3. Conflict Resolution** | History wins / Intake wins / Flag for doctor | **Flag for doctor** — safety first |
| **4. ABHA ID Format** | 14-digit / UUID / Both | **14-digit ABHA number** (user-facing) |
| **4. Phase 2 Scope** | All 5 endpoints + UI / Just intake + mock HIU / Just HIU pull | **Intake + Mock HIU + Merge + Triage** (end-to-end value) |

---

## Questions Before Proceeding

1. **Do you have ABDM sandbox credentials** (client_id, client_secret, gateway URL) or should we build full mock first?
2. **Which consent flow** does your ABDM sandbox support — redirect-based or embedded?
3. **Should Phase 2 include the differential engine** (Phase 3) or stop at merged context + triage?
4. **Any specific conflict resolution rules** for intake vs history discrepancies?
5. **Target timeline** for Phase 2 completion?

---

## Decision Required

**Please confirm before I proceed:**

- ✅ Architecture review approved?
- ✅ Mock-first approach acceptable?
- ✅ Scope = Intake + Mock HIU + Merge + Triage (Phase 2)?
- ✅ Ready to proceed with Gate 1 implementation plan?

Once you confirm, I'll present the detailed implementation plan for each component before writing any code.