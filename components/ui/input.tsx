"use client";

import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}

      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(
          "w-full bg-surface border rounded-lg px-3 py-2",
          "text-ink placeholder:text-ink-dim text-sm",
          "transition-colors duration-150",
          /* default */
          "border-border",
          /* hover */
          "hover:border-border-strong",
          /* focus */
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1",
          "focus-visible:ring-offset-background focus-visible:border-gold",
          /* error */
          error && "border-error focus-visible:ring-error focus-visible:border-error",
          /* disabled */
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-surface-raised",
          className,
        )}
        {...props}
      />

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-error">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
