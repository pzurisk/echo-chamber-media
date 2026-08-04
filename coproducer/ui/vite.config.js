import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" because jweb loads the built app from disk inside the M4L device,
// so every asset path must be relative to dist/index.html.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
