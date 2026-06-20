import { useMemo, useState } from "react";
import { useTrendsData } from "@/hooks/useAnalytics";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency, formatMonth } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function ReportsPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useTrendsData();
  const { data: categories } = useCategories();
  const [timeRange, setTimeRange] = useState("6m"); // "6m" | "12m" | "all"
  
  const currency = user?.defaultCurrency || "USD";

  const monthlyData = useMemo(() => {
    if (!data?.monthly) return [];
    let sliceLen = data.monthly.length;
    if (timeRange === "6m") sliceLen = 6;
    if (timeRange === "12m") sliceLen = 12;
    return [...data.monthly]
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-sliceLen)
      .map(d => ({
        ...d,
        displayMonth: formatMonth(d.month)
      }));
  }, [data?.monthly, timeRange]);

  const categoryData = useMemo(() => {
    if (!data?.byCategory || !categories) return [];
    return data.byCategory.map(item => {
      const cat = categories.find(c => c.id === item.categoryId);
      return {
        name: cat?.name || "Unknown",
        value: item._sum.amount,
        color: cat?.color || "#94a3b8"
      };
    }).sort((a, b) => b.value - a.value);
  }, [data?.byCategory, categories]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>
        <p className="text-dark-muted mt-1">Deep dive into your financial habits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trends */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-400" />
                Spending Trends
              </CardTitle>
              <CardDescription>Your expenses over time</CardDescription>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="12m">Last 12 Months</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            {isLoading ? (
              <SkeletonCard className="h-[300px] w-full border-none bg-transparent" />
            ) : monthlyData.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No trend data"
                description="Add more expenses over time to see your spending trends."
              />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d2d4a" />
                    <XAxis 
                      dataKey="displayMonth" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                      width={50}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: '#1e1e36' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-dark-surface border border-dark-border rounded-lg p-3 shadow-xl">
                              <p className="text-sm font-medium text-white mb-1">{label}</p>
                              <p className="text-lg font-bold text-primary-400">
                                {formatCurrency(payload[0].value as number, currency)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="total" 
                      fill="#6366f1" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-violet-400" />
              Category Breakdown
            </CardTitle>
            <CardDescription>Where your money goes (All Time)</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            {isLoading ? (
              <SkeletonCard className="h-[300px] w-full border-none bg-transparent" />
            ) : categoryData.length === 0 ? (
              <EmptyState
                icon={PieChartIcon}
                title="No category data"
                description="Categorize your expenses to see this breakdown."
              />
            ) : (
              <div className="flex flex-col h-full">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-dark-surface border border-dark-border rounded-lg p-3 shadow-xl flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                                <div>
                                  <p className="text-sm font-medium text-white">{data.name}</p>
                                  <p className="text-sm font-bold text-slate-300">
                                    {formatCurrency(data.value, currency)}
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-slate-300 truncate">{cat.name}</span>
                      </div>
                      <span className="font-medium text-white ml-2 shrink-0">
                        {formatCurrency(cat.value, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
