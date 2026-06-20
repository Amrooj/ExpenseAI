import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { cn, getInitials } from "../../lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/expenses", icon: CreditCard, label: "Expenses" },
  { to: "/categories", icon: Tag, label: "Categories" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-dark-border shrink-0",
          collapsed && !mobile && "px-3 justify-center"
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <span className="font-bold text-white text-lg tracking-tight">ExpenseAI</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto mt-2">
        <TooltipProvider delayDuration={0}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Tooltip key={to} disableHoverableContent={!collapsed || mobile}>
              <TooltipTrigger asChild>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                      collapsed && !mobile && "justify-center px-2.5",
                      isActive
                        ? "bg-primary-600/15 text-primary-300 border border-primary-500/20"
                        : "text-dark-muted hover:bg-dark-elevated hover:text-white"
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {(!collapsed || mobile) && <span>{label}</span>}
                </NavLink>
              </TooltipTrigger>
              {collapsed && !mobile && (
                <TooltipContent side="right">{label}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>

      {/* User section */}
      <div className={cn("p-3 border-t border-dark-border shrink-0 space-y-1", collapsed && !mobile && "px-2")}>
        <TooltipProvider delayDuration={0}>
          <Tooltip disableHoverableContent={!collapsed || mobile}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                  "hover:bg-dark-elevated transition-colors duration-150 cursor-default",
                  collapsed && !mobile && "justify-center px-2"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>{getInitials(user?.name || "U")}</AvatarFallback>
                </Avatar>
                {(!collapsed || mobile) && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                    <p className="text-xs text-dark-muted truncate">{user?.email}</p>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            {collapsed && !mobile && (
              <TooltipContent side="right">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-dark-muted">{user?.email}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <Tooltip disableHoverableContent={!collapsed || mobile}>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium",
                  "text-dark-muted hover:text-danger-400 hover:bg-danger-500/10",
                  "transition-all duration-150",
                  collapsed && !mobile && "justify-center px-2"
                )}
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" />
                {(!collapsed || mobile) && <span>Sign out</span>}
              </button>
            </TooltipTrigger>
            {collapsed && !mobile && (
              <TooltipContent side="right">Sign out</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 bg-dark-surface border-r border-dark-border",
          "transition-all duration-300 ease-in-out relative",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "absolute -right-3 top-[72px] z-10",
            "w-6 h-6 rounded-full bg-dark-elevated border border-dark-border",
            "flex items-center justify-center text-dark-muted hover:text-white",
            "transition-colors duration-150"
          )}
        >
          <ChevronLeft
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col",
          "bg-dark-surface border-r border-dark-border",
          "transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-dark-elevated"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent mobile />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-dark-border bg-dark-surface shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-dark-muted hover:text-white hover:bg-dark-elevated"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-white">ExpenseAI</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
