import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        saffron: "#FF9933",
        "saffron-dark": "#E68A2E",
        indian: {
          green: "#138808",
          "green-dark": "#107006",
          navy: "#1a5276",
          "navy-dark": "#0d3b5e",
        },
        halo: {
          bg: "#0c0e14",
          sidebar: "#12151e",
          card: "#161a25",
          border: "#1e2330",
          hover: "#1a1f2e",
          active: "#1c2438",
          muted: "#6b7280",
          text: "#e5e7eb",
        },
      },
    },
  },
  plugins: [],
};
export default config;
