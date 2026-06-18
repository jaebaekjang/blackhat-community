export function EmptyState({
  icon = "🗂️",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="text-3xl opacity-60">{icon}</div>
      <div className="text-base font-medium text-zinc-200">{title}</div>
      {description && (
        <p className="max-w-sm text-sm text-ash-dim">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "불러오는 중..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-ash-dim">
      <span className="h-3 w-3 animate-pulse rounded-full bg-blood" />
      {label}
    </div>
  );
}
