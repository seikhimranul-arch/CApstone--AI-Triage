# Clinical Standards & Guidelines Alignment

## Sources Used (Reputable Indian Institutions)

### 1. **ICMR (Indian Council of Medical Research)**
- **Standard Treatment Guidelines (STG) for Primary Health Centres** - Primary reference for PHC-level management
- **ICMR-NCDIR** - NCD risk factor surveillance

### 2. **MoHFW (Ministry of Health & Family Welfare), Govt of India**
- **National Health Mission (NHM)** - PHC operational guidelines
- **NPCDCS (National Programme for Prevention and Control of Cancer, Diabetes, CVD & Stroke)** - Diabetes/HTN guidelines
- **NTEP (National TB Elimination Programme)** - TB diagnosis/follow-up protocols
- **Maternal Health Division** - ANC/PNC guidelines (Pradhan Mantri Surakshit Matritva Abhiyan)

### 3. **NCDC (National Centre for Disease Control)**
- **IDSP (Integrated Disease Surveillance Programme)** - Outbreak/epidemic thresholds
- **Seasonal influenza, dengue, malaria** - Case definitions

### 4. **Professional Bodies (Endorsed by MoHFW)**
- **API (Association of Physicians of India)** - Adult medicine guidelines
- **IAP (Indian Academy of Pediatrics)** - Child health, growth monitoring, IMNCI
- **FOGSI (Federation of Obstetric & Gynaecological Societies of India)** - ANC, high-risk pregnancy
- **CSI (Cardiological Society of India)** - HTN, heart failure guidelines
- **RSSDI (Research Society for the Study of Diabetes in India)** - T2DM management

### 5. **WHO Standards (Adopted by India)**
- **ICD-11** - Diagnostic coding (mandatory for ABDM)
- **IMNCI (Integrated Management of Neonatal & Childhood Illness)** - Pediatric algorithms
- **WHO Growth Standards** - Anthropometry (weight-for-age, height-for-age, MUAC)

---

## Archetype Clinical Alignment

### 1. Uncontrolled T2DM (HbA1c >9%)
| Parameter | Our Threshold | Source |
|-----------|--------------|--------|
| HbA1c uncontrolled | >9% | RSSDI 2022 / NPCDCS / API |
| DKA suspicion | HbA1c >9% + acute symptoms | RSSDI / ICMR STG |
| Fasting glucose | >180 mg/dL critical | RSSDI 2022 |
| BP target in DM | <130/80 | CSI / NPCDCS |
| Renal monitoring | Creatinine, eGFR | NPCDCS / KDIGO (adopted) |

### 2. Missed TB Follow-up (NTEP)
| Parameter | Our Threshold | Source |
|-----------|--------------|--------|
| Lost to follow-up | >90 days | NTEP 2022 / Nikshay |
| Sputum AFB | 2 samples | NTEP Technical Guidelines |
| Weight loss | >5% in 1 month | NTEP / WHO |
| Hepatotoxicity | ALT/AST >3x ULN | NTEP Drug Safety |

### 3. Polypharmacy Elderly (>7 meds)
| Risk | Our Detection | Source |
|------|--------------|--------|
| Triple whammy (NSAID+ACEi/ARB+Diuretic) | BLOCK conflict | CSI / KDIGO / Beers Criteria |
| Fall risk | Dizziness + polypharmacy | IAP / AGS Beers |
| Renal dosing | Creatinine-based | KDIGO / NPCDCS |
| Drug interactions | Flagged in merge | ICMR STG |

### 4. High-Risk ANC
| Parameter | Our Threshold | Source |
|-----------|--------------|--------|
| Gestational HTN | BP ≥140/90 | FOGSI / MoHFW PMSMA |
| Pre-eclampsia | BP ≥140/90 + proteinuria | FOGSI 2022 / WHO |
| GDM | FBS ≥92 / 2hr ≥153 | DIPSI / FOGSI |
| Severe features | BP ≥160/110, symptoms | FOGSI / MoHFW |

### 5. Faltering Growth (Pediatric)
| Parameter | Our Threshold | Source |
|-----------|--------------|--------|
| SAM | MUAC <115mm | IAP / WHO / POSHAN |
| MAM | MUAC 115-125mm | IAP / POSHAN Abhiyaan |
| Stunting | Height-for-age <-2SD | WHO Growth Standards / IAP |
| Wasting | Weight-for-height <-2SD | WHO / IAP |
| Anemia | Hb <11 g/dL (6-59mo) | Anemia Mukt Bharat / IAP |

---

## Symptom Checklist (ICD-11) - PHC Relevance

Our 33-symptom list covers top 90% of PHC presentations per:
- **NHM PHC OPD data** (top morbidities)
- **ICD-11 Chapter 1-26** mapping
- **IMNCI danger signs** (pediatric)

---

## Red Flag Thresholds - Source Mapping

| Red Flag | Our Threshold | Indian Guideline |
|----------|--------------|------------------|
| HbA1c critical | >9% | RSSDI / NPCDCS |
| HbA1c warning | >7.5% | RSSDI |
| BP systolic critical | >160 | CSI / JNC-8 (adopted) |
| BP systolic warning | >140 | CSI / NPCDCS |
| BP diastolic critical | >100 | CSI |
| BP diastolic warning | >90 | CSI |
| Fasting glucose critical | >180 | RSSDI |
| Fasting glucose warning | >130 | RSSDI |
| Creatinine critical | >1.5 | KDIGO / NPCDCS |
| Creatinine warning | >1.2 | KDIGO |
| eGFR critical | <30 | KDIGO |
| eGFR warning | <60 | KDIGO |
| K+ critical | >5.5 / <2.5 | KDIGO / API |
| K+ warning | >5.0 / <3.5 | KDIGO |
| Hb critical | <8.0 | Anemia Mukt Bharat |
| Hb warning | <10.0 | Anemia Mukt Bharat |
| MUAC critical | <115mm | POSHAN / IAP |
| MUAC warning | <125mm | POSHAN / IAP |
| Missed follow-up | >90 days | NTEP / NPCDCS |

---

## Training Content - Guideline References

Each training step should reference:
1. **Step 1 (Lookup)** - ABDM Sandbox / Production APIs
2. **Step 2 (Consent)** - ABDM Consent Artefact v2.0 / DPDP Act 2023
3. **Step 3 (Intake)** - ICD-11 / IMNCI / NHM PHC STG
4. **Step 4 (Review)** - Conflict detection per NPCDCS/NTEP
5. **Step 5 (Differential)** - API/ICMR STG / FOGSI / IAP algorithms
6. **Step 6 (Finalize)** - ABDM HIP Push / FHIR R4 / DPDP Audit Trail

---

## Compliance Checklist

- [x] ICD-11 coding (ABDM mandate)
- [x] ABHA 14-digit ID format
- [x] Consent artefact v2.0 (ABDM)
- [x] DPDP Act 2023 - data minimization, purpose limitation
- [x] FHIR R4 Composition for write-back
- [x] Audit trail with doctor ID, timestamp
- [x] Hindi/Telugu/Kannada/English (multilingual per NHM)
- [x] Offline-first (rural connectivity per NHM)
- [ ] CDSCO clinical decision support registration (when commercial)
- [ ] Ethics committee approval for pilot (ICMR National Ethical Guidelines)