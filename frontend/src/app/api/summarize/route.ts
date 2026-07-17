import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { patient_id } = await request.json();
    
    if (!patient_id) {
      return NextResponse.json(
        { success: false, error: "patient_id is required" },
        { status: 400 }
      );
    }

    // Call Python backend API
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${pythonApiUrl}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id }),
      });
      
      if (!response.ok) {
        throw new Error(`Python API error: ${response.status}`);
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    } catch {
      // Mock response for demo
      const mockSummaries: Record<string, object> = {
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
              { type: "warning", key: "missed_followup", message: "No visit 105d — schedule follow-up this week", value: 105, unit: "days", threshold: 90 },
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
          evaluation: { score: 9.5, passed: 10, total: 10, details: {}, pass_threshold: true },
          processing_time_ms: 1200
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
        }
      };

      const summary = mockSummaries[patient_id] || mockSummaries.uncontrolled_dm_000;
      return NextResponse.json(summary);
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}