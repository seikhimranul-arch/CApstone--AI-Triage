"use client";

import { memo } from "react";

interface FilterOption {
  id: string;
  label: string;
}

interface FilterChipsProps {
  filters: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export const FilterChips = memo(function FilterChips({ filters, selected, onChange }: FilterChipsProps) {
  const toggle = (id: string) => {
    if (id === "all") {
      onChange(selected.includes("all") ? [] : ["all"]);
    } else {
      const newSelected = selected.includes(id) 
        ? selected.filter(f => f !== id)
        : [...selected.filter(f => f !== "all"), id];
      onChange(newSelected);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isSelected = selected.includes(filter.id);
        return (
          <button
            key={filter.id}
            onClick={() => toggle(filter.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all
              ${isSelected
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
              }
            `}
          >
            {filter.label}
            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white/30"></span>}
          </button>
        );
      })}
    </div>
  );
});