import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// ============================================================
// vite.config.ts — Vite Build Tool Configuration
//
// 🎓 TEACHING: What is Vite?
//
// Vite (French for "fast") is a modern build tool that replaces
// Create React App and Webpack.
//
// WHY IS VITE FASTER?
//   Webpack bundles EVERYTHING before starting the dev server.
//   Vite uses native browser ES Modules — it only transforms files
//   when the browser requests them. Your dev server starts in <300ms
//   regardless of project size.
//
// Vite uses Rollup for production builds (optimized bundles).
// ============================================================

export default defineConfig({
  plugins: [
    react(),
    // @vitejs/plugin-react:
    // - Enables Fast Refresh (component state preserved on save)
    // - Transforms JSX
    // - Handles React-specific optimizations
  ],

  // ── Path Aliases ──────────────────────────────────────────
  // Must match tsconfig.json "paths" exactly
  // This tells Vite to resolve "@/components/Button" as "src/components/Button"
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ── Dev Server ────────────────────────────────────────────
  server: {
    port: 5173,
    host: true, // Needed for Docker (listen on all interfaces, not just localhost)
    // ── API Proxy ──────────────────────────────────────────
    // When the frontend calls /api/..., Vite proxies it to the backend.
    // This avoids CORS issues in development and mirrors production
    // where a reverse proxy (nginx) routes /api to the backend.
    proxy: {
      "/api": {
        target: process.env["VITE_API_URL"] ?? "http://localhost:3000",
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, "") // uncomment if backend doesn't have /api prefix
      },
      "/uploads": {
        target: process.env["VITE_API_URL"] ?? "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },

  // ── Production Build ──────────────────────────────────────
  build: {
    // Output directory (what gets deployed to Vercel)
    outDir: "dist",
    // Generate source maps for production debugging
    sourcemap: true,
    // Split vendor code into separate chunks
    // WHY? Browser caches vendor code (React, Recharts) separately
    // from your app code. When you update your app, users only
    // re-download YOUR code, not the entire bundle.
    rollupOptions: {
      output: {
        manualChunks: {
          // Chunk: React runtime
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // Chunk: Data layer
          "data-vendor": ["@tanstack/react-query", "axios", "zustand"],
          // Chunk: Charts (large library — lazy loaded)
          "charts-vendor": ["recharts"],
          // Chunk: PDF generation (only loaded when user clicks export)
          "pdf-vendor": ["jspdf", "html2canvas"],
        },
      },
    },
  },

  // ── Test Configuration ────────────────────────────────────
  test: {
    environment: "jsdom", // Simulate browser DOM for React component tests
    setupFiles: ["./src/tests/setup.ts"],
    globals: true,        // Use describe/it/expect without imports
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
