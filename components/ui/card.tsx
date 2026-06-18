import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ elevated = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border transition-colors duration-150",
        elevated
          ? "bg-surface-raised border-border-strong shadow-elevated"
          : "bg-surface border-border shadow-card",
        "hover:border-border-strong",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-6 pb-4", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-6 py-4 border-t border-border flex items-center gap-3", className)}
      {...props}
    />
  );
}
