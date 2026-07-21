"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc]">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-[#f8fafc] to-[#f0fdfa]" />
        <div className="absolute -left-32 top-20 h-[500px] w-[500px] rounded-full bg-[#2563EB]/8 blur-3xl" />
        <div className="absolute -right-24 top-40 h-[400px] w-[400px] rounded-full bg-[#14B8A6]/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-t from-[#14B8A6]/5 to-transparent blur-2xl" />
        {/* Grid pattern */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2563EB" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating ghost cards */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="absolute right-[8%] top-[18%] h-28 w-36 animate-[fadeInUp_0.8s_ease_0.2s_both]">
          <div className="h-full w-full rounded-2xl border border-white/60 bg-white/40 p-4 shadow-lg shadow-[#2563EB]/5 backdrop-blur-md">
            <div className="flex h-full flex-col justify-center gap-2">
              <div className="h-2 w-12 rounded-full bg-[#14B8A6]/40" />
              <div className="h-2 w-20 rounded-full bg-slate-200" />
              <div className="h-2 w-16 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
        <div className="absolute left-[6%] top-[32%] h-32 w-40 animate-[fadeInUp_0.8s_ease_0.4s_both]">
          <div className="h-full w-full rounded-2xl border border-white/60 bg-white/40 p-4 shadow-lg shadow-[#2563EB]/5 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#2563EB]/20" />
              <div className="space-y-1.5">
                <div className="h-2 w-16 rounded-full bg-slate-200" />
                <div className="h-2 w-10 rounded-full bg-[#2563EB]/30" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[28%] right-[12%] h-24 w-32 animate-[fadeInUp_0.8s_ease_0.6s_both]">
          <div className="h-full w-full rounded-2xl border border-white/60 bg-white/40 p-4 shadow-lg shadow-[#2563EB]/5 backdrop-blur-md">
            <div className="flex h-full items-end gap-1">
              <div className="flex-1 rounded-t-sm bg-gradient-to-t from-[#14B8A6]/30 to-[#2563EB]/20" style={{ height: "40%" }} />
              <div className="flex-1 rounded-t-sm bg-gradient-to-t from-[#14B8A6]/30 to-[#2563EB]/20" style={{ height: "65%" }} />
              <div className="flex-1 rounded-t-sm bg-gradient-to-t from-[#14B8A6]/30 to-[#2563EB]/20" style={{ height: "45%" }} />
              <div className="flex-1 rounded-t-sm bg-gradient-to-t from-[#14B8A6]/30 to-[#2563EB]/20" style={{ height: "80%" }} />
              <div className="flex-1 rounded-t-sm bg-gradient-to-t from-[#14B8A6]/30 to-[#2563EB]/20" style={{ height: "55%" }} />
            </div>
          </div>
        </div>
        <div className="absolute bottom-[22%] left-[10%] h-20 w-28 animate-[fadeInUp_0.8s_ease_0.8s_both]">
          <div className="h-full w-full rounded-2xl border border-white/60 bg-white/40 p-4 shadow-lg shadow-[#2563EB]/5 backdrop-blur-md">
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <div className="h-3 w-3 rounded-full bg-[#14B8A6]/50" />
              <div className="h-0.5 w-8 bg-slate-200" />
              <div className="h-3 w-3 rounded-full border-2 border-[#2563EB]/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] shadow-lg shadow-[#2563EB]/20">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
              <path d="M12 4C10.5 4 9.2 4.8 8.5 6C7.3 5.6 6 6.4 5.5 7.6C4.5 7.4 3.5 8.2 3.5 9.4C3.5 10.2 4 10.9 4.7 11.2C4.3 12.4 5 13.7 6.2 14C6.5 15.3 7.7 16.2 9 16C9.5 17.1 10.6 17.8 12 17.8C13.4 17.8 14.5 17.1 15 16C16.3 16.2 17.5 15.3 17.8 14C19 13.7 19.7 12.4 19.3 11.2C20 10.9 20.5 10.2 20.5 9.4C20.5 8.2 19.5 7.4 18.5 7.6C18 6.4 16.7 5.6 15.5 6C14.8 4.8 13.5 4 12 4Z" fill="currentColor" fillOpacity="0.95" />
              <path d="M8 12.5H16M10 15H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">SehatAI</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="#about" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white/60 hover:text-slate-900 sm:px-4">About</a>
          <a href="#features" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white/60 hover:text-slate-900 sm:px-4">Features</a>
          <Link href="/app" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white/60 hover:text-slate-900 sm:px-4">Demo</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.95fr] lg:gap-16">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2563EB]/15 bg-white/75 px-4 py-1.5 text-sm text-slate-600 shadow-sm backdrop-blur-sm">
              <svg className="h-3.5 w-3.5 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              ABHA-ready clinical continuity
            </div>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.55rem]">
              Give every consultation
              <span className="block bg-gradient-to-r from-[#2563EB] to-[#14B8A6] bg-clip-text text-transparent">
                the full patient story.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
              SehatAI brings consented ABHA health records, clinical AI summaries, and triage decision support into one focused workspace for Indian PHC doctors.
            </p>
            <ul className="mt-7 space-y-3 text-left">
              {["See the full patient story in seconds", "AI-powered differential diagnosis", "Consent-first ABHA record linking"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <svg className="h-5 w-5 shrink-0 text-[#14B8A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
              <Link
                href="/app"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[#2563EB]/25 transition-all hover:bg-[#1d4ed8] hover:shadow-xl hover:shadow-[#2563EB]/30"
              >
                Try Interactive Demo
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-6 py-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-md"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Hero Image Mock */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="absolute -inset-5 rounded-[38px] bg-gradient-to-br from-[#2563EB]/15 via-transparent to-[#14B8A6]/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border-[6px] border-white bg-slate-100 shadow-2xl shadow-slate-300/50">
              {/* Mock dashboard UI */}
              <div className="h-[370px] w-full bg-gradient-to-br from-slate-50 to-white sm:h-[440px]">
                <div className="flex h-full">
                  {/* Mini sidebar */}
                  <div className="w-16 border-r border-slate-200 bg-white p-3">
                    <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#14B8A6]">
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white"><path d="M12 4C10.5 4 9.2 4.8 8.5 6C7.3 5.6 6 6.4 5.5 7.6C4.5 7.4 3.5 8.2 3.5 9.4C3.5 10.2 4 10.9 4.7 11.2C4.3 12.4 5 13.7 6.2 14C6.5 15.3 7.7 16.2 9 16C9.5 17.1 10.6 17.8 12 17.8C13.4 17.8 14.5 17.1 15 16C16.3 16.2 17.5 15.3 17.8 14C19 13.7 19.7 12.4 19.3 11.2C20 10.9 20.5 10.2 20.5 9.4C20.5 8.2 19.5 7.4 18.5 7.6C18 6.4 16.7 5.6 15.5 6C14.8 4.8 13.5 4 12 4Z" fill="currentColor" fillOpacity="0.95" /></svg>
                    </div>
                    <div className="space-y-2">
                      {[1,2,3,4].map(i => <div key={i} className={`h-8 rounded-lg ${i===1 ? 'bg-[#2563EB]/10' : 'bg-slate-100'}`} />)}
                    </div>
                  </div>
                  {/* Content area */}
                  <div className="flex-1 p-4">
                    <div className="mb-4 h-6 w-48 rounded-lg bg-slate-200" />
                    <div className="mb-4 grid grid-cols-3 gap-3">
                      {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                        <div className="mb-2 h-3 w-12 rounded bg-slate-200" />
                        <div className="h-5 w-16 rounded bg-slate-300" />
                      </div>)}
                    </div>
                    <div className="space-y-2">
                      {[1,2,3,4].map(i => <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                        <div className="h-8 w-8 rounded-full bg-slate-200" />
                        <div className="flex-1 space-y-1">
                          <div className="h-2.5 w-24 rounded bg-slate-200" />
                          <div className="h-2 w-32 rounded bg-slate-100" />
                        </div>
                        <div className="h-5 w-16 rounded-full bg-[#14B8A6]/10" />
                      </div>)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/65 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/25 bg-white/90 p-4 shadow-xl backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-auto sm:w-[310px]">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#E8F0FF] p-2.5 text-[#2563EB]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2563EB]">Patient context ready</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">History, trends & notes in one view</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative z-10 mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <div className="overflow-hidden rounded-[24px] border border-white/80 bg-white/55 p-8 shadow-lg shadow-slate-200/50 backdrop-blur-sm sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col gap-4 text-center sm:text-left">
              <div className="mx-auto rounded-2xl bg-[#E8F0FF] p-3 text-[#2563EB] sm:mx-0">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 2v2m0 16v2M5 12H3m18 0h-2M7.05 7.05l-1.414-1.414m12.728 0l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M12 6a6 6 0 100 12 6 6 0 000-12z" /></svg>
              </div>
              <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
                SehatAI is a clinician-first workspace that turns disconnected ABHA health records into an understandable patient narrative, while keeping the doctor in control of every clinical decision.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white bg-slate-100 shadow-xl shadow-slate-200/60">
              <div className="h-64 w-full bg-gradient-to-br from-[#2563EB]/5 to-[#14B8A6]/5 sm:h-72 lg:h-80">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] shadow-lg">
                      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-700">ABHA-Linked Records</p>
                    <p className="text-xs text-slate-400">Consent-first data access</p>
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
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Built around the doctor&apos;s workflow</h2>
          <p className="mt-4 text-lg text-slate-600">Essential clinical context, without adding another complicated system.</p>
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
            <article key={feature.title} className="group rounded-[24px] border border-white/80 bg-white/70 p-6 shadow-lg shadow-slate-200/40 backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-[#2563EB]/10">
              <div className="h-44 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100/80">
                <div className="flex h-full items-center justify-center">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                    feature.icon === "timeline" ? "bg-[#2563EB]/10 text-[#2563EB]" :
                    feature.icon === "ai" ? "bg-[#14B8A6]/10 text-[#14B8A6]" :
                    "bg-purple-100 text-purple-600"
                  }`}>
                    {feature.icon === "timeline" && <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {feature.icon === "ai" && <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>}
                    {feature.icon === "abha" && <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
                  </div>
                </div>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/60 bg-white/40 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-12 text-center lg:px-8">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] shadow-lg shadow-[#2563EB]/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
                <path d="M12 4C10.5 4 9.2 4.8 8.5 6C7.3 5.6 6 6.4 5.5 7.6C4.5 7.4 3.5 8.2 3.5 9.4C3.5 10.2 4 10.9 4.7 11.2C4.3 12.4 5 13.7 6.2 14C6.5 15.3 7.7 16.2 9 16C9.5 17.1 10.6 17.8 12 17.8C13.4 17.8 14.5 17.1 15 16C16.3 16.2 17.5 15.3 17.8 14C19 13.7 19.7 12.4 19.3 11.2C20 10.9 20.5 10.2 20.5 9.4C20.5 8.2 19.5 7.4 18.5 7.6C18 6.4 16.7 5.6 15.5 6C14.8 4.8 13.5 4 12 4Z" fill="currentColor" fillOpacity="0.95" />
                <path d="M8 12.5H16M10 15H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">SehatAI</span>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">PHC AI Triage Assistant</p>
          <p className="mt-2 text-sm text-slate-500">Built as a capstone project. Ayushman Bharat Digital Mission integrated.</p>
        </div>
      </footer>
    </div>
  );
}
