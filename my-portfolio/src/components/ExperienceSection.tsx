"use client";
import { motion } from "framer-motion";

const experiences = [
  {
    date: "Apr 26 – Present",
    role: "Associate Functional Consultant",
    company: "ADP — UK Implementation",
    bullets: [
      "Leading UK HCM implementations — end-to-end client onboarding, configuration, and go-live",
      "Driving requirements gathering and solution design for UK payroll and HR compliance",
      "Using JIRA, Monday.com, and Siebel to track delivery milestones and cross-team dependencies",
    ],
  },
  {
    date: "Sep 25 – Apr 26",
    role: "Lifion Developer IC",
    company: "ADP — AU Pilot Program",
    bullets: [
      "Piloted HCM integration projects for Australia (payroll law, superannuation, STP)",
      "Worked on Siebel CRM for enterprise integrations and legacy-to-SaaS migration patterns",
      "Pilot concluded successfully — led directly to UK Implementation assignment",
    ],
  },
  {
    date: "Jul 24 – Sep 25",
    role: "Associate Implementation Consultant",
    company: "ADP — UK & Ireland",
    bullets: [
      "Implemented 7 clients via fast-track delivery with higher-than-average NPS scores",
      "Translated business requirements into product configurations, workflows, and system rules",
      "Automated internal processes using n8n to reduce manual effort and accelerate delivery",
    ],
  },
];

export default function ExperienceSection() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <span className="text-xs font-bold tracking-[2px] uppercase text-gray-400">
          ✦ Experience
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold mt-3 lowercase tracking-tight text-[#111]">
          the journey so far
        </h2>
      </motion.div>

      <div className="mt-12">
        {experiences.map((exp, index) => (
          <motion.div
            key={exp.role}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4 md:gap-8 py-6 border-b border-[#E5E5EA] last:border-b-0"
          >
            <div className="flex md:justify-end">
              <span className="inline-flex items-center h-fit px-3.5 py-1.5 bg-[#E8F0FF] text-[#0066FF] rounded-full text-xs font-semibold whitespace-nowrap">
                {exp.date}
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold text-[#111]">{exp.role}</h4>
              <div className="text-sm font-semibold text-[#0066FF] mb-2">{exp.company}</div>
              <ul className="pl-4 space-y-1">
                {exp.bullets.map((bullet) => (
                  <li key={bullet} className="text-sm text-gray-500 leading-relaxed list-disc">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
