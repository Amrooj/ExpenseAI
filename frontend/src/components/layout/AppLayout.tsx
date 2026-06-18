// ============================================================
// src/components/layout/AppLayout.tsx — Responsive App Shell
// ============================================================

import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/expenses",  icon: "💳", label: "Expenses" },
  { to: "/reports",   icon: "📈", label: "Reports" },
  { to: "/settings",  icon: "⚙️", label: "Settings" },
];

export function AppLayout() {
  const { user, logout }    = useAuthStore();
  const navigate            = useNavigate();
  const location            = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 flex items-center justify-between border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          {!collapsed && (
            <span className="gradient-text text-xl font-bold whitespace-nowrap">ExpenseAI</span>
          )}
        </div>
        {/* Collapse button — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:block text-dark-muted hover:text-dark-text transition-colors p-1"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-dark-muted hover:text-dark-text text-2xl leading-none"
          aria-label="Close menu"
        >
          ×
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? "bg-primary-500/15 text-primary-400 border border-primary-500/20"
                : "text-dark-muted hover:text-dark-text hover:bg-dark-border/30"
              }`
            }
          >
            <span className="text-xl flex-shrink-0">{icon}</span>
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-dark-border">
        <div className={`flex items-center gap-3 px-3 py-3 rounded-xl ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-text truncate">{user?.name}</p>
              <p className="text-xs text-dark-muted truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-4 py-2.5 mt-1 rounded-xl text-sm
            text-dark-muted hover:text-red-400 hover:bg-red-500/10 transition-all duration-200
            ${collapsed ? "justify-center" : ""}`}
        >
          <span className="text-lg">🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {/* ── Mobile overlay backdrop ──────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Desktop Sidebar ──────────────────────────────────── */}
      <aside className={`
        hidden lg:flex flex-col flex-shrink-0
        ${collapsed ? "w-20" : "w-64"}
        bg-dark-surface border-r border-dark-border
        transition-all duration-300 ease-in-out
      `}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer Sidebar ────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-72
        bg-dark-surface border-r border-dark-border
        transition-transform duration-300 ease-in-out
        lg:hidden
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <SidebarContent />
      </aside>

      {/* ── Main Content ────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-dark-surface border-b border-dark-border sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-dark-muted hover:text-white p-1"
            aria-label="Open menu"
          >
            <span className="text-2xl leading-none">☰</span>
          </button>
          <span className="gradient-text font-bold text-lg">ExpenseAI</span>
        </div>
        <div className="page-container flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
