export default function Loading() {
  return <div className="space-y-4" aria-busy="true" aria-label="Loading operational data"><div className="h-7 w-48 animate-pulse rounded bg-panel3" /><div className="h-4 w-96 max-w-full animate-pulse rounded bg-panel3" /><div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl border border-line/10 bg-panel" />)}</div></div>;
}
