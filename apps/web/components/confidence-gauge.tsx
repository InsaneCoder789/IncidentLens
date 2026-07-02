export function ConfidenceGauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const circle = 2 * Math.PI * 42;
  const offset = circle - (pct / 100) * circle;

  return (
    <div className="panel flex flex-col items-center justify-center px-4 py-5">
      <div className="label-caps text-slate-500">Root Cause Confidence</div>
      <div className="relative mt-4 flex h-28 w-28 items-center justify-center">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" stroke="#30363d" strokeWidth="6" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="#0070ff"
            strokeWidth="6"
            fill="none"
            strokeDasharray={circle}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-[28px] font-semibold text-white">{pct}%</div>
        </div>
      </div>
      <p className="mt-3 max-w-[180px] text-center text-xs leading-5 text-slate-400">
        Based on corroborated traces, logs, metrics, and code change evidence.
      </p>
    </div>
  );
}
