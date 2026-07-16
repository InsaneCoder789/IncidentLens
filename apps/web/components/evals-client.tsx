"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Clock3, Play, ShieldAlert } from "lucide-react";
import { runEvalSuite } from "@/lib/api";
import type { EvalFailure, EvalMetric, EvalRun } from "@/lib/types";
import { EvalHistoryChart, EvalMetricCard, FailedCasesTable } from "@/components/evidence-citation";
import { PageIntro, SectionHeading } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function toPercent(value: number): string { return `${Math.round(value * 100)}%`; }

export function EvalsClient({ initialRuns }: { initialRuns: EvalRun[] }) {
  const [runs, setRuns] = useState(initialRuns);
  const [isPending, startTransition] = useTransition();
  const [runError, setRunError] = useState<string | null>(null);
  const latest = runs[0];

  const metrics = useMemo<EvalMetric[]>(() => latest ? [
    { label: "Recall@5", value: toPercent(latest.recall_at_5), sublabel: latest.dataset_name, tone: "accent" },
    { label: "Recall@10", value: toPercent(latest.recall_at_10), sublabel: latest.dataset_name, tone: "accent" },
    { label: "MRR", value: latest.mrr.toFixed(2), sublabel: "ranking", tone: "success" },
    { label: "Root Cause", value: toPercent(latest.root_cause_accuracy), sublabel: "accuracy", tone: "success" },
    { label: "Citation Coverage", value: toPercent(latest.citation_coverage), sublabel: "grounding", tone: "accent" },
  ] : ["Recall@5", "Recall@10", "MRR", "Root Cause", "Citation Coverage"].map((label) => ({ label, value: "--", sublabel: "no run", tone: "warning" as const })), [latest]);

  const history = useMemo(() => {
    const ordered = [...runs].reverse();
    return { labels: ordered.map((run) => new Date(run.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })), accuracy: ordered.map((run) => Math.round(run.root_cause_accuracy * 100)), latency: ordered.map((run) => Math.round(run.avg_latency_ms)) };
  }, [runs]);
  const failures = useMemo<EvalFailure[]>(() => latest?.failed_cases_json ?? [], [latest]);

  function triggerRun() {
    startTransition(async () => {
      setRunError(null);
      try {
        const nextRun = await runEvalSuite();
        setRuns((current) => [nextRun.run, ...current]);
      } catch (error) {
        setRunError(error instanceof Error ? error.message : "Evaluation run failed.");
      }
    });
  }

  return (
    <div>
      <PageIntro
        eyebrow="Quality control / phase 7"
        title="Evaluation dashboard"
        description="Measure retrieval quality, root-cause accuracy, citation grounding, safety, latency, and cost against the versioned incident dataset."
        actions={<><Button onClick={triggerRun} disabled={isPending}><Play className="mr-2 h-4 w-4" strokeWidth={1.5} />{isPending ? "Running suite..." : "Run eval suite"}</Button><span className="inline-flex min-h-11 items-center rounded-[10px] border border-line/12 bg-panel px-3 text-xs text-muted">{latest ? `Last run ${new Date(latest.created_at).toLocaleDateString()}` : "No runs yet"}</span></>}
      />
      {runError ? <div role="alert" className="mb-5 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">{runError}</div> : null}
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1fr_1fr_1.15fr]">{metrics.map((metric) => <EvalMetricCard key={metric.label} {...metric} />)}</div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <EvalHistoryChart {...history} />
          <Card>
            <CardHeader><SectionHeading eyebrow="Guardrail" title="Regression status" /></CardHeader>
            <CardContent className="space-y-1">
              {latest ? <>
                <div className="flex items-center justify-between border-b border-line/8 py-3 text-xs"><span className="flex items-center gap-2 text-muted"><CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={1.5} />Root-cause accuracy</span><span className="font-mono text-text">{toPercent(latest.root_cause_accuracy)}</span></div>
                <div className="flex items-center justify-between border-b border-line/8 py-3 text-xs"><span className="flex items-center gap-2 text-muted"><ShieldAlert className="h-3.5 w-3.5 text-warning" strokeWidth={1.5} />Unsupported claims</span><span className="font-mono text-text">{toPercent(latest.unsupported_claim_rate)}</span></div>
                <div className="flex items-center justify-between py-3 text-xs"><span className="flex items-center gap-2 text-muted"><Clock3 className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />Average latency</span><span className="font-mono text-text">{Math.round(latest.avg_latency_ms)}ms</span></div>
                <div className="mt-3 rounded-xl border border-line/10 bg-bg/40 p-3 text-xs leading-5 text-muted">Dataset <span className="font-mono text-text">{latest.dataset_name}</span> completed at an estimated <span className="font-mono text-text">${latest.avg_cost_usd.toFixed(2)}</span> per run.</div>
              </> : <div className="py-10 text-center text-sm text-muted">Run the local evaluation suite to establish the first baseline.</div>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><SectionHeading eyebrow="Failures" title="Cases requiring review" description="Open regressions and unsupported outputs from the latest run." /></CardHeader>
          <CardContent>{failures.length ? <FailedCasesTable failures={failures} /> : <div className="rounded-xl border border-dashed border-line/15 px-4 py-10 text-center text-sm text-muted">No failed cases in the latest run.</div>}</CardContent>
        </Card>
      </div>
    </div>
  );
}
