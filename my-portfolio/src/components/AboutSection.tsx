"use client";
import { motion } from "framer-motion";

export default function AboutSection() {
  return (
    <section id="about" className="py-24 px-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <span className="text-xs font-bold tracking-[2px] uppercase text-gray-400">
          ✦ About Me
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold mt-3 lowercase tracking-tight text-[#111]">
          a little about myself
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 items-start">
        {/* Left image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="w-full aspect-[3/4] bg-gradient-to-br from-[#E8F0FF] to-[#F0F0F5] rounded-[2rem] flex items-center justify-center"
        >
          <div className="text-6xl text-[#E5E5EA]">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </motion.div>

        {/* Right content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p className="text-sm text-gray-500 leading-[1.8] mb-4">
            AI Product Manager &amp; HCM Implementation Specialist with 2+ years at ADP — one of the
            world&apos;s largest payroll platforms. I sit at a rare intersection:{" "}
            <strong className="text-[#111]">deep domain knowledge of complex enterprise HCM implementations</strong>{" "}
            combined with <strong className="text-[#111]">hands-on, full-stack experience building and deploying
            live AI-native products</strong>.
          </p>
          <p className="text-sm text-gray-500 leading-[1.8] mb-4">
            I designed, built, and shipped <strong className="text-[#111]">FintLer</strong> (AI financial clarity
            engine) and <strong className="text-[#111]">Intentio Stylist AI</strong> (context-aware fashion
            assistant) — live MVPs demonstrating 0-to-1 product execution, behavioral psychology in UX, and
            ephemeral data architectures.
          </p>
          <p className="text-sm text-gray-500 leading-[1.8] mb-6">
            Previously: HCM implementations across{" "}
            <strong className="text-[#111]">UK, Ireland, and Australia markets</strong>. I know where payroll
            systems fail, what clients actually need vs. what they ask for, and how to translate that into
            products that ship.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E5EA] rounded-full text-xs font-semibold text-[#111]">
              🏢 ADP
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E5EA] rounded-full text-xs font-semibold text-[#111]">
              📅 2+ Years
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E5EA] rounded-full text-xs font-semibold text-[#111]">
              🌏 Hyderabad, India
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
