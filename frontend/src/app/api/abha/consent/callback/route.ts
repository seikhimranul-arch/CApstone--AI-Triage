export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const consent_id = searchParams.get("consent_id");
  const status = searchParams.get("status");
  const artefact = searchParams.get("artefact");

  if (!consent_id || !status) {
    return NextResponse.json({ error: "consent_id and status are required" }, { status: 400 });
  }

  const abha_id = "11000100000001";
  const now = new Date().toISOString();

  return NextResponse.json({
    success: true,
    consent: {
      consent_id,
      abha_id,
      status: status === "GRANTED" || status === "REQUESTED" ? status : "GRANTED",
      purpose: "TRIAGE",
      hi_types: ["Condition","MedicationRequest","Observation","Encounter","DiagnosticReport","AllergyIntolerance"],
      expiry_hours: 24,
      created_at: now,
      granted_at: status === "GRANTED" ? now : null,
      artefact: artefact ? JSON.parse(artefact) : { signed: true }
    }
  });
}
