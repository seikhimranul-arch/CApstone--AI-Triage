export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

function getArchetypeFromAbha(abha_id: string): string {
  const code = abha_id.length >= 6 ? abha_id.slice(3, 6) : "001";
  const map: Record<string, string> = {
    "001": "uncontrolled_dm",
    "002": "missed_tb_fu",
    "003": "polypharmacy_elderly",
    "004": "high_risk_anc",
    "005": "faltering_growth"
  };
  return map[code] || "uncontrolled_dm";
}

const HISTORY_TEMPLATES: Record<string, any> = {
  uncontrolled_dm: {
    conditions: [
      { code: "44054006", display: "Type 2 diabetes mellitus", status: "active" },
      { code: "38341003", display: "Hypertensive disorder", status: "active" }
    ],
    medications: [
      { rxnormCode: "860975", name: "Metformin", dose: "500 mg BD" },
      { rxnormCode: "314154", name: "Glimepiride", dose: "2 mg OD" },
      { rxnormCode: "17767", name: "Amlodipine", dose: "5 mg OD" }
    ],
    vitals: { bp_systolic: 148, bp_diastolic: 94, pulse: 88, weight: 78, height: 170 }
  },
  missed_tb_fu: {
    conditions: [
      { code: "60963004", display: "Pulmonary tuberculosis", status: "active" }
    ],
    medications: [
      { rxnormCode: "876548", name: "Isoniazid", dose: "300 mg OD" },
      { rxnormCode: "876557", name: "Rifampicin", dose: "450 mg OD" }
    ],
    vitals: { bp_systolic: 118, bp_diastolic: 76, pulse: 98, weight: 52, height: 165 }
  },
  polypharmacy_elderly: {
    conditions: [
      { code: "44054006", display: "Type 2 diabetes mellitus", status: "active" },
      { code: "38341003", display: "Hypertensive disorder", status: "active" },
      { code: "42343007", display: "Chronic kidney disease stage 3", status: "active" }
    ],
    medications: [
      { rxnormCode: "17767", name: "Amlodipine", dose: "5 mg OD" },
      { rxnormCode: "201994", name: "Telmisartan", dose: "40 mg OD" },
      { rxnormCode: "199619", name: "Metformin", dose: "500 mg BD" }
    ],
    vitals: { bp_systolic: 142, bp_diastolic: 88, pulse: 76, weight: 65, height: 162 }
  },
  high_risk_anc: {
    conditions: [
      { code: "JA01", display: "Pre-eclampsia", status: "active" }
    ],
    medications: [
      { rxnormCode: "876654", name: "Methyldopa", dose: "250 mg TDS" },
      { rxnormCode: "876680", name: "Iron supplement", dose: "1 tab OD" }
    ],
    vitals: { bp_systolic: 162, bp_diastolic: 106, pulse: 88, weight: 68, height: 155 }
  },
  faltering_growth: {
    conditions: [
      { code: "5B00", display: "Protein-energy malnutrition", status: "active" }
    ],
    medications: [
      { rxnormCode: "876700", name: "Multivitamin drops", dose: "1 mL OD" }
    ],
    vitals: { bp_systolic: 90, bp_diastolic: 55, pulse: 128, weight: 6.8, height: 76 }
  }
};

const DIFFERENTIAL_TEMPLATES: Record<string, {
  differentials: Array<{ icd11: string; display: string; probability: "high" | "moderate" | "low"; urgency: "emergent" | "urgent" | "routine"; reasoning: string; supporting_evidence: string[]; contradicting_evidence: string[] }>;
  red_flags: Array<{ type: string; key: string; message: string; value?: number; unit?: string; threshold?: number }>;
  suggested_actions: Array<{ type: "question" | "test" | "referral"; priority: "high" | "medium" | "low"; description: string; rationale: string; icd11_link: string[] }>;
  clinical_summary: string;
}> = {
  uncontrolled_dm: {
    differentials: [
      { icd11: "5A12", display: "Diabetic ketoacidosis", probability: "high", urgency: "emergent", reasoning: "Elevated HbA1c with hyperglycemia suggests uncontrolled diabetes, risk of DKA.", supporting_evidence: ["HbA1c >9%", "Fasting glucose elevated", "No recent insulin adjustment"], contradicting_evidence: ["No bicarbonate level available", "Anion gap unknown"] },
      { icd11: "5A13", display: "Hyperosmolar hyperglycemic state", probability: "moderate", urgency: "urgent", reasoning: "Severe hyperglycemia with dehydration risk.", supporting_evidence: ["High glucose", "Dehydration noted"], contradicting_evidence: ["Mental status unclear"] },
      { icd11: "BA10", display: "Acute coronary syndrome", probability: "low", urgency: "urgent", reasoning: "Chest pain with diabetes and HTN increases CAD risk.", supporting_evidence: ["HTN history", "DM risk factor"], contradicting_evidence: ["No ECG available", "No troponin"] },
      { icd11: "CB00", display: "Pulmonary edema", probability: "low", urgency: "emergent", reasoning: "Shortness of breath with hypertension could indicate heart failure.", supporting_evidence: ["SOB", "HTN"], contradicting_evidence: ["No chest X-ray", "No JVP assessment"] }
    ],
    red_flags: [
      { type: "critical", key: "hba1c", message: "HbA1c >9% — intensify glycemic control, consider insulin", value: 9.2, unit: "%", threshold: 9.0 },
      { type: "warning", key: "missed_followup", message: "Follow-up overdue >90d", value: 105, unit: "days", threshold: 90 }
    ],
    suggested_actions: [
      { type: "test", priority: "high", description: "Order HbA1c, FBS, PPBS, serum ketones", rationale: "Assess glycemic control and DKA risk", icd11_link: ["5A12"] },
      { type: "test", priority: "high", description: "Order lipid panel, renal function, urine albumin", rationale: "Screen for chronic complications", icd11_link: ["5A22"] },
      { type: "referral", priority: "medium", description: "Refer to endocrinology", rationale: "Intensify diabetes management", icd11_link: ["5A12"] }
    ],
    clinical_summary: "Patient presents with uncontrolled type 2 diabetes mellitus with elevated HbA1c and hypertensive disorder. Key concerns include risk of acute decompensation (DKA/HHS) and chronic microvascular complications. Recommend immediate intensification of glycemic control and comprehensive complication screening."
  },
  missed_tb_fu: {
    differentials: [
      { icd11: "1B30", display: "Pulmonary tuberculosis", probability: "high", urgency: "urgent", reasoning: "Cough, weight loss, and hemoptysis in context of missed TB treatment.", supporting_evidence: ["Cough >2w", "Weight loss >5%", "Hemoptysis"], contradicting_evidence: ["Negative smear (unknown)"] },
      { icd11: "CA82", display: "Bronchiectasis", probability: "moderate", urgency: "urgent", reasoning: "Chronic cough with hemoptysis could indicate bronchiectasis.", supporting_evidence: ["Chronic cough", "Hemoptysis"], contradicting_evidence: ["No prior imaging"] },
      { icd11: "MD15", display: "Hemoptysis", probability: "high", urgency: "urgent", reasoning: "Active bleeding from airways requires urgent evaluation.", supporting_evidence: ["Frank hemoptysis"], contradicting_evidence: ["No central source identified"] },
      { icd11: "DJ42", display: "Interstitial lung disease", probability: "low", urgency: "routine", reasoning: "Diffuse lung disease could mimic TB.", supporting_evidence: ["Cough", "SOB"], contradicting_evidence: ["No CT scan"] }
    ],
    red_flags: [
      { type: "critical", key: "missed_tb", message: "Missed >2 DOTS doses — risk of MDR-TB, initiate tracing", value: 2, unit: "doses", threshold: 2 },
      { type: "critical", key: "weight", message: "Weight loss >5% — nutritional support needed", value: 8, unit: "%", threshold: 5 },
      { type: "warning", key: "alt", message: "ALT 2x ULN — hepatotoxicity risk", value: 120, unit: "U/L", threshold: 60 }
    ],
    suggested_actions: [
      { type: "test", priority: "high", description: "Sputum AFB smear and culture, GeneXpert MTB/RIF", rationale: "Confirm diagnosis and assess drug resistance", icd11_link: ["1B30"] },
      { type: "test", priority: "high", description: "Chest X-ray, CT if indicated", rationale: "Assess extent of pulmonary involvement", icd11_link: ["1B30"] },
      { type: "referral", priority: "medium", description: "Refer to DOTS center / chest physician", rationale: "Ensure supervised treatment and adherence", icd11_link: ["1B30"] }
    ],
    clinical_summary: "Patient with pulmonary tuberculosis on lost to follow-up status presenting with cough, weight loss, and hemoptysis. High risk of MDR-TB due to missed doses. LFT elevation requires monitoring for drug-induced hepatotoxicity. Immediate sputum testing and DOTS re-enrollment indicated."
  },
  polypharmacy_elderly: {
    differentials: [
      { icd11: "GB61", display: "Acute kidney injury", probability: "high", urgency: "urgent", reasoning: "NSAID + ACEi + Diuretic triple therapy creates high AKI risk.", supporting_evidence: ["ACEi + Diuretic + NSAID", "eGFR 38", "AKI risk factors"], contradicting_evidence: ["No creatinine change documented"] },
      { icd11: "DM90", display: "Drug-induced liver injury", probability: "moderate", urgency: "urgent", reasoning: "Multiple hepatotoxic medications and comorbidities.", supporting_evidence: ["Multiple meds", "Hepatic comorbidities"], contradicting_evidence: ["LFTs baseline unknown"] },
      { icd11: "5A23", display: "Hypoglycemia", probability: "moderate", urgency: "emergent", reasoning: "Metformin + renal impairment increases hypoglycemia risk.", supporting_evidence: ["Metformin on board", "CKD stage 3"], contradicting_evidence: ["No recent glucose logs"] },
      { icd11: "ND82", display: "Fall injury", probability: "moderate", urgency: "urgent", reasoning: "7+ medications and age >70 significantly increase fall risk.", supporting_evidence: ["Age >70", "Polypharmacy >5"], contradicting_evidence: ["No recent falls reported"] }
    ],
    red_flags: [
      { type: "critical", key: "triple_whammy", message: "NSAID + ACEi + Diuretic: stop NSAID immediately, monitor creatinine", value: 0, unit: "", threshold: 0 },
      { type: "warning", key: "fall_risk", message: "Fall risk elevated with 7+ meds and age >70", value: 7, unit: "meds", threshold: 5 }
    ],
    suggested_actions: [
      { type: "test", priority: "high", description: "Urgent renal function, electrolytes, LFTs", rationale: "Baseline assessment for drug toxicity", icd11_link: ["GB61", "DM90"] },
      { type: "question", priority: "high", description: "Review all medications with pharmacist / geriatrician", rationale: "Deprescribe high-risk medications", icd11_link: ["5A23"] },
      { type: "referral", priority: "medium", description: "Geriatric medicine referral for frailty and falls assessment", rationale: "Fall prevention and comprehensive geriatric assessment", icd11_link: ["ND82"] }
    ],
    clinical_summary: "Elderly patient with polypharmacy on 7+ medications including high-risk NSAID+ACEi+diuretic combination. Immediate medication review required due to triple whammy AKI risk and fall risk. Deprescribing and geriatric assessment recommended."
  },
  high_risk_anc: {
    differentials: [
      { icd11: "JA00", display: "Pre-eclampsia", probability: "high", urgency: "emergent", reasoning: "BP 168/108 with proteinuria at 28 weeks meets severe pre-eclampsia criteria.", supporting_evidence: ["BP >160/110", "Proteinuria", "Gestational age 28w"], contradicting_evidence: ["No HELLP labs available"] },
      { icd11: "JA02", display: "Antepartum hemorrhage", probability: "low", urgency: "emergent", reasoning: "Vaginal bleeding in third trimester requires placental evaluation.", supporting_evidence: ["Bleeding reported"], contradicting_evidence: ["No placental abruption signs"] },
      { icd11: "5B11", display: "Gestational diabetes mellitus", probability: "moderate", urgency: "urgent", reasoning: "Uncontrolled glucose in pregnancy increases fetal macrosomia risk.", supporting_evidence: ["Elevated glucose", "Obstetric risk factors"], contradicting_evidence: ["No OGTT result available"] },
      { icd11: "HA10", display: "Hyperemesis gravidarum", probability: "low", urgency: "routine", reasoning: "Nausea/vomiting in 1st/2nd trimester common but severe form requires IV fluids.", supporting_evidence: ["Nausea/vomiting"], contradicting_evidence: ["No ketonuria result"] }
    ],
    red_flags: [
      { type: "critical", key: "htn_emergency", message: "Severe hypertension — immediate magnesium sulfate and delivery planning", value: 168, unit: "mmHg", threshold: 160 },
      { type: "critical", key: "epigastric_pain", message: "Epigastric pain — exclude HELLP syndrome with LFTs, platelets, LDH", value: 0, unit: "", threshold: 0 }
    ],
    suggested_actions: [
      { type: "test", priority: "high", description: "Urgent LFTs, platelet count, LDH, uric acid, renal function", rationale: "Rule in/out HELLP syndrome and assess severity", icd11_link: ["JA00"] },
      { type: "test", priority: "high", description: "Fetal monitoring, ultrasound for growth and amniotic fluid", rationale: "Assess fetal well-being and gestational age", icd11_link: ["JA00"] },
      { type: "referral", priority: "high", description: "Immediate maternal-fetal medicine referral", rationale: "Severe pre-eclampsia requires tertiary care", icd11_link: ["JA00"] }
    ],
    clinical_summary: "High-risk antenatal patient with severe pre-eclampsia at 28 weeks gestation. Hypertension is severe-range requiring urgent magnesium sulfate, antihypertensive optimization, and delivery planning. HELLP syndrome workup is essential given epigastric pain. Close fetal monitoring required."
  },
  faltering_growth: {
    differentials: [
      { icd11: "5B00", display: "Protein-energy malnutrition", probability: "high", urgency: "urgent", reasoning: "Weight below 3rd centile with poor feeding raises significant malnutrition concern.", supporting_evidence: ["Weight <3rd centile", "Poor feeding", "Age <5y"], contradicting_evidence: ["No exclusion of chronic disease"] },
      { icd11: "1A00", display: "Acute gastroenteritis", probability: "moderate", urgency: "routine", reasoning: "Diarrhea and poor feeding may cause acute faltering growth.", supporting_evidence: ["Diarrhea", "Oral intake poor"], contradicting_evidence: ["No dysentery reported"] },
      { icd11: "CA40", display: "Lower respiratory infection", probability: "moderate", urgency: "urgent", reasoning: "Cough and irritability suggest concurrent infection inhibiting growth.", supporting_evidence: ["Cough", "Irritability", "Poor feeding"], contradicting_evidence: ["No chest X-ray"] },
      { icd11: "4A64", display: "Immunodeficiency", probability: "low", urgency: "routine", reasoning: "Recurrent infections with failure to thrive suggest immunodeficiency.", supporting_evidence: ["Recurrent infections", "FTT"], contradicting_evidence: ["No HIV or immunology workup"] }
    ],
    red_flags: [
      { type: "critical", key: "failure_to_thrive", message: "Weight below 3rd centile — initiate urgent re-feeding plan", value: 3, unit: "centile", threshold: 3 },
      { type: "warning", key: "dehydration", message: "Signs of dehydration — start ORS immediately", value: 0, unit: "", threshold: 0 }
    ],
    suggested_actions: [
      { type: "test", priority: "high", description: "Weight, height, head circumference plotted on growth chart", rationale: "Document severity and trend of faltering growth", icd11_link: ["5B00"] },
      { type: "test", priority: "high", description: "CBC, electrolytes, renal function, LFTs", rationale: "Identify metabolic or endocrine causes", icd11_link: ["5B00"] },
      { type: "question", priority: "medium", description: "Detailed dietary history and feeding assessment", rationale: "Rule out psychosocial or environmental causes", icd11_link: ["5B00"] },
      { type: "referral", priority: "medium", description: "Pediatric nutrition clinic", rationale: "Structured re-feeding and growth monitoring", icd11_link: ["5B00"] }
    ],
    clinical_summary: "Pediatric patient with faltering growth, weight below 3rd centile, poor feeding, and irritability. The presentation is concerning for protein-energy malnutrition, possibly complicated by acute infection. Urgent nutritional rehabilitation and infection workup indicated."
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { intake, abha_id, consent_id, use_fallback = false } = body;

    try {
      const response = await fetch(`${pythonApiUrl}/api/triage/differential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake, abha_id, consent_id, use_fallback }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {}

    const archetype = getArchetypeFromAbha(abha_id);
    const tmpl = DIFFERENTIAL_TEMPLATES[archetype] || DIFFERENTIAL_TEMPLATES.uncontrolled_dm;

    return NextResponse.json({
      success: true,
      differential: tmpl.differentials,
      red_flags: tmpl.red_flags,
      suggested_actions: tmpl.suggested_actions,
      clinical_summary: tmpl.clinical_summary,
      block_reason: null,
      model_used: "rule-based-fallback"
    });
  } catch {
    return NextResponse.json({ error: "Failed to compute differential" }, { status: 500 });
  }
}
