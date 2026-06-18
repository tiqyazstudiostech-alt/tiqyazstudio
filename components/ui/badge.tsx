import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "neutral" | "success" | "warning" | "error" | "info";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  primary:   "bg-gold/15    text-gold      border-gold/30",
  secondary: "bg-terra/15   text-terra-fg  border-terra/30",
  neutral:   "bg-surface-raised text-ink-muted border-border",
  success:   "bg-success/15 text-success    border-success/30",
  warning:   "bg-warning/15 text-warning    border-warning/30",
  error:     "bg-error/15   text-error      border-error/30",
  info:      "bg-info/15    text-info       border-info/30",
};

export function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5",
        "text-xs font-medium rounded-full border",
        "transition-colors duration-150",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
