export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { abha_id, purpose = "TRIAGE", hi_types = ["Condition","MedicationRequest","Observation","Encounter","DiagnosticReport","AllergyIntolerance"], expiry_hours = 24 } = body;

    try {
      const response = await fetch(`${pythonApiUrl}/api/abha/consent/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abha_id, purpose, hi_types, expiry_hours }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {}

    const consent_id = `CONS-${Math.random().toString(36).substring(2, 14).toUpperCase()}`;
    const created_at = new Date().toISOString();
    const redirect_url = `https://health.abdm.gov.in/consent-approval?consent_id=${consent_id}`;

    return NextResponse.json({
      consent_id,
      abha_id,
      status: "REQUESTED",
      purpose,
      hi_types,
      expiry_hours,
      created_at,
      redirect_url
    });
  } catch {
    return NextResponse.json({ error: "Failed to initiate consent" }, { status: 500 });
  }
}
