import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: "/",
  define: { __TALKS_STATIC__: JSON.stringify(mode === "static") },
  server: {
    host: true,
    proxy: {
      // Local single-origin: Vite UI + Go /ws (and future /api) on one host.
      "/ws": {
        target: "http://localhost:1578",
        ws: true,
        changeOrigin: true,
      },
      "/healthz": {
        target: "http://localhost:1578",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
  },
}));
