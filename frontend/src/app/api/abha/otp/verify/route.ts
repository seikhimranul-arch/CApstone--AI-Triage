import { NextResponse } from 'next/server';

const DEMO_PROFILES: Record<string, any> = {
  "12345678901234": { name: "Ravi Kumar", age: 52, gender: "M", phone: "+91-98XXX-1234", blood_group: "B+", address: "Kukatpally, Hyderabad, Telangana" },
  "23456789012345": { name: "Suresh Babu", age: 58, gender: "M", phone: "+91-97XXX-5678", blood_group: "O+", address: "Miyapur, Hyderabad, Telangana" },
  "34567890123456": { name: "Rajesh Singh", age: 38, gender: "M", phone: "+91-96XXX-9012", blood_group: "A+", address: "Ameerpet, Hyderabad, Telangana" },
  "45678901234567": { name: "Anil Kumar", age: 42, gender: "M", phone: "+91-95XXX-3456", blood_group: "AB+", address: "Secunderabad, Hyderabad, Telangana" },
  "56789012345678": { name: "Parvathi Amma", age: 68, gender: "F", phone: "+91-94XXX-7890", blood_group: "O-", address: "Begumpet, Hyderabad, Telangana" },
  "67890123456789": { name: "Gopal Krishna", age: 72, gender: "M", phone: "+91-93XXX-2345", blood_group: "B-", address: "Jubilee Hills, Hyderabad, Telangana" },
  "78901234567890": { name: "Meena Kumari", age: 28, gender: "F", phone: "+91-92XXX-6789", blood_group: "A+", address: "LB Nagar, Hyderabad, Telangana" },
  "89012345678901": { name: "Lakshmi Devi", age: 32, gender: "F", phone: "+91-91XXX-0123", blood_group: "O+", address: "Dilsukhnagar, Hyderabad, Telangana" },
  "90123456789012": { name: "Priya Reddy", age: 3, gender: "F", phone: "+91-90XXX-4567", blood_group: "B+", address: "Kukatpally, Hyderabad, Telangana" },
  "01234567890123": { name: "Arjun Rao", age: 2, gender: "M", phone: "+91-89XXX-8901", blood_group: "A+", address: "Madhapur, Hyderabad, Telangana" },
};

const MOCK_RECORDS: Record<string, any[]> = {
  "12345678901234": [
    { type: "OPConsultation", date: "2025-12-15", provider: "PHC Kukatpally", summary: "Uncontrolled DM, HbA1c 9.2%, started insulin" },
    { type: "Prescription", date: "2025-12-15", provider: "Dr. Priya", summary: "Metformin 500mg BD, Glimepiride 2mg OD, Insulin Glargine 10U HS" },
    { type: "DiagnosticReport", date: "2025-12-15", provider: "PHC Lab", summary: "HbA1c 9.2% (HIGH), RBS 210 mg/dL (HIGH), Creatinine 1.0 (Normal)" },
    { type: "OPConsultation", date: "2025-09-10", provider: "PHC Kukatpally", summary: "Routine follow-up, poor glycemic control" },
    { type: "DiagnosticReport", date: "2025-09-10", provider: "PHC Lab", summary: "HbA1c 8.8%, Lipid profile: TC 248 (HIGH)" },
  ],
  "34567890123456": [
    { type: "OPConsultation", date: "2025-11-01", provider: "PHC Kukatpally", summary: "Pulmonary TB, smear positive, malnourished" },
    { type: "Prescription", date: "2025-11-01", provider: "Dr. Priya", summary: "DOT regimen: INH+RIF+PZA, Nutritional support" },
    { type: "DiagnosticReport", date: "2025-11-01", provider: "District Lab", summary: "Sputum AFB 2+, ALT 120 (HIGH), Hb 9.8 (LOW)" },
  ],
  "78901234567890": [
    { type: "OPConsultation", date: "2025-12-10", provider: "PHC Kukatpally", summary: "Severe preeclampsia at 28wk, BP 155/102, proteinuria 2+" },
    { type: "Prescription", date: "2025-12-10", provider: "Dr. Priya", summary: "IV Labetalol, MgSO4, Calcium supplement" },
    { type: "DiagnosticReport", date: "2025-12-10", provider: "PHC Lab", summary: "Urine protein 2+, Uric acid 7.2 (HIGH), Hb 10.8 (Normal)" },
  ],
};

export async function POST(request: Request) {
  try {
    const { abha_id, otp } = await request.json();

    if (!abha_id || !otp) {
      return NextResponse.json({ detail: "ABHA ID and OTP are required" }, { status: 400 });
    }

    // Demo mode: accept any 6-digit OTP (or specifically 123456)
    if (otp.length !== 6) {
      return NextResponse.json({ detail: "कृपया 6 अंकों का OTP दर्ज करें" }, { status: 400 });
    }

    const profile = DEMO_PROFILES[abha_id];
    if (!profile) {
      return NextResponse.json({ detail: "ABHA ID not found" }, { status: 404 });
    }

    const records = MOCK_RECORDS[abha_id] || [
      { type: "OPConsultation", date: "2025-12-01", provider: "PHC Kukatpally", summary: "General consultation — vitals stable" },
      { type: "Prescription", date: "2025-12-01", provider: "Dr. Priya", summary: "No active prescriptions" },
    ];

    const consentId = `CONSENT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      success: true,
      profile,
      linked_records: records,
      consent_id: consentId,
    });
  } catch {
    return NextResponse.json({ detail: "OTP verification failed" }, { status: 500 });
  }
}
