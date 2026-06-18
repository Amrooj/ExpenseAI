// ============================================================
// src/features/auth/pages/LoginPage.tsx — Premium Login UI
// ============================================================

import { useState, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);

  // Redirect back to where user came from (or /dashboard)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      // Error handling done in the store via toast
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* ── Left Panel: Decorative ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-violet-600 to-fuchsia-600" />

        {/* Animated circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 right-16 w-96 h-96 bg-violet-300/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-fuchsia-400/10 rounded-full blur-2xl animate-pulse [animation-delay:2s]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <span className="text-3xl">💰</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight">
              Take Control of<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-white">
                Your Finances
              </span>
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              AI-powered expense tracking that categorizes your spending automatically
              and gives you actionable insights.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 pt-4">
              {["AI Categorization", "Smart Reports", "Receipt Scanner", "Budget Alerts"].map((f) => (
                <span key={f} className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/90 border border-white/20">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl mb-4">
              <span className="text-white text-2xl font-bold">E</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Welcome back</h2>
            <p className="mt-2 text-dark-muted">Sign in to your ExpenseAI account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="login-email" className="block text-sm font-medium text-dark-text">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="login-password" className="block text-sm font-medium text-dark-text">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-dark-text transition-colors"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark-bg text-dark-muted">New to ExpenseAI?</span>
            </div>
          </div>

          {/* Register link */}
          <div className="text-center">
            <Link
              to="/register"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Create a free account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
