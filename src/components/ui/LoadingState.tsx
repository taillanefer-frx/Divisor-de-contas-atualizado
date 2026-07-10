export function LoadingState({ label = 'Carregando' }: { label?: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center gap-3 text-sm font-medium text-ink-muted">
      <span className="h-3 w-3 animate-pulse rounded-full bg-brand-green" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
