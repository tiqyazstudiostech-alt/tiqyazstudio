"use client";

import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: [
    "bg-gold text-gold-fg",
    "hover:bg-gold-hover",
    "active:bg-gold-active",
    "focus-visible:ring-gold",
    "shadow-glow-gold/0 hover:shadow-glow-gold",
  ].join(" "),

  secondary: [
    "bg-terra text-terra-fg",
    "hover:bg-terra-hover",
    "active:bg-terra-active",
    "focus-visible:ring-terra",
  ].join(" "),

  ghost: [
    "bg-transparent text-ink border border-border",
    "hover:bg-surface-raised hover:border-border-strong",
    "active:bg-overlay",
    "focus-visible:ring-border-strong",
  ].join(" "),
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8  px-3   text-sm   rounded-md gap-1.5",
  md: "h-10 px-4   text-base  rounded-lg gap-2",
  lg: "h-12 px-6   text-base  rounded-lg gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="shrink-0" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
