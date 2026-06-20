import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "danger" | "outline" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:   "bg-primary-600 hover:bg-primary-500 text-white shadow-lg hover:shadow-glow-primary",
  secondary: "bg-dark-elevated hover:bg-dark-border border border-dark-border text-white hover:border-primary-500/50",
  ghost:     "hover:bg-white/5 text-dark-muted hover:text-white",
  danger:    "bg-danger-600 hover:bg-danger-500 text-white shadow-sm",
  outline:   "border border-dark-border hover:border-primary-500/50 text-white hover:bg-dark-elevated",
  link:      "text-primary-400 hover:text-primary-300 underline-offset-4 hover:underline p-0 h-auto",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 py-2 text-sm rounded-xl",
  sm:      "h-8 px-3 py-1.5 text-xs rounded-lg",
  lg:      "h-12 px-6 py-3 text-base rounded-2xl",
  icon:    "h-9 w-9 rounded-xl",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
          "cursor-pointer select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
