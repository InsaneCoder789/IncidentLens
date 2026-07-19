import Link from "next/link";
import { Activity, Gauge, ShieldCheck } from "lucide-react";
import { getIncidents, getLlmopsOverview, getRuntimeSettings } from "@/lib/api";
import { RuntimeSettingsForm } from "@/components/runtime-settings-form";
import { PageIntro, SectionHeading } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ConnectionHealth } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [overview, settings, incidents] = await Promise.all([getLlmopsOverview(), getRuntimeSettings(), getIncidents()]);
  const latestIncident = incidents[0];
  const latestEval = overview?.latest_eval_summary ?? {};
  const runtimeConnections: ConnectionHealth[] = [
    { name: "Reasoning", subtitle: overview.reasoning_model_primary, status: overview.provider_configured ? "active" : "configuration required" },
    { name: "Embeddings", subtitle: overview.embedding_model_name, status: "active" },
    { name: "Tracing", subtitle: overview.tracing_enabled ? "Agent spans and tool telemetry" : "Tracing disabled", status: overview.tracing_enabled ? "enabled" : "disabled" },
  ];

  return (
    <div>
      <PageIntro eyebrow="Runtime control" title="LLMOps settings" description="Configure model routing, retrieval, tracing, cost controls, prompt versions, and evaluation thresholds. Production-changing actions remain approval-gated." actions={latestIncident ? <Link href={`/incidents/${latestIncident.id}/trace`}><Button variant="secondary"><Activity className="mr-2 h-4 w-4" strokeWidth={1.5} />Open latest trace</Button></Link> : undefined} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[1.1fr_1fr_1fr]">
            {runtimeConnections.map((connection, index) => (
              <Card key={connection.name}><CardContent className="min-h-[118px]"><div className="flex items-start justify-between gap-3"><div><div className="label-caps text-muted">{connection.name}</div><div className="mt-3 text-sm font-medium text-text">{connection.subtitle}</div></div><span className={`mt-0.5 h-2 w-2 rounded-full ${connection.status === "active" || connection.status === "enabled" ? "bg-success" : "bg-warning"}`} /></div><div className="mt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{connection.status} / channel {index + 1}</div></CardContent></Card>
            ))}
          </div>
          <RuntimeSettingsForm initialSettings={settings} />
        </div>

        <aside className="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
          <Card><CardHeader><SectionHeading eyebrow="Guardrails" title="Budget and safety" /></CardHeader><CardContent>
            <div className="label-caps text-muted">Monthly cost limit</div><div className="mt-2 font-mono text-3xl tracking-[-0.05em] text-text">${settings.monthly_cost_limit_usd.toFixed(2)}</div>
            <div className="mt-2 flex justify-between font-mono text-[9px] text-muted"><span>Recorded average</span><span>{latestEval.avg_cost_usd ? `$${Number(latestEval.avg_cost_usd).toFixed(2)} / eval run` : "No usage recorded"}</span></div>
            <div className="mt-5 rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs leading-5 text-warning">Rollback, hotfix, and production mutation steps require human approval before execution.</div>
          </CardContent></Card>
          <Card><CardHeader><SectionHeading eyebrow="Engine" title="Runtime health" /></CardHeader><CardContent className="divide-y divide-line/8">
            <div className="flex items-center justify-between py-3 text-xs"><span className="flex items-center gap-2 text-muted"><Gauge className="h-3.5 w-3.5" strokeWidth={1.5} />Average latency</span><span className="font-mono text-text">{latestEval.avg_latency_ms ? `${Math.round(Number(latestEval.avg_latency_ms))}ms` : "No run"}</span></div>
            <div className="flex items-center justify-between py-3 text-xs"><span className="flex items-center gap-2 text-muted"><ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />Provider</span><span className="font-mono text-text">{overview.provider_configured ? "Configured" : "Required"}</span></div>
            <div className="flex items-center justify-between py-3 text-xs"><span className="text-muted">Prompt versions</span><span className="font-mono text-text">{overview?.prompt_versions.length ?? 0}</span></div>
          </CardContent></Card>
        </aside>
      </div>
    </div>
  );
}
