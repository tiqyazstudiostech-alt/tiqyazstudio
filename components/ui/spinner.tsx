import { cn } from "@/lib/cn";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "w-3.5 h-3.5 border-[1.5px]",
  md: "w-5   h-5   border-2",
  lg: "w-8   h-8   border-[3px]",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full border-current border-t-transparent animate-spin",
        sizeClasses[size],
        className,
      )}
    />
  );
}
