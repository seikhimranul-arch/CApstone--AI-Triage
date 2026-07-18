"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PatientList } from "../components/PatientList";
import { ClinicalSummaryPanel } from "../components/ClinicalSummaryPanel";
import { useI18n } from "../lib/i18n";
import { LanguageSelector } from "../components/LanguageSelector";

export interface PatientFile {
  filename: string;
  archetype: string;
  id: string;
  age: number;
  gender: string;
  name: string;
}

export interface PatientSummary {
  patient_id: string;
  one_liner: string;
  active_problems: Array<{code?: string; display?: string; clinical_status?: string}>;
  red_flags: Array<{type: "critical" | "warning" | "info"; key: string; message: string; value?: number; unit?: string; threshold?: number}>;
  chronic_snapshot: Record<string, {last_hba1c?: string; last_bp?: string; last_weight?: string; control?: string; trend?: string; weight_loss_5pct?: boolean}>;
  medications: Array<{name: string; dose: string; status?: string}>;
  missing_data: string[];
  encounter_count: number;
  last_encounter_days: number | null;
}

export default function HomePage() {
  const { t, locale } = useI18n();
  const [patients, setPatients] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (patientId: string) => {
    setSelectedPatient(patientId);
    setSummaryLoading(true);
    setSummary(null);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('home.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                🏥
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('app.title')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('app.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Link href="/triage" className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">
                🔍 {t('header.triage_button')}
              </Link>
              <Link href="/review" className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                ✍️ {t('header.review_button')}
              </Link>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">{t('header.demo_mode')}</span>
              <span>•</span>
              <span>{t('header.patients_count', { count: patients.length })}</span>
              <span>•</span>
              <span>{t('header.gemini')}</span>
              <LanguageSelector className="ml-2" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Patient List Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <PatientList
                patients={patients}
                onSelect={loadSummary}
                selectedId={selectedPatient}
                loading={loading}
              />
            </div>
          </aside>

          {/* Clinical Summary Panel */}
          <div className="lg:col-span-8 xl:col-span-9">
            {selectedPatient && summary ? (
              <ClinicalSummaryPanel summary={summary} onClose={() => { setSelectedPatient(null); setSummary(null); }} />
            ) : selectedPatient && summaryLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">{t('home.generating_summary')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('home.analyzing_fhir')}</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-[600px] flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('home.select_patient')}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('home.select_patient_desc')}
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{patients.length}</div>
                      <div className="text-xs text-gray-500">{t('home.stats.patients')}</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">5</div>
                      <div className="text-xs text-gray-500">{t('home.stats.archetypes')}</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">~3s</div>
                      <div className="text-xs text-gray-500">{t('home.stats.avg_response')}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{t('footer.chart_review')}</p>
          <p className="mt-1">{t('footer.karpathy')}</p>
        </div>
      </footer>
    </div>
  );
}