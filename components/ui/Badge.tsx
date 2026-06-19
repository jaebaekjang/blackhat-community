import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/lib/labels";

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  neutral: "border-line bg-ink-700 text-ash",
  danger: "border-blood/50 bg-blood/15 text-blood-bright",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  villa: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  broadcast: "border-blood/40 bg-blood/10 text-blood-bright",
};

export function Badge({
  children,
  variant = "neutral",
  className,
  dot = false,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        VARIANT_CLASS[variant],
        className,
      )}
    >
      {dot && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}
