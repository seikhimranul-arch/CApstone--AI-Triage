"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import { ClinicalSummaryPanel } from "../../components/ClinicalSummaryPanel";
import { useI18n } from "../../lib/i18n";
import { useTheme } from "../../lib/theme/ThemeContext";
import type { PatientFile } from "../../lib/types";

const ARCHETYPE_LABELS: Record<string, string> = {
  uncontrolled_dm: "Uncontrolled DM",
  missed_tb_fu: "Missed TB FU",
  polypharmacy_elderly: "Polypharmacy",
  high_risk_anc: "High-Risk ANC",
  faltering_growth: "Faltering Growth",
};

const ARCHETYPE_COLORS: Record<string, string> = {
  uncontrolled_dm: "bg-red-100 text-red-700",
  missed_tb_fu: "bg-orange-100 text-orange-700",
  polypharmacy_elderly: "bg-purple-100 text-purple-700",
  high_risk_anc: "bg-blue-100 text-blue-700",
  faltering_growth: "bg-green-100 text-green-700",
};

const ARCHETYPE_DOTS: Record<string, string> = {
  uncontrolled_dm: "bg-red-500",
  missed_tb_fu: "bg-orange-500",
  polypharmacy_elderly: "bg-purple-500",
  high_risk_anc: "bg-blue-500",
  faltering_growth: "bg-green-500",
};

const COMPLAINTS: Record<string, string> = {
  uncontrolled_dm: "Fever, shortness of breath",
  missed_tb_fu: "Persistent cough, weight loss",
  polypharmacy_elderly: "Headache, dizziness, edema",
  high_risk_anc: "Edema, fatigue, bleeding",
  faltering_growth: "Poor feeding, irritability",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  new: "bg-blue-100 text-blue-700",
  defaulted: "bg-red-100 text-red-700",
  review: "bg-yellow-100 text-yellow-700",
};

const LAB_STATUS_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  LOW: "bg-yellow-100 text-yellow-700",
  NORMAL: "bg-green-100 text-green-700",
  BORDERLINE: "bg-orange-100 text-orange-700",
  INFO: "bg-slate-100 text-slate-600",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface AbhaRecords { vitals_history: any[]; consultations: any[]; lab_reports: any[]; medications: any[]; allergies: string[]; chronic_conditions: Record<string, any>; }

export default function ChartReviewPage() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [patients, setPatients] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summary, setSummary] = useState<any | null>(null);
  const [abhaRecords, setAbhaRecords] = useState<AbhaRecords | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "vitals" | "labs" | "consultations" | "medications">("overview");

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.archetype === filter;
    return matchSearch && matchFilter;
  });

  const loadPatient = async (patientId: string) => {
    setSelectedPatient(patientId);
    setSummaryLoading(true);
    setSummary(null);
    setAbhaRecords(null);
    setActiveTab("overview");
    try {
      const [sumRes, abhaRes] = await Promise.all([
        fetch("/api/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient_id: patientId }) }),
        fetch(`/api/patients/${patientId}/abha-records`),
      ]);
      const sumData = await sumRes.json();
      const abhaData = await abhaRes.json();
      if (sumData.success) {
        setSummary(sumData.summary);
        setShowSummary(true);
      }
      setAbhaRecords(abhaData);
    } catch (e) {
      console.error("Failed to load patient:", e);
    } finally {
      setSummaryLoading(false);
    }
  };

  const selected = patients.find((p) => p.id === selectedPatient);
  const latestVitals = abhaRecords?.vitals_history?.[0];

  return (
    <AppShell>
      <div className="flex h-full">
        {/* Left: Patient Queue */}
        <div className={`w-full max-w-sm flex-shrink-0 flex flex-col ${isDark ? "bg-halo-sidebar border-r border-halo-border" : "border-r border-slate-200/60 bg-white/50"}`}>
          <div className={`px-4 py-4 ${isDark ? "border-b border-halo-border" : "border-b border-slate-100"}`}>
            <h1 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Dashboard</h1>
            <p className={`text-xs ${isDark ? "text-halo-muted" : "text-slate-400"}`}>PHC Kukatpally · Patient queue</p>
          </div>
          <div className={`grid grid-cols-3 gap-2 px-4 py-3 ${isDark ? "border-b border-halo-border" : "border-b border-slate-100"}`}>
            <div className="text-center"><p className="text-2xl font-bold text-[#5b6ee1]">{patients.length}</p><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>Total</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-[#22c55e]">{patients.filter(p => p.abha_id).length}</p><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>ABHA</p></div>
            <div className="text-center"><p className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>5</p><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>Types</p></div>
          </div>
          <div className="px-4 py-3">
            <div className="relative">
              <svg className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-halo-muted" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient..." className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 ${
                isDark
                  ? "border-halo-border bg-halo-card text-white placeholder:text-halo-muted focus:border-[#5b6ee1] focus:ring-[#5b6ee1]/30"
                  : "border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#1a5276] focus:ring-blue-100"
              }`} />
            </div>
          </div>
          <div className="flex gap-1.5 px-4 pb-3">
            {[{ key: "all", label: "All" }, { key: "uncontrolled_dm", label: "DM" }, { key: "missed_tb_fu", label: "TB" }, { key: "polypharmacy_elderly", label: "Poly" }, { key: "high_risk_anc", label: "ANC" }, { key: "faltering_growth", label: "Peds" }].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                filter === f.key
                  ? isDark ? "bg-[#5b6ee1] text-white shadow-sm" : "bg-[#1a5276] text-white shadow-sm"
                  : isDark ? "bg-halo-card text-halo-muted hover:bg-halo-card-hover" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>{f.label}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-12"><div className={`h-8 w-8 animate-spin rounded-full border-2 ${isDark ? "border-[#5b6ee1] border-t-transparent" : "border-[#1a5276] border-t-transparent"}`} /></div>
            ) : filtered.length === 0 ? (
              <p className={`py-8 text-center text-sm ${isDark ? "text-halo-muted" : "text-slate-400"}`}>No patients found</p>
            ) : filtered.map((patient) => (
              <button key={patient.id} onClick={() => loadPatient(patient.id)} className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                selectedPatient === patient.id
                  ? isDark
                    ? "border-[#5b6ee1] bg-[#5b6ee1]/10 shadow-md shadow-[#5b6ee1]/10"
                    : "border-[#1a5276] bg-blue-50 shadow-md shadow-blue-100"
                  : isDark
                    ? "border-halo-border bg-halo-card hover:border-halo-border hover:bg-halo-card-hover"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${
                    selectedPatient === patient.id
                      ? isDark ? "bg-[#5b6ee1]" : "bg-[#1a5276]"
                      : isDark ? "bg-halo-muted/30" : "bg-slate-400"
                  }`}>{patient.name?.charAt(0) || "P"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}>{patient.name || patient.id}</p>
                    </div>
                    <p className={`text-xs ${isDark ? "text-halo-muted" : "text-slate-500"}`}>{patient.age}{patient.gender === "M" ? "M" : patient.gender === "F" ? "F" : ""}</p>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${ARCHETYPE_COLORS[patient.archetype] || ""}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ARCHETYPE_DOTS[patient.archetype] || ""}`} />
                        {ARCHETYPE_LABELS[patient.archetype] || patient.archetype}
                      </span>
                      {patient.abha_id && <span className="inline-flex items-center rounded-md bg-[#22c55e]/10 px-2 py-0.5 text-[10px] font-medium text-[#22c55e]">ABHA</span>}
                    </div>
                    <p className={`mt-1 text-[11px] truncate ${isDark ? "text-halo-muted" : "text-slate-400"}`}>{COMPLAINTS[patient.archetype] || "General consultation"}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Patient Detail */}
        <div className={`flex-1 overflow-y-auto ${isDark ? "bg-halo-bg" : "bg-[#f7f5f0]"}`}>
          {summaryLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className={`mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 ${isDark ? "border-[#5b6ee1] border-t-transparent" : "border-[#1a5276] border-t-transparent"}`} />
                <p className={`text-sm ${isDark ? "text-halo-muted" : "text-slate-500"}`}>Loading ABHA records & generating AI summary...</p>
              </div>
            </div>
          ) : selected && summary && abhaRecords ? (
            <div className="p-6 space-y-6">
              {/* Patient Header */}
              <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? "border-halo-border bg-halo-card" : "border-slate-200 bg-white"}`}>
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF9933] via-[#1a5276] to-[#138808] text-lg font-bold text-white">{selected.name?.charAt(0) || "P"}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{selected.name || selected.id}</h2>
                      {selected.abha_id && <span className="inline-flex items-center gap-1 rounded-full bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold text-[#22c55e]"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>ABHA Verified</span>}
                    </div>
                    <p className={`text-sm ${isDark ? "text-halo-muted" : "text-slate-500"}`}>
                      {selected.age ? `${selected.age}y` : ""}
                      {selected.gender ? ` · ${selected.gender === "M" ? "Male" : selected.gender === "F" ? "Female" : selected.gender}` : ""}
                      {selected.address ? ` · ${selected.address}` : ""}
                    </p>
                    {selected.abha_id && <p className="text-xs text-slate-400 mt-0.5">ABHA: {selected.abha_id}{selected.phone ? ` · Phone: ${selected.phone}` : ""}</p>}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${ARCHETYPE_COLORS[selected.archetype]}`}>{ARCHETYPE_LABELS[selected.archetype]}</span>
                    <p className="mt-1 text-xs text-slate-400">#{selected.id.split("_").pop()}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className={`flex items-center gap-2 rounded-xl p-1 shadow-sm ${isDark ? "border border-halo-border bg-halo-card" : "border border-slate-200 bg-white"}`}>
                <div className="flex flex-1 gap-1">
                  {(["overview", "vitals", "labs", "consultations", "medications"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all capitalize ${
                      activeTab === tab
                        ? isDark ? "bg-[#5b6ee1] text-white shadow-sm" : "bg-[#1a5276] text-white shadow-sm"
                        : isDark ? "text-halo-muted hover:bg-halo-card-hover" : "text-slate-600 hover:bg-slate-50"
                    }`}>{tab}</button>
                  ))}
                </div>
                {/* Language Switcher */}
                <div className={`flex items-center gap-1 rounded-lg px-2 py-1 ${isDark ? "bg-halo-bg" : "bg-slate-100"}`}>
                  <button
                    onClick={() => { if (typeof window !== "undefined") localStorage.setItem("sehat-lang", "en"); window.location.reload(); }}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      (typeof window !== "undefined" && localStorage.getItem("sehat-lang")) !== "hi"
                        ? isDark ? "bg-[#5b6ee1] text-white" : "bg-[#1a5276] text-white"
                        : isDark ? "text-halo-muted hover:text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >EN</button>
                  <button
                    onClick={() => { if (typeof window !== "undefined") localStorage.setItem("sehat-lang", "hi"); window.location.reload(); }}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      (typeof window !== "undefined" && localStorage.getItem("sehat-lang")) === "hi"
                        ? isDark ? "bg-[#5b6ee1] text-white" : "bg-[#1a5276] text-white"
                        : isDark ? "text-halo-muted hover:text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >HI</button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {showSummary && summary && (
                    <ClinicalSummaryPanel summary={summary} onClose={() => setShowSummary(false)} />
                  )}

                  {/* Reopen Summary Button */}
                  {!showSummary && summary && (
                    <button
                      onClick={() => setShowSummary(true)}
                      className={`w-full rounded-2xl border-2 border-dashed p-4 text-left transition-all hover:shadow-md ${
                        isDark ? "border-[#5b6ee1]/30 hover:border-[#5b6ee1]/60 bg-halo-card" : "border-[#1a5276]/20 hover:border-[#1a5276]/40 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDark ? "bg-[#5b6ee1]/15" : "bg-[#1a5276]/10"}`}>
                          <svg className={`h-5 w-5 ${isDark ? "text-[#818cf8]" : "text-[#1a5276]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>View AI Clinical Summary</p>
                          <p className={`text-xs ${isDark ? "text-halo-muted" : "text-slate-500"}`}>Click to review red flags, medications & active problems</p>
                        </div>
                        <svg className={`ml-auto h-4 w-4 ${isDark ? "text-halo-muted" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                      </div>
                    </button>
                  )}

                  {/* Latest Vitals Card */}
                  {latestVitals && (
                    <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? "border-halo-border bg-halo-card" : "border-slate-200 bg-white"}`}>
                      <h3 className={`mb-4 text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Current Vitals · {latestVitals.date}</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {latestVitals.bp_systolic && <div className={`rounded-xl p-3 text-center ${isDark ? "bg-halo-bg" : "bg-slate-50"}`}><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>BP</p><p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{latestVitals.bp_systolic}/{latestVitals.bp_diastolic}</p><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>mmHg</p></div>}
                        {latestVitals.pulse && <div className={`rounded-xl p-3 text-center ${isDark ? "bg-halo-bg" : "bg-slate-50"}`}><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>Pulse</p><p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{latestVitals.pulse}</p><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>bpm</p></div>}
                        {latestVitals.temperature && <div className={`rounded-xl p-3 text-center ${isDark ? "bg-halo-bg" : "bg-slate-50"}`}><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>Temp</p><p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{latestVitals.temperature}</p><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>°C</p></div>}
                        {latestVitals.spo2 && <div className={`rounded-xl p-3 text-center ${isDark ? "bg-halo-bg" : "bg-slate-50"}`}><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>SpO2</p><p className={`text-lg font-bold ${latestVitals.spo2 < 95 ? "text-red-500" : isDark ? "text-white" : "text-slate-900"}`}>{latestVitals.spo2}%</p></div>}
                        {latestVitals.weight && <div className={`rounded-xl p-3 text-center ${isDark ? "bg-halo-bg" : "bg-slate-50"}`}><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>Weight</p><p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{latestVitals.weight}</p><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>kg</p></div>}
                        {latestVitals.height && <div className={`rounded-xl p-3 text-center ${isDark ? "bg-halo-bg" : "bg-slate-50"}`}><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>Height</p><p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{latestVitals.height}</p><p className={`text-[10px] ${isDark ? "text-halo-muted" : "text-slate-400"}`}>cm</p></div>}
                      </div>
                      {latestVitals.note && <p className={`mt-3 text-xs italic ${isDark ? "text-halo-muted" : "text-slate-500"}`}>Note: {latestVitals.note}</p>}
                    </div>
                  )}

                  {/* Chronic Conditions */}
                  {Object.keys(abhaRecords.chronic_conditions).length > 0 && (
                    <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? "border-halo-border bg-halo-card" : "border-slate-200 bg-white"}`}>
                      <h3 className={`mb-4 text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Chronic Conditions</h3>
                      <div className="space-y-3">
                        {Object.entries(abhaRecords.chronic_conditions).map(([cond, info]: [string, any]) => (
                          <div key={cond} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${isDark ? "border-halo-border bg-halo-bg" : "border-slate-100 bg-slate-50"}`}>
                            <div className="flex items-center gap-3">
                              <div className={`h-2 w-2 rounded-full ${info.status === "uncontrolled" || info.status === "defaulted" || info.status === "SAM" ? "bg-red-500" : info.status === "controlled" ? "bg-green-500" : "bg-blue-500"}`} />
                              <div>
                                <p className={`text-sm font-medium capitalize ${isDark ? "text-white" : "text-slate-900"}`}>{cond.replace(/_/g, " ")}</p>
                                <p className={`text-xs ${isDark ? "text-halo-muted" : "text-slate-400"}`}>Since {info.since}</p>
                              </div>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${info.status === "uncontrolled" || info.status === "defaulted" || info.status === "SAM" ? "bg-red-100 text-red-700" : info.status === "controlled" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{info.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Allergies */}
                  <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? "border-halo-border bg-halo-card" : "border-slate-200 bg-white"}`}>
                    <h3 className={`mb-3 text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Allergies</h3>
                    <div className="flex flex-wrap gap-2">
                      {abhaRecords.allergies.map((a: string, i: number) => (
                        <span key={i} className={`rounded-full px-3 py-1 text-xs font-medium ${a.includes("No known") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "vitals" && (
                <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? "border-halo-border bg-halo-card" : "border-slate-200 bg-white"}`}>
                  <h3 className={`mb-4 text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Vitals Trend</h3>
                  <div className="space-y-3">
                    {abhaRecords.vitals_history.map((v: any, i: number) => (
                      <div key={i} className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${isDark ? "border-halo-border bg-halo-bg" : "border-slate-100 bg-slate-50"}`}>
                        <div className={`w-20 text-xs font-medium ${isDark ? "text-halo-muted" : "text-slate-500"}`}>{v.date}</div>
                        <div className={`flex flex-wrap gap-3 text-sm`}>
                          {v.bp_systolic && <span className={`font-medium ${isDark ? "text-halo-text" : "text-slate-700"}`}>BP: {v.bp_systolic}/{v.bp_diastolic}</span>}
                          {v.pulse && <span className={isDark ? "text-halo-muted" : "text-slate-500"}>HR: {v.pulse}</span>}
                          {v.temperature && <span className={isDark ? "text-halo-muted" : "text-slate-500"}>T: {v.temperature}°C</span>}
                          {v.spo2 && <span className={`font-medium ${v.spo2 < 95 ? "text-red-500" : isDark ? "text-halo-text" : "text-slate-700"}`}>SpO2: {v.spo2}%</span>}
                          {v.weight && <span className={isDark ? "text-halo-muted" : "text-slate-500"}>Wt: {v.weight}kg</span>}
                        </div>
                        {v.note && <p className={`ml-auto text-[11px] max-w-xs truncate ${isDark ? "text-halo-muted" : "text-slate-400"}`}>{v.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "labs" && (
                <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? "border-halo-border bg-halo-card" : "border-slate-200 bg-white"}`}>
                  <h3 className={`mb-4 text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Lab Reports</h3>
                  <div className="space-y-2">
                    {abhaRecords.lab_reports.map((lab: any, i: number) => (
                      <div key={i} className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${isDark ? "border-halo-border bg-halo-bg" : "border-slate-100 bg-slate-50"}`}>
                        <div className={`w-20 text-xs ${isDark ? "text-halo-muted" : "text-slate-400"}`}>{lab.date}</div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{lab.test}</p>
                          <p className={`text-xs ${isDark ? "text-halo-muted" : "text-slate-400"}`}>{lab.lab}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${LAB_STATUS_COLORS[lab.status] || ""}`}>{lab.result}</span>
                        <span className={`text-[10px] w-24 text-right ${isDark ? "text-halo-muted" : "text-slate-400"}`}>Ref: {lab.reference}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "consultations" && (
                <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? "border-halo-border bg-halo-card" : "border-slate-200 bg-white"}`}>
                  <h3 className={`mb-4 text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Consultation History</h3>
                  <div className="space-y-4">
                    {abhaRecords.consultations.map((c: any, i: number) => (
                      <div key={i} className={`rounded-xl border p-4 ${isDark ? "border-halo-border bg-halo-bg" : "border-slate-100 bg-slate-50"}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{c.date}</span>
                          <span className={`text-xs ${isDark ? "text-halo-muted" : "text-slate-400"}`}>{c.provider}</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div><span className={`font-medium ${isDark ? "text-halo-text" : "text-slate-600"}`}>CC: </span><span className={isDark ? "text-halo-text" : "text-slate-700"}>{c.chief_complaint}</span></div>
                          <div><span className={`font-medium ${isDark ? "text-halo-text" : "text-slate-600"}`}>Examination: </span><span className={isDark ? "text-halo-text" : "text-slate-700"}>{c.examination}</span></div>
                          <div><span className={`font-medium ${isDark ? "text-halo-text" : "text-slate-600"}`}>Assessment: </span><span className={isDark ? "text-halo-text" : "text-slate-700"}>{c.assessment}</span></div>
                          <div><span className={`font-medium ${isDark ? "text-halo-text" : "text-slate-600"}`}>Plan: </span><span className={isDark ? "text-halo-text" : "text-slate-700"}>{c.plan}</span></div>
                          {c.referral && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">↗ Referral: {c.referral}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "medications" && (
                <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? "border-halo-border bg-halo-card" : "border-slate-200 bg-white"}`}>
                  <h3 className={`mb-4 text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Medications</h3>
                  <div className="space-y-2">
                    {abhaRecords.medications.map((med: any, i: number) => (
                      <div key={i} className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${isDark ? "border-halo-border bg-halo-bg" : "border-slate-100 bg-slate-50"}`}>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{med.name}</p>
                          <p className={`text-xs ${isDark ? "text-halo-muted" : "text-slate-400"}`}>{med.dose} · {med.frequency}</p>
                        </div>
                        <span className={`text-xs ${isDark ? "text-halo-muted" : "text-slate-400"}`}>Since {med.since}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[med.status] || "bg-slate-100 text-slate-600"}`}>{med.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : selected ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className={`mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 ${isDark ? "border-[#5b6ee1] border-t-transparent" : "border-[#1a5276] border-t-transparent"}`} />
                <p className={`text-sm ${isDark ? "text-halo-muted" : "text-slate-500"}`}>Loading {selected.name}...</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center px-8">
                <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl ${isDark ? "bg-[#5b6ee1]/10" : "bg-gradient-to-br from-[#1a5276]/10 to-[#138808]/10"}`}>
                  <svg className={`h-10 w-10 ${isDark ? "text-[#818cf8]" : "text-[#1a5276]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                </div>
                <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Select a Patient</h3>
                <p className={`mt-2 text-sm ${isDark ? "text-halo-muted" : "text-slate-500"}`}>Click on a patient to view their ABHA-linked health records, AI clinical summary, vitals trend, lab reports, and consultation history.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
