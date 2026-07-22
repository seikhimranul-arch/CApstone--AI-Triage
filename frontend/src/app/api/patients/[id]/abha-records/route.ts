import { NextResponse } from 'next/server';

const MOCK_ABHA_RECORDS: Record<string, any> = {
  uncontrolled_dm_000: {
    vitals_history: [
      { date: "2025-12-15", bp_systolic: 148, bp_diastolic: 94, pulse: 88, temperature: 36.8, spo2: 97, weight: 78, height: 170, note: "Poor control, advise strict diet" },
      { date: "2025-09-10", bp_systolic: 142, bp_diastolic: 90, pulse: 84, temperature: 36.7, spo2: 98, weight: 79 },
      { date: "2025-06-05", bp_systolic: 138, bp_diastolic: 88, pulse: 82, temperature: 36.6, spo2: 98, weight: 80 }
    ],
    consultations: [
      { date: "2025-12-15", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "Fever and weakness for 3 days", examination: "BP 148/94,随机血糖 210 mg/dL, BMI 27", assessment: "Uncontrolled T2DM with acute infection", plan: "Start insulin, continue Metformin, review in 1 week", referral: null },
      { date: "2025-09-10", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "Routine follow-up", examination: "BP 142/90, HbA1c 9.2%,随机血糖 180 mg/dL", assessment: "Uncontrolled DM despite 2 oral agents", plan: "Add third agent or start insulin, dietary counseling", referral: null },
      { date: "2025-06-05", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "Foot pain and tingling", examination: "Reduced sensation bilateral feet, BP 138/88", assessment: "Diabetic neuropathy, uncontrolled HTN", plan: "Gabapentin 300mg TDS, strict BP control, foot care education", referral: null }
    ],
    lab_reports: [
      { date: "2025-12-15", test: "HbA1c", result: "9.2%", status: "HIGH", lab: "PHC Lab", reference: "<7.0%" },
      { date: "2025-12-15", test: "Random Blood Sugar", result: "210 mg/dL", status: "HIGH", lab: "PHC Lab", reference: "<140 mg/dL" },
      { date: "2025-12-15", test: "Serum Creatinine", result: "1.0 mg/dL", status: "NORMAL", lab: "PHC Lab", reference: "0.7-1.2 mg/dL" },
      { date: "2025-09-10", test: "Lipid Profile - Total Cholesterol", result: "248 mg/dL", status: "HIGH", lab: "PHC Lab", reference: "<200 mg/dL" },
      { date: "2025-09-10", test: "HbA1c", result: "8.8%", status: "HIGH", lab: "PHC Lab", reference: "<7.0%" }
    ],
    medications: [
      { name: "Metformin 500mg", dose: "500 mg", frequency: "BD", since: "2024-01", status: "active" },
      { name: "Glimepiride 2mg", dose: "2 mg", frequency: "OD", since: "2024-06", status: "active" },
      { name: "Amlodipine 5mg", dose: "5 mg", frequency: "OD", since: "2023-08", status: "active" },
      { name: "Gabapentin 300mg", dose: "300 mg", frequency: "TDS", since: "2025-06", status: "active" }
    ],
    allergies: ["No known drug allergies"],
    chronic_conditions: {
      diabetes: { since: "2018", status: "uncontrolled", last_hba1c: "9.2%" },
      hypertension: { since: "2020", status: "uncontrolled", last_bp: "148/94" }
    }
  },
  uncontrolled_dm_001: {
    vitals_history: [
      { date: "2025-11-20", bp_systolic: 162, bp_diastolic: 98, pulse: 92, temperature: 36.9, spo2: 96, weight: 82 },
      { date: "2025-08-15", bp_systolic: 158, bp_diastolic: 96, pulse: 90, temperature: 36.8, spo2: 97, weight: 83 }
    ],
    consultations: [
      { date: "2025-11-20", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "Numbness in feet worsening", examination: "Monofilament test reduced bilateral, BP 162/98, HbA1c 10.1%", assessment: "Uncontrolled DM with progressive neuropathy", plan: "Start insulin, neuropathy management, urgent BP control", referral: "Endocrinologist" }
    ],
    lab_reports: [
      { date: "2025-11-20", test: "HbA1c", result: "10.1%", status: "HIGH", lab: "PHC Lab", reference: "<7.0%" },
      { date: "2025-11-20", test: "Fasting Blood Sugar", result: "248 mg/dL", status: "HIGH", lab: "PHC Lab", reference: "<100 mg/dL" }
    ],
    medications: [
      { name: "Metformin 500mg", dose: "500 mg", frequency: "BD", since: "2023-01", status: "active" },
      { name: "Telmisartan 40mg", dose: "40 mg", frequency: "OD", since: "2023-06", status: "active" }
    ],
    allergies: ["Sulfa drugs"],
    chronic_conditions: {
      diabetes: { since: "2015", status: "uncontrolled", last_hba1c: "10.1%" },
      hypertension: { since: "2019", status: "uncontrolled", last_bp: "162/98" },
      diabetic_neuropathy: { since: "2024", status: "active" }
    }
  },
  missed_tb_fu_000: {
    vitals_history: [
      { date: "2025-11-01", bp_systolic: 118, bp_diastolic: 76, pulse: 98, temperature: 37.5, spo2: 94, weight: 52, note: "Evening fever, night sweats" },
      { date: "2025-09-15", bp_systolic: 116, bp_diastolic: 74, pulse: 94, temperature: 37.2, spo2: 95, weight: 54 },
      { date: "2025-08-01", bp_systolic: 114, bp_diastolic: 72, pulse: 88, temperature: 36.9, spo2: 96, weight: 56 }
    ],
    consultations: [
      { date: "2025-11-01", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "Persistent cough for 2 months, weight loss", examination: "BP 118/76, RR 24, SpO2 94%, BMI 17.3", assessment: "Pulmonary TB, possible MDR, malnourished", plan: "Sputum AFB, GeneXpert, nutritional rehab, DOT referral", referral: "District TB Centre" },
      { date: "2025-09-15", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "Follow-up on DOTS, missed doses", examination: "Temperature 37.2°C, weight 54kg, mild cough", assessment: "TB treatment default, 2 doses missed", plan: "Resume DOTS, counselor referral, home visit", referral: null }
    ],
    lab_reports: [
      { date: "2025-11-01", test: "Sputum AFB", result: "Positive (2+)", status: "HIGH", lab: "District Lab", reference: "Negative" },
      { date: "2025-11-01", test: "ALT", result: "120 U/L", status: "HIGH", lab: "PHC Lab", reference: "<40 U/L" },
      { date: "2025-11-01", test: "Hemoglobin", result: "9.8 g/dL", status: "LOW", lab: "PHC Lab", reference: "12-16 g/dL" }
    ],
    medications: [
      { name: "Isoniazid 300mg", dose: "300 mg", frequency: "OD", since: "2025-06", status: "active" },
      { name: "Rifampicin 450mg", dose: "450 mg", frequency: "OD", since: "2025-06", status: "active" },
      { name: "Pyrazinamide 1.5g", dose: "1500 mg", frequency: "OD", since: "2025-06", status: "active" }
    ],
    allergies: ["No known drug allergies"],
    chronic_conditions: {
      tuberculosis: { since: "2025-06", status: "active", regimen: "Category I DOTS" }
    }
  },
  missed_tb_fu_001: {
    vitals_history: [
      { date: "2025-10-15", bp_systolic: 110, bp_diastolic: 70, pulse: 102, temperature: 37.8, spo2: 93, weight: 46, note: "Retreatment category, previous default" }
    ],
    consultations: [
      { date: "2025-10-15", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "Cough relapse after completing treatment last year", examination: "Scrofula, BMI 16.2, SpO2 93%", assessment: "Retreatment TB, possible MDR", plan: "GeneXpert MTB/RIF, chest X-ray, nutritional support", referral: "DR-TB Centre" }
    ],
    lab_reports: [
      { date: "2025-10-15", test: "Sputum AFB", result: "Positive (3+)", status: "HIGH", lab: "District Lab", reference: "Negative" },
      { date: "2025-10-15", test: "GeneXpert", result: "MTB Detected, Rifampicin Sensitive", status: "INFO", lab: "Reference Lab", reference: "Not Detected" }
    ],
    medications: [
      { name: "Isoniazid 300mg", dose: "300 mg", frequency: "OD", since: "2025-10", status: "active" },
      { name: "Rifampicin 450mg", dose: "450 mg", frequency: "OD", since: "2025-10", status: "active" },
      { name: "Ethambutol 800mg", dose: "800 mg", frequency: "OD", since: "2025-10", status: "active" },
      { name: "Pyrazinamide 1.5g", dose: "1500 mg", frequency: "OD", since: "2025-10", status: "active" }
    ],
    allergies: ["No known drug allergies"],
    chronic_conditions: {
      tuberculosis: { since: "2024-01", status: "retreatment", previous_default: true }
    }
  },
  polypharmacy_elderly_000: {
    vitals_history: [
      { date: "2025-12-01", bp_systolic: 142, bp_diastolic: 88, pulse: 72, temperature: 36.8, spo2: 96, weight: 62, note: "Multiple medications, dizziness reported" }
    ],
    consultations: [
      { date: "2025-12-01", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "Dizziness and fatigue", examination: "BP 142/88, eGFR 38, on 7 medications including NSAID+ACEi+diuretic", assessment: "Triple whammy AKI risk, polypharmacy review needed", plan: "Stop Diclofenac, monitor creatinine in 1 week, medication reconciliation", referral: null }
    ],
    lab_reports: [
      { date: "2025-12-01", test: "eGFR", result: "38 mL/min", status: "HIGH", lab: "PHC Lab", reference: ">60 mL/min" },
      { date: "2025-12-01", test: "Serum Creatinine", result: "1.8 mg/dL", status: "HIGH", lab: "PHC Lab", reference: "0.7-1.2 mg/dL" },
      { date: "2025-12-01", test: "HbA1c", result: "7.8%", status: "BORDERLINE", lab: "PHC Lab", reference: "<7.0%" }
    ],
    medications: [
      { name: "Amlodipine 5mg", dose: "5 mg", frequency: "OD", since: "2020-01", status: "active" },
      { name: "Telmisartan 40mg", dose: "40 mg", frequency: "OD", since: "2021-06", status: "active" },
      { name: "Metformin 500mg", dose: "500 mg", frequency: "BD", since: "2019-03", status: "active" },
      { name: "Diclofenac 50mg", dose: "50 mg", frequency: "SOS", since: "2023-01", status: "active" },
      { name: "Atorvastatin 10mg", dose: "10 mg", frequency: "OD", since: "2022-06", status: "active" },
      { name: "Aspirin 75mg", dose: "75 mg", frequency: "OD", since: "2020-01", status: "active" },
      { name: "Omeprazole 20mg", dose: "20 mg", frequency: "OD", since: "2022-01", status: "active" }
    ],
    allergies: ["Penicillin — rash"],
    chronic_conditions: {
      diabetes: { since: "2015", status: "controlled", last_hba1c: "7.8%" },
      hypertension: { since: "2018", status: "uncontrolled", last_bp: "142/88" },
      chronic_kidney_disease: { since: "2023", status: "stage_3", egfr: 38 }
    }
  },
  polypharmacy_elderly_001: {
    vitals_history: [
      { date: "2025-11-25", bp_systolic: 138, bp_diastolic: 82, pulse: 76, temperature: 36.7, spo2: 95, weight: 70 }
    ],
    consultations: [
      { date: "2025-11-25", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "Excessive drowsiness, nearly fell at home", examination: "On 9 medications, two ACE inhibitors, benzodiazepine+opioid", assessment: "Polypharmacy with dangerous interactions", plan: "Deprescribing review, stop duplicate ACEi, taper benzo", referral: "Geriatrician" }
    ],
    lab_reports: [
      { date: "2025-11-25", test: "eGFR", result: "42 mL/min", status: "BORDERLINE", lab: "PHC Lab", reference: ">60 mL/min" },
      { date: "2025-11-25", test: "HbA1c", result: "8.1%", status: "HIGH", lab: "PHC Lab", reference: "<7.0%" }
    ],
    medications: [
      { name: "Enalapril 10mg", dose: "10 mg", frequency: "OD", since: "2018-01", status: "active" },
      { name: "Ramipril 5mg", dose: "5 mg", frequency: "OD", since: "2022-06", status: "active" },
      { name: "Metformin 500mg", dose: "500 mg", frequency: "BD", since: "2017-03", status: "active" },
      { name: "Salbutamol inhaler", dose: "2 puffs", frequency: "PRN", since: "2020-01", status: "active" },
      { name: "Tamsulosin 0.4mg", dose: "0.4 mg", frequency: "OD", since: "2021-01", status: "active" },
      { name: "Diazepam 2mg", dose: "2 mg", frequency: "HS", since: "2023-06", status: "active" },
      { name: "Tramadol 50mg", dose: "50 mg", frequency: "TDS PRN", since: "2024-01", status: "active" },
      { name: "Aspirin 75mg", dose: "75 mg", frequency: "OD", since: "2018-01", status: "active" },
      { name: "Atorvastatin 20mg", dose: "20 mg", frequency: "OD", since: "2020-06", status: "active" }
    ],
    allergies: ["ACE inhibitor — angioedema (mild)"],
    chronic_conditions: {
      diabetes: { since: "2014", status: "borderline", last_hba1c: "8.1%" },
      hypertension: { since: "2016", status: "controlled", last_bp: "138/82" },
      copd: { since: "2019", status: "mild" },
      bph: { since: "2020", status: "stable" }
    }
  },
  high_risk_anc_000: {
    vitals_history: [
      { date: "2025-12-10", bp_systolic: 155, bp_diastolic: 102, pulse: 88, temperature: 37.0, spo2: 98, weight: 68, note: "Proteinuria 2+, advise admission" },
      { date: "2025-11-26", bp_systolic: 140, bp_diastolic: 92, pulse: 84, temperature: 36.9, spo2: 99, weight: 67 },
      { date: "2025-11-12", bp_systolic: 132, bp_diastolic: 86, pulse: 82, temperature: 36.8, spo2: 99, weight: 66 }
    ],
    consultations: [
      { date: "2025-12-10", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "Headache and blurred vision at 28 weeks", examination: "BP 155/102, proteinuria 2+, deep tendon reflexes brisk", assessment: "Severe preeclampsia — urgent management needed", plan: "IV Labetalol, MgSO4 for seizure prophylaxis, plan for delivery", referral: "Emergency Referral — District Hospital" },
      { date: "2025-11-26", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "Routine ANC visit", examination: "BP 140/92, urine protein 1+, fetal movements good", assessment: "Gestational hypertension progressing", plan: "Increase Methyldopa, monitor BP twice daily, proteinuria check", referral: null }
    ],
    lab_reports: [
      { date: "2025-12-10", test: "Urine Protein", result: "2+", status: "HIGH", lab: "PHC Lab", reference: "Negative" },
      { date: "2025-12-10", test: "Serum Uric Acid", result: "7.2 mg/dL", status: "HIGH", lab: "PHC Lab", reference: "2.5-7.0 mg/dL" },
      { date: "2025-12-10", test: "Hemoglobin", result: "10.8 g/dL", status: "NORMAL", lab: "PHC Lab", reference: "11-14 g/dL" }
    ],
    medications: [
      { name: "Methyldopa 250mg", dose: "250 mg", frequency: "TDS", since: "2025-11", status: "active" },
      { name: "Calcium 500mg", dose: "500 mg", frequency: "BD", since: "2025-08", status: "active" },
      { name: "Iron Folate", dose: "1 tablet", frequency: "OD", since: "2025-06", status: "active" }
    ],
    allergies: ["No known drug allergies"],
    chronic_conditions: {
      pregnancy: { ga_weeks: 28, gravida: 2, para: 1, risk_level: "high", previous_preeclampsia: true }
    }
  },
  high_risk_anc_001: {
    vitals_history: [
      { date: "2025-12-08", bp_systolic: 128, bp_diastolic: 82, pulse: 86, temperature: 36.9, spo2: 99, weight: 74, note: "GDM well controlled on insulin" }
    ],
    consultations: [
      { date: "2025-12-08", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "34 week ANC — GDM follow-up", examination: "BP 128/82, BSL fasting 92, post-meal 138, AFI 24cm", assessment: "GDM controlled on insulin, LGA fetus, polyhydramnios", plan: "Continue insulin, plan delivery at 38 weeks, discuss CS", referral: null }
    ],
    lab_reports: [
      { date: "2025-12-08", test: "Fasting Blood Sugar", result: "92 mg/dL", status: "NORMAL", lab: "PHC Lab", reference: "70-100 mg/dL" },
      { date: "2025-12-08", test: "Post-meal Sugar", result: "138 mg/dL", status: "NORMAL", lab: "PHC Lab", reference: "<140 mg/dL" },
      { date: "2025-12-08", test: "AFI", result: "24 cm", status: "HIGH", lab: "Ultrasound", reference: "5-25 cm" }
    ],
    medications: [
      { name: "Insulin Regular", dose: "10U", frequency: "Before meals", since: "2025-10", status: "active" },
      { name: "Insulin NPH", dose: "14U", frequency: "At bedtime", since: "2025-10", status: "active" },
      { name: "Iron Folate", dose: "1 tablet", frequency: "OD", since: "2025-04", status: "active" }
    ],
    allergies: ["No known drug allergies"],
    chronic_conditions: {
      pregnancy: { ga_weeks: 34, gravida: 3, para: 2, risk_level: "high", gdm: true, insulin_dependent: true }
    }
  },
  faltering_growth_000: {
    vitals_history: [
      { date: "2025-12-05", temperature: 37.8, spo2: 96, pulse: 110, weight: 11.2, height: 92, note: "Chronic diarrhea, poor feeding" },
      { date: "2025-11-05", temperature: 37.2, spo2: 97, pulse: 100, weight: 11.5, height: 91 }
    ],
    consultations: [
      { date: "2025-12-05", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "Diarrhea for 3 weeks, not gaining weight", examination: "Weight 11.2kg (<3rd percentile), Hb 7.2, loose stools 5-6/day", assessment: "Severe acute malnutrition with chronic diarrhea, severe anemia", plan: "F-75 therapeutic milk, zinc, iron, stool culture, celiac screen", referral: "Nutrition Rehabilitation Centre" }
    ],
    lab_reports: [
      { date: "2025-12-05", test: "Hemoglobin", result: "7.2 g/dL", status: "LOW", lab: "PHC Lab", reference: "11-14 g/dL" },
      { date: "2025-12-05", test: "Serum Ferritin", result: "8 ng/mL", status: "LOW", lab: "PHC Lab", reference: "12-150 ng/mL" },
      { date: "2025-12-05", test: "Stool Routine", result: "Reduced fats, no parasites", status: "INFO", lab: "PHC Lab", reference: "Normal" }
    ],
    medications: [
      { name: "ORS", dose: "200mL", frequency: "After each loose stool", since: "2025-12", status: "active" },
      { name: "Zinc 20mg", dose: "20 mg", frequency: "OD x 14 days", since: "2025-12", status: "active" },
      { name: "Iron supplement", dose: "3 mg/kg/day", frequency: "OD", since: "2025-12", status: "active" },
      { name: "Vitamin A 200K IU", dose: "1 dose", frequency: "STAT", since: "2025-12", status: "active" }
    ],
    allergies: ["No known drug allergies"],
    chronic_conditions: {
      malnutrition: { since: "2025-06", status: "SAM", weight_for_age: "<3rd percentile" },
      chronic_diarrhea: { since: "2025-11", status: "active" }
    }
  },
  faltering_growth_001: {
    vitals_history: [
      { date: "2025-11-15", temperature: 37.4, spo2: 95, pulse: 120, weight: 6.8, height: 78, note: "Failure to thrive, immunization overdue" }
    ],
    consultations: [
      { date: "2025-11-15", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "Poor weight gain, recurrent cough", examination: "Weight 6.8kg at 24mo, 3 episodes of pneumonia this year", assessment: "Failure to thrive, possible immunodeficiency, malnutrition", plan: "Immunization catch-up, HIV test, nutritional rehab, TB screening", referral: "Pediatrician" }
    ],
    lab_reports: [
      { date: "2025-11-15", test: "Hemoglobin", result: "9.2 g/dL", status: "LOW", lab: "PHC Lab", reference: "11-14 g/dL" },
      { date: "2025-11-15", test: "Total Leukocyte Count", result: "12000/cmm", status: "HIGH", lab: "PHC Lab", reference: "5000-15000/cmm" }
    ],
    medications: [
      { name: "Vitamin A 100K IU", dose: "1 dose", frequency: "STAT", since: "2025-11", status: "active" },
      { name: "Iron supplement", dose: "3 mg/kg/day", frequency: "OD", since: "2025-11", status: "active" },
      { name: "Zinc 20mg", dose: "20 mg", frequency: "OD x 14 days", since: "2025-11", status: "active" }
    ],
    allergies: ["No known drug allergies"],
    chronic_conditions: {
      failure_to_thrive: { since: "2025-03", status: "active", birth_weight: "1.8kg" },
      recurrent_infections: { since: "2025-06", status: "active", episodes: 3 }
    }
  }
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const records = MOCK_ABHA_RECORDS[id];

  if (records) {
    return NextResponse.json(records);
  }

  // Generic fallback
  return NextResponse.json({
    vitals_history: [
      { date: "2025-12-01", temperature: 37.0, spo2: 97, pulse: 80, weight: 65, bp_systolic: 120, bp_diastolic: 80 }
    ],
    consultations: [
      { date: "2025-12-01", provider: "Dr. Priya, PHC Kukatpally", chief_complaint: "General consultation", examination: "Vitals stable", assessment: "No active concerns", plan: "Routine follow-up", referral: null }
    ],
    lab_reports: [
      { date: "2025-12-01", test: "Blood Sugar", result: "98 mg/dL", status: "NORMAL", lab: "PHC Lab", reference: "70-140 mg/dL" }
    ],
    medications: [],
    allergies: ["No known drug allergies"],
    chronic_conditions: {}
  });
}
