"use client";

import { memo } from "react";
import type { PatientFile } from "../lib/types";

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

interface PatientCardProps {
  patient: PatientFile;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

export const PatientCard = memo(function PatientCard({ patient, index, isSelected, onClick }: PatientCardProps) {
  const name = patient.name || patient.id;
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
        isSelected
          ? "border-[#2563EB] bg-blue-50 shadow-md shadow-blue-100"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${
          isSelected ? "bg-[#2563EB]" : "bg-slate-400"
        }`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
            <span className="ml-2 flex h-2 w-2 flex-shrink-0 rounded-full" />
          </div>
          <p className="text-xs text-slate-500">
            {patient.age}{patient.gender === "M" ? "M" : patient.gender === "F" ? "F" : ""} · #{patient.id.split("_").pop()}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${ARCHETYPE_COLORS[patient.archetype] || "bg-slate-100 text-slate-600"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${ARCHETYPE_DOTS[patient.archetype] || "bg-slate-400"}`} />
              {ARCHETYPE_LABELS[patient.archetype] || patient.archetype}
            </span>
          </div>
          {patient.address && (
            <p className="mt-1.5 text-[11px] text-slate-400 truncate">{patient.address}</p>
          )}
        </div>
      </div>
    </button>
  );
});
