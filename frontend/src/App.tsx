// ============================================================
// src/App.tsx — Root Application Component & Routing
// ============================================================
//
// 🎓 TEACHING: React Router v6 — Route-based Code Splitting
//
// React.lazy() + Suspense = code splitting on a per-route basis.
//
// WITHOUT code splitting:
//   Browser downloads ALL pages (Dashboard, Expenses, Settings)
//   even if the user only visits the Login page.
//   Initial bundle: ~800KB
//
// WITH code splitting (React.lazy):
//   Browser downloads ONLY the code for the current page.
//   Login page: ~80KB
//   Dashboard page loaded ONLY when user navigates there.
//
// This dramatically improves Time To Interactive (TTI) —
// a key performance metric measured by Google Lighthouse.
//
// 🎓 TEACHING: Protected Routes
// Some pages (Dashboard, Expenses) require the user to be logged in.
// The <ProtectedRoute> component checks for a valid auth token.
// If not logged in → redirect to /login.
// This pattern is used in every production React application.
// ============================================================

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// ── Lazy-loaded page components ───────────────────────────────
// Each page is loaded only when navigated to
const LoginPage        = lazy(() => import("./features/auth/pages/LoginPage"));
const RegisterPage     = lazy(() => import("./features/auth/pages/RegisterPage"));
const DashboardPage    = lazy(() => import("./features/dashboard/pages/DashboardPage"));
const ExpensesPage     = lazy(() => import("./features/expenses/pages/ExpensesPage"));
const ReportsPage      = lazy(() => import("./features/reports/pages/ReportsPage"));
const SettingsPage     = lazy(() => import("./features/settings/pages/SettingsPage"));
const NotFoundPage     = lazy(() => import("./pages/NotFoundPage"));

// ── Layout Components (loaded immediately — always needed) ────
import { AppLayout }       from "./components/layout/AppLayout";
import { ProtectedRoute }  from "./components/layout/ProtectedRoute";
import { PageLoader }      from "./components/ui/PageLoader";

// ============================================================
// App Component
// ============================================================
function App() {
  return (
    // Suspense shows a loading state while lazy components are loading
    // fallback = what to show while the chunk is downloading
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Public Routes (no auth required) ─────────────── */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Protected Routes (auth required) ─────────────── */}
        {/* All protected routes live inside AppLayout (sidebar + navbar) */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Default route: / redirects to /dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="expenses"  element={<ExpensesPage />} />
          <Route path="reports"   element={<ReportsPage />} />
          <Route path="settings"  element={<SettingsPage />} />
        </Route>

        {/* ── 404 Catch-all ─────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Suspense>
  );
}

export default App;
