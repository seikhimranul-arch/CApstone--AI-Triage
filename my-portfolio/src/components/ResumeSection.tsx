"use client";
import { motion } from "framer-motion";

export default function ResumeSection() {
  return (
    <section id="resume" className="py-24 px-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#111]">
          oh sure, let&apos;s keep it formal
        </h3>
        <button className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-[#0066FF] text-white rounded-full font-semibold text-sm hover:bg-[#0052CC] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-[#E5E5EA] rounded-[1.5rem] p-8 md:p-10 max-w-3xl mx-auto"
      >
        {/* Contact pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5EA] rounded-full text-xs text-gray-500">
            <span className="text-[#0066FF]">✉</span> seikhimranulminhaj@gmail.com
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5EA] rounded-full text-xs text-gray-500">
            <span className="text-[#0066FF]">📞</span> +91-7008044210
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5EA] rounded-full text-xs text-gray-500">
            <span className="text-[#0066FF]">in</span> /in/seikh-imran
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5EA] rounded-full text-xs text-gray-500">
            <span className="text-[#0066FF]">🌐</span> seikhimranul-arch.github.io
          </span>
        </div>

        {/* Experience items */}
        <div className="space-y-0">
          <div className="py-4 border-b border-[#E5E5EA]">
            <h4 className="text-sm font-bold text-[#111]">Associate Functional Consultant</h4>
            <div className="text-xs font-semibold text-[#0066FF]">ADP — UK Implementation</div>
            <div className="text-[11px] text-gray-400 mb-1">Apr 2026 — Present · Hyderabad, India</div>
            <ul className="pl-4 space-y-0.5">
              <li className="text-xs text-gray-500 leading-relaxed list-disc">Leading UK HCM implementations — end-to-end client onboarding, configuration, and go-live</li>
              <li className="text-xs text-gray-500 leading-relaxed list-disc">Driving requirements gathering and solution design for UK payroll and HR compliance</li>
            </ul>
          </div>
          <div className="py-4 border-b border-[#E5E5EA]">
            <h4 className="text-sm font-bold text-[#111]">Lifion Developer IC</h4>
            <div className="text-xs font-semibold text-[#0066FF]">ADP — AU Pilot Program</div>
            <div className="text-[11px] text-gray-400 mb-1">Sep 2025 — Apr 2026 · Hyderabad, India</div>
            <ul className="pl-4 space-y-0.5">
              <li className="text-xs text-gray-500 leading-relaxed list-disc">Piloted HCM integration projects for Australia market</li>
              <li className="text-xs text-gray-500 leading-relaxed list-disc">Pilot concluded successfully — led to UK Implementation assignment</li>
            </ul>
          </div>
          <div className="py-4">
            <h4 className="text-sm font-bold text-[#111]">Associate Implementation Consultant</h4>
            <div className="text-xs font-semibold text-[#0066FF]">ADP — UK & Ireland</div>
            <div className="text-[11px] text-gray-400 mb-1">Jul 2024 — Sep 2025 · Hyderabad, India</div>
            <ul className="pl-4 space-y-0.5">
              <li className="text-xs text-gray-500 leading-relaxed list-disc">Implemented 7 clients via fast-track delivery with high NPS scores</li>
              <li className="text-xs text-gray-500 leading-relaxed list-disc">Automated internal processes using n8n to reduce manual effort</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
