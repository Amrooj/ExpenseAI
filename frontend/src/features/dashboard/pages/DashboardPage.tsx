import { useDashboardStats } from "@/hooks/useAnalytics";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, Receipt, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  
  const { data: recentExpensesData, isLoading: expensesLoading } = useExpenses({
    limit: 5,
    sortBy: "date",
    sortOrder: "desc"
  });

  const currency = user?.defaultCurrency || "USD";
  const recentExpenses = recentExpensesData?.expenses || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Dashboard
        </h1>
        <p className="text-dark-muted mt-1">
          Welcome back, {user?.name}. Here's your financial overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Spent This Month"
          value={formatCurrency(stats?.thisMonth?.total || 0, currency)}
          icon={DollarSign}
          iconColor="text-primary-400"
          iconBg="bg-primary-500/10"
          trend={{
            value: stats?.changePercent || 0,
            label: "vs last month",
          }}
          loading={statsLoading}
        />
        <StatCard
          title="Average per Expense"
          value={formatCurrency(stats?.thisMonth?.average || 0, currency)}
          icon={TrendingDown}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
          loading={statsLoading}
        />
        <StatCard
          title="Expenses This Month"
          value={String(stats?.thisMonth?.count || 0)}
          icon={Receipt}
          iconColor="text-sky-400"
          iconBg="bg-sky-500/10"
          loading={statsLoading}
        />
        <StatCard
          title="Total Lifetime Expenses"
          value={String(stats?.totalExpenses || 0)}
          icon={Calendar}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Expenses */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Your latest transactions</CardDescription>
            </div>
            <button
              onClick={() => navigate("/expenses")}
              className="text-sm font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="flex-1">
            {expensesLoading ? (
              <SkeletonTable rows={5} />
            ) : recentExpenses.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No expenses yet"
                description="When you add expenses, they will appear here."
                className="py-12"
              />
            ) : (
              <div className="space-y-4">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-dark-elevated border border-dark-border hover:border-dark-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner"
                        style={{
                          backgroundColor: `${expense.category.color}20`,
                          color: expense.category.color,
                          border: `1px solid ${expense.category.color}40`,
                        }}
                      >
                        {expense.category.icon || "🏷️"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {expense.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-dark-muted">
                            {format(new Date(expense.date), "MMM d, yyyy")}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-dark-muted/50" />
                          <span className="text-xs text-dark-muted">{expense.category.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        {formatCurrency(expense.amount, expense.currency)}
                      </p>
                      {expense.aiProvider && (
                        <Badge variant="primary" className="mt-1 text-[10px] px-1.5 py-0">
                          AI
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tips or Info */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Suggestions based on your habits</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center p-6 text-center">
            {statsLoading ? (
              <div className="space-y-4 w-full">
                <SkeletonCard className="h-24 w-full" />
                <SkeletonCard className="h-24 w-full" />
              </div>
            ) : stats?.thisMonth?.total === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Not enough data"
                description="Add some expenses to see AI-powered insights and saving opportunities."
                className="py-8"
              />
            ) : (
              <div className="space-y-4 w-full">
                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Sparkles className="w-12 h-12 text-violet-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-violet-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Spending Trend
                  </h4>
                  <p className="text-sm text-slate-300 mt-2 relative z-10 leading-relaxed">
                    {stats && stats.changePercent > 0 
                      ? `Your spending is up ${formatPercentage(stats.changePercent, 100)} compared to last month. Keep an eye on your budgets!`
                      : `Great job! Your spending is down ${formatPercentage(Math.abs(stats?.changePercent || 0), 100)} from last month.`}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
