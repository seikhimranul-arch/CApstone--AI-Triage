# Phase 2 Implementation Plan: ABHA Mock Integration + Symptom Intake
## Mock-First Approach — Detailed Step-by-Step

---

## Phase 2 Scope (Confirmed)
**Goal:** End-to-end triage flow with mock ABHA integration
- Symptom intake form (nurse/ASHA)
- Mock ABHA lookup + consent flow
- Mock HIU history pull
- Context merge (intake + ABHA history)
- Triage output (merged context ready for differential)

**Mock Strategy:** All ABDM interactions simulated; swap HIU endpoint when sandbox creds arrive.

---

## Implementation Steps (Sequential, Review-Gated)

### Step 1: Data Models & Types
**Files:** `engine/models.py` (new)
**Content:**
- `SymptomIntake` — checklist + vitals + free text
- `ABHAConsent` — consent artifact, status, expiry
- `TriageContext` — merged intake + ABHA history + conflicts
- `Conflict` — discrepancy between intake and history

**Review Gate:** Approve data models before implementation.

---

### Step 2: Mock ABDM Service
**Files:** `engine/abha_mock.py` (new)
**Endpoints simulated:**
- `lookup_patient(abha_id)` → returns demographics from synthetic data
- `initiate_consent(abha_id)` → returns mock consent URL + consent_id
- `handle_callback(consent_id, status)` → updates consent artifact
- `pull_history(abha_id, consent_id)` → returns FHIR bundle from synthetic patients

**Review Gate:** Approve mock behavior and data shapes.

---

### Step 3: Context Merge Service
**Files:** `engine/merge.py` (new)
**Logic:**
- Deduplicate medications (by RxNorm code)
- Deduplicate conditions (by SNOMED code)
- Detect conflicts:
  - Intake says "no diabetes" but history has T2DM
  - Intake medication not in history
  - History condition not mentioned in intake
- Output `TriageContext` with merged lists + conflict flags

**Review Gate:** Approve merge rules and conflict definitions.

---

### Step 4: FastAPI Endpoints (New)
**Files:** `api.py` (extend)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/abha/patient/{abha_id}` | GET | Mock demographics lookup |
| `/api/abha/consent/initiate` | POST | Start mock consent → return redirect URL |
| `/api/abha/consent/callback` | GET | Handle mock redirect → store consent |
| `/api/abha/history` | GET | Mock HIU pull (requires consent) |
| `/api/intake` | POST | Submit symptom intake → returns intake_id |
| `/api/triage/context` | POST | Merge intake + ABHA history → TriageContext |

**Review Gate:** Approve endpoint contracts (request/response schemas).

---

### Step 5: Frontend Components
**Files:** `frontend/src/components/` (new)
| Component | Purpose |
|-----------|---------|
| `ABHALookup.tsx` | Enter 14-digit ABHA ID → fetch demographics |
| `ConsentFlow.tsx` | Redirect to mock consent manager, handle callback |
| `SymptomIntake.tsx` | ICD-11 symptom checklist + vitals + free text + duration |
| `TriageReview.tsx` | Show merged context, conflicts, ready for differential |

**Integration:** Add to main page as new "Triage" tab alongside chart review.

**Review Gate:** Approve UI flow and component hierarchy.

---

### Step 6: Integration Test & Demo Flow
**Flow:**
1. Nurse enters ABHA ID → sees patient name/age
2. Clicks "Get Consent" → mock redirect → returns with consent
3. Fills symptom intake (checklist + vitals)
4. Submits → sees merged context with conflicts highlighted
5. Doctor reviews → ready for differential (Phase 3)

**Review Gate:** Demo working end-to-end.

---

## Next Actions (Your Permission Required)

| Step | Action | Your Decision |
|------|--------|---------------|
| **1** | Create `engine/models.py` with data models | ✅ Proceed / ❌ Modify |
| **2** | Create `engine/abha_mock.py` with mock ABDM service | ✅ Proceed / ❌ Modify |
| **3** | Create `engine/merge.py` with context merge logic | ✅ Proceed / ❌ Modify |
| **4** | Extend `api.py` with 6 new endpoints | ✅ Proceed / ❌ Modify |
| **5** | Create 4 frontend components | ✅ Proceed / ❌ Modify |
| **6** | Integration test & demo | ✅ Proceed / ❌ Modify |

---

## Questions Before Starting Step 1

1. **ABHA ID format:** 14-digit numeric string only, or also support UUID?
2. **Symptom checklist source:** Use ICD-11 codes from our archetypes, or a standard PHC symptom list?
3. **Vitals in intake:** Which vitals required? (BP, temp, RR, SpO2, pulse, weight, height)
3. **Consent expiry:** Fixed 24h, or configurable?
4. **Conflict severity levels:** Just flag, or also warn/block?

---

## Ready to Proceed?

**Please confirm:**
- ✅ Mock-first approach confirmed
- ✅ Phase 2 scope = Intake + Mock ABHA + Merge + Triage Context
- ✅ Step 1: Create data models (`engine/models.py`)
- ✅ I'll present each step's detailed plan before implementation

**Or specify modifications to the plan above.**