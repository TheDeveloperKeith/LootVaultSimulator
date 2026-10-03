import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxies /api requests to Spring Boot so the browser sees one origin
// (this is also what makes session cookies work without extra CORS setup).
// Backend is running on 8081 per your last startup log — update this if that changes.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
});
