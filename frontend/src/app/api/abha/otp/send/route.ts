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

// In-memory OTP store for demo
const otpStore = new Map<string, { otp: string; expires: number }>();

export async function POST(request: Request) {
  try {
    const { abha_id } = await request.json();

    if (!abha_id || abha_id.length !== 14) {
      return NextResponse.json({ detail: "कृपया वैध 14 अंकों का ABHA नंबर दर्ज करें" }, { status: 400 });
    }

    const profile = DEMO_PROFILES[abha_id];
    if (!profile) {
      return NextResponse.json({ detail: "ABHA ID not found in demo database" }, { status: 404 });
    }

    // Generate demo OTP (always 123456 for easy testing)
    const otp = "123456";
    otpStore.set(abha_id, { otp, expires: Date.now() + 300000 }); // 5 min

    const maskedPhone = profile.phone.replace(/(\d{2})\d{4}(\d{2})/, "$1****$2");

    return NextResponse.json({
      success: true,
      masked_phone: maskedPhone,
      message: "OTP sent successfully (Demo mode: use 123456)"
    });
  } catch {
    return NextResponse.json({ detail: "Failed to send OTP" }, { status: 500 });
  }
}
