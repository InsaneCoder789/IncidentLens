import Link from "next/link";
import { Activity, Gauge, ShieldCheck } from "lucide-react";
import { getLlmopsOverview } from "@/lib/api";
import { llmopsConnections, settingsSections } from "@/lib/mock-data";
import { SettingsSection } from "@/components/evidence-citation";
import { PageIntro, SectionHeading } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ConnectionHealth, SettingSectionData } from "@/lib/types";

export default async function SettingsPage() {
  const overview = await getLlmopsOverview();
  const latestEval = overview?.latest_eval_summary ?? {};
  const promptSummary = overview?.prompt_versions.length ? overview.prompt_versions.map((item) => `${item.name}@${item.version}`).join(", ") : "No prompt versions loaded yet";
  const runtimeConnections: ConnectionHealth[] = overview ? [
    { name: "Reasoning", subtitle: overview.reasoning_model_primary, status: overview.mock_mode ? "mock mode" : "active" },
    { name: "Embeddings", subtitle: overview.embedding_model_name, status: "active" },
    { name: "Tracing", subtitle: overview.tracing_enabled ? "Agent spans and tool telemetry" : "Tracing disabled", status: overview.tracing_enabled ? "enabled" : "disabled" },
  ] : llmopsConnections;
  const runtimeSections: SettingSectionData[] = overview ? [
    { title: "Model providers", description: "Primary reasoning, fallback, and prompt registry controls.", fields: [
      { kind: "input", label: "Primary model", value: overview.reasoning_model_primary },
      { kind: "input", label: "Fallback model", value: overview.reasoning_model_fallback },
      { kind: "toggle", label: "Mock mode", value: overview.mock_mode, description: "Deterministic local mode keeps the demo runnable without paid APIs." },
      { kind: "input", label: "Prompt registry", value: promptSummary },
    ] },
    { title: "Retrieval and tracing", description: "Embedding, telemetry, and generation defaults.", fields: [
      { kind: "input", label: "Embedding model", value: overview.embedding_model_name },
      { kind: "toggle", label: "Tracing enabled", value: overview.tracing_enabled },
      { kind: "toggle", label: "Cost tracking enabled", value: overview.cost_tracking_enabled },
      { kind: "input", label: "Max generation tokens", value: String(overview.generation_max_tokens) },
    ] },
    { title: "Governance", description: "Evaluation health, prompt visibility, and readiness thresholds.", fields: [
      { kind: "toggle", label: "Prompt versioning enabled", value: overview.prompt_versioning_enabled },
      { kind: "input", label: "Healthy integrations", value: `${overview.integration_status_summary.healthy ?? 0}/${overview.integration_status_summary.total ?? 0}` },
      { kind: "input", label: "Root-cause accuracy", value: latestEval.root_cause_accuracy ? `${Math.round(Number(latestEval.root_cause_accuracy) * 100)}%` : "No eval run yet" },
      { kind: "input", label: "Citation coverage", value: latestEval.citation_coverage ? `${Math.round(Number(latestEval.citation_coverage) * 100)}%` : "No eval run yet" },
    ] },
  ] : settingsSections;

  return (
    <div>
      <PageIntro eyebrow="Runtime control" title="LLMOps settings" description="Configure model routing, retrieval, tracing, cost controls, prompt versions, and evaluation thresholds. Production-changing actions remain approval-gated." actions={<Link href="/incidents/1/trace"><Button variant="secondary"><Activity className="mr-2 h-4 w-4" strokeWidth={1.5} />Open latest trace</Button></Link>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[1.1fr_1fr_1fr]">
            {runtimeConnections.map((connection, index) => (
              <Card key={connection.name}><CardContent className="min-h-[118px]"><div className="flex items-start justify-between gap-3"><div><div className="label-caps text-muted">{connection.name}</div><div className="mt-3 text-sm font-medium text-text">{connection.subtitle}</div></div><span className={`mt-0.5 h-2 w-2 rounded-full ${connection.status === "disabled" ? "bg-warning" : "bg-success"}`} /></div><div className="mt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{connection.status} / channel {index + 1}</div></CardContent></Card>
            ))}
          </div>
          {runtimeSections.map((section) => <SettingsSection key={section.title} title={section.title} description={section.description} fields={section.fields} />)}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
          <Card><CardHeader><SectionHeading eyebrow="Guardrails" title="Budget and safety" /></CardHeader><CardContent>
            <div className="label-caps text-muted">Monthly cost limit</div><div className="mt-2 font-mono text-3xl tracking-[-0.05em] text-text">$500</div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-panel3"><div className="h-full w-[8%] rounded-full bg-accent" /></div>
            <div className="mt-2 flex justify-between font-mono text-[9px] text-muted"><span>Current usage</span><span>{latestEval.avg_cost_usd ? `$${Number(latestEval.avg_cost_usd).toFixed(2)} avg/run` : "$0.00 mock"}</span></div>
            <div className="mt-5 rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs leading-5 text-warning">Rollback, hotfix, and production mutation steps require human approval before execution.</div>
          </CardContent></Card>
          <Card><CardHeader><SectionHeading eyebrow="Engine" title="Runtime health" /></CardHeader><CardContent className="divide-y divide-line/8">
            <div className="flex items-center justify-between py-3 text-xs"><span className="flex items-center gap-2 text-muted"><Gauge className="h-3.5 w-3.5" strokeWidth={1.5} />Average latency</span><span className="font-mono text-text">{latestEval.avg_latency_ms ? `${Math.round(Number(latestEval.avg_latency_ms))}ms` : "No run"}</span></div>
            <div className="flex items-center justify-between py-3 text-xs"><span className="flex items-center gap-2 text-muted"><ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />Mock mode</span><span className="font-mono text-text">{overview?.mock_mode ? "Enabled" : "Disabled"}</span></div>
            <div className="flex items-center justify-between py-3 text-xs"><span className="text-muted">Prompt versions</span><span className="font-mono text-text">{overview?.prompt_versions.length ?? 0}</span></div>
          </CardContent></Card>
        </aside>
      </div>
    </div>
  );
}
