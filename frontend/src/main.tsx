// ============================================================
// src/main.tsx — React Application Bootstrap
// ============================================================
//
// 🎓 TEACHING: What is main.tsx?
//
// This is the ENTRY POINT of your React application.
// Vite starts here (as configured in index.html).
//
// It's responsible for:
//   1. Mounting the React app to the DOM
//   2. Setting up global providers that wrap everything
//
// 🎓 TEACHING: What is a "Provider"?
// A Provider is a React component that makes data or functionality
// available to ALL child components below it in the tree.
// It uses React's Context API under the hood.
//
// Examples:
//   <QueryClientProvider> → TanStack Query cache available everywhere
//   <Router>             → React Router navigation available everywhere
//   <Toaster>            → Toast notifications available everywhere
//
// Provider ORDER matters — if Component A needs both Query and Router,
// it must be wrapped by BOTH providers.
// ============================================================

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App";
import "./index.css";

// ── TanStack Query Client ─────────────────────────────────────
//
// 🎓 TEACHING: QueryClient is the heart of TanStack Query.
// It manages:
//   - Cache for all API responses
//   - Background refetching strategies
//   - Error retry logic
//   - Loading/error states for every query
//
// staleTime: How long before data is considered "stale" (outdated)?
//   0ms = always stale → refetch every time component mounts
//   5 minutes = cache for 5 minutes → no unnecessary API calls
//
// retry: How many times to retry failed requests?
//   1 = retry once (handles temporary network glitches)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Don't refetch when user switches tabs
    },
    mutations: {
      retry: 0, // Never retry mutations (POST/PATCH/DELETE)
      // WHY? Retrying a mutation could create duplicate records
    },
  },
});

// ── Mount React App ───────────────────────────────────────────
//
// 🎓 TEACHING: document.getElementById("root")!
//
// The `!` is TypeScript's "non-null assertion operator".
// It tells TypeScript: "I guarantee this won't be null."
// We know it won't be null because index.html has <div id="root">.
//
// React.StrictMode: Renders components twice in development to
// detect side effects. Has zero impact in production builds.
// It helps catch common mistakes like:
//   - Missing cleanup in useEffect
//   - Deprecated API usage
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* QueryClientProvider makes the query cache available everywhere */}
    <QueryClientProvider client={queryClient}>
      {/* BrowserRouter enables React Router navigation */}
      <BrowserRouter>

        {/* Your entire application */}
        <App />

        {/* Toast notifications — position at top-right */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1a1a2e",
              color: "#f1f5f9",
              border: "1px solid #2d2d4a",
              borderRadius: "0.75rem",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.875rem",
            },
            success: {
              iconTheme: { primary: "#22c55e", secondary: "#1a1a2e" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#1a1a2e" },
            },
          }}
        />

      </BrowserRouter>

      {/* TanStack Query DevTools — only shows in development */}
      {/* Lets you inspect cache, queries, and loading states */}
      <ReactQueryDevtools initialIsOpen={false} />

    </QueryClientProvider>
  </React.StrictMode>
);
