"use client";

import { useI18n } from "../lib/i18n";
import { useTheme } from "../lib/theme/ThemeContext";
import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en' as const, label: 'English' },
  { code: 'hi' as const, label: 'हिन्दी' },
  { code: 'te' as const, label: 'తెలుగు' },
  { code: 'kn' as const, label: 'ಕನ್ನಡ' },
];

export function LanguageSelector({ collapsed = false }: { collapsed?: boolean }) {
  const { locale, setLocale } = useI18n();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isDark
            ? "text-halo-muted hover:bg-halo-card hover:text-halo-text"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        }`}
        title={collapsed ? "Language" : undefined}
      >
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
        {!collapsed && <span>{current.label}</span>}
      </button>

      {open && (
        <div className={`absolute bottom-full left-0 mb-2 w-44 rounded-xl py-1 shadow-xl z-50 ${
          isDark
            ? "bg-halo-card border border-halo-border"
            : "bg-white border border-slate-200"
        }`}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLocale(lang.code); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors ${
                locale === lang.code
                  ? isDark
                    ? "bg-[#5b6ee1]/15 text-[#818cf8] font-medium"
                    : "bg-blue-50 text-[#1a5276] font-medium"
                  : isDark
                    ? "text-halo-text hover:bg-halo-card-hover"
                    : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {lang.label}
              {locale === lang.code && (
                <svg className={`ml-auto h-4 w-4 ${isDark ? "text-[#818cf8]" : "text-[#1a5276]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
