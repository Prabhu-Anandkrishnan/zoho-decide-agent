import { defineConfig } from "vite";

/** FastAPI decide-agent (see repo root .env APP_PORT). */
const API_TARGET = process.env.DECIDE_API_TARGET || "http://localhost:8000";

export default defineConfig({
  root: ".",
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      "/canshowComparison": { target: API_TARGET, changeOrigin: true },
      "/compare": { target: API_TARGET, changeOrigin: true },
      "/health": { target: API_TARGET, changeOrigin: true },
    },
  },
});
