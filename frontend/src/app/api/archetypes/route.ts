export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const ARCHETYPES = [
  { name: "uncontrolled_dm", count: 3, description: "Uncontrolled diabetes mellitus with hypertension, needs intensive follow-up" },
  { name: "missed_tb_fu", count: 3, description: "Missed tuberculosis follow-up with risk of drug resistance" },
  { name: "polypharmacy_elderly", count: 3, description: "Polypharmacy in elderly with AKI/bleeding risk and fall risk" },
  { name: "high_risk_anc", count: 3, description: "High-risk antenatal with pre-eclampsia and GDM complications" },
  { name: "faltering_growth", count: 3, description: "Pediatric faltering growth with malnutrition and recurrent infections" }
];

const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${pythonApiUrl}/api/archetypes`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch {}

  return NextResponse.json({ archetypes: ARCHETYPES });
}
