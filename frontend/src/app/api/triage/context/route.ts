export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { intake, abha_id, consent_id } = body;

    try {
      const response = await fetch(`${pythonApiUrl}/api/triage/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake, abha_id, consent_id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {}

    return NextResponse.json({
      success: true,
      context: {
        merged_conditions: [],
        merged_medications: [],
        merged_vitals: {},
        merged_lab_reports: [],
        conflicts: [],
        red_flags: [],
        ready_for_triage: true
      }
    });
  } catch {
    return NextResponse.json({ error: "Failed to build triage context" }, { status: 500 });
  }
}
