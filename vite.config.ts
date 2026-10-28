import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Relative base keeps the static build portable on GitHub Pages project sites.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
