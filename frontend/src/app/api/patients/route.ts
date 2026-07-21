export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const PATIENTS = [
  { id: "uncontrolled_dm_000", filename: "uncontrolled_dm_000.json", archetype: "uncontrolled_dm", age: 52, gender: "M", name: "Rajesh Sharma", abha_id: "11000100000001" },
  { id: "uncontrolled_dm_001", filename: "uncontrolled_dm_001.json", archetype: "uncontrolled_dm", age: 48, gender: "F", name: "Anita Verma", abha_id: "11000100000002" },
  { id: "uncontrolled_dm_002", filename: "uncontrolled_dm_002.json", archetype: "uncontrolled_dm", age: 55, gender: "M", name: "Amit Kumar", abha_id: "11000100000003" },
  { id: "missed_tb_fu_000", filename: "missed_tb_fu_000.json", archetype: "missed_tb_fu", age: 35, gender: "M", name: "Suresh Singh", abha_id: "11000200000001" },
  { id: "missed_tb_fu_001", filename: "missed_tb_fu_001.json", archetype: "missed_tb_fu", age: 28, gender: "F", name: "Sunita Devi", abha_id: "11000200000002" },
  { id: "missed_tb_fu_002", filename: "missed_tb_fu_002.json", archetype: "missed_tb_fu", age: 42, gender: "M", name: "Vikram Patel", abha_id: "11000200000003" },
  { id: "polypharmacy_elderly_000", filename: "polypharmacy_elderly_000.json", archetype: "polypharmacy_elderly", age: 72, gender: "F", name: "Kavita Joshi", abha_id: "11000300000001" },
  { id: "polypharmacy_elderly_001", filename: "polypharmacy_elderly_001.json", archetype: "polypharmacy_elderly", age: 68, gender: "M", name: "Mohan Gupta", abha_id: "11000300000002" },
  { id: "polypharmacy_elderly_002", filename: "polypharmacy_elderly_002.json", archetype: "polypharmacy_elderly", age: 78, gender: "F", name: "Meena Reddy", abha_id: "11000300000003" },
  { id: "high_risk_anc_000", filename: "high_risk_anc_000.json", archetype: "high_risk_anc", age: 24, gender: "F", name: "Priya Sharma", abha_id: "11000400000001" },
  { id: "high_risk_anc_001", filename: "high_risk_anc_001.json", archetype: "high_risk_anc", age: 28, gender: "F", name: "Seema Nair", abha_id: "11000400000002" },
  { id: "high_risk_anc_002", filename: "high_risk_anc_002.json", archetype: "high_risk_anc", age: 22, gender: "F", name: "Pooja Yadav", abha_id: "11000400000003" },
  { id: "faltering_growth_000", filename: "faltering_growth_000.json", archetype: "faltering_growth", age: 2, gender: "M", name: "Ravi Kumar", abha_id: "11000500000001" },
  { id: "faltering_growth_001", filename: "faltering_growth_001.json", archetype: "faltering_growth", age: 1, gender: "F", name: "Neha Singh", abha_id: "11000500000002" },
  { id: "faltering_growth_002", filename: "faltering_growth_002.json", archetype: "faltering_growth", age: 3, gender: "M", name: "Deepak Verma", abha_id: "11000500000003" },
];

export async function GET() {
  try {
    return NextResponse.json(PATIENTS);
  } catch {
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 });
  }
}
