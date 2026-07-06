"use client";

import { useMemo, useState, useTransition } from "react";
import { runEvalSuite } from "@/lib/api";
import type { EvalFailure, EvalMetric, EvalRun } from "@/lib/types";
import { EvalHistoryChart, EvalMetricCard, FailedCasesTable } from "@/components/evidence-citation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";


function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}


export function EvalsClient({ initialRuns }: { initialRuns: EvalRun[] }) {
  const [runs, setRuns] = useState(initialRuns);
  const [isPending, startTransition] = useTransition();

  const latest = runs[0];

  const metrics = useMemo<EvalMetric[]>(() => {
    if (!latest) {
      return [
        { label: "Recall@5", value: "--", sublabel: "no run", tone: "warning" },
        { label: "Recall@10", value: "--", sublabel: "no run", tone: "warning" },
        { label: "MRR", value: "--", sublabel: "no run", tone: "warning" },
        { label: "Root Cause", value: "--", sublabel: "no run", tone: "warning" },
        { label: "Citation Coverage", value: "--", sublabel: "no run", tone: "warning" },
      ];
    }
    return [
      { label: "Recall@5", value: toPercent(latest.recall_at_5), sublabel: latest.dataset_name, tone: "accent" },
      { label: "Recall@10", value: toPercent(latest.recall_at_10), sublabel: latest.dataset_name, tone: "accent" },
      { label: "MRR", value: latest.mrr.toFixed(2), sublabel: "ranking", tone: "success" },
      { label: "Root Cause", value: toPercent(latest.root_cause_accuracy), sublabel: "accuracy", tone: "success" },
      { label: "Citation Coverage", value: toPercent(latest.citation_coverage), sublabel: "grounding", tone: "accent" },
    ];
  }, [latest]);

  const history = useMemo(() => {
    const ordered = [...runs].reverse();
    return {
      labels: ordered.map((run) => new Date(run.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })),
      accuracy: ordered.map((run) => Math.round(run.root_cause_accuracy * 100)),
      latency: ordered.map((run) => Math.round(run.avg_latency_ms)),
    };
  }, [runs]);

  const failures = useMemo<EvalFailure[]>(() => {
    if (!latest) return [];
    return latest.failed_cases_json;
  }, [latest]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold text-white">Evaluation Dashboard</div>
          <div className="mt-1 text-xs text-slate-500">Historical eval runs, retrieval quality, root cause accuracy, and safety checks.</div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-[#7b3ff3] hover:bg-[#6d31e5]"
            onClick={() =>
              startTransition(async () => {
                const nextRun = await runEvalSuite();
                setRuns((current) => [nextRun.run, ...current]);
              })
            }
          >
            {isPending ? "Running..." : "Run Eval Suite"}
          </Button>
          <Button variant="secondary" size="sm">
            {latest ? `Last run: ${new Date(latest.created_at).toLocaleString()}` : "No runs yet"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {metrics.map((metric) => (
          <EvalMetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <EvalHistoryChart {...history} />
        <Card>
          <CardHeader><div className="text-sm font-medium text-white">Regression Status</div></CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-300">
            {latest ? (
              <>
                <div className="rounded-md border border-line bg-[#11161f] px-3 py-3">
                  <div className="flex justify-between"><span>{latest.dataset_name}</span><span>{toPercent(latest.root_cause_accuracy)}</span></div>
                </div>
                <div className="rounded-md border border-line bg-[#11161f] px-3 py-3">
                  <div className="flex justify-between"><span>Unsupported claim rate</span><span>{toPercent(latest.unsupported_claim_rate)}</span></div>
                </div>
                <div className="rounded-md border border-line bg-[#11161f] px-3 py-3 text-slate-400">
                  Average latency {Math.round(latest.avg_latency_ms)}ms with estimated cost ${latest.avg_cost_usd.toFixed(2)} in mock mode.
                </div>
              </>
            ) : (
              <div className="rounded-md border border-line bg-[#11161f] px-3 py-3 text-slate-400">
                Run the local eval harness to populate historical metrics.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><div className="text-sm font-medium text-white">Failed Evaluation Cases</div></CardHeader>
        <CardContent>
          <FailedCasesTable failures={failures} />
        </CardContent>
      </Card>
    </div>
  );
}
