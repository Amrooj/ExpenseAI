// src/features/dashboard/pages/DashboardPage.tsx

import { useDashboard, useSpendingTrends, useCategories, useExpenses } from "../../../hooks/useExpenses";
import { useAuthStore } from "../../../store/authStore";
import { Expense } from "../../../types";
import { useNavigate } from "react-router-dom";

function StatCard({
  icon, label, value, subtext, trend, trendUp,
}: {
  icon: string; label: string; value: string;
  subtext?: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="card-hover group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dark-muted text-sm">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtext && <p className="text-xs text-dark-muted mt-1">{subtext}</p>}
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-violet-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      {trend && (
        <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${trendUp ? "text-green-400" : "text-red-400"}`}>
          <span>{trendUp ? "↑" : "↓"}</span>
          <span>{trend}</span>
          <span className="text-dark-muted ml-1">vs last month</span>
        </div>
      )}
    </div>
  );
}

function CategoryBar({ name, color, percentage, amount }: {
  name: string; color: string; percentage: number; amount: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-dark-text">{name}</span>
        </div>
        <span className="text-dark-muted">{amount}</span>
      </div>
      <div className="h-2 bg-dark-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function RecentExpenseRow({ expense, fmt }: { expense: Expense; fmt: (n: number) => string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-dark-border/40 last:border-0 hover:bg-dark-border/10 transition-colors rounded-lg px-2 -mx-2">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
        style={{ backgroundColor: (expense.category?.color ?? "#6366F1") + "20" }}
      >
        {expense.category?.icon ?? "📦"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{expense.description}</p>
        <p className="text-xs text-dark-muted">
          {new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          {expense.category?.name && <span className="ml-2">• {expense.category.name}</span>}
        </p>
      </div>
      <p className="text-sm font-semibold text-white flex-shrink-0">{fmt(expense.amount)}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: trends } = useSpendingTrends();
  const { data: categories } = useCategories();
  const { data: recentData } = useExpenses({ page: 1, limit: 5, sortBy: "date", sortOrder: "desc" });
  const recentExpenses = (recentData?.data ?? []) as Expense[];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: user?.defaultCurrency ?? "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  if (dashLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-64 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="card p-6 space-y-3">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-8 w-32 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 card p-6 space-y-3">
            <div className="skeleton h-5 w-32 rounded" />
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-8 rounded-lg" />)}
          </div>
          <div className="lg:col-span-2 card p-6 space-y-3">
            <div className="skeleton h-5 w-28 rounded" />
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-6 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  const thisMonthTotal = dashboard?.thisMonth?.total ?? 0;
  const changePercent  = dashboard?.changePercent ?? 0;
  const totalCount     = dashboard?.totalExpenses ?? 0;
  const avgExpense     = dashboard?.thisMonth?.average ?? 0;
  const hasData        = totalCount > 0;

  const categoryBreakdown = trends?.byCategory?.map((item) => {
    const cat = categories?.find((c) => c.id === item.categoryId);
    const total = Number(item._sum?.amount ?? 0);
    return {
      name:       cat?.name ?? "Other",
      color:      cat?.color ?? "#6366F1",
      amount:     fmt(total),
      percentage: thisMonthTotal > 0 ? (total / thisMonthTotal) * 100 : 0,
    };
  }).sort((a, b) => b.percentage - a.percentage).slice(0, 6) ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {greeting}, <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-dark-muted mt-1">Here is your spending summary</p>
        </div>
        {hasData && (
          <button
            onClick={() => navigate("/expenses")}
            className="px-4 py-2 text-sm rounded-xl border border-dark-border text-dark-muted hover:text-primary-400 hover:border-primary-500 transition-all"
          >
            View All Expenses →
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="This Month" value={fmt(thisMonthTotal)} trend={`${Math.abs(changePercent)}%`} trendUp={changePercent <= 0} />
        <StatCard icon="📊" label="Avg per Expense" value={fmt(avgExpense)} subtext={`${dashboard?.thisMonth?.count ?? 0} expenses`} />
        <StatCard icon="🧾" label="Total Tracked" value={totalCount.toLocaleString()} subtext="all time" />
        <StatCard icon="📉" label="vs Last Month" value={`${changePercent > 0 ? "+" : ""}${changePercent}%`} subtext={changePercent <= 0 ? "Spending less!" : "Spending increased"} trend={changePercent <= 0 ? "On track" : "Watch out"} trendUp={changePercent <= 0} />
      </div>

      {!hasData && (
        <div className="card p-12 text-center space-y-4">
          <p className="text-6xl">📊</p>
          <h3 className="text-xl font-semibold text-white">No expenses yet</h3>
          <p className="text-dark-muted">Start by adding your first expense to see your dashboard come to life.</p>
          <button onClick={() => navigate("/expenses")} className="btn-primary px-6 py-2.5 mt-2">Add First Expense</button>
        </div>
      )}

      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Spending Trend</h3>
            {trends?.monthly && trends.monthly.length > 0 ? (
              <div className="space-y-3">
                {trends.monthly.map((m) => {
                  const monthStr = new Date(m.month).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                  const maxVal = Math.max(...trends.monthly.map((t) => t.total || 1));
                  const pct = (m.total / maxVal) * 100;
                  return (
                    <div key={m.month} className="flex items-center gap-4">
                      <span className="text-sm text-dark-muted w-16 flex-shrink-0">{monthStr}</span>
                      <div className="flex-1 h-8 bg-dark-border/30 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-lg transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        >
                          <span className="text-xs text-white font-medium">{fmt(m.total)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-muted">
                <p className="text-4xl mb-2">📊</p>
                <p>Start adding expenses to see your trends!</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-2 card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">By Category</h3>
            {categoryBreakdown.length > 0 ? (
              <div className="space-y-4">
                {categoryBreakdown.map((cat) => (
                  <CategoryBar key={cat.name} {...cat} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-muted">
                <p className="text-4xl mb-2">🏷️</p>
                <p>No expense data yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {hasData && recentExpenses.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Expenses</h3>
            <button
              onClick={() => navigate("/expenses")}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium"
            >
              See all →
            </button>
          </div>
          <div>
            {recentExpenses.map((expense) => (
              <RecentExpenseRow key={expense.id} expense={expense} fmt={fmt} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
