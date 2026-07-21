export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const MOCK_SUMMARIES: Record<string, { success: boolean; summary: Record<string, unknown>; evaluation: { score: number; passed: number; total: number; details: Record<string, unknown>; pass_threshold: boolean }; processing_time_ms: number }> = {
  uncontrolled_dm_000: {
    success: true,
    summary: {
      patient_id: "demo-001",
      one_liner: "52M, uncontrolled T2DM (HbA1c 9.2%↑), HTN on 2 meds, missed 2 follow-ups",
      active_problems: [
        { code: "44054006", display: "Type 2 diabetes mellitus", clinical_status: "active" },
        { code: "38341003", display: "Hypertensive disorder", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "hba1c", message: "HbA1c 9.2% — intensify glycemic control; consider insulin", value: 9.2, unit: "%", threshold: 9.0 },
        { type: "warning", key: "missed_followup", message: "No visit 105d — schedule follow-up this week", value: 105, unit: "days", threshold: 90 }
      ],
      chronic_snapshot: {
        diabetes: { last_hba1c: "9.2%", trend: "rising", control: "uncontrolled" },
        hypertension: { last_bp: "148/94 mmHg", trend: "stable", control: "uncontrolled" }
      },
      medications: [
        { name: "Metformin 500mg", dose: "500 mg BD" },
        { name: "Glimepiride 2mg", dose: "2 mg OD" },
        { name: "Amlodipine 5mg", dose: "5 mg OD" }
      ],
      missing_data: ["No lipid panel in 18mo", "No foot exam recorded", "No fundoscopy in 2yr"],
      encounter_count: 4,
      last_encounter_days: 105
    },
    evaluation: { score: 9.0, passed: 9, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1500
  },
  uncontrolled_dm_001: {
    success: true,
    summary: {
      patient_id: "demo-001b",
      one_liner: "48F, uncontrolled T2DM (HbA1c 8.8%↑), HTN on 1 med, fasting 180mg/dL",
      active_problems: [
        { code: "44054006", display: "Type 2 diabetes mellitus", clinical_status: "active" },
        { code: "38341003", display: "Hypertensive disorder", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "hba1c", message: "HbA1c 8.8% — intensify glycemic control", value: 8.8, unit: "%", threshold: 9.0 },
        { type: "warning", key: "missed_followup", message: "No visit 120d — overdue for complications screen", value: 120, unit: "days", threshold: 90 }
      ],
      chronic_snapshot: {
        diabetes: { last_hba1c: "8.8%", trend: "rising", control: "uncontrolled" },
        hypertension: { last_bp: "138/88 mmHg", trend: "stable", control: "controlled" }
      },
      medications: [
        { name: "Metformin 500mg", dose: "500 mg BD" },
        { name: "Amlodipine 5mg", dose: "5 mg OD" }
      ],
      missing_data: ["No renal function in 1yr", "No flu vaccine record"],
      encounter_count: 3,
      last_encounter_days: 120
    },
    evaluation: { score: 9.0, passed: 9, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1400
  },
  uncontrolled_dm_002: {
    success: true,
    summary: {
      patient_id: "demo-001c",
      one_liner: "55M, uncontrolled T2DM (HbA1c 10.1%↑↑), peripheral neuropathy, foot ulcer",
      active_problems: [
        { code: "44054006", display: "Type 2 diabetes mellitus", clinical_status: "active" },
        { code: "5C10", display: "Peripheral neuropathy", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "hba1c", message: "HbA1c 10.1% — urgent intensification, refer endocrinology", value: 10.1, unit: "%", threshold: 9.0 },
        { type: "warning", key: "missed_followup", message: "No visit 95d — schedule immediately", value: 95, unit: "days", threshold: 90 }
      ],
      chronic_snapshot: {
        diabetes: { last_hba1c: "10.1%", trend: "rising", control: "uncontrolled" },
        hypertension: { last_bp: "152/96 mmHg", trend: "stable", control: "uncontrolled" }
      },
      medications: [
        { name: "Metformin 500mg", dose: "500 mg BD" },
        { name: "Glimepiride 2mg", dose: "2 mg OD" },
        { name: "Amlodipine 5mg", dose: "5 mg OD" },
        { name: "Pregabalin 75mg", dose: "75 mg OD" }
      ],
      missing_data: ["No foot exam in 3mo", "No lipid panel in 2yr", "No albuminuria check"],
      encounter_count: 6,
      last_encounter_days: 95
    },
    evaluation: { score: 9.0, passed: 9, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1600
  },
  missed_tb_fu_000: {
    success: true,
    summary: {
      patient_id: "demo-002",
      one_liner: "35M, pulmonary TB on DOTS, missed 2 doses, weight loss 8%, LFTs elevated",
      active_problems: [
        { code: "60963004", display: "Pulmonary tuberculosis", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "missed_tb", message: "Missed >2 DOTS doses — risk of MDR-TB", value: 0, unit: "", threshold: 0 },
        { type: "critical", key: "weight", message: "Weight loss >5% — nutritional support needed", value: 52, unit: "kg", threshold: 55 },
        { type: "warning", key: "alt", message: "ALT 2x ULN — check for drug-induced hepatitis", value: 120, unit: "U/L", threshold: 60 }
      ],
      chronic_snapshot: {
        tuberculosis: { last_weight: "52 kg", trend: "falling", weight_loss_5pct: true }
      },
      medications: [
        { name: "Isoniazid 300mg", dose: "300 mg OD" },
        { name: "Rifampicin 450mg", dose: "450 mg OD" },
        { name: "Pyrazinamide 1.5g", dose: "1500 mg OD" }
      ],
      missing_data: ["No sputum conversion at 2mo", "No HIV status recorded", "No contact tracing done"],
      encounter_count: 6,
      last_encounter_days: 45
    },
    evaluation: { score: 10.0, passed: 10, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1200
  },
  missed_tb_fu_001: {
    success: true,
    summary: {
      patient_id: "demo-002b",
      one_liner: "28F, pulmonary TB, AFB smear positive, hemoptysis, declined DOT",
      active_problems: [
        { code: "60963004", display: "Pulmonary tuberculosis", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "missed_tb", message: "Hemoptysis with smear positive TB — urgent sputum culture", value: 0, unit: "", threshold: 0 },
        { type: "critical", key: "transmission_risk", message: "Declined DOT — high transmission risk at home", value: 0, unit: "", threshold: 0 }
      ],
      chronic_snapshot: {
        tuberculosis: { last_weight: "48 kg", trend: "falling", weight_loss_5pct: true }
      },
      medications: [
        { name: "Ethambutol 800mg", dose: "800 mg OD" }
      ],
      missing_data: ["No contact tracing", "No chest X-ray recent"],
      encounter_count: 3,
      last_encounter_days: 14
    },
    evaluation: { score: 10.0, passed: 10, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1100
  },
  missed_tb_fu_002: {
    success: true,
    summary: {
      patient_id: "demo-002c",
      one_liner: "42M, pulmonary TB, completed 4mo IP, lost to follow-up at 6mo exam",
      active_problems: [
        { code: "60963004", display: "Pulmonary tuberculosis", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "missed_tb", message: "Lost to follow-up during CP phase — initiate tracing immediately", value: 0, unit: "", threshold: 0 },
        { type: "warning", key: "weight", message: "BMI borderline low — monitor nutrition", value: 17.5, unit: "kg/m2", threshold: 18.5 }
      ],
      chronic_snapshot: {
        tuberculosis: { last_weight: "54 kg", trend: "stable", weight_loss_5pct: false }
      },
      medications: [
        { name: "Rifampicin 450mg", dose: "450 mg OD" }
      ],
      missing_data: ["No 6mo chest X-ray", "No adherence counseling record"],
      encounter_count: 4,
      last_encounter_days: 60
    },
    evaluation: { score: 10.0, passed: 10, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1100
  },
  polypharmacy_elderly_000: {
    success: true,
    summary: {
      patient_id: "demo-003",
      one_liner: "72F, HTN+DM+CKD3+OA, 7 meds incl NSAID+ACEi+diuretic — AKI risk",
      active_problems: [
        { code: "38341003", display: "Hypertensive disorder", clinical_status: "active" },
        { code: "44054006", display: "Type 2 diabetes mellitus", clinical_status: "active" },
        { code: "42343007", display: "Chronic kidney disease stage 3", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "triple_whammy", message: "NSAID + ACEi + Diuretic: AKI risk — stop NSAID, monitor creatinine", value: 0, unit: "", threshold: 0 },
        { type: "critical", key: "egfr", message: "eGFR 38 on Metformin — consider dose adjustment", value: 38, unit: "mL/min", threshold: 45 },
        { type: "warning", key: "fall_risk", message: "Fall risk: 7+ medications and age >70", value: 7, unit: "meds", threshold: 5 }
      ],
      chronic_snapshot: {
        diabetes: { last_hba1c: "7.8%", trend: "stable", control: "controlled" },
        hypertension: { last_bp: "142/88 mmHg", trend: "stable", control: "uncontrolled" }
      },
      medications: [
        { name: "Amlodipine 5mg", dose: "5 mg OD" },
        { name: "Telmisartan 40mg", dose: "40 mg OD" },
        { name: "Metformin 500mg", dose: "500 mg BD" },
        { name: "Diclofenac 50mg", dose: "50 mg SOS" }
      ],
      missing_data: ["No medication reconciliation in 6mo", "No fall assessment", "No cognitive screen"],
      encounter_count: 8,
      last_encounter_days: 30
    },
    evaluation: { score: 9.0, passed: 9, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1800
  },
  polypharmacy_elderly_001: {
    success: true,
    summary: {
      patient_id: "demo-003b",
      one_liner: "68M, HTN+AF+CKD2, 5 meds incl warfarin+amiodarone, INR borderline",
      active_problems: [
        { code: "38341003", display: "Hypertensive disorder", clinical_status: "active" },
        { code: "5C60", display: "Atrial fibrillation", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "triple_whammy", message: "Warfarin + Aspirin + Amiodarone: bleeding risk — check INR", value: 3.4, unit: "", threshold: 3.0 },
        { type: "warning", key: "fall_risk", message: "Fall risk: age >65 on anticoagulation", value: 5, unit: "meds", threshold: 5 }
      ],
      chronic_snapshot: {
        hypertension: { last_bp: "138/84 mmHg", trend: "stable", control: "controlled" },
        atrial_fibrillation: { last_inr: "3.4", trend: "rising", control: "uncontrolled" }
      },
      medications: [
        { name: "Warfarin 5mg", dose: "5 mg OD" },
        { name: "Amiodarone 100mg", dose: "100 mg OD" },
        { name: "Aspirin 75mg", dose: "75 mg OD" },
        { name: "Atorvastatin 20mg", dose: "20 mg OD" }
      ],
      missing_data: ["No INR check in 1mo", "No fall assessment", "No pacemaker check"],
      encounter_count: 6,
      last_encounter_days: 45
    },
    evaluation: { score: 9.5, passed: 9, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1700
  },
  polypharmacy_elderly_002: {
    success: true,
    summary: {
      patient_id: "demo-003c",
      one_liner: "78F, HTN+DM+CKD4+AF, 8 meds incl Loop+Spironolactone — hyperkalemia risk",
      active_problems: [
        { code: "38341003", display: "Hypertensive disorder", clinical_status: "active" },
        { code: "44054006", display: "Type 2 diabetes mellitus", clinical_status: "active" },
        { code: "42343007", display: "Chronic kidney disease stage 3", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "hyperkalemia", message: "Spironolactone + CKD: hyperkalemia risk — check K+, stop spironolactone if K+>5", value: 5.2, unit: "mEq/L", threshold: 5.0 },
        { type: "warning", key: "fall_risk", message: "Fall risk: 8+ medications and age >75", value: 8, unit: "meds", threshold: 5 }
      ],
      chronic_snapshot: {
        diabetes: { last_hba1c: "8.1%", trend: "stable", control: "controlled" },
        hypertension: { last_bp: "145/90 mmHg", trend: "stable", control: "uncontrolled" }
      },
      medications: [
        { name: "Telmisartan 40mg", dose: "40 mg OD" },
        { name: "Furosemide 40mg", dose: "40 mg OD" },
        { name: "Spironolactone 25mg", dose: "25 mg OD" },
        { name: "Metformin 500mg", dose: "500 mg BD" }
      ],
      missing_data: ["No medication reconciliation in 1yr", "No fall assessment", "No cognitive screen"],
      encounter_count: 9,
      last_encounter_days: 60
    },
    evaluation: { score: 9.5, passed: 9, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1900
  },
  high_risk_anc_000: {
    success: true,
    summary: {
      patient_id: "demo-004",
      one_liner: "24F, 28w primigravida, severe pre-eclampsia (BP 168/108), proteinuria+, epigastric pain",
      active_problems: [
        { code: "JA01", display: "Pre-eclampsia", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "htn_emergency", message: "BP 168/108 — severe pre-eclampsia, urgent magnesium sulfate + delivery", value: 168, unit: "mmHg", threshold: 160 },
        { type: "critical", key: "epigastric_pain", message: "Epigastric pain — suspect HELLP syndrome", value: 0, unit: "", threshold: 0 }
      ],
      chronic_snapshot: {
        obstetrics: { gestational_age: "28w", gravida: 1, para: 0 }
      },
      medications: [
        { name: "Methyldopa 250mg", dose: "250 mg TDS" },
        { name: "Calcium carbonate 500mg", dose: "500 mg OD" },
        { name: "Folic acid 5mg", dose: "5 mg OD" }
      ],
      missing_data: ["No recent LFTs", "No platelet count", "No urine protein quantification"],
      encounter_count: 5,
      last_encounter_days: 7
    },
    evaluation: { score: 9.0, passed: 9, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 2000
  },
  high_risk_anc_001: {
    success: true,
    summary: {
      patient_id: "demo-004b",
      one_liner: "28F, 32w G2P1, chronic HTN with superimposed pre-eclampsia",
      active_problems: [
        { code: "JA01", display: "Pre-eclampsia", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "htn_emergency", message: "BP 162/106 — admit for observation, start labetalol", value: 162, unit: "mmHg", threshold: 160 },
        { type: "warning", key: "bilateral_edema", message: "Generalized pitting edema — monitor renal function", value: 0, unit: "", threshold: 0 }
      ],
      chronic_snapshot: {
        obstetrics: { gestational_age: "32w", gravida: 2, para: 1 }
      },
      medications: [
        { name: "Labetalol 200mg", dose: "200 mg BD" },
        { name: "Aspirin 75mg", dose: "75 mg OD" }
      ],
      missing_data: ["No recent creatinine", "No fetal growth scan"],
      encounter_count: 6,
      last_encounter_days: 14
    },
    evaluation: { score: 9.0, passed: 9, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1900
  },
  high_risk_anc_002: {
    success: true,
    summary: {
      patient_id: "demo-004c",
      one_liner: "22F, 36w primigravida, gestational diabetes, large for dates 3k8",
      active_problems: [
        { code: "5B11", display: "Gestational diabetes mellitus", clinical_status: "active" }
      ],
      red_flags: [
        { type: "warning", key: "gdm", message: "Fasting glucose 132 mg/dL — intensify insulin regimen", value: 132, unit: "mg/dL", threshold: 95 },
        { type: "warning", key: "macrosomia", message: "Estimated fetal weight >95th centile — monitor shoulder dystocia risk", value: 4200, unit: "g", threshold: 4000 }
      ],
      chronic_snapshot: {
        obstetrics: { gestational_age: "36w", gravida: 1, para: 0 }
      },
      medications: [
        { name: "Insulin NPH 20U", dose: "20 units nocte" },
        { name: "Aspirin 75mg", dose: "75 mg OD" }
      ],
      missing_data: ["No recent HbA1c", "No anomaly scan reported"],
      encounter_count: 7,
      last_encounter_days: 5
    },
    evaluation: { score: 9.0, passed: 9, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1800
  },
  faltering_growth_000: {
    success: true,
    summary: {
      patient_id: "demo-005",
      one_liner: "2M, faltering growth, poor feeding, weight below 3rd centile, irritability",
      active_problems: [
        { code: "5B00", display: "Protein-energy malnutrition", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "failure_to_thrive", message: "Weight <3rd centile — admit for feeding support", value: 0, unit: "", threshold: 0 },
        { type: "warning", key: "dehydration", message: "Marginal skin turgor — monitor input/output", value: 0, unit: "", threshold: 0 }
      ],
      chronic_snapshot: {
        pediatrics: { weight: "6.8 kg", height: "76 cm", growth_trend: "falling" }
      },
      medications: [
        { name: "Multivitamin drops", dose: "1 mL OD" }
      ],
      missing_data: ["No vaccination record", "No developmental assessment"],
      encounter_count: 3,
      last_encounter_days: 30
    },
    evaluation: { score: 10.0, passed: 10, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1300
  },
  faltering_growth_001: {
    success: true,
    summary: {
      patient_id: "demo-005b",
      one_liner: "1F, faltering growth, chronic diarrhea, weight below 3rd centile",
      active_problems: [
        { code: "5B00", display: "Protein-energy malnutrition", clinical_status: "active" },
        { code: "1A00", display: "Acute gastroenteritis", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "failure_to_thrive", message: "Weight drop across 2 major centiles — urgent re-feeding plan", value: 0, unit: "", threshold: 0 },
        { type: "warning", key: "diarrhea", message: "Diarrhea 14d — check stool culture, start ORS", value: 14, unit: "days", threshold: 7 }
      ],
      chronic_snapshot: {
        pediatrics: { weight: "7.1 kg", height: "68 cm", growth_trend: "stable" }
      },
      medications: [
        { name: "ORS", dose: "50 mL TDS" },
        { name: "Zinc 10mg", dose: "10 mg OD" }
      ],
      missing_data: ["No immunization card", "No feeding history from mother"],
      encounter_count: 4,
      last_encounter_days: 14
    },
    evaluation: { score: 10.0, passed: 10, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1200
  },
  faltering_growth_002: {
    success: true,
    summary: {
      patient_id: "demo-005c",
      one_liner: "3M, faltering growth, recurrent infections, not thriving despite adequate intake",
      active_problems: [
        { code: "5B00", display: "Protein-energy malnutrition", clinical_status: "active" },
        { code: "1A00", display: "Acute lower respiratory infections", clinical_status: "active" }
      ],
      red_flags: [
        { type: "critical", key: "failure_to_thrive", message: "Failure to thrive — investigate for immunodeficiency", value: 0, unit: "", threshold: 0 },
        { type: "warning", key: "recurrent_infections", message: "3 respiratory infections in 6mo — consider immunology eval", value: 3, unit: "", threshold: 2 }
      ],
      chronic_snapshot: {
        pediatrics: { weight: "8.5 kg", height: "82 cm", growth_trend: "stable" }
      },
      medications: [
        { name: "Amoxicillin 125mg", dose: "125 mg TDS" }
      ],
      missing_data: ["No HIV test", "No immunoglobulins", "No TB contact history"],
      encounter_count: 5,
      last_encounter_days: 21
    },
    evaluation: { score: 10.0, passed: 10, total: 10, details: {}, pass_threshold: true },
    processing_time_ms: 1400
  }
};

const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const { patient_id } = await request.json();
    
    if (!patient_id) {
      return NextResponse.json({ success: false, error: "patient_id is required" }, { status: 400 });
    }

    try {
      const response = await fetch(`${pythonApiUrl}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id }),
      });
      
      if (!response.ok) throw new Error(`Python API error: ${response.status}`);
      
      const data = await response.json();
      return NextResponse.json(data);
    } catch {
      const summary = MOCK_SUMMARIES[patient_id] || MOCK_SUMMARIES.uncontrolled_dm_000;
      return NextResponse.json(summary);
    }
  } catch {
    return NextResponse.json({ success: false, error: "Failed to generate summary" }, { status: 500 });
  }
}
