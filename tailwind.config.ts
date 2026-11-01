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
        // 2026-11 redesign: the former bridal token names now carry the dark gold
        // palette (ECM brand system), so every page that used them goes dark at once.
        // ivory = page background, champagne = raised surface, ink = main text,
        // muted = secondary text, gilt = gold accent.
        ivory: "#1A1A1A",
        champagne: "#242424",
        ink: "#F5F5F5",
        muted: "#A8A8A8",
        gilt: {
          DEFAULT: "#C9A84C",
          hover: "#D4B85C",
          accent: "#C9A84C",
        },
        // After dark section.
        night: {
          DEFAULT: "#120E0A",
          text: "#F4EADA",
          muted: "#CDBFA8",
          gold: "#E2B04A",
        },
      },
      fontFamily: {
        heading: ["var(--font-archivo-black)", "sans-serif"],
        body: ["var(--font-montserrat)", "sans-serif"],
        display: ["var(--font-archivo-black)", "sans-serif"],
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
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
