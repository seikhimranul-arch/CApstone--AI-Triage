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

interface SummaryCardProps {
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
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const CHRONIC_COLORS: Record<string, string> = {
  diabetes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  hypertension: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  tuberculosis: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

interface Medication {
  name: string;
  dose: string;
  status?: string;
}

export function SummaryCard({ summary, onClose }: SummaryCardProps) {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Clinical Summary
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Patient ID: {summary.patient_id}
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* One-Liner */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
        <p className="text-lg font-medium text-gray-900 dark:text-white">{summary.one_liner}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Red Flags */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Red Flags ({summary.red_flags?.length || 0})
          </h3>
          <div className="space-y-2">
            {summary.red_flags?.map((flag, i) => (
              <div key={i} className={`px-3 py-2 rounded-lg text-sm ${FLAG_COLORS[flag.type] || FLAG_COLORS.info}`}>
                <div className="font-medium">{flag.message}</div>
                {flag.value !== null && flag.value !== undefined && (
                  <div className="text-xs opacity-80 mt-0.5">
                    Value: {flag.value} {flag.unit || ""} • Threshold: {flag.threshold} {flag.unit || ""}
                  </div>
                )}
              </div>
            ))}
            {(!summary.red_flags || summary.red_flags.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No red flags detected</p>
            )}
          </div>
        </section>

        {/* Chronic Snapshot */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Chronic Disease Snapshot
          </h3>
          <div className="space-y-3">
            {Object.entries(summary.chronic_snapshot || {}).map(([key, data]) => (
              <div key={key} className={`px-3 py-3 rounded-lg ${CHRONIC_COLORS[key] || "bg-gray-100 dark:bg-gray-700"}`}>
                <div className="font-medium capitalize">{key.replace("_", " ")}</div>
                <div className="text-sm mt-1">
                  {data.last_hba1c && <span>HbA1c: {data.last_hba1c}</span>}
                  {data.last_bp && <span className={data.last_hba1c ? "mx-2" : ""}>BP: {data.last_bp}</span>}
                  {data.last_weight && <span>Weight: {data.last_weight}</span>}
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white/50 dark:bg-gray-600/50">
                    {data.control || data.trend}
                  </span>
                </div>
              </div>
            ))}
            {Object.keys(summary.chronic_snapshot || {}).length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No chronic conditions tracked</p>
            )}
          </div>
        </section>

        {/* Active Problems */}
        <section className="md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Active Problems
          </h3>
          <div className="flex flex-wrap gap-2">
            {summary.active_problems?.map((p, i) => (
              <span key={i} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-sm rounded-lg">
                {p.display} <span className="text-xs text-gray-500">({p.clinical_status})</span>
              </span>
            ))}
            {(!summary.active_problems || summary.active_problems.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No active problems</p>
            )}
          </div>
        </section>

        {/* Medications */}
        <section className="md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Current Medications ({summary.medications?.length || 0})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {summary.medications?.map((m, i) => (
              <div key={i} className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium">{m.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{m.dose}</span>
              </div>
            ))}
            {(!summary.medications || summary.medications.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No active medications</p>
            )}
          </div>
        </section>

        {/* Missing Data */}
        <section className="md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            Missing / Needed Data
          </h3>
          <ul className="space-y-1">
            {summary.missing_data?.map((item, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-1.5"></span>
                {item}
              </li>
            ))}
            {(!summary.missing_data || summary.missing_data.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400">All expected data present</p>
            )}
          </ul>
        </section>
      </div>

      {/* Footer Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>Encounters: {summary.encounter_count}</span>
        <span>Last visit: {summary.last_encounter_days ? `${summary.last_encounter_days}d ago` : "Unknown"}</span>
      </div>
    </div>
  );
}