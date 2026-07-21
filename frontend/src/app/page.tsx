"use client";

import Link from "next/link";
import { useI18n } from "../lib/i18n";
import { LanguageSelector } from "../components/LanguageSelector";

const features = [
  {
    title: "Chart Review",
    desc: "AI-powered clinical summaries from FHIR records. One-liner, active problems, red flags, and medication snapshot in seconds.",
    icon: "📋",
    color: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-200/60",
    href: "/app",
  },
  {
    title: "Differential Diagnosis",
    desc: "Ranked DDx with ICD-11 codes, probability, reasoning, and suggested next actions — grounded in ICMR/NPCDCS/NTEP guidelines.",
    icon: "🔍",
    color: "from-purple-500/20 to-purple-600/10",
    borderColor: "border-purple-200/60",
    href: "/triage",
  },
  {
    title: "Doctor Override",
    desc: "Clinician reviews and finalises every AI recommendation. Accept, reject, reorder, or add — with full audit trail.",
    icon: "✍️",
    color: "from-teal-500/20 to-teal-600/10",
    borderColor: "border-teal-200/60",
    href: "/review",
  },
  {
    title: "ABHA Write-back",
    desc: "Consented records pushed back to ABHA-linked health accounts. Mock ABDM Gateway with full consent + HIU/HIP flow.",
    icon: "🏥",
    color: "from-emerald-500/20 to-emerald-600/10",
    borderColor: "border-emerald-200/60",
    href: "/app",
  },
  {
    title: "ASHA Training",
    desc: "6-step guided walkthrough for nurses and ASHAs. Symptom intake, vitals, triage flow — with guideline references.",
    icon: "🎓",
    color: "from-amber-500/20 to-amber-600/10",
    borderColor: "border-amber-200/60",
    href: "/training",
  },
  {
    title: "Pilot Metrics",
    desc: "Live dashboard tracking MOs onboarded, triages per day, override rate, red-flag detection, and write-back success.",
    icon: "📊",
    color: "from-rose-500/20 to-rose-600/10",
    borderColor: "border-rose-200/60",
    href: "/metrics",
  },
];

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc] text-slate-900">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-[#f8fafc] to-[#f0fdfa]" />
        <div className="absolute -left-32 top-20 h-[500px] w-[500px] rounded-full bg-[#2563EB]/8 blur-3xl" />
        <div className="absolute -right-24 top-40 h-[400px] w-[400px] rounded-full bg-[#14B8A6]/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-t from-[#14B8A6]/5 to-transparent blur-2xl" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2563EB" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Floating cards */}
        <div className="absolute right-[8%] top-[18%] hidden h-28 w-36 lg:block animate-float">
          <div className="h-full w-full rounded-2xl border border-white/60 bg-white/40 p-4 shadow-lg shadow-[#2563EB]/5 backdrop-blur-md">
            <div className="flex h-full flex-col justify-center gap-2">
              <div className="h-2 w-12 rounded-full bg-[#14B8A6]/40" />
              <div className="h-2 w-20 rounded-full bg-slate-200" />
              <div className="h-2 w-16 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
        <div className="absolute left-[6%] top-[32%] hidden h-32 w-40 lg:block animate-float-delay">
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
        <div className="absolute bottom-[28%] right-[12%] hidden h-24 w-32 lg:block animate-float">
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
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8 animate-fade-in">
        <Link href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] shadow-lg shadow-[#2563EB]/20">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" aria-hidden="true">
              <path d="M12 4C10.5 4 9.2 4.8 8.5 6C7.3 5.6 6 6.4 5.5 7.6C4.5 7.4 3.5 8.2 3.5 9.4C3.5 10.2 4 10.9 4.7 11.2C4.3 12.4 5 13.7 6.2 14C6.5 15.3 7.7 16.2 9 16C9.5 17.1 10.6 17.8 12 17.8C13.4 17.8 14.5 17.1 15 16C16.3 16.2 17.5 15.3 17.8 14C19 13.7 19.7 12.4 19.3 11.2C20 10.9 20.5 10.2 20.5 9.4C20.5 8.2 19.5 7.4 18.5 7.6C18 6.4 16.7 5.6 15.5 6C14.8 4.8 13.5 4 12 4Z" fill="currentColor" fillOpacity="0.95" />
              <path d="M8 12.5H16M10 15H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">SehatAI</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="#about" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white/60 hover:text-slate-900 sm:px-4">About</a>
          <a href="#features" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white/60 hover:text-slate-900 sm:px-4">Features</a>
          <Link href="/app" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white/60 hover:text-slate-900 sm:px-4">Launch App</Link>
          <LanguageSelector className="ml-1" />
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.95fr] lg:gap-16">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2563EB]/15 bg-white/75 px-4 py-1.5 text-sm text-slate-600 shadow-sm backdrop-blur-sm animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2563EB]">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              ABHA-integrated clinical decision support
            </div>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.55rem] animate-fade-in-up">
              Give every PHC consultation
              <span className="block bg-gradient-to-r from-[#2563EB] to-[#14B8A6] bg-clip-text text-transparent">the full patient story.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl animate-fade-in-delay-1">
              SehatAI brings consented ABHA health records, AI-powered differentials, and guideline-grounded clinical summaries into one focused workspace — so Indian PHC doctors can spend less time searching and more time caring.
            </p>
            <ul className="mt-7 space-y-3 text-left animate-fade-in-delay-2">
              {[
                "Chart review with one-liner summary and red-flag detection in ~3 seconds",
                "Ranked differential diagnoses grounded in ICMR, NPCDCS, NTEP, RSSDI guidelines",
                "Every recommendation doctor-reviewed — full override audit trail",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-[#14B8A6]">
                    <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row lg:items-start animate-fade-in-delay-3">
              <Link
                href="/app"
                className="relative inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[#2563EB]/25 transition-all duration-200 hover:bg-[#1d4ed8] hover:shadow-xl hover:shadow-[#2563EB]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
              >
                Launch Clinical Workspace
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-6 py-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Hero illustration */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none animate-fade-in-up">
            <div className="absolute -inset-5 rounded-[38px] bg-gradient-to-br from-[#2563EB]/15 via-transparent to-[#14B8A6]/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border-[6px] border-white bg-slate-100 shadow-2xl shadow-slate-300/50">
              {/* Mini app mockup */}
              <div className="h-[370px] w-full bg-gradient-to-br from-slate-50 to-slate-100 sm:h-[440px]">
                <div className="flex h-full">
                  {/* Sidebar */}
                  <div className="w-1/3 border-r border-slate-200/80 bg-white/80 p-3">
                    <div className="mb-3 h-4 w-20 rounded-full bg-slate-200" />
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className={`mb-2 rounded-lg p-2 ${i === 2 ? 'bg-[#2563EB]/10 border border-[#2563EB]/20' : 'bg-slate-50'}`}>
                        <div className="mb-1 h-2 w-16 rounded-full bg-slate-300" />
                        <div className="h-1.5 w-10 rounded-full bg-slate-200" />
                      </div>
                    ))}
                  </div>
                  {/* Main content */}
                  <div className="flex-1 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#14B8A6]" />
                      <div className="h-2.5 w-24 rounded-full bg-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
                        <div className="mb-1.5 h-2 w-16 rounded-full bg-[#2563EB]/30" />
                        <div className="h-1.5 w-full rounded-full bg-slate-100" />
                        <div className="mt-1 h-1.5 w-3/4 rounded-full bg-slate-100" />
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
                        <div className="mb-1.5 h-2 w-20 rounded-full bg-purple-200" />
                        <div className="space-y-1">
                          <div className="h-1.5 w-full rounded-full bg-slate-100" />
                          <div className="h-1.5 w-5/6 rounded-full bg-slate-100" />
                        </div>
                      </div>
                      <div className="rounded-lg border border-[#14B8A6]/20 bg-[#14B8A6]/5 p-2.5">
                        <div className="mb-1.5 h-2 w-14 rounded-full bg-[#14B8A6]/40" />
                        <div className="h-1.5 w-full rounded-full bg-[#14B8A6]/20" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/65 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/25 bg-white/90 p-4 shadow-xl backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-auto sm:w-[310px]">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#E8F0FF] p-2.5 text-[#2563EB]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2563EB]">Clinical Summary Ready</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">DDx, red flags & actions in one view</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-3 top-10 hidden rounded-2xl border border-white bg-white/95 p-3 shadow-xl sm:block">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#14B8A6]">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Consent-first care
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative z-10 mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <div className="overflow-hidden rounded-[24px] border border-white/80 bg-white/55 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
          <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col gap-4 text-center sm:text-left">
              <div className="mx-auto rounded-2xl bg-[#E8F0FF] p-3 text-[#2563EB] sm:mx-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2v2" /><path d="M5 2v2" /><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" /><path d="M8 15a6 6 0 0 0 12 0v-3" /><circle cx="20" cy="10" r="2" /></svg>
              </div>
              <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
                SehatAI is a clinician-first decision support tool that turns disconnected PHC health records into an actionable patient narrative — while keeping the doctor in control of every clinical decision. Built for India&apos;s 30,000+ Primary Health Centres.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white bg-gradient-to-br from-[#2563EB]/5 to-[#14B8A6]/5 p-8 shadow-xl shadow-slate-200/60">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-bold text-[#2563EB]">15</div>
                  <div className="mt-1 text-xs text-slate-500">Synthetic Patients</div>
                </div>
                <div className="rounded-xl bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-bold text-[#14B8A6]">5</div>
                  <div className="mt-1 text-xs text-slate-500">Clinical Archetypes</div>
                </div>
                <div className="rounded-xl bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">9.4</div>
                  <div className="mt-1 text-xs text-slate-500">Avg Eval Score</div>
                </div>
                <div className="rounded-xl bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-bold text-rose-600">20+</div>
                  <div className="mt-1 text-xs text-slate-500">API Endpoints</div>
                </div>
                <div className="rounded-xl bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-bold text-amber-600">4</div>
                  <div className="mt-1 text-xs text-slate-500">Languages</div>
                </div>
                <div className="rounded-xl bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-bold text-emerald-600">100%</div>
                  <div className="mt-1 text-xs text-slate-500">Doctor Override</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Built around the PHC doctor&apos;s workflow</h2>
          <p className="mt-4 text-lg text-slate-600">Essential clinical context, without adding another complicated system.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className={`group rounded-[24px] border ${f.borderColor} bg-white/70 p-6 shadow-lg shadow-slate-200/40 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-[#2563EB]/10 hover:-translate-y-1`}
            >
              <div className={`h-36 overflow-hidden rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center`}>
                <span className="text-5xl">{f.icon}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#2563EB] group-hover:gap-2.5 transition-all">
                Open <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/60 bg-white/40 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-12 text-center lg:px-8">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] shadow-lg shadow-[#2563EB]/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" aria-hidden="true">
                <path d="M12 4C10.5 4 9.2 4.8 8.5 6C7.3 5.6 6 6.4 5.5 7.6C4.5 7.4 3.5 8.2 3.5 9.4C3.5 10.2 4 10.9 4.7 11.2C4.3 12.4 5 13.7 6.2 14C6.5 15.3 7.7 16.2 9 16C9.5 17.1 10.6 17.8 12 17.8C13.4 17.8 14.5 17.1 15 16C16.3 16.2 17.5 15.3 17.8 14C19 13.7 19.7 12.4 19.3 11.2C20 10.9 20.5 10.2 20.5 9.4C20.5 8.2 19.5 7.4 18.5 7.6C18 6.4 16.7 5.6 15.5 6C14.8 4.8 13.5 4 12 4Z" fill="currentColor" fillOpacity="0.95" />
                <path d="M8 12.5H16M10 15H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">SehatAI</span>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">AI Clinical Decision Support for Indian PHCs</p>
          <p className="mt-2 text-sm text-slate-500">Capstone Project — Educational Prototype</p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span>ICMR STG</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>NPCDCS</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>NTEP</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>RSSDI</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>FOGSI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
