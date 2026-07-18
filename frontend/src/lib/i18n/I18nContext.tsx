"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import te from "./locales/te.json";
import kn from "./locales/kn.json";

type Locale = "en" | "hi" | "te" | "kn";

type TranslationKeys = Record<string, any>;

const translations: Record<Locale, TranslationKeys> = { en, hi, te, kn };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const DEFAULT_CONTEXT: I18nContextType = {
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
};

const I18nContext = createContext<I18nContextType>(DEFAULT_CONTEXT);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && translations[saved]) {
      setLocale(saved);
    }
    setIsLoaded(true);
  }, []);

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem("locale", newLocale);
    document.documentElement.lang = newLocale;
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    if (!isLoaded) return key;
    
    const keys = key.split(".");
    let value: any = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        value = translations.en;
        for (const k2 of keys) {
          if (value && typeof value === "object" && k2 in value) {
            value = value[k2];
          } else {
            return key;
          }
        }
        break;
      }
    }
    
    if (typeof value === "string" && params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return String(params[paramKey] ?? match);
      });
    }
    
    return typeof value === "string" ? value : key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}