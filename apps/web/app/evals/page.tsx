import { evalFailures, evalMetrics, evalTrend } from "@/lib/mock-data";
import { EvalHistoryChart, EvalMetricCard, FailedCasesTable } from "@/components/evidence-citation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EvalsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold text-white">Evaluation Dashboard</div>
          <div className="mt-1 text-xs text-slate-500">Metric cards, regression charts, failure cases, and prompt version comparison from the Stitch eval screen.</div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="bg-[#7b3ff3] hover:bg-[#6d31e5]">Run Eval Suite</Button>
          <Button variant="secondary" size="sm">Last run: 29 ago</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {evalMetrics.map((metric) => (
          <EvalMetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <EvalHistoryChart {...evalTrend} />
        <Card>
          <CardHeader><div className="text-sm font-medium text-white">Regression Status</div></CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-300">
            <div className="rounded-md border border-line bg-[#11161f] px-3 py-3">
              <div className="flex justify-between"><span>Prompt v4.2 (current)</span><span>94.2 pts</span></div>
            </div>
            <div className="rounded-md border border-line bg-[#11161f] px-3 py-3">
              <div className="flex justify-between"><span>Prompt v4.3 (beta)</span><span>89.9 pts</span></div>
            </div>
            <div className="rounded-md border border-line bg-[#11161f] px-3 py-3 text-slate-400">
              V4.2 shows improvement in context windows utilization and 4.8% lower token latency in P90 inference timings.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><div className="text-sm font-medium text-white">Failed Evaluation Cases</div></CardHeader>
        <CardContent>
          <FailedCasesTable failures={evalFailures} />
        </CardContent>
      </Card>
    </div>
  );
}
