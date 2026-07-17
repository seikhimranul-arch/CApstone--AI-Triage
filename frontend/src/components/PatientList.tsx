"use client";

import { useState, useMemo } from "react";
import { PatientCard } from "./PatientCard";
import { SearchBar } from "./SearchBar";
import { FilterChips } from "./FilterChips";

export interface PatientFile {
  filename: string;
  archetype: string;
  id: string;
}

export interface PatientSummary {
  patient_id: string;
  one_liner: string;
  active_problems: Array<{code?: string; display?: string; clinical_status?: string}>;
  red_flags: Array<{type: string; key: string; message: string; value?: number; unit?: string; threshold?: number}>;
  chronic_snapshot: Record<string, unknown>;
  medications: Array<{name: string; dose: string; status?: string}>;
  missing_data: string[];
  encounter_count: number;
  last_encounter_days: number | null;
}

interface FilterOption {
  id: string;
  label: string;
}

interface PatientListProps {
  patients: PatientFile[];
  onSelect: (patientId: string) => void;
  selectedId: string | null;
  loading?: boolean;
}

const FILTERS: FilterOption[] = [
  { id: "all", label: "All" },
  { id: "uncontrolled_dm", label: "🔴 DM" },
  { id: "missed_tb_fu", label: "🟠 TB" },
  { id: "polypharmacy_elderly", label: "🟣 Poly" },
  { id: "high_risk_anc", label: "🔵 ANC" },
  { id: "faltering_growth", label: "🟢 Peds" },
];

export function PatientList({ patients, onSelect, selectedId, loading }: PatientListProps) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>(["all"]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch = 
        p.filename.toLowerCase().includes(search.toLowerCase()) ||
        p.archetype.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = activeFilters.includes("all") || activeFilters.includes(p.archetype);
      
      return matchesSearch && matchesFilter;
    });
  }, [patients, search, activeFilters]);

  const handleFilterChange = (newFilters: string[]) => {
    if (newFilters.includes("all")) {
      setActiveFilters(["all"]);
    } else {
      setActiveFilters(newFilters);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
        <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">Loading patients...</p>
      </div>
    );
  }

  if (filteredPatients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
        <div className="text-4xl mb-2">🔍</div>
        <p className="text-gray-500 dark:text-gray-400">No patients match your filters</p>
        <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
      {/* Search & Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-10">
        <SearchBar 
          value={search} 
          onChange={setSearch} 
          placeholder="Search patients..."
        />
        <FilterChips
          filters={FILTERS}
          selected={activeFilters}
          onChange={handleFilterChange}
        />
      </div>

      {/* Patient Grid */}
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

      {/* Results Count */}
      <div className="px-4 pb-4 text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">
        Showing {filteredPatients.length} of {patients.length} patients
        {activeFilters.length > 0 && activeFilters[0] !== "all" && (
          <span> • Filtered by {activeFilters.map(f => FILTERS.find(o => o.id === f)?.label || f).join(", ")}</span>
        )}
      </div>
    </div>
  );
}