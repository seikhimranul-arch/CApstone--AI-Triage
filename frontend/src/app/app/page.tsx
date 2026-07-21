"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import { PatientList } from "../../components/PatientList";
import { ClinicalSummaryPanel } from "../../components/ClinicalSummaryPanel";
import { useI18n } from "../../lib/i18n";
import type { PatientFile } from "../../lib/types";

export default function ChartReviewPage() {
  const { t } = useI18n();
  const [patients, setPatients] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summary, setSummary] = useState<any | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadSummary = async (patientId: string) => {
    setSelectedPatient(patientId);
    setSummaryLoading(true);
    setSummary(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.summary) setSummary(data.summary);
      }
    } catch (e) {
      console.error("Failed to load summary:", e);
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">{t("app.title")}</h1>
          <p className="text-sm text-slate-500">{t("app.subtitle")}</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Patient sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <PatientList
                patients={patients}
                onSelect={loadSummary}
                selectedId={selectedPatient}
                loading={loading}
              />
            </div>
          </aside>

          {/* Summary area */}
          <div className="lg:col-span-8 xl:col-span-9">
            {selectedPatient && summary ? (
              <ClinicalSummaryPanel
                summary={summary}
                onClose={() => {
                  setSelectedPatient(null);
                  setSummary(null);
                }}
              />
            ) : selectedPatient && summaryLoading ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
                <p className="text-slate-600">{t("home.generating_summary")}</p>
                <p className="mt-1 text-xs text-slate-400">{t("home.analyzing_fhir")}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm h-[600px] flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#E8F0FF]">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">{t("home.select_patient")}</h3>
                  <p className="text-slate-500">{t("home.select_patient_desc")}</p>
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-2xl font-bold text-[#2563EB]">{patients.length}</div>
                      <div className="text-xs text-slate-500">{t("home.stats.patients")}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-2xl font-bold text-[#14B8A6]">5</div>
                      <div className="text-xs text-slate-500">{t("home.stats.archetypes")}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-2xl font-bold text-purple-600">~3s</div>
                      <div className="text-xs text-slate-500">{t("home.stats.avg_response")}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
