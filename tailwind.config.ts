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
      },
      fontFamily: {
        heading: ["var(--font-archivo-black)", "sans-serif"],
        body: ["var(--font-montserrat)", "sans-serif"],
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
