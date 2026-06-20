import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "danger" | "warning" | "muted" | "outline";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default:  "bg-dark-elevated text-slate-300 border border-dark-border",
  primary:  "bg-primary-500/15 text-primary-300 border border-primary-500/25",
  success:  "bg-success-500/15 text-success-500 border border-success-500/25",
  danger:   "bg-danger-500/15 text-danger-400 border border-danger-500/25",
  warning:  "bg-warning-500/15 text-warning-500 border border-warning-500/25",
  muted:    "bg-dark-elevated/50 text-dark-muted border border-dark-border/50",
  outline:  "border border-dark-border text-dark-muted",
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
