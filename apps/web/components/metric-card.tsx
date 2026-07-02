import { Card, CardContent } from "@/components/ui/card";

function Sparkline({ values, tone }: { values: number[]; tone?: string }) {
  const max = Math.max(...values);
  return (
    <div className="mt-3 flex h-8 items-end gap-1">
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="w-2 rounded-sm"
          style={{
            height: `${(value / max) * 100}%`,
            backgroundColor: tone ?? "#568dff",
          }}
        />
      ))}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  trend,
  tone = "neutral",
}: {
  label: string;
  value: string;
  delta: string;
  trend: number[];
  tone?: "neutral" | "warning" | "danger" | "accent" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "#ff8b3d"
      : tone === "danger"
        ? "#f85149"
        : tone === "success"
          ? "#2dd4bf"
          : tone === "accent"
            ? "#568dff"
            : "#8b949e";

  return (
    <Card>
      <CardContent className="min-h-[110px]">
        <div className="label-caps text-slate-500">{label}</div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="text-[28px] font-semibold leading-none text-white">{value}</div>
          <div className="font-mono text-[11px]" style={{ color: toneClass }}>
            {delta}
          </div>
        </div>
        <Sparkline values={trend} tone={toneClass} />
      </CardContent>
    </Card>
  );
}
