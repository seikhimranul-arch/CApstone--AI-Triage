"use client";

import { useState, useMemo } from "react";
import { PatientCard } from "./PatientCard";
import type { PatientFile } from "../lib/types";

interface PatientListProps {
  patients: PatientFile[];
  onSelect: (patientId: string) => void;
  selectedId: string | null;
  loading?: boolean;
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "uncontrolled_dm", label: "DM" },
  { id: "missed_tb_fu", label: "TB" },
  { id: "polypharmacy_elderly", label: "Poly" },
  { id: "high_risk_anc", label: "ANC" },
  { id: "faltering_growth", label: "Peds" },
];

export function PatientList({ patients, onSelect, selectedId, loading }: PatientListProps) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>(["all"]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const s = search.toLowerCase();
      const matchesSearch = !search ||
        (p.name || "").toLowerCase().includes(s) ||
        (p.id || "").toLowerCase().includes(s) ||
        (p.abha_id || "").toLowerCase().includes(s) ||
        (p.address || "").toLowerCase().includes(s);

      const matchesFilter = activeFilters.includes("all") || activeFilters.includes(p.archetype);

      return matchesSearch && matchesFilter;
    });
  }, [patients, search, activeFilters]);

  const handleFilterChange = (filterId: string) => {
    if (filterId === "all") {
      setActiveFilters(["all"]);
    } else {
      const next = activeFilters.includes(filterId)
        ? activeFilters.filter(f => f !== filterId)
        : [...activeFilters.filter(f => f !== "all"), filterId];
      setActiveFilters(next.length === 0 ? ["all"] : next);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2563EB] border-t-transparent"></div>
        <p className="mt-2 text-slate-500 text-sm">Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
      <div className="p-4 border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, or ABHA..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-blue-100"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => handleFilterChange(f.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                activeFilters.includes(f.id)
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
          <svg className="h-12 w-12 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <p className="text-sm text-slate-500">No patients match your filters</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          {filteredPatients.map((patient, index) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              index={index + 1}
              isSelected={selectedId === patient.id}
              onClick={() => onSelect(patient.id)}
            />
          ))}
        </div>
      )}

      <div className="px-4 pb-4 text-xs text-slate-400 text-center border-t border-slate-200 pt-3">
        Showing {filteredPatients.length} of {patients.length} patients
      </div>
    </div>
  );
}
