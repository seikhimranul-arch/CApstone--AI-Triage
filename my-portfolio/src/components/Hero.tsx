"use client";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="min-h-screen relative overflow-hidden pt-24">
      {/* Sky-blue gradient banner */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative bg-gradient-to-br from-[#0066FF] via-[#00B4D8] to-[#00D4AA] rounded-[2.5rem] min-h-[520px] overflow-hidden">
          {/* Cloud decorations */}
          <div className="absolute top-10 right-20 w-48 h-20 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-60 w-36 h-14 bg-white/8 rounded-full blur-2xl" />
          <div className="absolute bottom-16 left-10 w-40 h-16 bg-white/10 rounded-full blur-3xl" />

          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 p-10 md:p-14 md:pr-72">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-white text-sm font-semibold mb-5"
            >
              <span>👋</span> Hey, I&apos;m Seikh Imran
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white leading-[0.95] tracking-tighter"
            >
              AI Product
              <br />
              <span className="font-serif italic font-medium text-white/70 text-[0.65em]">
                Manager
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-2 mt-5"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs font-medium">
                📍 Hyderabad, India
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs font-medium">
                💼 2+ Years at ADP
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs font-medium">
                🤖 2 Live AI MVPs
              </span>
            </motion.div>
          </div>

          {/* Portrait cutout placeholder (right side, overlapping bottom) */}
          <div className="absolute bottom-0 right-8 md:right-16 w-40 md:w-52 h-48 md:h-64 rounded-t-2xl overflow-hidden">
            <div className="w-full h-full bg-gradient-to-t from-[#0066FF]/40 to-transparent flex items-end justify-center pb-4">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-2xl md:text-3xl font-bold">
                SI
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
