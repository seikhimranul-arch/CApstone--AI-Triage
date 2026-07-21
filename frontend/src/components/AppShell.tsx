"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "../lib/i18n";
import { LanguageSelector } from "./LanguageSelector";
import { Chatbot } from "./Chatbot";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard", icon: "grid" },
  { href: "/consent", label: "ABHA Consent", icon: "shield" },
  { href: "/triage", label: "Triage", icon: "activity" },
  { href: "/review", label: "Override", icon: "edit" },
  { href: "/training", label: "Training", icon: "book" },
  { href: "/metrics", label: "Metrics", icon: "bar-chart" },
] as const;

function NavIcon({ name }: { name: string }) {
  const cls = "h-4 w-4";
  switch (name) {
    case "grid":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
    case "shield":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
    case "activity":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
    case "edit":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
    case "book":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
    case "bar-chart":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
    default:
      return null;
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-slate-200/60 bg-white/80 backdrop-blur-sm transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] shadow-md shadow-blue-200/50">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
              <path d="M12 4C10.5 4 9.2 4.8 8.5 6C7.3 5.6 6 6.4 5.5 7.6C4.5 7.4 3.5 8.2 3.5 9.4C3.5 10.2 4 10.9 4.7 11.2C4.3 12.4 5 13.7 6.2 14C6.5 15.3 7.7 16.2 9 16C9.5 17.1 10.6 17.8 12 17.8C13.4 17.8 14.5 17.1 15 16C16.3 16.2 17.5 15.3 17.8 14C19 13.7 19.7 12.4 19.3 11.2C20 10.9 20.5 10.2 20.5 9.4C20.5 8.2 19.5 7.4 18.5 7.6C18 6.4 16.7 5.6 15.5 6C14.8 4.8 13.5 4 12 4Z" fill="currentColor" fillOpacity="0.95"/>
              <path d="M8 12.5H16M10 15H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7"/>
            </svg>
          </div>
          {!collapsed && <span className="text-lg font-semibold tracking-tight text-slate-900">SehatAI</span>}
        </div>

        {/* User Profile */}
        {!collapsed && (
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]/10 text-xs font-bold text-[#2563EB]">DR</div>
              <div>
                <p className="text-sm font-medium text-slate-900">Dr. Priya</p>
                <p className="text-[11px] text-slate-400">PHC Kukatpally</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-[#2563EB]/10 text-[#2563EB]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <NavIcon name={item.icon} />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="space-y-1 border-t border-slate-100 px-3 py-3">
          <LanguageSelector collapsed={collapsed} />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              )}
            </svg>
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
