import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const patients = [
      { id: "uncontrolled_dm_000", filename: "uncontrolled_dm_000.json", archetype: "uncontrolled_dm" },
      { id: "uncontrolled_dm_001", filename: "uncontrolled_dm_001.json", archetype: "uncontrolled_dm" },
      { id: "missed_tb_fu_000", filename: "missed_tb_fu_000.json", archetype: "missed_tb_fu" },
      { id: "missed_tb_fu_001", filename: "missed_tb_fu_001.json", archetype: "missed_tb_fu" },
      { id: "polypharmacy_elderly_000", filename: "polypharmacy_elderly_000.json", archetype: "polypharmacy_elderly" },
      { id: "polypharmacy_elderly_001", filename: "polypharmacy_elderly_001.json", archetype: "polypharmacy_elderly" },
      { id: "high_risk_anc_000", filename: "high_risk_anc_000.json", archetype: "high_risk_anc" },
      { id: "high_risk_anc_001", filename: "high_risk_anc_001.json", archetype: "high_risk_anc" },
      { id: "faltering_growth_000", filename: "faltering_growth_000.json", archetype: "faltering_growth" },
      { id: "faltering_growth_001", filename: "faltering_growth_001.json", archetype: "faltering_growth" },
    ];
    
    return NextResponse.json(patients);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}