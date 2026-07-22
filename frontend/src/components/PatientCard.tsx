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

const GENDER_ICONS: Record<string, string> = {
  M: "♂",
  F: "♀",
};

interface PatientCardProps {
  patient: PatientFile;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

export const PatientCard = memo(function PatientCard({ patient, index, isSelected, onClick }: PatientCardProps) {
  const displayName = patient.name || patient.id;
  const nameParts = displayName.split(" ");
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : displayName.slice(0, 2).toUpperCase();

  const ageGender = [
    patient.age ? `${patient.age}y` : "",
    patient.gender ? GENDER_ICONS[patient.gender] || patient.gender : "",
  ].filter(Boolean).join(" ");

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
          isSelected ? "bg-gradient-to-br from-[#2563EB] to-[#14B8A6]" : "bg-slate-400"
        }`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
            <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">#{index}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            {ageGender && <span>{ageGender}</span>}
            {patient.abha_id && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#14B8A6]/10 text-[#14B8A6] text-[10px] font-medium">
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                ABHA
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${ARCHETYPE_COLORS[patient.archetype] || "bg-slate-100 text-slate-600"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${ARCHETYPE_DOTS[patient.archetype] || "bg-slate-400"}`} />
              {ARCHETYPE_LABELS[patient.archetype] || patient.archetype}
            </span>
          </div>
          {patient.address && (
            <p className="mt-1 text-[10px] text-slate-400 truncate flex items-center gap-1">
              <svg className="h-2.5 w-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
              {patient.address}
            </p>
          )}
        </div>
      </div>
    </button>
  );
});
