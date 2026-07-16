import { Card, CardContent } from "@/components/ui/card";

function Sparkline({ values, tone }: { values: number[]; tone?: string }) {
  const max = Math.max(...values);
  return (
    <div className="mt-5 flex h-7 items-end gap-1.5" aria-hidden="true">
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="w-1.5 rounded-full opacity-70"
          style={{
            height: `${(value / max) * 100}%`,
            backgroundColor: tone ?? "#56B8C7",
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
      ? "#E7A75D"
      : tone === "danger"
        ? "#F06A6A"
        : tone === "success"
          ? "#6FC69A"
          : tone === "accent"
            ? "#56B8C7"
            : "#7D8A99";

  return (
    <Card>
      <CardContent className="min-h-[132px]">
        <div className="label-caps text-muted">{label}</div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="font-mono text-[28px] font-medium leading-none tracking-[-0.04em] text-text">{value}</div>
          <div className="font-mono text-[11px]" style={{ color: toneClass }}>
            {delta}
          </div>
        </div>
        <Sparkline values={trend} tone={toneClass} />
      </CardContent>
    </Card>
  );
}
