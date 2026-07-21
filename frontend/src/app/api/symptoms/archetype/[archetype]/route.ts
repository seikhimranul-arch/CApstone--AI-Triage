export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const ARCHETYPE_DEMO_SYMPTOMS: Record<string, string[]> = {
  uncontrolled_dm: ["MG44", "MD12", "ME00", "MB23"],
  missed_tb_fu: ["MG44", "MD11", "MB23", "MD15"],
  polypharmacy_elderly: ["MB40", "MB41", "MB01", "ME00"],
  high_risk_anc: ["MB01", "MG44", "MG40", "GA01"],
  faltering_growth: ["KB00", "KB01", "MB23", "MD11"]
};

const FULL_SYMPTOM_MAP: Record<string, { icd11: string; display: string; category: string }> = {
  MG44: { icd11: "MG44", display: "Fever", category: "General" },
  MG40: { icd11: "MG40", display: "Fatigue/Weakness", category: "General" },
  MB23: { icd11: "MB23", display: "Weight loss", category: "General" },
  MB24: { icd11: "MB24", display: "Weight gain", category: "General" },
  MG45: { icd11: "MG45", display: "Night sweats", category: "General" },
  MD11: { icd11: "MD11", display: "Cough", category: "Respiratory" },
  MD12: { icd11: "MD12", display: "Shortness of breath", category: "Respiratory" },
  MD13: { icd11: "MD13", display: "Chest pain", category: "Respiratory" },
  MD14: { icd11: "MD14", display: "Wheezing", category: "Respiratory" },
  MD15: { icd11: "MD15", display: "Hemoptysis", category: "Respiratory" },
  ME00: { icd11: "ME00", display: "Abdominal pain", category: "GI" },
  ME01: { icd11: "ME01", display: "Diarrhea", category: "GI" },
  ME02: { icd11: "ME02", display: "Vomiting", category: "GI" },
  ME03: { icd11: "ME03", display: "Nausea", category: "GI" },
  ME04: { icd11: "ME04", display: "Constipation", category: "GI" },
  ME05: { icd11: "ME05", display: "Blood in stool", category: "GI" },
  MB00: { icd11: "MB00", display: "Palpitations", category: "Cardio" },
  MB01: { icd11: "MB01", display: "Edema/Swelling", category: "Cardio" },
  MB40: { icd11: "MB40", display: "Headache", category: "Neuro" },
  MB41: { icd11: "MB41", display: "Dizziness", category: "Neuro" },
  MB42: { icd11: "MB42", display: "Seizures", category: "Neuro" },
  MF00: { icd11: "MF00", display: "Dysuria", category: "GU" },
  MF01: { icd11: "MF01", display: "Frequency/Urgency", category: "GU" },
  MF02: { icd11: "MF02", display: "Hematuria", category: "GU" },
  MH00: { icd11: "MH00", display: "Rash", category: "Skin" },
  MH01: { icd11: "MH01", display: "Itching", category: "Skin" },
  MH02: { icd11: "MH02", display: "Wound/Ulcer", category: "Skin" },
  GA00: { icd11: "GA00", display: "Amenorrhea", category: "OBGYN" },
  GA01: { icd11: "GA01", display: "Vaginal bleeding", category: "OBGYN" },
  GA02: { icd11: "GA02", display: "Vaginal discharge", category: "OBGYN" },
  KB00: { icd11: "KB00", display: "Poor feeding", category: "Peds" },
  KB01: { icd11: "KB01", display: "Irritability", category: "Peds" },
  KB02: { icd11: "KB02", display: "Developmental delay", category: "Peds" }
};

const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function GET(request: Request, { params }: { params: { archetype: string } }) {
  const { archetype } = params;
  
  try {
    const response = await fetch(`${pythonApiUrl}/api/symptoms/archetype/${encodeURIComponent(archetype)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch {}

  const codes = ARCHETYPE_DEMO_SYMPTOMS[archetype] || [];
  const symptoms = codes.map(code => FULL_SYMPTOM_MAP[code]).filter(Boolean) as { icd11: string; display: string; category: string }[];
  
  return NextResponse.json({ archetype, symptoms });
}
