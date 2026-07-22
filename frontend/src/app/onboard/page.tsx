"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "../../lib/theme/ThemeContext";
import { useI18n } from "../../lib/i18n";
import { SehatLogo } from "../../components/SehatLogo";

type Step = "welcome" | "otp" | "details" | "complete";

interface OnboardData {
  abha_id: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  address: string;
  blood_group: string;
  emergency_contact: string;
  known_allergies: string;
  chronic_conditions: string;
}

const INITIAL: OnboardData = {
  abha_id: "", name: "", age: "", gender: "", phone: "", address: "",
  blood_group: "", emergency_contact: "", known_allergies: "", chronic_conditions: "",
};

const STEPS: { key: Step; label: string }[] = [
  { key: "welcome", label: "ABHA ID" },
  { key: "otp", label: "Verify OTP" },
  { key: "details", label: "Your Details" },
  { key: "complete", label: "Done" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function OnboardPage() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === "dark";

  const [step, setStep] = useState<Step>("welcome");
  const [data, setData] = useState<OnboardData>(INITIAL);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [error, setError] = useState("");

  const bg = isDark ? "bg-halo-bg" : "bg-[#f7f5f0]";
  const cardBg = isDark ? "bg-halo-card border-halo-border" : "bg-white border-slate-200";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-halo-muted" : "text-slate-500";
  const inputBg = isDark ? "bg-halo-bg border-halo-border text-white placeholder-halo-muted" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400";

  const update = (field: keyof OnboardData, val: string) => setData((p) => ({ ...p, [field]: val }));

  const sendOtp = async () => {
    if (data.abha_id.length !== 14) { setError("ABHA ID must be 14 digits"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/abha/otp/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abha_id: data.abha_id }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.detail || "Failed to send OTP"); setLoading(false); return; }
      setMaskedPhone(json.masked_phone);
      setOtpSent(true);
      setStep("otp");
    } catch { setError("Network error. Please try again."); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setError("Please enter 6-digit OTP"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/abha/otp/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abha_id: data.abha_id, otp }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.detail || "Invalid OTP"); setLoading(false); return; }
      if (json.profile) {
        setData((p) => ({
          ...p,
          name: json.profile.name || p.name,
          age: json.profile.age ? String(json.profile.age) : p.age,
          gender: json.profile.gender || p.gender,
          phone: json.profile.phone || p.phone,
          address: json.profile.address || p.address,
          blood_group: json.profile.blood_group || p.blood_group,
        }));
      }
      setStep("details");
    } catch { setError("Verification failed. Please try again."); }
    setLoading(false);
  };

  const completeOnboard = () => {
    setStep("complete");
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => {
        const idx = STEPS.findIndex((x) => x.key === step);
        const current = i === idx;
        const done = i < idx;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
              done ? "bg-[#138808] text-white" :
              current ? "bg-[#FF9933] text-white ring-4 ring-[#FF9933]/20" :
              isDark ? "bg-halo-bg text-halo-muted" : "bg-slate-100 text-slate-400"
            }`}>
              {done ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              ) : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`hidden sm:block w-12 h-0.5 rounded ${done ? "bg-[#138808]" : isDark ? "bg-halo-border" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors ${bg}`}>
      <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2">
            <SehatLogo size="md" dark={isDark} />
            <span className={`text-xl font-bold ${textPrimary}`}>SehatAI</span>
          </Link>
        </div>

        <StepIndicator />

        {/* WELCOME STEP */}
        {step === "welcome" && (
          <div className={`rounded-2xl border p-6 sm:p-8 ${cardBg}`}>
            <div className="text-center mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a5276] to-[#138808] mb-4">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <h1 className={`text-xl font-bold ${textPrimary}`}>Welcome to SehatAI</h1>
              <p className={`mt-2 text-sm ${textMuted}`}>Enter your ABHA ID to link your health records</p>
            </div>

            <div className="mb-4">
              <label className={`block text-xs font-medium mb-2 ${textMuted}`}>14-digit ABHA Health ID</label>
              <input
                type="text"
                value={data.abha_id}
                onChange={(e) => { update("abha_id", e.target.value.replace(/\D/g, "").slice(0, 14)); setError(""); }}
                placeholder="12345678901234"
                maxLength={14}
                className={`w-full rounded-xl border px-4 py-3.5 text-center text-lg font-mono tracking-[0.2em] transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40`}
              />
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs ${textMuted}`}>Demo IDs:</span>
                {["12345678901234", "23456789012345", "34567890123456"].map((id) => (
                  <button
                    key={id}
                    onClick={() => update("abha_id", id)}
                    className={`text-xs font-mono px-2 py-0.5 rounded ${isDark ? "bg-halo-bg text-[#FF9933]" : "bg-[#FF9933]/10 text-[#FF9933]"}`}
                  >
                    {id.slice(0, 4)}...
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

            <button
              onClick={sendOtp}
              disabled={loading || data.abha_id.length !== 14}
              className="w-full rounded-xl bg-[#FF9933] py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[#e68a2e] transition-colors disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP to Linked Mobile"}
            </button>

            <p className={`mt-4 text-center text-xs ${textMuted}`}>
              Don't have an ABHA?{" "}
              <a href="https://abdm.gov.in" target="_blank" rel="noopener" className="text-[#138808] hover:underline font-medium">
                Create one at ABDM.gov.in
              </a>
            </p>
          </div>
        )}

        {/* OTP STEP */}
        {step === "otp" && (
          <div className={`rounded-2xl border p-6 sm:p-8 ${cardBg}`}>
            <div className="text-center mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#138808]/15 mb-4">
                <svg className="h-8 w-8 text-[#138808]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <h1 className={`text-xl font-bold ${textPrimary}`}>Verify OTP</h1>
              <p className={`mt-2 text-sm ${textMuted}`}>
                OTP sent to <span className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{maskedPhone}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className={`block text-xs font-medium mb-2 ${textMuted}`}>6-digit OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                placeholder="123456"
                maxLength={6}
                className={`w-full rounded-xl border px-4 py-3.5 text-center text-lg font-mono tracking-[0.3em] transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#138808]/40`}
              />
              <p className={`mt-2 text-xs text-center ${textMuted}`}>Demo OTP: <span className={`font-mono font-medium ${isDark ? "text-white" : "text-slate-900"}`}>123456</span></p>
            </div>

            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

            <button
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full rounded-xl bg-[#138808] py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[#10a800] transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>

            <button
              onClick={() => { setStep("welcome"); setOtp(""); setError(""); }}
              className={`w-full mt-3 py-3 text-sm font-medium ${textMuted} hover:text-slate-900 dark:hover:text-white transition-colors`}
            >
              ← Back
            </button>
          </div>
        )}

        {/* DETAILS STEP */}
        {step === "details" && (
          <div className={`rounded-2xl border p-6 sm:p-8 ${cardBg}`}>
            <div className="text-center mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5b6ee1]/15 mb-4">
                <svg className="h-8 w-8 text-[#5b6ee1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h1 className={`text-xl font-bold ${textPrimary}`}>Confirm Your Details</h1>
              <p className={`mt-2 text-sm ${textMuted}`}>Pre-filled from ABHA. Please verify and add any missing info.</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Full Name</label>
                  <input value={data.name} onChange={(e) => update("name", e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#5b6ee1]/40`} />
                </div>
                <div className="w-24">
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Age</label>
                  <input value={data.age} onChange={(e) => update("age", e.target.value)} type="number" className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#5b6ee1]/40`} />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Gender</label>
                  <select value={data.gender} onChange={(e) => update("gender", e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#5b6ee1]/40`}>
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Blood Group</label>
                  <select value={data.blood_group} onChange={(e) => update("blood_group", e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#5b6ee1]/40`}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Phone</label>
                <input value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91-XXXXXXXXXX" className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#5b6ee1]/40`} />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Address</label>
                <input value={data.address} onChange={(e) => update("address", e.target.value)} placeholder="Village/City, District, State" className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#5b6ee1]/40`} />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Emergency Contact</label>
                <input value={data.emergency_contact} onChange={(e) => update("emergency_contact", e.target.value)} placeholder="Name - Phone" className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#5b6ee1]/40`} />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Known Allergies</label>
                <input value={data.known_allergies} onChange={(e) => update("known_allergies", e.target.value)} placeholder="e.g. Penicillin, Dust" className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#5b6ee1]/40`} />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Chronic Conditions</label>
                <input value={data.chronic_conditions} onChange={(e) => update("chronic_conditions", e.target.value)} placeholder="e.g. Diabetes, Hypertension" className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#5b6ee1]/40`} />
              </div>
            </div>

            <button
              onClick={completeOnboard}
              className="w-full mt-6 rounded-xl bg-[#5b6ee1] py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[#4c5fcc] transition-colors"
            >
              Complete Registration
            </button>

            <button
              onClick={() => { setStep("otp"); setError(""); }}
              className={`w-full mt-3 py-3 text-sm font-medium ${textMuted} hover:text-slate-900 dark:hover:text-white transition-colors`}
            >
              ← Back
            </button>
          </div>
        )}

        {/* COMPLETE STEP */}
        {step === "complete" && (
          <div className={`rounded-2xl border p-6 sm:p-8 ${cardBg}`}>
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#138808]/15 mb-5">
                <svg className="h-10 w-10 text-[#138808]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className={`text-2xl font-bold ${textPrimary}`}>You're All Set!</h1>
              <p className={`mt-3 text-sm ${textMuted}`}>
                Welcome, <span className={`font-semibold ${textPrimary}`}>{data.name || "Patient"}</span>. Your records are now linked.
              </p>
            </div>

            <div className={`mt-6 rounded-xl border p-4 ${isDark ? "border-halo-border bg-halo-bg" : "border-slate-100 bg-slate-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${textMuted}`}>Your Profile Summary</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "ABHA ID", value: data.abha_id },
                  { label: "Name", value: data.name },
                  { label: "Age/Gender", value: `${data.age}y, ${data.gender === "M" ? "Male" : data.gender === "F" ? "Female" : data.gender || "—"}` },
                  { label: "Blood Group", value: data.blood_group || "—" },
                  { label: "Phone", value: data.phone || "—" },
                  { label: "Emergency", value: data.emergency_contact || "—" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className={`text-xs ${textMuted}`}>{item.label}</p>
                    <p className={`font-medium ${textPrimary}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              {data.known_allergies && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-halo-border">
                  <p className="text-xs text-red-500 font-medium">⚠ Allergies: {data.known_allergies}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/app"
                className="w-full rounded-xl bg-[#FF9933] py-3.5 text-center text-sm font-semibold text-white shadow-md hover:bg-[#e68a2e] transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/consent"
                className={`w-full rounded-xl border py-3 text-center text-sm font-medium transition-colors ${isDark ? "border-halo-border text-halo-muted hover:bg-halo-card" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Manage ABHA Consent
              </Link>
              <Link
                href="/"
                className={`w-full py-3 text-center text-sm font-medium ${textMuted} hover:text-slate-900 dark:hover:text-white transition-colors`}
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
