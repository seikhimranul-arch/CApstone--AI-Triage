"use client";

import { X } from "lucide-react";

interface RedFlag {
  type: "critical" | "warning" | "info";
  key: string;
  message: string;
  value?: number | null;
  unit?: string;
  threshold?: number;
}

interface ChronicSnapshotData {
  last_hba1c?: string;
  last_bp?: string;
  last_weight?: string;
  control?: string;
  trend?: string;
  weight_loss_5pct?: boolean;
}

interface ActiveProblem {
  code?: string;
  display?: string;
  clinical_status?: string;
}

interface Medication {
  name: string;
  dose: string;
  status?: string;
}

interface ClinicalSummaryPanelProps {
  summary: {
    patient_id: string;
    one_liner: string;
    active_problems: ActiveProblem[];
    red_flags: RedFlag[];
    chronic_snapshot: Record<string, ChronicSnapshotData>;
    medications: Medication[];
    missing_data: string[];
    encounter_count: number;
    last_encounter_days: number | null;
  };
  onClose: () => void;
}

const FLAG_COLORS = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
};

const CHRONIC_COLORS: Record<string, string> = {
  diabetes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  hypertension: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  tuberculosis: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  pregnancy: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  malnutrition: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export function ClinicalSummaryPanel({ summary, onClose }: ClinicalSummaryPanelProps) {
  const criticalFlags = summary.red_flags?.filter((f) => f.type === "critical") || [];
  const warningFlags = summary.red_flags?.filter((f) => f.type === "warning") || [];
  const infoFlags = summary.red_flags?.filter((f) => f.type === "info") || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Clinical Summary</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Patient ID: {summary.patient_id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* One-Liner */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border-l-4 border-blue-500">
            <p className="text-lg font-medium text-gray-900 dark:text-white">{summary.one_liner}</p>
          </div>

          {/* Red Flags */}
          {(criticalFlags.length > 0 || warningFlags.length > 0 || infoFlags.length > 0) && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Red Flags ({criticalFlags.length + warningFlags.length + infoFlags.length})
              </h3>
              <div className="space-y-2">
                {criticalFlags.map((flag, i) => (
                  <div key={i} className={`px-4 py-3 rounded-xl border ${FLAG_COLORS.critical}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-red-600 dark:text-red-400 font-bold mt-0.5">🔴</span>
                      <div className="flex-1">
                        <p className="font-medium">{flag.message}</p>
                        {flag.value !== undefined && flag.value !== null && (
                          <p className="text-sm opacity-80 mt-0.5">
                            Value: {flag.value} {flag.unit || ""} • Threshold: {flag.threshold} {flag.unit || ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {warningFlags.map((flag, i) => (
                  <div key={i} className={`px-4 py-3 rounded-xl border ${FLAG_COLORS.warning}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold mt-0.5">🟡</span>
                      <div className="flex-1">
                        <p className="font-medium">{flag.message}</p>
                        {flag.value !== undefined && flag.value !== null && (
                          <p className="text-sm opacity-80 mt-0.5">
                            Value: {flag.value} {flag.unit || ""} • Threshold: {flag.threshold} {flag.unit || ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {infoFlags.map((flag, i) => (
                  <div key={i} className={`px-4 py-3 rounded-xl border ${FLAG_COLORS.info}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">🔵</span>
                      <div className="flex-1">
                        <p className="font-medium">{flag.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Chronic Disease Snapshot */}
          {summary.chronic_snapshot && Object.keys(summary.chronic_snapshot).length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Chronic Disease Snapshot</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(summary.chronic_snapshot).map(([key, data]) => (
                  <div key={key} className={`px-4 py-3 rounded-xl ${CHRONIC_COLORS[key] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}>
                    <div className="font-medium capitalize">{key.replace("_", " ")}</div>
                    <div className="text-sm mt-1 space-y-0.5">
                      {data.last_hba1c && <span>HbA1c: {data.last_hba1c}</span>}
                      {data.last_bp && <span>BP: {data.last_bp}</span>}
                      {data.last_weight && <span>Weight: {data.last_weight}</span>}
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-white/50 dark:bg-gray-600/50">
                        {data.control || data.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active Problems */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Active Problems</h3>
            <div className="flex flex-wrap gap-2">
              {summary.active_problems?.map((p, i) => (
                <span key={i} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-sm rounded-lg">
                  {p.display} <span className="text-xs text-gray-500">({p.clinical_status})</span>
                </span>
              ))}
            </div>
          </section>

          {/* Medications */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Current Medications ({summary.medications?.length || 0})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {summary.medications?.map((m, i) => (
                <div key={i} className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{m.dose}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Missing Data */}
          {summary.missing_data && summary.missing_data.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                Missing / Needed Data
              </h3>
              <ul className="space-y-1">
                {summary.missing_data.map((item, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-1.5"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Footer Stats */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>📋 Encounters: {summary.encounter_count}</span>
            <span>⏱ Last visit: {summary.last_encounter_days !== null ? `${summary.last_encounter_days}d ago` : "Unknown"}</span>
            <span>🆔 Patient ID: {summary.patient_id}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex gap-2">
          <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            📋 Export Summary
          </button>
          <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            📅 Schedule Follow-up
          </button>
          <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            💊 Review Medications
          </button>
        </div>
      </div>
    </div>
  );
}