import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "panel p-4 sm:p-5",
        hover && "transition-colors hover:border-line-strong hover:bg-surface-alt",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-3", className)}>
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ash-dim">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "panel p-4",
        accent && "border-blood/40 bg-blood/5",
      )}
    >
      <div className="text-xs text-ash-dim">{label}</div>
      <div
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          accent ? "text-blood-bright" : "text-zinc-100",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-ash-faint">{sub}</div>}
    </div>
  );
}
