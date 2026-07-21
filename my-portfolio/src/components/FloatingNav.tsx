"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingNav() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center w-full px-4">
      <motion.nav
        layout
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex items-center bg-white/90 backdrop-blur-md border border-gray-200 shadow-sm rounded-full p-1.5 overflow-hidden cursor-pointer"
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Avatar & Name */}
        <div className="flex items-center gap-2.5 pl-2 pr-3 z-10">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-[#0066FF] to-[#00D4AA] flex items-center justify-center text-white text-xs font-bold">
              SI
            </div>
          </div>
          <span className="font-bold text-sm tracking-wide text-gray-900 uppercase whitespace-nowrap">
            Seikh Imran
          </span>
        </div>

        {/* Expandable Links */}
        <AnimatePresence mode="wait">
          {isHovered ? (
            <motion.div
              key="links"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1 px-2 whitespace-nowrap overflow-hidden"
            >
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <a
                href="#work"
                className="text-sm font-medium text-gray-500 hover:text-[#0066FF] transition-colors px-3 py-1.5 rounded-full hover:bg-gray-50"
              >
                Work
              </a>
              <a
                href="#about"
                className="text-sm font-medium text-gray-500 hover:text-[#0066FF] transition-colors px-3 py-1.5 rounded-full hover:bg-gray-50"
              >
                About
              </a>
              <a
                href="#resume"
                className="text-sm font-medium text-gray-500 hover:text-[#0066FF] transition-colors px-3 py-1.5 rounded-full hover:bg-gray-50"
              >
                Resume
              </a>
            </motion.div>
          ) : (
            <motion.div
              key="dots"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 text-gray-400 font-bold text-lg leading-none select-none"
            >
              •••
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
