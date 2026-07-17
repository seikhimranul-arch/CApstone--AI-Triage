"use client";

import { memo } from "react";

interface PatientFile {
  id: string;
  filename: string;
  archetype: string;
}

interface RedFlag {
  type: "critical" | "warning" | "info";
  message: string;
}

interface DemoPatientData {
  name: string;
  age: number;
  gender: "M" | "F";
  one_liner: string;
  chronic_tags: string[];
  red_flags: RedFlag[];
}

interface PatientCardProps {
  patient: PatientFile;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

const ARCHETYPE_LABELS: Record<string, string> = {
  uncontrolled_dm: "🔴 Uncontrolled DM",
  missed_tb_fu: "🟠 Missed TB FU",
  polypharmacy_elderly: "🟣 Polypharmacy",
  high_risk_anc: "🔵 High-Risk ANC",
  faltering_growth: "🟢 Faltering Growth",
};

const FLAG_COLORS = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const CHRONIC_COLORS: Record<string, string> = {
  diabetes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  hypertension: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  tuberculosis: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  pregnancy: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  malnutrition: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const DEMO_DATA: Record<string, DemoPatientData> = {
  uncontrolled_dm: {
    name: "Rajesh Sharma",
    age: 52,
    gender: "M",
    one_liner: "52M, uncontrolled T2DM (HbA1c 9.2%↑), HTN on 3 meds, missed FU 105d",
    chronic_tags: ["diabetes", "hypertension"],
    red_flags: [
      { type: "critical", message: "HbA1c 9.2% — intensify glycemic control; consider insulin" },
      { type: "warning", message: "BP 148/94 — uptitrate/add agent; check adherence" },
      { type: "warning", message: "No visit 105d — schedule follow-up this week" },
    ],
  },
  missed_tb_fu: {
    name: "Amit Patel",
    age: 35,
    gender: "M",
    one_liner: "35M, pulmonary TB on DOTS, missed 2 doses, weight loss 8%, LFTs elevated",
    chronic_tags: ["tuberculosis"],
    red_flags: [
      { type: "critical", message: "Missed >2 DOTS doses — risk of MDR-TB" },
      { type: "critical", message: "Weight loss >5% — nutritional support needed" },
      { type: "warning", message: "ALT 2x ULN — check for drug-induced hepatitis" },
    ],
  },
  polypharmacy_elderly: {
    name: "Sunita Devi",
    age: 72,
    gender: "F",
    one_liner: "72F, HTN+DM+CKD3+OA, 7 meds incl NSAID+ACEi+diuretic — AKI risk",
    chronic_tags: ["hypertension", "diabetes"],
    red_flags: [
      { type: "critical", message: "NSAID + ACEi + Diuretic: AKI risk — stop NSAID, monitor creatinine" },
      { type: "critical", message: "eGFR 38 on Metformin — consider dose adjustment" },
      { type: "warning", message: "Fall risk: 7+ medications and age >70" },
    ],
  },
  high_risk_anc: {
    name: "Priya Singh",
    age: 28,
    gender: "F",
    one_liner: "28F G2P1 28wks, GHTN (152/98↑), GDM (HbA1c 6.8%), anemia Hb 9.2↓",
    chronic_tags: ["diabetes", "hypertension"],
    red_flags: [
      { type: "critical", message: "BP 152/98 rising — admit for IV antihypertensives, mag sulfate prophylaxis" },
      { type: "critical", message: "Hb 9.2 g/dL — IV iron sucrose urgent; target >11 before delivery" },
      { type: "warning", message: "Proteinuria 150mg — monitor for preeclampsia" },
    ],
  },
  faltering_growth: {
    name: "Rohan Kumar",
    age: 2,
    gender: "M",
    one_liner: "2M, severe wasting (WFA -3.2 SD), MUAC 112mm, recurrent LRI, no weight gain 3mo",
    chronic_tags: ["malnutrition"],
    red_flags: [
      { type: "critical", message: "WFA < -3 SD — admit for nutritional rehabilitation" },
      { type: "critical", message: "MUAC 112mm — severe acute malnutrition" },
      { type: "warning", message: "No weight gain in 3 months — investigate underlying cause" },
    ],
  },
};

function getCardClassName(isSelected: boolean): string {
  if (isSelected) {
    return "cursor-pointer p-4 rounded-2xl border transition-all duration-200 shadow-sm ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/20";
  }
  return "cursor-pointer p-4 rounded-2xl border transition-all duration-200 shadow-sm border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800 hover:shadow-md";
}

function PatientCardComponent({ patient, index, isSelected, onClick }: PatientCardProps) {
  const data = DEMO_DATA[patient.archetype] || {
    name: `Patient ${index}`,
    age: 30,
    gender: "M" as const,
    one_liner: "Clinical summary pending",
    chronic_tags: [],
    red_flags: [],
  };

  const criticalCount = data.red_flags?.filter((f) => f.type === "critical").length || 0;
  const warningCount = data.red_flags?.filter((f) => f.type === "warning").length || 0;
  const cardClassName = getCardClassName(isSelected);

  return (
    <div
      onClick={onClick}
      className={cardClassName}
    >
      {criticalCount > 0 && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
          {criticalCount}
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
            {data.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {data.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.age}{data.gender} • #{patient.id.slice(-4)}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {criticalCount > 0 && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${FLAG_COLORS.critical}`}>
              {criticalCount} 🔴
            </span>
          )}
          {warningCount > 0 && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${FLAG_COLORS.warning}`}>
              {warningCount} 🟡
            </span>
          )}
        </div>
      </div>

      <div className="mb-3">
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          {ARCHETYPE_LABELS[patient.archetype] || patient.archetype}
        </span>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2 min-h-[3rem]">
        {data.one_liner}
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {data.red_flags?.slice(0, 3).map((flag, i) => (
          <span key={i} className={`px-2 py-1 text-xs font-medium rounded-full ${FLAG_COLORS[flag.type] || FLAG_COLORS.info}`}>
            {flag.message.slice(0, 40)}{flag.message.length > 40 ? "…" : ""}
          </span>
        ))}
        {data.red_flags && data.red_flags.length > 3 && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            +{data.red_flags.length - 3} more
          </span>
        )}
      </div>

      {data.chronic_tags && data.chronic_tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.chronic_tags.map((tag) => (
            <span key={tag} className={`px-2 py-0.5 text-xs font-medium rounded-full ${CHRONIC_COLORS[tag] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export const PatientCard = memo(PatientCardComponent);

interface PatientFile {
  id: string;
  filename: string;
  archetype: string;
}

interface PatientCardProps {
  patient: PatientFile;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

interface RedFlag {
  type: "critical" | "warning" | "info";
  message: string;
}

interface DemoPatientData {
  name: string;
  age: number;
  gender: "M" | "F";
  one_liner: string;
  chronic_tags: string[];
  red_flags: RedFlag[];
}