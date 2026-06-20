import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  BarChart3,
  Shield,
  Zap,
  TrendingUp,
  CreditCard,
  PieChart,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Categorization",
    description: "Smart expense categorization that learns your spending patterns automatically.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: BarChart3,
    title: "Visual Analytics",
    description: "Beautiful charts and insights to understand where your money goes.",
    color: "text-primary-400",
    bg: "bg-primary-500/10",
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description: "JWT authentication with refresh token rotation keeps your data safe.",
    color: "text-success-500",
    bg: "bg-success-500/10",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed. Track expenses in seconds, not minutes.",
    color: "text-warning-500",
    bg: "bg-warning-500/10",
  },
  {
    icon: TrendingUp,
    title: "Spending Trends",
    description: "Month-over-month comparisons and category breakdowns at a glance.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
  },
  {
    icon: CreditCard,
    title: "Multi-Currency",
    description: "Track expenses in 15+ currencies with automatic formatting.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
];

const STATS = [
  { value: "15+", label: "Currencies" },
  { value: "100%", label: "Open Source" },
  { value: "0", label: "Hidden Fees" },
  { value: "∞", label: "Expenses" },
];

const BENEFITS = [
  "Track unlimited expenses",
  "AI category suggestions",
  "Export to CSV",
  "Mobile responsive",
  "Real-time analytics",
  "Secure & private",
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-dark-border/50 bg-dark-bg/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-white">ExpenseAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Sign in
            </Button>
            <Button variant="default" size="sm" onClick={() => navigate("/register")}>
              Get started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-8">
            <Sparkles className="h-3 w-3" />
            AI-Powered Expense Tracking
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6">
            Track smarter,{" "}
            <span className="bg-gradient-to-r from-primary-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              spend wiser
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-dark-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            ExpenseAI turns your financial chaos into clarity. Automatically categorize expenses,
            visualize spending patterns, and gain insights that help you make better financial decisions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="default"
              size="lg"
              onClick={() => navigate("/register")}
              className="w-full sm:w-auto gap-2"
            >
              Start tracking free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto"
            >
              Sign in to dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-dark-border bg-dark-surface/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{value}</div>
                <div className="text-sm text-dark-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to manage expenses
            </h2>
            <p className="text-dark-muted text-lg max-w-2xl mx-auto">
              A complete financial toolkit built for individuals and small teams.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="bg-dark-surface border border-dark-border rounded-2xl p-6 hover:border-dark-muted/40 transition-all duration-200 group"
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-dark-muted leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard preview / CTA */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/20 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto">
          <div className="bg-dark-surface border border-dark-border rounded-3xl p-8 sm:p-12 text-center relative">
            {/* Mock dashboard card */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-3">
              {["bg-danger-500/20", "bg-primary-500/20", "bg-success-500/20"].map((c, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${c} border border-current`} />
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 mb-6">
              <PieChart className="h-5 w-5 text-primary-400" />
              <span className="text-sm font-medium text-primary-300">Built for real workflows</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to take control of your finances?
            </h2>
            <p className="text-dark-muted text-lg mb-8 max-w-xl mx-auto">
              Join thousands of users who track smarter with ExpenseAI.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 max-w-md mx-auto">
              {BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-success-500 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <Button
              variant="default"
              size="lg"
              onClick={() => navigate("/register")}
              className="gap-2"
            >
              Create free account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium text-white">ExpenseAI</span>
          </div>
          <p className="text-xs text-dark-muted">
            Built with ♥ for better financial clarity
          </p>
          <div className="flex items-center gap-4 text-xs text-dark-muted">
            <button onClick={() => navigate("/login")} className="hover:text-white transition-colors">
              Sign in
            </button>
            <button onClick={() => navigate("/register")} className="hover:text-white transition-colors">
              Register
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
