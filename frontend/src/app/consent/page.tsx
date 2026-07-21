"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/AppShell";
import { useI18n } from "../../lib/i18n";
import type { AbhaProfile, LinkedRecord } from "../../lib/types";

type Step = "abha" | "otp" | "verified";

export default function ConsentPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState<Step>("abha");
  const [abhaId, setAbhaId] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [profile, setProfile] = useState<AbhaProfile | null>(null);
  const [linkedRecords, setLinkedRecords] = useState<LinkedRecord[]>([]);
  const [consentId, setConsentId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300);

  const formatAbhaInput = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 14);
    const parts: string[] = [];
    let i = 0;
    const sizes = [2, 4, 4, 4];
    for (const size of sizes) {
      if (i < digits.length) {
        parts.push(digits.slice(i, i + size));
        i += size;
      }
    }
    return parts.join(" ");
  };

  const handleSendOtp = useCallback(async () => {
    const digits = abhaId.replace(/\D/g, "");
    if (digits.length !== 14) {
      setError("Please enter a valid 14-digit ABHA number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/abha/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abha_id: digits }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send OTP");
      setMaskedPhone(data.masked_phone);
      setStep("otp");
      setCountdown(300);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [abhaId]);

  const handleVerifyOtp = useCallback(async () => {
    const digits = abhaId.replace(/\D/g, "");
    const otpStr = otp.join("");
    if (otpStr.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/abha/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abha_id: digits, otp: otpStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "OTP verification failed");
      setProfile(data.profile);
      setLinkedRecords(data.linked_records);
      setConsentId(data.consent_id);
      setStep("verified");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [abhaId, otp]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const archetypeLabel: Record<string, string> = {
    uncontrolled_dm: "Uncontrolled Diabetes",
    missed_tb_fu: "Missed TB Follow-up",
    polypharmacy_elderly: "Polypharmacy Elderly",
    high_risk_anc: "High-Risk ANC",
    faltering_growth: "Faltering Growth",
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 lg:px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#06B6D4]">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ABHA Consent Verification</h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter the patient&apos;s 14-digit Ayushman Bharat Health Account number to fetch linked health records
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {(["abha", "otp", "verified"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                step === s ? "bg-[#2563EB] text-white shadow-lg shadow-blue-200" :
                (["abha", "otp", "verified"].indexOf(step) > i ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500")
              }`}>
                {["abha", "otp", "verified"].indexOf(step) > i ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${
                step === s ? "text-[#2563EB]" : "text-slate-400"
              }`}>
                {s === "abha" ? "ABHA Number" : s === "otp" ? "OTP Verify" : "Records Linked"}
              </span>
              {i < 2 && <div className="mx-1 h-px w-8 bg-slate-300" />}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: ABHA Number Input */}
        {step === "abha" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="mb-2 block text-sm font-medium text-slate-700">14-Digit ABHA Number</label>
            <input
              type="text"
              value={abhaId}
              onChange={(e) => { setAbhaId(formatAbhaInput(e.target.value)); setError(""); }}
              placeholder="XX XXXX XXXX XXXX"
              maxLength={19}
              className="mb-4 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-center text-2xl font-mono tracking-widest text-slate-900 placeholder:text-slate-300 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <p className="mb-4 text-xs text-slate-400 text-center">
              Demo: Try any 14-digit number (e.g., 12345678901234)
            </p>
            <button
              onClick={handleSendOtp}
              disabled={loading || abhaId.replace(/\D/g, "").length !== 14}
              className="w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#06B6D4] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:shadow-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending OTP..." : "Send OTP to Registered Mobile"}
            </button>
          </div>
        )}

        {/* Step 2: OTP Input */}
        {step === "otp" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-1 text-sm text-slate-600">
              OTP sent to <span className="font-semibold text-slate-900">{maskedPhone}</span>
            </p>
            <p className="mb-6 text-xs text-slate-400">
              {countdown > 0 ? `Expires in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, "0")}` : "OTP expired"}
            </p>
            <div className="mb-6 flex justify-center gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="h-14 w-12 rounded-xl border border-slate-300 bg-slate-50 text-center text-2xl font-mono text-slate-900 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setStep("abha"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.join("").length !== 6}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#06B6D4] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:shadow-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify & Fetch Records"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verified — Show Profile + Records */}
        {step === "verified" && profile && (
          <div className="space-y-4">
            {/* Patient Profile Card */}
            <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-lg font-bold text-white">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{profile.name}</h2>
                  <p className="text-sm text-slate-500">
                    {profile.age}{profile.gender === "M" ? "M" : "F"} · {profile.blood_group} · ABHA Verified
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-white/60 px-3 py-2">
                  <span className="text-slate-400">Phone</span>
                  <p className="font-medium text-slate-700">{profile.phone}</p>
                </div>
                <div className="rounded-lg bg-white/60 px-3 py-2">
                  <span className="text-slate-400">Email</span>
                  <p className="font-medium text-slate-700">{profile.email}</p>
                </div>
                <div className="col-span-2 rounded-lg bg-white/60 px-3 py-2">
                  <span className="text-slate-400">Address</span>
                  <p className="font-medium text-slate-700">{profile.address}</p>
                </div>
              </div>
            </div>

            {/* Consent Info */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <span className="font-semibold">Consent ID:</span> {consentId}
              <br />
              <span className="text-xs text-blue-500">Patient has granted access to view linked health records</span>
            </div>

            {/* Linked Health Records */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Linked Health Records ({linkedRecords.length})
              </h3>
              <div className="space-y-3">
                {linkedRecords.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${
                      rec.type === "OPConsultation" ? "bg-blue-500" :
                      rec.type === "Prescription" ? "bg-green-500" :
                      rec.type === "DiagnosticReport" ? "bg-purple-500" : "bg-slate-400"
                    }`}>
                      {rec.type === "OPConsultation" ? "OP" :
                       rec.type === "Prescription" ? "Rx" :
                       rec.type === "DiagnosticReport" ? "Lab" : "Doc"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">{rec.type}</p>
                        <span className="text-xs text-slate-400">{rec.date}</span>
                      </div>
                      <p className="text-xs text-slate-500">{rec.provider}</p>
                      <p className="mt-1 text-xs text-slate-600">{rec.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/app")}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#06B6D4] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:shadow-blue-300"
              >
                Open Chart Review →
              </button>
              <button
                onClick={() => { setStep("abha"); setAbhaId(""); setOtp(["", "", "", "", "", ""]); setProfile(null); setLinkedRecords([]); setError(""); }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                New Patient
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
