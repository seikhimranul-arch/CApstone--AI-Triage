"use client";

import { memo, forwardRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = memo(forwardRef<HTMLInputElement, SearchBarProps>(
  ({ value, onChange, placeholder = "Search..." }, ref) => (
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      aria-label={placeholder}
    />
  )
));

SearchBar.displayName = "SearchBar";