import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/sections/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#1A1A1A",
          charcoal: "#2D2D2D",
          gold: "#C9A84C",
          "gold-hover": "#D4B85C",
          "off-white": "#F5F5F5",
          gray: "#A0A0A0",
          red: "#C94C4C",
        },
        // 2026-11 redesign: refined ivory and ink palette (elegant, high-end). The token
        // names are shared by every page that used the bridal palette.
        // ivory = page background, champagne = raised surface, ink = main text,
        // muted = secondary text, gilt = gold accent.
        ivory: "#F4EFE6",
        champagne: "#EBE4D6",
        ink: "#1C1815",
        muted: "#6B5F52",
        gilt: {
          DEFAULT: "#6E5B3F",
          hover: "#1C1815",
          accent: "#B8A88A",
        },
        // After dark section.
        night: {
          DEFAULT: "#120E0A",
          text: "#F4EADA",
          muted: "#CDBFA8",
          gold: "#D8C3A0",
        },
      },
      fontFamily: {
        heading: ["var(--font-archivo-black)", "sans-serif"],
        body: ["var(--font-montserrat)", "sans-serif"],
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-jost)", "system-ui", "sans-serif"],
        script: ["var(--font-pinyon)", "cursive"],
        "script-dark": ["var(--font-yellowtail)", "cursive"],
      },
      letterSpacing: {
        editorial: "0.05em",
      },
      animation: {
        "scroll-bounce": "scrollBounce 2s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.8s ease-out forwards",
        "count-up": "fadeInUp 0.6s ease-out forwards",
      },
      keyframes: {
        scrollBounce: {
          "0%, 100%": { transform: "translateY(0)", opacity: "1" },
          "50%": { transform: "translateY(12px)", opacity: "0.4" },
        },
        fadeInUp: {
          "0%": { transform: "translateY(30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scrollLeft: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
