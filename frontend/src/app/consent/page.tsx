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
  const [otpSent, setOtpSent] = useState(false);

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
      setError("कृपया वैध 14 अंकों का ABHA नंबर दर्ज करें");
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
      if (!res.ok) throw new Error(data.detail || "OTP भेजने में विफल");
      setMaskedPhone(data.masked_phone);
      setOtpSent(true);
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
      setError("कृपया 6 अंकों का OTP दर्ज करें");
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
      if (!res.ok) throw new Error(data.detail || "OTP सत्यापन विफल");
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

  const handleResendOtp = useCallback(async () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setLoading(true);
    try {
      const digits = abhaId.replace(/\D/g, "");
      const res = await fetch("/api/abha/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abha_id: digits }),
      });
      const data = await res.json();
      setMaskedPhone(data.masked_phone);
      setCountdown(300);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [abhaId]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 lg:px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a5276] to-[#138808] shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ABHA Consent Verification</h1>
          <p className="mt-2 text-sm text-slate-500">
            Patient का 14 अंकों का ABHA नंबर दर्ज करें — स्वास्थ्य रिकॉर्ड लाने के लिए
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {(["abha", "otp", "verified"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                step === s ? "bg-[#1a5276] text-white shadow-lg shadow-blue-200" :
                (["abha", "otp", "verified"].indexOf(step) > i ? "bg-green-600 text-white" : "bg-slate-200 text-slate-500")
              }`}>
                {["abha", "otp", "verified"].indexOf(step) > i ? "\u2713" : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${
                step === s ? "text-[#1a5276]" : "text-slate-400"
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
              className="mb-4 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-center text-2xl font-mono tracking-widest text-slate-900 placeholder:text-slate-300 focus:border-[#1a5276] focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <div className="mb-4 rounded-lg bg-[#FFF4E6] border border-[#FF9933]/20 px-4 py-3">
              <div className="flex items-start gap-2">
                <svg className="h-5 w-5 text-[#FF9933] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">Test Mode — Any registered ABHA number works</p>
                  <p className="text-xs text-amber-600 mt-0.5">Try: 12345678901234, 45678901234567, or any from patient list</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading || abhaId.replace(/\D/g, "").length !== 14}
              className="w-full rounded-xl bg-gradient-to-r from-[#1a5276] to-[#138808] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Sending OTP...
                </span>
              ) : "Send OTP to Registered Mobile"}
            </button>
          </div>
        )}

        {/* Step 2: OTP Input */}
        {step === "otp" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Simulated SMS notification */}
            {otpSent && (
              <div className="mb-4 rounded-xl bg-gradient-to-r from-blue-50 to-green-50 border border-blue-100 p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1a5276]/10">
                    <svg className="h-5 w-5 text-[#1a5276]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">ABHA OTP Sent via SMS</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      A 6-digit OTP has been sent to <span className="font-semibold text-slate-700">{maskedPhone}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="mb-1 text-sm text-slate-600 text-center">
              OTP sent to registered mobile <span className="font-semibold text-slate-900">{maskedPhone}</span>
            </p>
            <p className="mb-6 text-center text-xs text-slate-400">
              {countdown > 0 ? (
                <>Expires in <span className="font-mono font-semibold">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}</span></>
              ) : (
                <span className="text-red-500">OTP expired — request a new one</span>
              )}
            </p>
            <div className="mb-6 flex justify-center gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="h-14 w-12 rounded-xl border border-slate-300 bg-slate-50 text-center text-2xl font-mono text-slate-900 focus:border-[#1a5276] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setStep("abha"); setOtp(["", "", "", "", "", ""]); setError(""); setOtpSent(false); }}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.join("").length !== 6}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#1a5276] to-[#138808] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Verifying...
                  </span>
                ) : "Verify & Fetch Records"}
              </button>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={handleResendOtp}
                disabled={loading}
                className="text-sm text-[#1a5276] hover:underline disabled:text-slate-400"
              >
                Resend OTP
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verified — Show Profile + Records */}
        {step === "verified" && profile && (
          <div className="space-y-4 animate-fade-in">
            {/* Patient Profile Card */}
            <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#138808] to-[#2EAD1A] text-lg font-bold text-white">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{profile.name}</h2>
                  <p className="text-sm text-slate-500">
                    {profile.age}y · {profile.gender === "M" ? "Male" : "Female"} · ABHA Verified
                  </p>
                </div>
                <div className="ml-auto rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Verified
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-white/60 px-3 py-2">
                  <span className="text-slate-400">Phone</span>
                  <p className="font-medium text-slate-700">{profile.phone}</p>
                </div>
                <div className="rounded-lg bg-white/60 px-3 py-2">
                  <span className="text-slate-400">Blood Group</span>
                  <p className="font-medium text-slate-700">{profile.blood_group || "N/A"}</p>
                </div>
                <div className="col-span-2 rounded-lg bg-white/60 px-3 py-2">
                  <span className="text-slate-400">Address</span>
                  <p className="font-medium text-slate-700">{profile.address}</p>
                </div>
              </div>
            </div>

            {/* Consent Info */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <div className="flex items-center gap-2 mb-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                <span className="font-semibold">Consent Granted</span>
              </div>
              <p className="text-xs text-blue-500">Consent ID: {consentId}</p>
              <p className="text-xs text-blue-500 mt-0.5">Access to linked health records has been granted</p>
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
                      rec.type === "OPConsultation" ? "bg-blue-600" :
                      rec.type === "Prescription" ? "bg-[#138808]" :
                      rec.type === "DiagnosticReport" ? "bg-purple-600" : "bg-slate-400"
                    }`}>
                      {rec.type === "OPConsultation" ? "OP" :
                       rec.type === "Prescription" ? "Rx" :
                       rec.type === "DiagnosticReport" ? "Lab" : "Doc"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">{rec.type}</p>
                        <span className="text-xs text-slate-400">{formatDate(rec.date)}</span>
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
                className="flex-1 rounded-xl bg-gradient-to-r from-[#1a5276] to-[#138808] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              >
                Open Chart Review →
              </button>
              <button
                onClick={() => { setStep("abha"); setAbhaId(""); setOtp(["", "", "", "", "", ""]); setProfile(null); setLinkedRecords([]); setError(""); setOtpSent(false); }}
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
