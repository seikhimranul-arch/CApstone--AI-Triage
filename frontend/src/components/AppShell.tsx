"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "../lib/i18n";
import { useTheme } from "../lib/theme/ThemeContext";
import { LanguageSelector } from "./LanguageSelector";
import { Chatbot } from "./Chatbot";
import { SehatLogo } from "./SehatLogo";

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
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const isDark = theme === "dark";

  const sidebarBg = isDark ? "bg-halo-sidebar border-halo-border" : "bg-white border-slate-200";
  const mainBg = isDark ? "bg-halo-bg" : "bg-[#f7f5f0]";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-halo-muted" : "text-slate-400";
  const borderClass = isDark ? "border-halo-border" : "border-slate-100";
  const navActive = isDark ? "bg-[#5b6ee1]/15 text-[#818cf8]" : "bg-[#1a5276]/10 text-[#1a5276]";
  const navInactive = isDark ? "text-halo-muted hover:bg-halo-card hover:text-halo-text" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";
  const btnMuted = isDark ? "text-halo-muted hover:bg-halo-card hover:text-halo-text" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700";

  return (
    <div className={`flex h-screen transition-colors ${mainBg}`}>
      {/* Sidebar */}
      <aside className={`flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-60"} border-r ${sidebarBg}`}>
        {/* Logo */}
        <Link href="/" className={`flex h-16 items-center gap-3 px-4 border-b ${borderClass} hover:opacity-80 transition-opacity`}>
          <SehatLogo size="md" dark={isDark} />
          {!collapsed && (
            <div>
              <span className={`text-lg font-semibold tracking-tight ${textPrimary}`}>SehatAI</span>
              <p className={`text-[10px] font-medium ${textMuted}`}>PHC Clinical Assistant</p>
            </div>
          )}
        </Link>

        {/* User Profile */}
        {!collapsed && (
          <div className={`px-4 py-3 border-b ${borderClass}`}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF9933]/15 text-xs font-bold text-[#FF9933]">
                DR
              </div>
              <div>
                <p className={`text-sm font-medium ${textPrimary}`}>Dr. Priya</p>
                <p className={`text-[11px] ${textMuted}`}>PHC Kukatpally</p>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Label */}
        {!collapsed && (
          <div className="px-4 pt-4 pb-2">
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${textMuted}`}>
              Workspace
            </p>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${active ? navActive : navInactive}`}
                title={collapsed ? item.label : undefined}
              >
                <NavIcon name={item.icon} />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className={`space-y-0.5 px-3 py-3 border-t ${borderClass}`}>
          <LanguageSelector collapsed={collapsed} />
          <button
            onClick={toggle}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${btnMuted}`}
            title={collapsed ? (isDark ? "Light mode" : "Dark mode") : undefined}
          >
            {isDark ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
            )}
            {!collapsed && (isDark ? "Light Mode" : "Dark Mode")}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${btnMuted}`}
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
      <main className={`flex-1 overflow-y-auto transition-colors ${mainBg}`}>
        {children}
      </main>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
