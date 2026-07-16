"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, Clock3, Database, LockKeyhole, PlayCircle } from "lucide-react";
import { getIncidentReport, getIncidentTrace, runInvestigation, traceSummary } from "@/lib/api";
import type { AgentRun, IncidentReport, IncidentTrace, ToolCall } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


export function RunInvestigationButton({
  incidentId,
  onComplete,
  onStart,
  onError,
}: {
  incidentId: number;
  onComplete: (report: IncidentReport | undefined, trace: IncidentTrace) => void;
  onStart?: () => void;
  onError?: (message: string) => void;
}) {
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        className="w-full justify-center gap-2"
        onClick={() =>
          startTransition(async () => {
            onStart?.();
            try {
              await runInvestigation(incidentId);
              const [report, trace] = await Promise.all([getIncidentReport(incidentId), getIncidentTrace(incidentId)]);
              onComplete(report, trace);
              setMessage("Investigation completed");
            } catch (error) {
              const nextMessage = error instanceof Error ? error.message : "Investigation failed";
              onError?.(nextMessage);
              setMessage(nextMessage);
            }
          })
        }
      >
        <PlayCircle className="h-3.5 w-3.5" />
        {isPending ? "Running Investigation..." : "Run Investigation"}
      </Button>
      {message ? <div className="text-[11px] text-slate-500">{message}</div> : null}
    </div>
  );
}


export function InvestigationStatusPanel({
  report,
  trace,
}: {
  report?: IncidentReport;
  trace: IncidentTrace;
}) {
  const summary = traceSummary(trace);
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">Investigation Status</div>
          <div className="mt-1 text-xs text-slate-500">Latest persisted report, trace, and evaluation summary.</div>
        </div>
        <Badge className={report ? "border-[#4E9E77]/30 bg-[#4E9E771a] text-[#8FD8AF]" : "border-line bg-[#171b24] text-slate-300"}>
          {report ? "report ready" : "idle"}
        </Badge>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4 text-xs">
        <div className="rounded-lg border border-line bg-[#10131b] px-3 py-3"><div className="text-slate-500">Root cause</div><div className="mt-2 text-slate-200">{report?.selected_root_cause ?? "Not generated"}</div></div>
        <div className="rounded-lg border border-line bg-[#10131b] px-3 py-3"><div className="text-slate-500">Confidence</div><div className="mt-2 text-slate-200">{report ? `${Math.round(report.confidence_score * 100)}%` : "--"}</div></div>
        <div className="rounded-lg border border-line bg-[#10131b] px-3 py-3"><div className="text-slate-500">Quality</div><div className="mt-2 text-slate-200">{report ? `${Math.round(report.evaluation_score * 100)}%` : "--"}</div></div>
        <div className="rounded-lg border border-line bg-[#10131b] px-3 py-3"><div className="text-slate-500">Latency</div><div className="mt-2 text-slate-200">{summary.totalLatencyMs}ms</div></div>
      </div>
    </div>
  );
}


function CitationSourceBadges({
  line,
  citationSourceTypes,
}: {
  line: string;
  citationSourceTypes: Record<string, string>;
}) {
  const citationIds = Array.from(line.matchAll(/\[(EVID-\d+)\]/g), (match) => match[1]);
  const multimodal = citationIds.filter((citationId) => {
    const sourceType = citationSourceTypes[citationId];
    return ["screenshot", "dashboard_screenshot", "sentry_screenshot", "architecture_diagram", "pdf_runbook", "pdf_postmortem", "voice_note"].includes(sourceType);
  });
  if (!multimodal.length) return null;
  return (
    <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
      {multimodal.map((citationId) => (
        <Badge key={citationId} className="border-[#56B8C7]/30 bg-[#56B8C71a] font-mono text-[9px] text-[#8FD3DD]">
          {citationSourceTypes[citationId]?.replaceAll("_", " ")}
        </Badge>
      ))}
    </span>
  );
}

export function MarkdownReport({
  markdown,
  citationSourceTypes = {},
}: {
  markdown: string;
  citationSourceTypes?: Record<string, string>;
}) {
  const lines = markdown.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        if (line.startsWith("# ")) return <h1 key={index} className="text-xl font-semibold text-white">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={index} className="pt-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#8FD3DD]">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={index} className="pt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#EDBC82]">{line.slice(4)}</h3>;
        if (line.startsWith("- ")) return <div key={index} className="flex min-w-0 gap-2 text-sm text-slate-300"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#56B8C7]" /><span className="min-w-0 [overflow-wrap:anywhere]">{line.slice(2)}<CitationSourceBadges line={line} citationSourceTypes={citationSourceTypes} /></span></div>;
        if (!line.trim()) return <div key={index} className="h-2" />;
        return <p key={index} className="max-w-full text-sm leading-6 text-slate-300 [overflow-wrap:anywhere]">{line}<CitationSourceBadges line={line} citationSourceTypes={citationSourceTypes} /></p>;
      })}
    </div>
  );
}


export function IncidentReportViewer({
  report,
  citationSourceTypes = {},
}: {
  report?: IncidentReport;
  citationSourceTypes?: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-white">Latest Report</div>
            <div className="mt-1 text-xs text-slate-500">Structured, citation-grounded incident report persisted by the investigation workflow.</div>
          </div>
          {report ? <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">{new Date(report.created_at).toLocaleString()}</div> : null}
        </div>
      </CardHeader>
      <CardContent>
        {report ? <MarkdownReport markdown={report.report_markdown} citationSourceTypes={citationSourceTypes} /> : <div className="text-sm text-slate-500">No report generated yet.</div>}
      </CardContent>
    </Card>
  );
}


export function ApprovalGatedActionsPanel({ report }: { report?: IncidentReport }) {
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const actions = useMemo(() => {
    if (!report) return [];
    return report.report_markdown
      .split("## 11. Approval-Gated Actions")[1]
      ?.split("## 12. Rollback or Hotfix Plan")[0]
      ?.split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2)) ?? [];
  }, [report]);

  return (
    <Card>
      <CardHeader><div><div className="label-caps text-warning">Human control</div><div className="mt-1 text-sm font-medium text-text">Approval-gated actions</div></div></CardHeader>
      <CardContent className="space-y-3">
        {actions.length === 0 ? <div className="text-xs text-slate-500">No approval-gated actions yet.</div> : actions.map((item) => (
          <div key={item} className="rounded-xl border border-danger/20 bg-danger/[0.045] p-3">
            <div className="flex gap-2 text-xs leading-5 text-text"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={1.5} /><span>{item}</span></div>
            <Button type="button" variant="outline" size="sm" disabled={requested.has(item)} className="mt-3 w-full" onClick={() => setRequested((current) => new Set(current).add(item))}>{requested.has(item) ? "Approval requested" : "Request approval"}</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}


export function MissingEvidencePanel({ report }: { report?: IncidentReport }) {
  const items = useMemo(() => {
    if (!report) return [];
    return report.report_markdown
      .split("## 16. Missing Evidence")[1]
      ?.split("## 17. Evaluation Notes")[0]
      ?.split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2)) ?? [];
  }, [report]);

  return (
    <Card>
      <CardHeader><div><div className="label-caps text-muted">Coverage gaps</div><div className="mt-1 text-sm font-medium text-text">Missing evidence</div></div></CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? <div className="text-xs text-muted">No missing evidence noted.</div> : items.map((item) => <div key={item} className="border-b border-line/8 py-2 text-xs leading-5 text-muted last:border-0">{item}</div>)}
        <Link href="/evidence" className="block"><Button variant="secondary" size="sm" className="mt-3 w-full"><Database className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />Open evidence workspace</Button></Link>
      </CardContent>
    </Card>
  );
}


export function ModelRunBadge({ modelName }: { modelName: string }) {
  return <Badge className="border-line bg-[#10131b] text-slate-300">{modelName}</Badge>;
}


export function PromptVersionBadge({ promptVersion }: { promptVersion: string }) {
  return <Badge className="border-[#56B8C7]/30 bg-[#56B8C71a] text-[#8FD3DD]">{promptVersion}</Badge>;
}


export function CostLatencySummary({ trace }: { trace: IncidentTrace }) {
  const summary = traceSummary(trace);
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <div className="rounded-lg border border-line bg-[#10131b] px-3 py-3"><div className="text-xs text-slate-500">Total latency</div><div className="mt-2 text-sm text-white">{summary.totalLatencyMs}ms</div></div>
      <div className="rounded-lg border border-line bg-[#10131b] px-3 py-3"><div className="text-xs text-slate-500">Estimated cost</div><div className="mt-2 text-sm text-white">${summary.totalCostUsd.toFixed(2)}</div></div>
      <div className="rounded-lg border border-line bg-[#10131b] px-3 py-3"><div className="text-xs text-slate-500">Completed runs</div><div className="mt-2 text-sm text-white">{summary.completed}</div></div>
      <div className="rounded-lg border border-line bg-[#10131b] px-3 py-3"><div className="text-xs text-slate-500">Failed runs</div><div className="mt-2 text-sm text-white">{summary.failed}</div></div>
    </div>
  );
}


export function TraceTimeline({ runs }: { runs: AgentRun[] }) {
  return (
    <div className="space-y-3">
      {runs.map((run, index) => (
        <div key={run.id} className="grid grid-cols-[16px_1fr] gap-3">
          <div className="relative flex justify-center">
            <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${run.status === "completed" ? "bg-[#4E9E77]" : run.status === "failed" ? "bg-[#F06A6A]" : "bg-[#56B8C7]"}`} />
            {index < runs.length - 1 ? <span className="absolute top-4 h-[calc(100%+12px)] w-px bg-line" /> : null}
          </div>
          <div>
            <div className="text-sm font-medium text-white">{run.agent_name}</div>
            <div className="mt-1 text-xs text-slate-500">{run.output_summary}</div>
          </div>
        </div>
      ))}
    </div>
  );
}


export function AgentTraceGraph({ runs }: { runs: AgentRun[] }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-4">
      <div className="grid gap-3 lg:grid-cols-6">
        {runs.map((run, index) => (
          <div key={run.id} className="relative rounded-lg border border-line bg-[#10131b] px-3 py-3">
            {index < runs.length - 1 ? <div className="absolute right-[-14px] top-1/2 hidden h-px w-7 bg-line lg:block" /> : null}
            <div className="text-xs font-medium text-white">{run.agent_name}</div>
            <div className="mt-2 text-[11px] text-slate-500">{run.latency_ms}ms</div>
            <div className="mt-2">
              <Badge className={run.status === "completed" ? "border-[#4E9E77]/30 bg-[#4E9E771a] text-[#8FD8AF]" : run.status === "failed" ? "border-[#F06A6A]/30 bg-[#F06A6A1a] text-[#F3A0A0]" : "border-[#56B8C7]/30 bg-[#56B8C71a] text-[#8FD3DD]"}>
                {run.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


export function AgentRunCard({ run }: { run: AgentRun }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">{run.agent_name}</div>
          <div className="mt-1 text-xs text-slate-500">{run.input_summary}</div>
        </div>
        <div className="flex gap-2">
          <ModelRunBadge modelName={run.model_name} />
          <PromptVersionBadge promptVersion={run.prompt_version} />
        </div>
      </div>
      <div className="mt-3 text-xs leading-5 text-slate-300">{run.output_summary}</div>
      {run.error_message ? <div className="mt-3 rounded-lg border border-[#F06A6A]/30 bg-[#22161b] px-3 py-3 text-xs text-[#F3A0A0]">{run.error_message}</div> : null}
      <div className="mt-4 grid grid-cols-4 gap-3 text-[11px]">
        <div><div className="text-slate-500">Status</div><div className="mt-1 text-slate-200">{run.status}</div></div>
        <div><div className="text-slate-500">Latency</div><div className="mt-1 text-slate-200">{run.latency_ms}ms</div></div>
        <div><div className="text-slate-500">Tokens</div><div className="mt-1 text-slate-200">{run.token_input}/{run.token_output}</div></div>
        <div><div className="text-slate-500">Cost</div><div className="mt-1 text-slate-200">${run.estimated_cost_usd.toFixed(2)}</div></div>
      </div>
    </div>
  );
}


export function ToolCallPanel({ calls }: { calls: ToolCall[] }) {
  return (
    <Card>
      <CardHeader><div><div className="label-caps text-muted">Execution detail</div><div className="mt-1 text-sm font-medium text-text">Tool calls</div></div></CardHeader>
      <CardContent className="space-y-3">
        {calls.map((call) => (
          <details key={call.id} className="group rounded-xl border border-line/10 bg-bg/35 open:border-accent/15">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden">
              <span><span className="block text-sm font-medium text-text">{call.tool_name}</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.08em] text-muted">{call.latency_ms}ms / click to inspect JSON</span></span>
              <span className="flex items-center gap-2"><Badge className={call.status === "completed" ? "border-success/25 bg-success/[0.07] text-success" : "border-danger/25 bg-danger/[0.07] text-danger"}>{call.status}</Badge><ChevronDown className="h-4 w-4 text-muted transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-open:rotate-180" strokeWidth={1.5} /></span>
            </summary>
            <div className="grid gap-3 border-t border-line/8 p-3 md:grid-cols-2">
              <div><div className="label-caps mb-2 text-muted">Input</div><pre className="terminal scrollbar-thin max-h-72 overflow-auto whitespace-pre-wrap px-3 py-3 font-mono text-[10px] leading-5 text-muted">{JSON.stringify(call.input_json, null, 2)}</pre></div>
              <div><div className="label-caps mb-2 text-muted">Output</div><pre className="terminal scrollbar-thin max-h-72 overflow-auto whitespace-pre-wrap px-3 py-3 font-mono text-[10px] leading-5 text-muted">{JSON.stringify(call.output_json, null, 2)}</pre></div>
            </div>
          </details>
        ))}
      </CardContent>
    </Card>
  );
}


export function InvestigationWorkspace({
  incidentId,
  initialReport,
  initialTrace,
  citationSourceTypes = {},
}: {
  incidentId: number;
  initialReport?: IncidentReport;
  initialTrace: IncidentTrace;
  citationSourceTypes?: Record<string, string>;
}) {
  const [report, setReport] = useState<IncidentReport | undefined>(initialReport);
  const [trace, setTrace] = useState<IncidentTrace>(initialTrace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <RunInvestigationButton
        incidentId={incidentId}
        onStart={() => {
          setLoading(true);
          setError(null);
        }}
        onError={(message) => {
          setLoading(false);
          setError(message);
        }}
        onComplete={(nextReport, nextTrace) => {
          setReport(nextReport);
          setTrace(nextTrace);
          setLoading(false);
        }}
      />
      {loading ? <InvestigationLoadingState /> : null}
      {error ? <InvestigationErrorState title="Investigation Error" description={error} /> : null}
      <InvestigationStatusPanel report={report} trace={trace} />
      <IncidentReportViewer report={report} citationSourceTypes={citationSourceTypes} />
      <ApprovalGatedActionsPanel report={report} />
      <MissingEvidencePanel report={report} />
    </div>
  );
}


export function InvestigationErrorState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-[#F06A6A]/30 bg-[#22161b] px-4 py-4">
      <div className="flex items-center gap-3 text-[#F3A0A0]">
        <AlertTriangle className="h-4 w-4" />
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="mt-2 text-xs leading-5 text-[#F3A0A0]/80">{description}</div>
    </div>
  );
}


export function InvestigationLoadingState() {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-4">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <Clock3 className="h-4 w-4 text-[#56B8C7]" />
        Running multi-agent investigation...
      </div>
    </div>
  );
}
