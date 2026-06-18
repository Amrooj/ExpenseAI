// ============================================================
// src/components/layout/ProtectedRoute.tsx — Route Guard
// ============================================================
//
// 🎓 TEACHING: Route Guards
//
// Route guards prevent unauthorized access to pages.
// If a user navigates to /dashboard without logging in,
// this component redirects them to /login automatically.
//
// It also handles the "loading" state when the app first loads
// and is checking localStorage for an existing token.
// ============================================================

import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { PageLoader } from "../ui/PageLoader";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isInitialized, initialize } = useAuthStore();
  const location = useLocation();

  // Initialize auth state on first render
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Still checking if user is logged in → show loader
  if (!isInitialized) {
    return <PageLoader />;
  }

  // Not logged in → redirect to login (preserving intended URL)
  if (!user) {
    // `state.from` lets the login page redirect back here after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated → render the protected content
  return <>{children}</>;
}
