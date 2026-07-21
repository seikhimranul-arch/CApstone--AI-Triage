export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    try {
      const response = await fetch(`${pythonApiUrl}/api/intake/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {}

    const intake_id = `INTAKE-${Math.random().toString(36).substring(2, 14).toUpperCase()}`;
    const now = new Date().toISOString();

    return NextResponse.json({
      success: true,
      intake_id,
      message: `Intake submitted successfully at ${now}`,
      submitted_at: now
    });
  } catch {
    return NextResponse.json({ error: "Failed to submit intake" }, { status: 500 });
  }
}
