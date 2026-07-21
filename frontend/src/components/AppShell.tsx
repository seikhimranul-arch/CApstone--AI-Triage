"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSelector } from "./LanguageSelector";

const NAV_ITEMS = [
  { href: "/app", label: "Chart Review", icon: "📋" },
  { href: "/triage", label: "Triage", icon: "🔍" },
  { href: "/review", label: "Override", icon: "✍️" },
  { href: "/training", label: "Training", icon: "🎓" },
  { href: "/metrics", label: "Metrics", icon: "📊" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] shadow-md shadow-[#2563EB]/20">
                <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5 text-white">
                  <path d="M12 4C10.5 4 9.2 4.8 8.5 6C7.3 5.6 6 6.4 5.5 7.6C4.5 7.4 3.5 8.2 3.5 9.4C3.5 10.2 4 10.9 4.7 11.2C4.3 12.4 5 13.7 6.2 14C6.5 15.3 7.7 16.2 9 16C9.5 17.1 10.6 17.8 12 17.8C13.4 17.8 14.5 17.1 15 16C16.3 16.2 17.5 15.3 17.8 14C19 13.7 19.7 12.4 19.3 11.2C20 10.9 20.5 10.2 20.5 9.4C20.5 8.2 19.5 7.4 18.5 7.6C18 6.4 16.7 5.6 15.5 6C14.8 4.8 13.5 4 12 4Z" fill="currentColor" fillOpacity="0.95" />
                  <path d="M8 12.5H16M10 15H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
                </svg>
              </div>
              <span className="text-base font-semibold tracking-tight text-slate-900">SehatAI</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#2563EB]/10 text-[#2563EB]"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
          </div>
        </div>
        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-t border-slate-200/60 px-4 py-2 md:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[#2563EB]/10 text-[#2563EB]"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
