"use client";

import Link from "next/link";
import { useTheme } from "../lib/theme/ThemeContext";

export default function LandingPage() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? "bg-halo-bg" : "bg-[#fdfbf7] indian-pattern"}`}>
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute -left-32 top-20 h-[500px] w-[500px] rounded-full blur-3xl ${isDark ? "bg-[#5b6ee1]/8" : "bg-[#1a5276]/8"}`} />
        <div className={`absolute -right-24 top-40 h-[400px] w-[400px] rounded-full blur-3xl ${isDark ? "bg-[#FF9933]/5" : "bg-[#FF9933]/10"}`} />
        <div className={`absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-t to-transparent blur-2xl ${isDark ? "from-[#22c55e]/5" : "from-[#138808]/5"}`} />
        {/* Dots pattern overlay */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]">
          <defs>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill={isDark ? "#5b6ee1" : "#1a5276"} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Header */}
      <header className={`relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8`}>
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a5276] to-[#138808] shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
              <path d="M12 4C10.5 4 9.2 4.8 8.5 6C7.3 5.6 6 6.4 5.5 7.6C4.5 7.4 3.5 8.2 3.5 9.4C3.5 10.2 4 10.9 4.7 11.2C4.3 12.4 5 13.7 6.2 14C6.5 15.3 7.7 16.2 9 16C9.5 17.1 10.6 17.8 12 17.8C13.4 17.8 14.5 17.1 15 16C16.3 16.2 17.5 15.3 17.8 14C19 13.7 19.7 12.4 19.3 11.2C20 10.9 20.5 10.2 20.5 9.4C20.5 8.2 19.5 7.4 18.5 7.6C18 6.4 16.7 5.6 15.5 6C14.8 4.8 13.5 4 12 4Z" fill="currentColor" fillOpacity="0.95" />
              <path d="M8 12.5H16M10 15H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
            </svg>
          </div>
          <span className={`text-lg font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>SehatAI</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="#about" className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${isDark ? "text-halo-muted hover:bg-halo-card hover:text-halo-text" : "text-slate-600 hover:bg-white/60 hover:text-slate-900"}`}>About</a>
          <a href="#features" className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${isDark ? "text-halo-muted hover:bg-halo-card hover:text-halo-text" : "text-slate-600 hover:bg-white/60 hover:text-slate-900"}`}>Features</a>
          <Link href="/app" className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${isDark ? "text-halo-muted hover:bg-halo-card hover:text-halo-text" : "text-slate-600 hover:bg-white/60 hover:text-slate-900"}`}>Demo</Link>
          <button onClick={toggle} className={`rounded-lg p-2 transition-colors ${isDark ? "text-halo-muted hover:bg-halo-card hover:text-halo-text" : "text-slate-500 hover:bg-white/60 hover:text-slate-700"}`} title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            {isDark ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
            )}
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.95fr] lg:gap-16">
          <div className="max-w-2xl text-center lg:text-left">
            <div className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm shadow-sm ${isDark ? "border-[#FF9933]/30 bg-[#FF9933]/10 text-[#FF9933]" : "border-[#FF9933]/20 bg-[#FFF4E6] text-amber-800"}`}>
              <span className="flex h-2 w-2 rounded-full bg-[#FF9933]" />
              ABHA-ready clinical continuity
            </div>
            <h1 className={`text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.55rem] ${isDark ? "text-white" : "text-slate-900"}`}>
              हर परामर्श में
              <span className="block bg-gradient-to-r from-[#1a5276] via-[#138808] to-[#FF9933] bg-clip-text text-transparent">
                मरीज़ का पूरा स्वास्थ्य इतिहास।
              </span>
            </h1>
            <p className={`mt-6 text-lg leading-relaxed sm:text-xl ${isDark ? "text-halo-muted" : "text-slate-600"}`}>
              SehatAI brings consented ABHA health records, clinical AI summaries, and triage decision support into one focused workspace for Indian PHC doctors.
            </p>
            <ul className="mt-7 space-y-3 text-left">
              {[
                "See the full patient story in seconds — ABHA-linked records",
                "AI-powered differential diagnosis with ICD-11 coding",
                "Consent-first ABHA record linking — patient privacy first",
              ].map((item) => (
                <li key={item} className={`flex items-center gap-3 text-sm font-medium ${isDark ? "text-halo-text" : "text-slate-700"}`}>
                  <svg className={`h-5 w-5 shrink-0 ${isDark ? "text-[#22c55e]" : "text-[#138808]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
              <Link
                href="/app"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a5276] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[#1a5276]/25 transition-all hover:bg-[#0d3b5e] hover:shadow-xl"
              >
                Try Interactive Demo
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              </Link>
              <a
                href="#features"
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium shadow-sm backdrop-blur-sm transition-all ${isDark ? "border border-halo-border bg-halo-card text-halo-text hover:bg-halo-hover hover:shadow-md" : "border border-slate-200/80 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white hover:shadow-md"}`}
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Hero Dashboard Mock */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="absolute -inset-5 rounded-[38px] bg-gradient-to-br from-[#1a5276]/15 via-transparent to-[#138808]/20 blur-2xl" />
            <div className={`relative overflow-hidden rounded-[28px] border-[6px] shadow-2xl ${isDark ? "border-halo-sidebar bg-halo-sidebar shadow-black/50" : "border-white bg-slate-100 shadow-slate-300/50"}`}>
              <div className="h-[370px] w-full sm:h-[440px]">
                <div className="flex h-full">
                  <div className={`w-16 p-3 ${isDark ? "border-r border-halo-border bg-halo-sidebar" : "border-r border-slate-200 bg-white"}`}>
                    <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a5276] to-[#138808]">
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white"><path d="M12 4C10.5 4 9.2 4.8 8.5 6C7.3 5.6 6 6.4 5.5 7.6C4.5 7.4 3.5 8.2 3.5 9.4C3.5 10.2 4 10.9 4.7 11.2C4.3 12.4 5 13.7 6.2 14C6.5 15.3 7.7 16.2 9 16C9.5 17.1 10.6 17.8 12 17.8C13.4 17.8 14.5 17.1 15 16C16.3 16.2 17.5 15.3 17.8 14C19 13.7 19.7 12.4 19.3 11.2C20 10.9 20.5 10.2 20.5 9.4C20.5 8.2 19.5 7.4 18.5 7.6C18 6.4 16.7 5.6 15.5 6C14.8 4.8 13.5 4 12 4Z" fill="currentColor" fillOpacity="0.95" /></svg>
                    </div>
                    <div className="space-y-2">
                      {[1,2,3,4].map(i => <div key={i} className={`h-8 rounded-lg ${i===1 ? 'bg-[#1a5276]/10' : isDark ? 'bg-halo-card' : 'bg-slate-100'}`} />)}
                    </div>
                  </div>
                  <div className={`flex-1 p-4 ${isDark ? "bg-halo-bg" : "bg-gradient-to-br from-slate-50 to-white"}`}>
                    <div className={`mb-4 h-6 w-48 rounded-lg ${isDark ? "bg-halo-card" : "bg-slate-200"}`} />
                    <div className="mb-4 grid grid-cols-3 gap-3">
                      {[1,2,3].map(i => <div key={i} className={`rounded-xl p-3 shadow-sm ${isDark ? "border border-halo-border bg-halo-card" : "border border-slate-100 bg-white"}`}>
                        <div className={`mb-2 h-3 w-12 rounded ${isDark ? "bg-halo-border" : "bg-slate-200"}`} />
                        <div className={`h-5 w-16 rounded ${isDark ? "bg-halo-border" : "bg-slate-300"}`} />
                      </div>)}
                    </div>
                    <div className="space-y-2">
                      {[1,2,3,4].map(i => <div key={i} className={`flex items-center gap-3 rounded-xl p-3 shadow-sm ${isDark ? "border border-halo-border bg-halo-card" : "border border-slate-100 bg-white"}`}>
                        <div className={`h-8 w-8 rounded-full ${isDark ? "bg-halo-border" : "bg-slate-200"}`} />
                        <div className="flex-1 space-y-1">
                          <div className={`h-2.5 w-24 rounded ${isDark ? "bg-halo-border" : "bg-slate-200"}`} />
                          <div className={`h-2 w-32 rounded ${isDark ? "bg-halo-border" : "bg-slate-100"}`} />
                        </div>
                        <div className={`h-5 w-16 rounded-full ${isDark ? "bg-[#22c55e]/10" : "bg-[#138808]/10"}`} />
                      </div>)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 to-transparent" />
              <div className={`absolute bottom-5 left-5 right-5 rounded-2xl p-4 shadow-xl backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-auto sm:w-[310px] ${isDark ? "border border-halo-border bg-halo-card/90" : "border border-white/25 bg-white/90"}`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#FFF4E6] p-2.5 text-[#FF9933]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${isDark ? "text-[#FF9933]" : "text-[#1a5276]"}`}>Patient context ready</p>
                    <p className={`mt-1 text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>History, trends & notes in one view</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative z-10 mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <div className={`overflow-hidden rounded-[24px] p-8 shadow-lg backdrop-blur-sm sm:p-10 ${isDark ? "border border-halo-border bg-halo-card/55 shadow-black/20" : "border border-white/80 bg-white/55 shadow-slate-200/50"}`}>
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col gap-4 text-center sm:text-left">
              <div className={`mx-auto rounded-2xl p-3 text-[#FF9933] sm:mx-0 ${isDark ? "bg-[#FF9933]/10" : "bg-[#FFF4E6]"}`}>
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 2v2m0 16v2M5 12H3m18 0h-2M7.05 7.05l-1.414-1.414m12.728 0l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M12 6a6 6 0 100 12 6 6 0 000-12z" /></svg>
              </div>
              <p className={`text-base leading-relaxed sm:text-lg ${isDark ? "text-halo-muted" : "text-slate-600"}`}>
                SehatAI is a clinician-first workspace that turns disconnected ABHA health records into an understandable patient narrative, while keeping the doctor in control of every clinical decision.
              </p>
            </div>
            <div className={`relative overflow-hidden rounded-2xl shadow-xl ${isDark ? "border border-halo-border bg-halo-card shadow-black/20" : "border border-white bg-slate-100 shadow-slate-200/60"}`}>
              <div className="h-64 w-full bg-gradient-to-br from-[#1a5276]/5 via-[#FF9933]/5 to-[#138808]/5 sm:h-72 lg:h-80">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a5276] via-[#138808] to-[#FF9933] shadow-lg">
                      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                    </div>
                    <p className={`text-sm font-medium ${isDark ? "text-halo-text" : "text-slate-700"}`}>ABHA-Linked Records</p>
                    <p className={`text-xs ${isDark ? "text-halo-muted" : "text-slate-400"}`}>Consent-first data access</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="mb-14 text-center">
          <h2 className={`text-3xl font-semibold tracking-tight sm:text-4xl ${isDark ? "text-white" : "text-slate-900"}`}>Built around the doctor&apos;s workflow</h2>
          <p className={`mt-4 text-lg ${isDark ? "text-halo-muted" : "text-slate-600"}`}>Essential clinical context, without adding another complicated system.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Continuity Timeline",
              desc: "See a clear, chronological view of a patient's medical journey from ABDM records.",
              icon: "timeline",
            },
            {
              title: "AI Consultation Assistant",
              desc: "Get AI-powered differential diagnosis, red flag alerts, and treatment suggestions.",
              icon: "ai",
            },
            {
              title: "ABHA Record Context",
              desc: "Bring consented health records, vitals and past notes into the consultation view.",
              icon: "abha",
            },
          ].map((feature) => (
            <article key={feature.title} className={`group rounded-[24px] p-6 shadow-lg backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl ${isDark ? "border border-halo-border bg-halo-card/70 shadow-black/20 hover:shadow-[#5b6ee1]/10" : "border border-white/80 bg-white/70 shadow-slate-200/40 hover:shadow-[#1a5276]/10"}`}>
              <div className={`h-44 overflow-hidden rounded-2xl border ${isDark ? "bg-halo-bg border-halo-border" : "bg-gradient-to-br from-slate-50 to-white border-slate-100/80"}`}>
                <div className="flex h-full items-center justify-center">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                    feature.icon === "timeline" ? isDark ? "bg-[#5b6ee1]/10 text-[#818cf8]" : "bg-[#1a5276]/10 text-[#1a5276]" :
                    feature.icon === "ai" ? isDark ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#138808]/10 text-[#138808]" :
                    isDark ? "bg-[#FF9933]/10 text-[#FF9933]" : "bg-[#FFF4E6] text-[#FF9933]"
                  }`}>
                    {feature.icon === "timeline" && <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {feature.icon === "ai" && <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>}
                    {feature.icon === "abha" && <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
                  </div>
                </div>
              </div>
              <h3 className={`mt-6 text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{feature.title}</h3>
              <p className={`mt-3 text-sm leading-relaxed ${isDark ? "text-halo-muted" : "text-slate-600"}`}>{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 border-t backdrop-blur-sm ${isDark ? "border-halo-border bg-halo-sidebar/40" : "border-slate-200/60 bg-white/40"}`}>
        <div className="mx-auto max-w-6xl px-6 py-12 text-center lg:px-8">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a5276] to-[#138808] shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
                <path d="M12 4C10.5 4 9.2 4.8 8.5 6C7.3 5.6 6 6.4 5.5 7.6C4.5 7.4 3.5 8.2 3.5 9.4C3.5 10.2 4 10.9 4.7 11.2C4.3 12.4 5 13.7 6.2 14C6.5 15.3 7.7 16.2 9 16C9.5 17.1 10.6 17.8 12 17.8C13.4 17.8 14.5 17.1 15 16C16.3 16.2 17.5 15.3 17.8 14C19 13.7 19.7 12.4 19.3 11.2C20 10.9 20.5 10.2 20.5 9.4C20.5 8.2 19.5 7.4 18.5 7.6C18 6.4 16.7 5.6 15.5 6C14.8 4.8 13.5 4 12 4Z" fill="currentColor" fillOpacity="0.95" />
                <path d="M8 12.5H16M10 15H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
              </svg>
            </div>
            <span className={`text-base font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>SehatAI</span>
          </div>
          <p className={`mt-3 text-sm font-medium ${isDark ? "text-halo-text" : "text-slate-700"}`}>PHC AI Triage Assistant · ABHA Integrated</p>
          <p className={`mt-2 text-sm ${isDark ? "text-halo-muted" : "text-slate-500"}`}>Built as a capstone project — Ayushman Bharat Digital Mission</p>
        </div>
      </footer>
    </div>
  );
}
