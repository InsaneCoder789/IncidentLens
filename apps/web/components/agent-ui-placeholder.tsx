export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-panel px-4 py-8 text-center">
      <div className="text-sm font-medium text-white">{title}</div>
      <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-5 text-xs text-slate-400">
      <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
      {label}
    </div>
  );
}

export function ErrorState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-[#f85149]/40 bg-[#f8514912] px-4 py-5 text-xs text-[#ffb4ab]">
      {label}
    </div>
  );
}
