import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export function EvidenceCitation({
  citationId,
  title,
  sourceType,
  excerpt,
}: {
  citationId: string;
  title: string;
  sourceType: string;
  excerpt: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">{citationId}</div>
        <Badge className="border-line bg-[#10131b] text-slate-300">{sourceType}</Badge>
      </div>
      <div className="mt-2 text-sm font-medium text-white">{title}</div>
      <div className="mt-1 text-xs leading-5 text-slate-400">{excerpt}</div>
    </div>
  );
}

export function EvidenceUploadPanel() {
  return (
    <div className="rounded-lg border border-dashed border-line bg-panel px-4 py-8 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-[#10131b] text-lg text-slate-300">
        ⤴
      </div>
      <div className="mt-4 text-sm font-medium text-white">Ingest New Data</div>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-400">
        Drag and drop logs, PDFs, screenshots, or URL imports. Our LLM will auto-chunk and vectorize the context.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Badge className="border-line bg-[#10131b] text-slate-300">LOG</Badge>
        <Badge className="border-line bg-[#10131b] text-slate-300">PDF</Badge>
        <Badge className="border-line bg-[#10131b] text-slate-300">IMG</Badge>
        <Badge className="border-line bg-[#10131b] text-slate-300">DIFF</Badge>
      </div>
    </div>
  );
}

export function RetrievalResults({
  results,
}: {
  results: Array<{ citationId: string; title: string; sourceType: string; excerpt: string; relevanceScore: number }>;
}) {
  return (
    <div className="space-y-3">
      {results.map((result) => (
        <EvidenceCitation
          key={result.citationId}
          citationId={result.citationId}
          title={result.title}
          sourceType={result.sourceType}
          excerpt={`${result.excerpt} (${Math.round(result.relevanceScore * 100)}% relevance)`}
        />
      ))}
    </div>
  );
}

export function RootCauseHypothesisCard({
  id,
  title,
  confidence,
  summary,
}: {
  id: string;
  title: string;
  confidence: number;
  summary: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-white">
          {id}: {title}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#b0c6ff]">{Math.round(confidence * 100)}%</div>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">{summary}</p>
    </div>
  );
}

export function ActionPlanCard({
  title,
  description,
  steps,
  tone = "safe",
}: {
  title: string;
  description: string;
  steps: string[];
  tone?: "safe" | "warning" | "danger";
}) {
  const borderColor = tone === "danger" ? "border-[#f85149]/40" : tone === "warning" ? "border-[#ff8b3d]/40" : "border-line";
  const bulletColor = tone === "danger" ? "bg-[#f85149]" : tone === "warning" ? "bg-[#ff8b3d]" : "bg-[#0070ff]";
  return (
    <div className={`rounded-lg ${borderColor} bg-panel px-3 py-3`}>
      <div className="text-sm font-medium text-white">{title}</div>
      <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      <div className="mt-3 space-y-2">
        {steps.map((step) => (
          <div key={step} className="flex gap-2 text-xs text-slate-300">
            <span className={`mt-1 h-1.5 w-1.5 rounded-full ${bulletColor}`} />
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentTraceGraph({ nodes }: { nodes: Array<{ id: string; name: string; status: string }> }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-4">
      <div className="mb-4 flex gap-6 overflow-x-auto">
        {nodes.map((node) => (
          <div key={node.id} className="relative min-w-[120px] rounded-md border border-line bg-[#11161f] px-3 py-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">{node.name}</div>
            <div className="mt-2 text-xs text-white">{node.status}</div>
          </div>
        ))}
      </div>
      <div className="h-px bg-line" />
      <div className="mt-4 grid gap-2 text-[10px] font-mono uppercase tracking-[0.08em] text-slate-500 md:grid-cols-4">
        <span>View: logical flow</span>
        <span>Last sync: 29s ago</span>
        <span>Total runtime: 2.44s</span>
        <span>Total tokens: 1,829</span>
      </div>
    </div>
  );
}

export function AgentRunCard({
  title,
  latency,
  tokens,
  model,
  toolCalls,
  summary,
}: {
  title: string;
  latency: string;
  tokens: string;
  model: string;
  toolCalls: number;
  summary: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">{title}</div>
          <p className="mt-1 text-xs leading-5 text-slate-400">{summary}</p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">{model}</div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-300">
        <div><span className="text-slate-500">Latency</span><div>{latency}</div></div>
        <div><span className="text-slate-500">Tokens</span><div>{tokens}</div></div>
        <div><span className="text-slate-500">Tools</span><div>{toolCalls}</div></div>
      </div>
    </div>
  );
}

export function ToolCallPanel({ calls }: { calls: Array<{ name: string; status: string; latency: string }> }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-3">
      <div className="label-caps text-slate-500">Connected Tools</div>
      <div className="mt-3 space-y-2">
        {calls.map((call) => (
          <div key={call.name} className="flex items-center justify-between rounded-md border border-line bg-[#11161f] px-3 py-2 text-xs">
            <span className="text-slate-300">{call.name}</span>
            <span className={call.status === "success" ? "text-[#ff8b3d]" : "text-slate-500"}>{call.status} · {call.latency}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EvalMetricCard({ label, value, sublabel, tone = "accent" }: { label: string; value: string; sublabel: string; tone?: string }) {
  const color = tone === "success" ? "#2dd4bf" : tone === "warning" ? "#ff8b3d" : tone === "danger" ? "#f85149" : "#568dff";
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-3">
      <div className="label-caps text-slate-500">{label}</div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-2xl font-semibold text-white">{value}</div>
        <div className="font-mono text-[10px]" style={{ color }}>{sublabel}</div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-[#20262f]">
        <div className="h-1.5 rounded-full" style={{ width: value.includes("%") ? value : "85%", backgroundColor: color }} />
      </div>
    </div>
  );
}

export function EvalHistoryChart({
  labels,
  accuracy,
  latency,
}: {
  labels: string[];
  accuracy: number[];
  latency: number[];
}) {
  const maxAccuracy = Math.max(...accuracy);
  const maxLatency = Math.max(...latency);

  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-white">Accuracy & Latency Trend</div>
          <div className="text-xs text-slate-500">Aggregate performance over the last deployment cycles</div>
        </div>
        <div className="flex gap-3 text-[10px] font-mono uppercase tracking-[0.08em] text-slate-500">
          <span>Accuracy</span>
          <span>Latency</span>
        </div>
      </div>
      <div className="grid grid-cols-7 items-end gap-3">
        {labels.map((label, index) => (
          <div key={label} className="space-y-2">
            <div className="flex h-32 items-end gap-1">
              <div className="w-3 rounded-sm bg-[#b0c6ff]" style={{ height: `${(accuracy[index] / maxAccuracy) * 100}%` }} />
              <div className="w-3 rounded-sm bg-[#ff8b3d]" style={{ height: `${(latency[index] / maxLatency) * 100}%` }} />
            </div>
            <div className="text-center font-mono text-[10px] text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FailedCasesTable({
  failures,
}: {
  failures: Array<{ incidentId: string; timestamp: string; reason: string; confidence: string; action: string }>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-[#0f131c] text-[10px] uppercase tracking-[0.08em] text-slate-500">
          <tr>
            <th className="px-3 py-3">Incident ID</th>
            <th className="px-3 py-3">Timestamp</th>
            <th className="px-3 py-3">Primary Reason</th>
            <th className="px-3 py-3">AI Confidence</th>
            <th className="px-3 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-panel">
          {failures.map((failure) => (
            <tr key={failure.incidentId}>
              <td className="px-3 py-3 font-mono text-slate-300">{failure.incidentId}</td>
              <td className="px-3 py-3 text-slate-400">{failure.timestamp}</td>
              <td className="px-3 py-3"><span className="rounded-full border border-line bg-[#11161f] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#ffb4ab]">{failure.reason}</span></td>
              <td className="px-3 py-3 text-slate-300">{failure.confidence}</td>
              <td className="px-3 py-3 text-right text-[#b0c6ff]">{failure.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="mt-1 text-xs text-slate-500">{description}</div>
      </div>
      <div className="grid gap-3 px-4 py-3">{children}</div>
    </div>
  );
}
