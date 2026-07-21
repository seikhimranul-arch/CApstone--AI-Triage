export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const SYMPTOMS = [
  { icd11: "MG44", display: "Fever", category: "General" },
  { icd11: "MG40", display: "Fatigue/Weakness", category: "General" },
  { icd11: "MB23", display: "Weight loss", category: "General" },
  { icd11: "MB24", display: "Weight gain", category: "General" },
  { icd11: "MG45", display: "Night sweats", category: "General" },
  { icd11: "MD11", display: "Cough", category: "Respiratory" },
  { icd11: "MD12", display: "Shortness of breath", category: "Respiratory" },
  { icd11: "MD13", display: "Chest pain", category: "Respiratory" },
  { icd11: "MD14", display: "Wheezing", category: "Respiratory" },
  { icd11: "MD15", display: "Hemoptysis", category: "Respiratory" },
  { icd11: "ME00", display: "Abdominal pain", category: "GI" },
  { icd11: "ME01", display: "Diarrhea", category: "GI" },
  { icd11: "ME02", display: "Vomiting", category: "GI" },
  { icd11: "ME03", display: "Nausea", category: "GI" },
  { icd11: "ME04", display: "Constipation", category: "GI" },
  { icd11: "ME05", display: "Blood in stool", category: "GI" },
  { icd11: "MB00", display: "Palpitations", category: "Cardio" },
  { icd11: "MB01", display: "Edema/Swelling", category: "Cardio" },
  { icd11: "MB40", display: "Headache", category: "Neuro" },
  { icd11: "MB41", display: "Dizziness", category: "Neuro" },
  { icd11: "MB42", display: "Seizures", category: "Neuro" },
  { icd11: "MF00", display: "Dysuria", category: "GU" },
  { icd11: "MF01", display: "Frequency/Urgency", category: "GU" },
  { icd11: "MF02", display: "Hematuria", category: "GU" },
  { icd11: "MH00", display: "Rash", category: "Skin" },
  { icd11: "MH01", display: "Itching", category: "Skin" },
  { icd11: "MH02", display: "Wound/Ulcer", category: "Skin" },
  { icd11: "GA00", display: "Amenorrhea", category: "OBGYN" },
  { icd11: "GA01", display: "Vaginal bleeding", category: "OBGYN" },
  { icd11: "GA02", display: "Vaginal discharge", category: "OBGYN" },
  { icd11: "KB00", display: "Poor feeding", category: "Peds" },
  { icd11: "KB01", display: "Irritability", category: "Peds" },
  { icd11: "KB02", display: "Developmental delay", category: "Peds" }
];

const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${pythonApiUrl}/api/symptoms/list`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch {}

  return NextResponse.json({ symptoms: SYMPTOMS });
}
