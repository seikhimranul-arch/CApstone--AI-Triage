"use client";

export function SehatLogo({ size = "md", dark = false }: { size?: "sm" | "md" | "lg"; dark?: boolean }) {
  const sizes = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-12 w-12" };
  const iconSizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };

  return (
    <div className={`flex ${sizes[size]} flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9933] via-[#1a5276] to-[#138808] shadow-lg`}>
      <svg viewBox="0 0 32 32" fill="none" className={iconSizes[size]}>
        {/* Ashoka-inspired lotus/pill shape */}
        <path d="M16 3C13.5 3 11.5 5 11 7.5C9.5 7 8 8.5 7.5 10.5C6 10 4.5 11.5 4.5 13.5C4.5 15 5.5 16.2 6.8 16.5C6 18.5 7 20.5 9 21C9.5 23 11 24.5 13 24.5C13.5 25.5 14.8 26.5 16.5 26.5C18.2 26.5 19.5 25.5 20 24.5C22 24.5 23.5 23 24 21C26 20.5 27 18.5 26.2 16.5C27.5 16.2 28.5 15 28.5 13.5C28.5 11.5 27 10 25.5 10.5C25 8.5 23.5 7 22 7.5C21.5 5 19.5 3 16 3Z" fill="white" fillOpacity="0.95"/>
        <path d="M11 14H22M13 18H20" stroke="rgba(26,82,118,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
        {/* Small heart line */}
        <path d="M16 10L17 12L16 14L15 12Z" fill="rgba(255,153,51,0.8)" />
      </svg>
    </div>
  );
}
