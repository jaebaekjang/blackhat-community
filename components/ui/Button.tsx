import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-blood text-white hover:bg-blood-bright border border-blood/60 shadow-[0_0_18px_rgba(200,30,44,0.25)]",
  secondary:
    "bg-surface-alt text-zinc-100 hover:bg-surface-hover border border-line-strong",
  ghost: "bg-transparent text-ash hover:bg-surface hover:text-zinc-100 border border-transparent",
  danger: "bg-transparent text-blood-bright hover:bg-blood/10 border border-blood/50",
  outline: "bg-transparent text-zinc-100 hover:bg-surface border border-line-strong",
};

const SIZES: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs rounded-md gap-1",
  md: "px-4 py-2 text-sm rounded-lg gap-1.5",
  lg: "px-5 py-2.5 text-base rounded-lg gap-2",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
