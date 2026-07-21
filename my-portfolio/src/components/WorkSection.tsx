"use client";
import { motion } from "framer-motion";

const projects = [
  {
    id: "01",
    year: "2025",
    title: "FintLer — AI Financial Clarity Engine",
    desc: "Zero-friction financial dashboard reading bank emails to generate behavioral insights for Indian millennials.",
    tags: ["AI/ML", "Gemini API", "React", "Supabase"],
    bgColor: "bg-[#0066FF]",
    link: "https://fintlerai.netlify.app",
  },
  {
    id: "02",
    year: "2025",
    title: "Intentio — Context-Aware Fashion Assistant",
    desc: "AI fashion assistant returning aesthetic rationale explaining why pieces work together, building user confidence.",
    tags: ["React 19", "Vite", "TanStack", "Tailwind"],
    bgColor: "bg-[#00B4D8]",
    link: "https://intetio.netlify.app",
  },
  {
    id: "03",
    year: "2025",
    title: "PayAI — Enterprise Validation Engine",
    desc: "B2B product concept automating payroll data validation for implementation teams.",
    tags: ["B2B", "Payroll", "Prompt Engineering"],
    bgColor: "bg-[#00D4AA]",
    link: "#",
  },
  {
    id: "04",
    year: "2025",
    title: "Lumenci AI — Patent Claim Chart Assistant",
    desc: "Early concept that honed B2B monetization thinking and advanced prompt engineering skills.",
    tags: ["Legal Tech", "Document AI", "LLM"],
    bgColor: "bg-[#7C3AED]",
    link: "#",
  },
];

export default function WorkSection() {
  return (
    <section id="work" className="py-24 px-6 max-w-6xl mx-auto relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <span className="text-xs font-bold tracking-[2px] uppercase text-gray-400">
          ✦ Selected Work
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold mt-3 lowercase tracking-tight text-[#111]">
          check out some of my work
        </h2>
        <p className="text-gray-500 mt-3 text-sm">
          A few products I&apos;ve built, and the thinking behind them.
        </p>
      </motion.div>

      {/* Sticky stacking cards */}
      <div className="relative w-full">
        {projects.map((project, index) => (
          <a
            key={project.id}
            href={project.link}
            target={project.link !== "#" ? "_blank" : undefined}
            rel={project.link !== "#" ? "noopener noreferrer" : undefined}
            className={`sticky block flex flex-col md:flex-row justify-between items-center w-full min-h-[65vh] rounded-[2.5rem] p-8 md:p-12 shadow-xl overflow-hidden text-white no-underline ${project.bgColor} hover:scale-[1.01] transition-transform duration-300`}
            style={{
              top: `calc(4rem + ${index * 2.5}rem)`,
              marginBottom: "4rem",
              zIndex: index + 1,
            }}
          >
            {/* Left content */}
            <div className="md:w-1/2 flex flex-col justify-between h-full z-10">
              <div className="flex justify-between items-center border-b border-white/20 pb-4 mb-6">
                <span className="text-3xl font-light">{project.id}</span>
                <span className="text-xs font-medium opacity-70">{project.year}</span>
              </div>

              <h3 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                {project.title}
              </h3>

              <p className="text-sm text-white/70 mb-6 max-w-md leading-relaxed">
                {project.desc}
              </p>

              <div className="flex gap-2 mb-8 flex-wrap">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 border border-white/25 rounded-full text-xs font-medium backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 w-fit px-5 py-2.5 bg-white text-[#111] rounded-full font-semibold text-sm hover:scale-105 transition-transform duration-300">
                View Case Study
                <span className="bg-[#111] text-white p-1.5 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  →
                </span>
              </div>
            </div>

            {/* Right mockup placeholder */}
            <div className="md:w-1/2 flex justify-end mt-10 md:mt-0 relative h-full">
              <div className="w-48 md:w-56 h-72 md:h-80 bg-white/10 border border-white/15 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="h-5 bg-white/5 border-b border-white/10" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-2 bg-white/10 rounded w-3/4" />
                  <div className="h-2 bg-white/10 rounded w-1/2" />
                  <div className="h-2 bg-white/10 rounded w-2/3" />
                  <div className="h-8 bg-white/8 rounded mt-4" />
                  <div className="h-8 bg-white/8 rounded" />
                  <div className="h-8 bg-white/8 rounded" />
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
