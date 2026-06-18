// ============================================================
// src/features/auth/pages/RegisterPage.tsx — Premium Register UI
// ============================================================

import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import toast from "react-hot-toast";

// Helper to validate single fields on the client-side
const validateField = (fieldName: string, value: string, passwordContext?: string): string => {
  if (fieldName === "name") {
    if (!value.trim()) return "Name is required.";
    if (value.trim().length < 2) return "Name must be at least 2 characters.";
    if (value.trim().length > 100) return "Name cannot exceed 100 characters.";
    return "";
  }
  if (fieldName === "email") {
    if (!value.trim()) return "Email address is required.";
    // Simple email regex aligned with standard email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return "Please enter a valid email address.";
    return "";
  }
  if (fieldName === "password") {
    const errs: string[] = [];
    if (value.length < 8) {
      errs.push("Password must be at least 8 characters.");
    }
    if (!/[A-Z]/.test(value)) {
      errs.push("Password must contain at least one uppercase letter.");
    }
    if (!/\d/.test(value)) {
      errs.push("Password must contain at least one number.");
    }
    return errs.join("\n");
  }
  if (fieldName === "confirmPassword") {
    if (!value) return "Please confirm your password.";
    if (value !== passwordContext) return "Passwords do not match.";
    return "";
  }
  return "";
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd,         setShowPwd]         = useState(false);
  const [errors,          setErrors]          = useState<Record<string, string>>({});

  // Dynamic handlers to clear/validate errors on the fly
  const handleNameChange = (val: string) => {
    setName(val);
    const err = validateField("name", val);
    setErrors((prev) => ({ ...prev, name: err }));
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const err = validateField("email", val);
    setErrors((prev) => ({ ...prev, email: err }));
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    const err = validateField("password", val);
    setErrors((prev) => {
      const updated: Record<string, string> = { ...prev, password: err };
      if (confirmPassword) {
        updated.confirmPassword = validateField("confirmPassword", confirmPassword, val);
      }
      return updated;
    });
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    const err = validateField("confirmPassword", val, password);
    setErrors((prev) => ({ ...prev, confirmPassword: err }));
  };

  // Simple password strength indicator aligned with password constraints
  const getPasswordStrength = (): { label: string; color: string; width: string } => {
    if (password.length === 0)   return { label: "", color: "", width: "0%" };
    if (password.length < 6)     return { label: "Weak", color: "bg-red-500", width: "25%" };
    if (password.length < 8)     return { label: "Fair", color: "bg-orange-500", width: "50%" };
    if (/[A-Z]/.test(password) && /\d/.test(password) && password.length >= 8)
      return { label: "Strong", color: "bg-green-500", width: "100%" };
    return { label: "Good", color: "bg-yellow-500", width: "75%" };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions

    // Validate all fields
    const nameErr = validateField("name", name);
    const emailErr = validateField("email", email);
    const passwordErr = validateField("password", password);
    const confirmPasswordErr = validateField("confirmPassword", confirmPassword, password);

    const newErrors: Record<string, string> = {};
    if (nameErr) newErrors.name = nameErr;
    if (emailErr) newErrors.email = emailErr;
    if (passwordErr) newErrors.password = passwordErr;
    if (confirmPasswordErr) newErrors.confirmPassword = confirmPasswordErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await register(name, email, password, confirmPassword);
      toast.success("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Map duplicate email directly below Email field
        setErrors((prev) => ({
          ...prev,
          email: "An account with this email already exists. Please login or use a different email.",
        }));
      } else if (err.response?.data?.error?.type === "VALIDATION_ERROR" && err.response.data.error.fields) {
        // Map backend validation errors directly to fields
        setErrors(err.response.data.error.fields);
      } else {
        const msg = err.response?.data?.error?.message || "An unexpected error occurred.";
        toast.error(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* ── Left Panel: Form ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl mb-4">
              <span className="text-white text-2xl font-bold">E</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Create your account</h2>
            <p className="mt-2 text-dark-muted">Start tracking your expenses with AI</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="register-name" className="block text-sm font-medium text-dark-text">
                Full name
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`input-field ${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                placeholder="John Doe"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-xs text-red-400 mt-1" role="alert">
                  ❌ {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="register-email" className="block text-sm font-medium text-dark-text">
                Email address
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`input-field ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-red-400 mt-1" role="alert">
                  ❌ {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="register-password" className="block text-sm font-medium text-dark-text">
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`input-field pr-12 ${errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                  placeholder="Min 8 chars, letter + number"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error-container" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-dark-text transition-colors"
                >
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
              {/* Password strength meter */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} rounded-full transition-all duration-500`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className="text-xs text-dark-muted">{strength.label}</p>
                </div>
              )}
              {errors.password && (
                <div id="password-error-container">
                  {errors.password.split("\n").map((errLine, idx) => (
                    <p key={idx} id={`password-error-${idx}`} className="text-xs text-red-400 mt-1" role="alert">
                      ❌ {errLine}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="register-confirm" className="block text-sm font-medium text-dark-text">
                Confirm password
              </label>
              <input
                id="register-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                className={`input-field ${errors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                placeholder="Re-enter your password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
              />
              {errors.confirmPassword && (
                <p id="confirm-error" className="text-xs text-red-400 mt-1" role="alert">
                  ❌ {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark-bg text-dark-muted">Already have an account?</span>
            </div>
          </div>

          {/* Login link */}
          <div className="text-center">
            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              ← Sign in instead
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Decorative ────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-emerald-600 via-teal-600 to-primary-600" />

        {/* Animated elements */}
        <div className="absolute top-24 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-24 left-16 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl animate-pulse [animation-delay:1.5s]" />

        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold leading-tight">
              Smart tracking,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-white">
                effortless insights
              </span>
            </h2>

            {/* Stats preview */}
            <div className="space-y-4">
              {[
                { label: "Average user saves", value: "₹12,000/mo", icon: "📈" },
                { label: "Categories tracked", value: "16+ types", icon: "🏷️" },
                { label: "AI accuracy rate", value: "94%", icon: "🤖" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <div className="font-semibold text-white">{value}</div>
                    <div className="text-sm text-white/60">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
