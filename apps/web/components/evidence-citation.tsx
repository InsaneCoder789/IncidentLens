"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Search, UploadCloud } from "lucide-react";
import { processAllEvidence, processEvidence, searchEvidence } from "@/lib/api";
import type {
  ActionPlan,
  EvidenceItem,
  EvalFailure,
  EvalMetric,
  RetrievalResult,
  SettingField,
  ToolCallSummary,
  TraceNode,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SOURCE_TYPE_OPTIONS = [
  "all",
  "github_pr",
  "sentry_issue",
  "prometheus_metric",
  "runbook",
  "previous_incident",
  "statuspage",
];

export function CitationBadge({ citationId }: { citationId: string }) {
  return <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">{citationId}</div>;
}

export function SourceTypeBadge({ sourceType }: { sourceType: string }) {
  return <Badge className="border-line bg-[#10131b] text-slate-300">{sourceType}</Badge>;
}

export function EmbeddingStatusBadge({ status }: { status: string }) {
  const tone =
    status === "completed"
      ? "border-[#2ea043]/30 bg-[#2ea0431a] text-[#7ee787]"
      : status === "processing"
        ? "border-[#568dff]/30 bg-[#568dff1a] text-[#b0c6ff]"
        : status === "failed"
          ? "border-[#f85149]/30 bg-[#f851491a] text-[#ffb4ab]"
          : "border-line bg-[#171b24] text-slate-300";
  return <Badge className={tone}>{status}</Badge>;
}

export function ProcessingStatusBadge({ status }: { status: string }) {
  const tone =
    status === "embedded"
      ? "border-[#2ea043]/30 bg-[#2ea0431a] text-[#7ee787]"
      : status === "chunked" || status === "normalized"
        ? "border-[#568dff]/30 bg-[#568dff1a] text-[#b0c6ff]"
        : status === "failed"
          ? "border-[#f85149]/30 bg-[#f851491a] text-[#ffb4ab]"
          : "border-line bg-[#171b24] text-slate-300";
  return <Badge className={tone}>{status}</Badge>;
}

export function EvidenceCitation({
  citationId,
  title,
  sourceType,
  excerpt,
  score,
}: {
  citationId: string;
  title: string;
  sourceType: string;
  excerpt: string;
  score?: number;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <CitationBadge citationId={citationId} />
        <div className="flex items-center gap-2">
          {typeof score === "number" ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#7ee787]">{Math.round(score * 100)}%</span>
          ) : null}
          <SourceTypeBadge sourceType={sourceType} />
        </div>
      </div>
      <div className="mt-2 text-sm font-medium text-white">{title}</div>
      <div className="mt-1 text-xs leading-5 text-slate-400">{excerpt}</div>
    </div>
  );
}

export function EvidenceUploadPanel() {
  return (
    <div className="rounded-xl border border-dashed border-line bg-panel px-5 py-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-[#0b0f19] text-[#b0c6ff]">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">Ingest new evidence</div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Drag logs, PDFs, screenshots, diffs, or notes into the retrieval pipeline. The backend integration points stay intact for
            normalization, chunking, embeddings, and search.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {["LOG", "PDF", "IMAGE", "DIFF", "RUNBOOK", "TRACE"].map((item) => (
          <Badge key={item} className="border-line bg-[#10131b] text-slate-300">
            {item}
          </Badge>
        ))}
      </div>
      <div className="mt-5 rounded-lg border border-line bg-[#050505] px-3 py-3 font-mono text-[11px] leading-6 text-slate-400">
        awaiting_upload :: source adapters ready
        <br />
        chunker :: standby
        <br />
        embeddings :: standby
      </div>
    </div>
  );
}

export function ProcessEvidenceButton({ evidenceId }: { evidenceId: number }) {
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        size="sm"
        className="w-full justify-center"
        onClick={() =>
          startTransition(async () => {
            const result = await processEvidence(evidenceId);
            setMessage(`${result.status} · ${result.chunks_created} chunks`);
          })
        }
      >
        {isPending ? "Processing..." : "Process Evidence"}
      </Button>
      {message ? <div className="text-[11px] text-slate-500">{message}</div> : null}
    </div>
  );
}

export function EvidenceProcessingStatus({
  processingStatus,
  embeddingStatus,
  chunkCount,
}: {
  processingStatus: string;
  embeddingStatus: string;
  chunkCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ProcessingStatusBadge status={processingStatus} />
      <EmbeddingStatusBadge status={embeddingStatus} />
      <Badge className="border-line bg-[#10131b] text-slate-300">{chunkCount} chunks</Badge>
    </div>
  );
}

export function ProcessAllEvidenceButton({ incidentId }: { incidentId: number }) {
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        className="w-full justify-center"
        onClick={() =>
          startTransition(async () => {
            const result = await processAllEvidence(incidentId);
            setMessage(`Processed ${result.processed} items · ${result.chunks_created} chunks`);
          })
        }
      >
        {isPending ? "Running pipeline..." : "Process All Evidence"}
      </Button>
      {message ? <div className="text-[11px] text-slate-500">{message}</div> : null}
    </div>
  );
}

export function RetrievalResults({ results }: { results: RetrievalResult[] }) {
  if (results.length === 0) {
    return <div className="rounded-lg border border-dashed border-line px-3 py-4 text-xs text-slate-500">No retrieval hits yet.</div>;
  }

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <RetrievalResultCard
          key={result.citation_id}
          citationId={result.citation_id}
          title={result.title}
          sourceType={result.source_type}
          excerpt={result.content}
          score={result.relevance_score}
        />
      ))}
    </div>
  );
}

export function RetrievalResultCard({
  citationId,
  title,
  sourceType,
  excerpt,
  score,
}: {
  citationId: string;
  title: string;
  sourceType: string;
  excerpt: string;
  score: number;
}) {
  return <EvidenceCitation citationId={citationId} title={title} sourceType={sourceType} excerpt={excerpt} score={score} />;
}

export function SemanticSearchPanel({
  incidentId,
  initialResults,
  metadataFilters,
}: {
  incidentId: number;
  initialResults: RetrievalResult[];
  metadataFilters?: Record<string, string | number | boolean>;
}) {
  const [query, setQuery] = useState("strict validation rollback");
  const [sourceType, setSourceType] = useState("all");
  const [results, setResults] = useState(initialResults);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-white">Semantic Search</div>
            <div className="mt-1 text-xs text-slate-500">Query the incident chunk store with the same backend route the FastAPI app exposes.</div>
          </div>
          <Badge className="border-[#568dff]/30 bg-[#568dff1a] text-[#b0c6ff]">RAG</Badge>
        </div>
      </div>
      <div className="space-y-3 px-4 py-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-8" placeholder="Search evidence chunks..." />
          </div>
          <select
            className="h-9 rounded-md border border-line bg-[#10131b] px-3 text-xs text-slate-300"
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value)}
          >
            {SOURCE_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "all sources" : option}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={() =>
              startTransition(async () => {
                const response = await searchEvidence({
                  incident_id: incidentId,
                  query,
                  source_types: sourceType === "all" ? undefined : [sourceType],
                  metadata_filters: metadataFilters,
                  top_k: 6,
                  score_threshold: 0.2,
                });
                setResults(response.results);
              })
            }
          >
            {isPending ? "Searching..." : "Search"}
          </Button>
        </div>
        <RetrievalResults results={results} />
      </div>
    </div>
  );
}

export function VectorIndexStatusCard({
  provider = "pgvector",
  status = "ready",
  embeddingModel = "sentence-transformers/all-MiniLM-L6-v2",
}: {
  provider?: string;
  status?: string;
  embeddingModel?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-4">
      <div className="text-sm font-medium text-white">Vector Index Status</div>
      <div className="mt-3 space-y-2 text-xs text-slate-300">
        <div className="flex justify-between"><span className="text-slate-500">Provider</span><span>{provider}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Status</span><span>{status}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-500">Embedding model</span><span className="text-right">{embeddingModel}</span></div>
      </div>
    </div>
  );
}

export function ChunkPreviewCard({
  citationId,
  content,
  tokenCount,
}: {
  citationId: string;
  content: string;
  tokenCount: number;
}) {
  return (
    <div className="rounded-lg border border-line bg-[#050505] px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <CitationBadge citationId={citationId} />
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">{tokenCount} tok</span>
      </div>
      <div className="mt-2 font-mono text-[11px] leading-5 text-slate-300">{content}</div>
    </div>
  );
}

export function ChunkList({
  chunks,
}: {
  chunks: Array<{ id: number; citation_id: string; content: string; token_count: number }>;
}) {
  if (chunks.length === 0) {
    return <div className="rounded-lg border border-dashed border-line px-3 py-4 text-xs text-slate-500">No chunks processed yet.</div>;
  }

  return (
    <div className="space-y-2">
      {chunks.map((chunk) => (
        <ChunkPreviewCard key={chunk.id} citationId={chunk.citation_id} content={chunk.content} tokenCount={chunk.token_count} />
      ))}
    </div>
  );
}

export function RootCauseHypothesisCard({ id, title, confidence, summary }: { id: string; title: string; confidence: number; summary: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-white">
          {id} · {title}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#b0c6ff]">{Math.round(confidence * 100)}%</div>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">{summary}</p>
    </div>
  );
}

export function ActionPlanCard({ title, description, steps, tone = "safe" }: ActionPlan) {
  const toneClass =
    tone === "danger"
      ? "border-[#f85149]/30 bg-[#22161b]"
      : tone === "warning"
        ? "border-[#ff8b3d]/30 bg-[#241b14]"
        : "border-[#568dff]/20 bg-panel";

  return (
    <div className={`rounded-lg border px-3 py-3 ${toneClass}`}>
      <div className="text-sm font-medium text-white">{title}</div>
      <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      <div className="mt-3 space-y-2">
        {steps.map((step) => (
          <div key={step} className="flex gap-2 text-xs text-slate-300">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#0070ff]" />
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentTraceGraph({ nodes }: { nodes: TraceNode[] }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-4">
      <div className="grid gap-3 lg:grid-cols-4">
        {nodes.map((node, index) => (
          <div key={node.id} className="relative rounded-lg border border-line bg-[#10131b] px-3 py-3">
            {index < nodes.length - 1 ? <div className="absolute right-[-14px] top-1/2 hidden h-px w-7 bg-line lg:block" /> : null}
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">{node.model}</div>
            <div className="mt-2 text-sm font-medium text-white">{node.name}</div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>{node.latencyLabel}</span>
              <span>{node.tokenLabel} tok</span>
            </div>
            <div className="mt-3">
              <Badge
                className={
                  node.status === "completed"
                    ? "border-[#2ea043]/30 bg-[#2ea0431a] text-[#7ee787]"
                    : node.status === "running"
                      ? "border-[#568dff]/30 bg-[#568dff1a] text-[#b0c6ff]"
                      : "border-line bg-[#171b24] text-slate-300"
                }
              >
                {node.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentRunCard({ title, latency, tokens, model, toolCalls, summary }: { title: string; latency: string; tokens: string; model: string; toolCalls: number; summary: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">{title}</div>
          <p className="mt-1 text-xs leading-5 text-slate-400">{summary}</p>
        </div>
        <Badge className="border-line bg-[#10131b] text-slate-300">{model}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-[11px]">
        <div><div className="text-slate-500">Latency</div><div className="mt-1 text-slate-200">{latency}</div></div>
        <div><div className="text-slate-500">Tokens</div><div className="mt-1 text-slate-200">{tokens}</div></div>
        <div><div className="text-slate-500">Tool calls</div><div className="mt-1 text-slate-200">{toolCalls}</div></div>
      </div>
    </div>
  );
}

export function ToolCallPanel({ calls }: { calls: ToolCallSummary[] }) {
  return (
    <div className="rounded-xl border border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <div className="text-sm font-medium text-white">Tool Calls</div>
      </div>
      <div className="space-y-2 px-4 py-4">
        {calls.map((call) => (
          <div key={call.name} className="flex items-center justify-between rounded-lg border border-line bg-[#10131b] px-3 py-3 text-xs">
            <div>
              <div className="font-medium text-slate-200">{call.name}</div>
              <div className="mt-1 text-slate-500">{call.latency}</div>
            </div>
            <Badge className={call.status === "warning" ? "border-[#ff8b3d]/30 bg-[#ff8b3d1a] text-[#ffb86b]" : "border-line bg-[#171b24] text-slate-300"}>
              {call.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EvalMetricCard({ label, value, sublabel, tone = "accent" }: EvalMetric) {
  const barColor = tone === "danger" ? "#f85149" : tone === "warning" ? "#ff8b3d" : tone === "success" ? "#2ea043" : "#568dff";
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <div className="label-caps text-slate-500">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold text-white">{value}</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: barColor }}>
          {sublabel}
        </div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-[#20262f]">
        <div className="h-1.5 rounded-full" style={{ width: value.includes("%") ? value : "82%", backgroundColor: barColor }} />
      </div>
    </div>
  );
}

export function EvalHistoryChart({ labels, accuracy, latency }: { labels: string[]; accuracy: number[]; latency: number[] }) {
  const maxValue = Math.max(...accuracy, ...latency);
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">Prompt Version Comparison</div>
          <div className="mt-1 text-xs text-slate-500">Accuracy and latency regression view across recent prompt releases.</div>
        </div>
        <div className="flex gap-3 text-[10px] font-mono uppercase tracking-[0.08em] text-slate-500">
          <span className="text-[#568dff]">accuracy</span>
          <span className="text-[#ff8b3d]">latency</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-3">
        {labels.map((label, index) => (
          <div key={label} className="space-y-2">
            <div className="flex h-40 items-end justify-center gap-1 rounded-lg border border-line bg-[#10131b] px-2 py-3">
              <div className="w-3 rounded-sm bg-[#568dff]" style={{ height: `${(accuracy[index] / maxValue) * 100}%` }} />
              <div className="w-3 rounded-sm bg-[#ff8b3d]" style={{ height: `${(latency[index] / maxValue) * 100}%` }} />
            </div>
            <div className="text-center font-mono text-[10px] text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FailedCasesTable({ failures }: { failures: EvalFailure[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-[#10131b] text-[10px] uppercase tracking-[0.08em] text-slate-500">
          <tr>
            <th className="px-3 py-3">Incident</th>
            <th className="px-3 py-3">Timestamp</th>
            <th className="px-3 py-3">Primary failure</th>
            <th className="px-3 py-3">Confidence</th>
            <th className="px-3 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-panel">
          {failures.map((failure) => (
            <tr key={failure.incidentId}>
              <td className="px-3 py-3 font-mono text-slate-300">{failure.incidentId}</td>
              <td className="px-3 py-3 text-slate-400">{failure.timestamp}</td>
              <td className="px-3 py-3 text-slate-200">{failure.reason}</td>
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
  fields,
}: {
  title: string;
  description: string;
  fields: SettingField[];
}) {
  const renderValue = (field: SettingField) => {
    if (field.kind === "toggle") return field.value ? "Enabled" : "Disabled";
    return String(field.value);
  };

  return (
    <div className="rounded-xl border border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="mt-1 text-xs text-slate-500">{description}</div>
      </div>
      <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="rounded-lg border border-line bg-[#10131b] px-3 py-3">
            <div className="text-xs text-slate-500">{field.label}</div>
            <div className="mt-2 text-sm text-white">{renderValue(field)}</div>
            {"description" in field && field.description ? <div className="mt-2 text-[11px] text-slate-500">{field.description}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-panel px-4 py-8 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-line bg-[#10131b] text-slate-300">
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="mt-3 text-sm font-medium text-white">{title}</div>
      <div className="mt-2 text-xs leading-5 text-slate-400">{description}</div>
    </div>
  );
}

export function LoadingState({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#568dff]" />
        <div className="text-sm text-slate-300">{title}</div>
      </div>
    </div>
  );
}

export function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-[#f85149]/30 bg-[#22161b] px-4 py-6">
      <div className="flex items-center gap-3 text-[#ffb4ab]">
        <AlertTriangle className="h-4 w-4" />
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="mt-2 text-xs leading-5 text-[#ffb4ab]/80">{description}</div>
    </div>
  );
}

export function RetrievalStatusStrip({ evidenceItems }: { evidenceItems: EvidenceItem[] }) {
  const summary = useMemo(() => {
    const completed = evidenceItems.filter((item) => item.embedding_status === "completed").length;
    const failed = evidenceItems.filter((item) => item.processing_status === "failed").length;
    return { completed, failed, total: evidenceItems.length };
  }, [evidenceItems]);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-line bg-panel px-4 py-3">
        <div className="text-xs text-slate-500">Evidence items</div>
        <div className="mt-2 text-2xl font-semibold text-white">{summary.total}</div>
      </div>
      <div className="rounded-lg border border-line bg-panel px-4 py-3">
        <div className="text-xs text-slate-500">Embedded</div>
        <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
          {summary.completed}
          <CheckCircle2 className="h-4 w-4 text-[#7ee787]" />
        </div>
      </div>
      <div className="rounded-lg border border-line bg-panel px-4 py-3">
        <div className="text-xs text-slate-500">Failed</div>
        <div className="mt-2 text-2xl font-semibold text-white">{summary.failed}</div>
      </div>
    </div>
  );
}
