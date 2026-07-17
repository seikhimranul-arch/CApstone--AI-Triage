# Market Requirements Document (MRD)
## SehatAI — ABHA-Integrated Clinical Decision Support for PHCs

---

### 1. Market Opportunity

**Total Addressable Market (TAM):**
- 25,000+ Primary Health Centers (PHCs) in India
- 40,000+ Medical Officers (MOs) conducting 150M+ consultations/year
- Ayushman Bharat Digital Mission (ABDM) creating 500M+ ABHA accounts

**Serviceable Addressable Market (SAM):**
- 8,000 PHCs with functional ABHA integration (current)
- 15,000 MOs with digital literacy for AI tools
- ₹500Cr+ annual potential (₹3L/MO/year productivity gain)

**Serviceable Obtainable Market (SOM - Year 1):**
- 50 pilot PHCs across 3 states
- 200 MOs using daily
- ₹1Cr ARR target

---

### 2. Target Customer Segments

| Segment | Size | Pain Points | Willingness to Adopt |
|---------|------|-------------|---------------------|
| **Rural PHC MOs** (Primary) | 18,000 | 80 pts/day, paper records, no history view, missed red flags | High - offline fallback critical |
| **Urban PHC MOs** (Secondary) | 7,000 | Fragmented digital records, time pressure, compliance needs | High - timeline view valuable |
| **CHC/Block Specialists** (Tertiary) | 3,000 | Referral quality, pre-consult prep | Medium - integration needed |
| **State Health IT Teams** (Buyers) | 36 | ABDM compliance, outcome tracking | High - dashboard/metrics |

---

### 3. Market Pain Points (Validated)

| Pain Point | Evidence | Impact |
|------------|----------|--------|
| **No pre-consult synthesis** | MOs spend 2-3 min/patient reading raw records | 30% consultation time wasted |
| **Missed critical trends** | HbA1c rising over 3 visits undetected | 15% avoidable complications |
| **Medication interaction blindness** | 7+ meds elderly - no automated checks | 8% adverse drug events |
| **Follow-up gaps** | >90 days no visit - no alerts | 25% chronic patients lost to follow-up |
| **ABHA records exist but unusable** | FHIR bundles fragmented across encounters | Digital investment not yielding ROI |

---

### 4. Competitive Landscape

| Solution | Strengths | Gaps | Our Differentiator |
|----------|-----------|------|-------------------|
| **eSanjeevani (Govt)** | Telemedicine, ABDM integrated | No AI triage, no clinical synthesis | Pre-consult AI summary |
| **Practo/1mg (Private)** | Good UX, patient-facing | Not PHC-focused, no offline | Offline-first, clinician-centric |
| **EMR vendors (Tally, etc.)** | Record keeping | No clinical intelligence | Deterministic red flags + LLM synthesis |
| **Research pilots (AIIMS, etc.)** | Clinical validity | Not production-ready, no scale | Production code, eval framework |

**Blue Ocean:** First AI triage designed for **Indian PHC workflow** — offline-capable, FHIR-native, clinician-validated.

---

### 5. Regulatory & Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| **ABDM/FHIR R4 compliance** | ✅ | Synthetic bundles validate parser |
| **Clinical Decision Support (CDS) guidelines** | ⚠️ | Need ICMR/CDSCO review for clinical use |
| **Data Privacy (DPDP Act 2023)** | ✅ | Zero PHI egress, synthetic only, local LLM option |
| **Medical Device Rules (if classified)** | TBD | Currently "clinical decision support software" - may need registration |

---

### 6. Go-to-Market Strategy

**Phase 1 (Months 1-3): Pilot**
- 3 states (Maharashtra, Tamil Nadu, Kerala)
- 50 PHCs, 200 MOs
- KPI: 90% adoption, 40% time reduction, 8/10 eval score

**Phase 2 (Months 4-9): Scale**
- 10 states, 500 PHCs
- Integration with state HMIS/ABDM
- KPI: 70% sustained use, outcome metrics

**Phase 3 (Year 2): Platform**
- National rollout via NHA
- Multi-language (Hindi, Tamil, Malayalam, etc.)
- Specialist referral integration

---

### 7. Pricing Model

| Tier | Target | Model | Price (Indicative) |
|------|--------|-------|-------------------|
| **Pilot** | State Govts | Grant/CSR funded | Free |
| **State License** | Health Depts | Annual SaaS | ₹50L-2Cr/state/year |
| **National** | NHA/ABDM | Platform fee | Revenue share / per-consultation |

---

### 8. Success Metrics (KPIs)

| Metric | Baseline | Target (6mo) | Target (12mo) |
|--------|----------|--------------|---------------|
| **Consultation time reduction** | 5 min | 3 min (40%) | 2.5 min (50%) |
| **Red flag detection rate** | 60% | 90% | 95% |
| **MO daily active use** | 0% | 70% | 85% |
| **Patients/doctor/day** | 80 | 110 | 130 |
| **Eval score (avg)** | N/A | 8.5/10 | 9.0/10 |
| **Offline fallback usage** | N/A | <20% | <10% |

---

### 9. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Low clinician adoption** | Medium | High | Co-design with MOs, 3 UI variants, offline mode |
| **ABDM API changes** | Medium | High | Abstract FHIR parser, versioned contracts |
| **Clinical liability** | Low | Critical | Disclaimer, human-in-loop, eval transparency |
| **Funding gap** | Medium | High | Grant pipeline (BIRAC, Gates, state health missions) |
| **Technical debt** | Low | Medium | Karpathy principles, eval-driven development |

---

### 10. Appendix: User Research Summary

**Interviews conducted:** 12 MOs (6 rural, 6 urban), 3 state IT leads, 2 ABDM consultants

**Key Quotes:**
> *"I have 3 minutes per patient. If AI gives me the 3 things I must check, I'll use it daily."* — Dr. K, Rural PHC, Maharashtra

> *"ABHA records exist but I never open them. Too many clicks, no summary."* — Dr. S, Urban PHC, Tamil Nadu

> *"If it works offline in my PHC with patchy internet, it's a game changer."* — Block MO, Kerala

---

*Document Version: 1.0 | Date: 2026-07-17 | Status: Draft for Review*