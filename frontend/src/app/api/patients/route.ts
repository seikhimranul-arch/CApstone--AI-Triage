import { NextResponse } from 'next/server';

export async function GET() {
  const patients = [
    { id: "uncontrolled_dm_000", filename: "uncontrolled_dm_000.json", archetype: "uncontrolled_dm", name: "Ravi Kumar", age: 52, gender: "M", abha_id: "12345678901234", phone: "+91-98XXX-1234", address: "Kukatpally, Hyderabad" },
    { id: "uncontrolled_dm_001", filename: "uncontrolled_dm_001.json", archetype: "uncontrolled_dm", name: "Suresh Babu", age: 58, gender: "M", abha_id: "23456789012345", phone: "+91-97XXX-5678", address: "Miyapur, Hyderabad" },
    { id: "missed_tb_fu_000", filename: "missed_tb_fu_000.json", archetype: "missed_tb_fu", name: "Rajesh Singh", age: 38, gender: "M", abha_id: "34567890123456", phone: "+91-96XXX-9012", address: "Ameerpet, Hyderabad" },
    { id: "missed_tb_fu_001", filename: "missed_tb_fu_001.json", archetype: "missed_tb_fu", name: "Anil Kumar", age: 42, gender: "M", abha_id: "45678901234567", phone: "+91-95XXX-3456", address: "Secunderabad, Hyderabad" },
    { id: "polypharmacy_elderly_000", filename: "polypharmacy_elderly_000.json", archetype: "polypharmacy_elderly", name: "Parvathi Amma", age: 68, gender: "F", abha_id: "56789012345678", phone: "+91-94XXX-7890", address: "Begumpet, Hyderabad" },
    { id: "polypharmacy_elderly_001", filename: "polypharmacy_elderly_001.json", archetype: "polypharmacy_elderly", name: "Gopal Krishna", age: 72, gender: "M", abha_id: "67890123456789", phone: "+91-93XXX-2345", address: "Jubilee Hills, Hyderabad" },
    { id: "high_risk_anc_000", filename: "high_risk_anc_000.json", archetype: "high_risk_anc", name: "Meena Kumari", age: 28, gender: "F", abha_id: "78901234567890", phone: "+91-92XXX-6789", address: "LB Nagar, Hyderabad" },
    { id: "high_risk_anc_001", filename: "high_risk_anc_001.json", archetype: "high_risk_anc", name: "Lakshmi Devi", age: 32, gender: "F", abha_id: "89012345678901", phone: "+91-91XXX-0123", address: "Dilsukhnagar, Hyderabad" },
    { id: "faltering_growth_000", filename: "faltering_growth_000.json", archetype: "faltering_growth", name: "Priya Reddy", age: 3, gender: "F", abha_id: "90123456789012", phone: "+91-90XXX-4567", address: "Kukatpally, Hyderabad" },
    { id: "faltering_growth_001", filename: "faltering_growth_001.json", archetype: "faltering_growth", name: "Arjun Rao", age: 2, gender: "M", abha_id: "01234567890123", phone: "+91-89XXX-8901", address: "Madhapur, Hyderabad" },
  ];

  return NextResponse.json(patients);
}
