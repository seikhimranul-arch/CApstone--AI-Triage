"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "../../lib/theme/ThemeContext";
import { useI18n } from "../../lib/i18n";

interface PatientFormData {
  name: string;
  age: string;
  gender: string;
  abha_id: string;
  phone: string;
  address: string;
  blood_group: string;
  chief_complaint: string;
  duration: string;
  history: string;
  bp_systolic: string;
  bp_diastolic: string;
  pulse: string;
  temperature: string;
  spo2: string;
  weight: string;
  height: string;
  notes: string;
}

const INITIAL: PatientFormData = {
  name: "", age: "", gender: "", abha_id: "", phone: "", address: "",
  blood_group: "", chief_complaint: "", duration: "", history: "",
  bp_systolic: "", bp_diastolic: "", pulse: "", temperature: "",
  spo2: "", weight: "", height: "", notes: "",
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const DURATIONS = ["< 1 day", "1-3 days", "4-7 days", "1-2 weeks", "2-4 weeks", "1-3 months", "> 3 months"];

export default function AdminPage() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === "dark";

  const [form, setForm] = useState<PatientFormData>(INITIAL);
  const [saved, setSaved] = useState(false);
  const [savedPatients, setSavedPatients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"add" | "list">("add");

  const bg = isDark ? "bg-halo-bg" : "bg-[#f7f5f0]";
  const cardBg = isDark ? "bg-halo-card border-halo-border" : "bg-white border-slate-200";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-halo-muted" : "text-slate-500";
  const inputBg = isDark ? "bg-halo-bg border-halo-border text-white placeholder-halo-muted" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400";
  const sectionLabel = isDark ? "text-halo-muted" : "text-slate-500";

  const update = (field: keyof PatientFormData, val: string) => setForm((p) => ({ ...p, [field]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.abha_id || !form.chief_complaint) return;
    const patient = { ...form, id: `manual_${Date.now()}`, created_at: new Date().toISOString() };
    setSavedPatients((prev) => [patient, ...prev]);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setForm(INITIAL);
  };

  const Input = ({ label, field, placeholder, type = "text", required = false, half = false }: any) => (
    <div className={half ? "flex-1 min-w-[140px]" : ""}>
      <label className={`block text-xs font-medium mb-1 ${sectionLabel}`}>{label}</label>
      <input
        type={type}
        value={form[field]}
        onChange={(e) => update(field, e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40`}
      />
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors ${bg}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9933]/15">
              <svg className="h-5 w-5 text-[#FF9933]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${textPrimary}`}>Admin Workspace</h1>
              <p className={`text-sm ${textMuted}`}>Patient data entry and management</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-slate-100 dark:bg-halo-card w-fit">
          {([
            { key: "add" as const, label: "Add Patient", icon: "M12 4.5v15m7.5-7.5h-15" },
            { key: "list" as const, label: `Onboarded (${savedPatients.length})`, icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? isDark ? "bg-halo-bg text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                  : textMuted
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Success Toast */}
        {saved && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            Patient saved successfully. Ready for next entry.
          </div>
        )}

        {/* ADD PATIENT TAB */}
        {activeTab === "add" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className={`rounded-xl border p-5 ${cardBg}`}>
              <h2 className={`flex items-center gap-2 text-base font-semibold mb-4 ${textPrimary}`}>
                <svg className="h-4 w-4 text-[#1a5276]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                Personal Information
              </h2>
              <div className="flex flex-wrap gap-4">
                <Input label="Full Name *" field="name" placeholder="e.g. Ravi Kumar" required half />
                <Input label="Age *" field="age" placeholder="e.g. 52" type="number" required half />
                <div className="flex-1 min-w-[140px]">
                  <label className={`block text-xs font-medium mb-1 ${sectionLabel}`}>Gender *</label>
                  <select
                    value={form.gender}
                    onChange={(e) => update("gender", e.target.value)}
                    required
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40`}
                  >
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className={`block text-xs font-medium mb-1 ${sectionLabel}`}>Blood Group</label>
                  <select
                    value={form.blood_group}
                    onChange={(e) => update("blood_group", e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40`}
                  >
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ABHA & Contact */}
            <div className={`rounded-xl border p-5 ${cardBg}`}>
              <h2 className={`flex items-center gap-2 text-base font-semibold mb-4 ${textPrimary}`}>
                <svg className="h-4 w-4 text-[#138808]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>
                ABHA & Contact
              </h2>
              <div className="flex flex-wrap gap-4">
                <Input label="ABHA ID (14-digit) *" field="abha_id" placeholder="e.g. 12345678901234" required half />
                <Input label="Phone Number" field="phone" placeholder="e.g. +91-98XXX-1234" half />
                <div className="w-full">
                  <label className={`block text-xs font-medium mb-1 ${sectionLabel}`}>Address</label>
                  <input
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="e.g. Kukatpally, Hyderabad, Telangana"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40`}
                  />
                </div>
              </div>
            </div>

            {/* Chief Complaint */}
            <div className={`rounded-xl border p-5 ${cardBg}`}>
              <h2 className={`flex items-center gap-2 text-base font-semibold mb-4 ${textPrimary}`}>
                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                Chief Complaint
              </h2>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className={`block text-xs font-medium mb-1 ${sectionLabel}`}>Complaint *</label>
                  <input
                    value={form.chief_complaint}
                    onChange={(e) => update("chief_complaint", e.target.value)}
                    placeholder="e.g. Fever with cough for 5 days"
                    required
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40`}
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className={`block text-xs font-medium mb-1 ${sectionLabel}`}>Duration</label>
                  <select
                    value={form.duration}
                    onChange={(e) => update("duration", e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40`}
                  >
                    <option value="">Select</option>
                    {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className={`block text-xs font-medium mb-1 ${sectionLabel}`}>Relevant History</label>
                <textarea
                  value={form.history}
                  onChange={(e) => update("history", e.target.value)}
                  placeholder="e.g. Known case of DM on Metformin, non-compliant"
                  rows={2}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors resize-none ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40`}
                />
              </div>
            </div>

            {/* Vitals */}
            <div className={`rounded-xl border p-5 ${cardBg}`}>
              <h2 className={`flex items-center gap-2 text-base font-semibold mb-4 ${textPrimary}`}>
                <svg className="h-4 w-4 text-[#5b6ee1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                Vitals
              </h2>
              <div className="flex flex-wrap gap-4">
                <Input label="BP Systolic" field="bp_systolic" placeholder="e.g. 150" type="number" half />
                <Input label="BP Diastolic" field="bp_diastolic" placeholder="e.g. 95" type="number" half />
                <Input label="Pulse (bpm)" field="pulse" placeholder="e.g. 88" type="number" half />
                <Input label="Temp (°C)" field="temperature" placeholder="e.g. 101.2" type="number" half />
                <Input label="SpO2 (%)" field="spo2" placeholder="e.g. 96" type="number" half />
                <Input label="Weight (kg)" field="weight" placeholder="e.g. 68" type="number" half />
                <Input label="Height (cm)" field="height" placeholder="e.g. 165" type="number" half />
              </div>
            </div>

            {/* Clinical Notes */}
            <div className={`rounded-xl border p-5 ${cardBg}`}>
              <h2 className={`flex items-center gap-2 text-base font-semibold mb-4 ${textPrimary}`}>
                <svg className="h-4 w-4 text-[#FF9933]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                Clinical Notes
              </h2>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Additional observations, provisional diagnosis, treatment plan..."
                rows={3}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors resize-none ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#FF9933]/40`}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-[#FF9933] px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#e68a2e] transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Save Patient Record
              </button>
              <Link
                href="/triage"
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-halo-border px-6 py-3 text-sm font-medium text-slate-700 dark:text-halo-muted hover:bg-slate-50 dark:hover:bg-halo-card transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                Run Triage
              </Link>
              <Link
                href="/review"
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-halo-border px-6 py-3 text-sm font-medium text-slate-700 dark:text-halo-muted hover:bg-slate-50 dark:hover:bg-halo-card transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                Doctor Override
              </Link>
            </div>
          </form>
        )}

        {/* LIST TAB */}
        {activeTab === "list" && (
          <div className={`rounded-xl border ${cardBg}`}>
            {savedPatients.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="mx-auto h-10 w-10 text-slate-300 dark:text-halo-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                <p className={`mt-3 text-sm ${textMuted}`}>No patients onboarded yet in this session.</p>
                <button onClick={() => setActiveTab("add")} className="mt-4 text-sm font-medium text-[#FF9933] hover:underline">Add first patient</button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-halo-border">
                {savedPatients.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${isDark ? "bg-halo-bg text-halo-muted" : "bg-slate-100 text-slate-600"}`}>
                        {p.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${textPrimary}`}>{p.name}</p>
                        <p className={`text-xs ${textMuted}`}>{p.age}y, {p.gender === "M" ? "Male" : "Female"} &middot; ABHA: {p.abha_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${isDark ? "bg-[#5b6ee1]/15 text-[#818cf8]" : "bg-[#1a5276]/10 text-[#1a5276]"}`}>
                        {p.chief_complaint}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8">
          <p className={`text-xs font-semibold uppercase tracking-widest mb-4 ${sectionLabel}`}>Quick Links</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/consent", label: "ABHA Consent", desc: "Link patient records", color: "bg-[#138808]", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
              { href: "/triage", label: "Triage AI", desc: "Severity assessment", color: "bg-red-500", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
              { href: "/review", label: "Doctor Override", desc: "Review & modify decisions", color: "bg-[#5b6ee1]", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" },
              { href: "/onboard", label: "Patient Portal", desc: "Self-onboarding flow", color: "bg-[#FF9933]", icon: "M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`group rounded-xl border p-4 transition-all hover:shadow-md ${cardBg}`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${link.color} mb-3`}>
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                </div>
                <p className={`text-sm font-medium ${textPrimary}`}>{link.label}</p>
                <p className={`text-xs ${textMuted}`}>{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
