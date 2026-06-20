import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, helperText, leftIcon, rightElement, id, ...props }, ref) => {
    const inputId = id || React.useId();
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-300"
          >
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full py-2.5 rounded-xl bg-dark-elevated border text-white text-sm",
              "placeholder:text-dark-muted/60",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon ? "pl-10 pr-4" : "px-4",
              rightElement ? "pr-10" : "",
              error
                ? "border-danger-500 focus:ring-danger-500/40 focus:border-danger-500"
                : "border-dark-border hover:border-dark-muted/50",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-danger-400 flex items-center gap-1">
            <span>⚠</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-dark-muted">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id || React.useId();
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-300">
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl bg-dark-elevated border text-white text-sm",
            "placeholder:text-dark-muted/60 resize-none",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-danger-500 focus:ring-danger-500/40"
              : "border-dark-border hover:border-dark-muted/50",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-danger-400 flex items-center gap-1">
            <span>⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
