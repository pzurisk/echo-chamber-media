/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0c0e",
        panel: "#121417",
        raised: "#181b1f",
        edge: "#23262c",
        edge2: "#31363e",
        ink: "#e7e5e0",
        dim: "#9aa1aa",
        faint: "#646b75",
        accent: "#e0a343",
        "accent-soft": "#eebd6d",
        ok: "#69b076",
        warn: "#c96f5f",
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
