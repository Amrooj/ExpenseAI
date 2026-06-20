import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "./skeleton";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  loading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary-400",
  iconBg = "bg-primary-500/10",
  trend,
  loading,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <div className={cn("bg-dark-surface border border-dark-border rounded-2xl p-6 space-y-4", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-dark-surface border border-dark-border rounded-2xl p-6",
        "hover:border-dark-muted/30 transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-dark-muted">{title}</p>
        <div className={cn("p-2 rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        {subtitle && <p className="text-sm text-dark-muted">{subtitle}</p>}
      </div>
      {trend && (
        <div className="mt-4 pt-4 border-t border-dark-border">
          <span
            className={cn(
              "text-xs font-medium",
              trend.value > 0 ? "text-danger-400" : trend.value < 0 ? "text-success-500" : "text-dark-muted"
            )}
          >
            {trend.value > 0 ? "↑" : trend.value < 0 ? "↓" : ""}{" "}
            {Math.abs(trend.value).toFixed(1)}% {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
