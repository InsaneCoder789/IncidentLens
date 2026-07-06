import { getLlmopsOverview } from "@/lib/api";
import { llmopsConnections, settingsSections } from "@/lib/mock-data";
import { SettingsSection } from "@/components/evidence-citation";
import { Button } from "@/components/ui/button";
import type { ConnectionHealth, SettingSectionData } from "@/lib/types";

export default async function SettingsPage() {
  const overview = await getLlmopsOverview();
  const latestEval = overview?.latest_eval_summary ?? {};
  const promptSummary =
    overview?.prompt_versions.length
      ? overview.prompt_versions.map((item) => `${item.name}@${item.version}`).join(", ")
      : "No prompt versions loaded yet";

  const runtimeConnections: ConnectionHealth[] = overview
    ? [
        { name: "Reasoning", subtitle: overview.reasoning_model_primary, status: overview.mock_mode ? "mock mode" : "active" },
        { name: "Embeddings", subtitle: overview.embedding_model_name, status: "active" },
        { name: "Tracing", subtitle: overview.tracing_enabled ? "Agent spans and tool telemetry" : "Tracing disabled", status: overview.tracing_enabled ? "enabled" : "disabled" },
      ]
    : llmopsConnections;

  const runtimeSections: SettingSectionData[] = overview
    ? [
        {
          title: "Model Providers",
          description: "Primary reasoning and fallback model controls.",
          fields: [
            { kind: "input", label: "Primary model", value: overview.reasoning_model_primary },
            { kind: "input", label: "Fallback model", value: overview.reasoning_model_fallback },
            { kind: "toggle", label: "Mock mode", value: overview.mock_mode, description: "Deterministic local mode keeps the demo runnable without paid APIs." },
            { kind: "input", label: "Prompt registry", value: promptSummary },
          ],
        },
        {
          title: "Retrieval",
          description: "Embedding, threshold, and semantic search defaults.",
          fields: [
            { kind: "input", label: "Embedding model", value: overview.embedding_model_name },
            { kind: "toggle", label: "Tracing enabled", value: overview.tracing_enabled },
            { kind: "toggle", label: "Cost tracking enabled", value: overview.cost_tracking_enabled },
            { kind: "input", label: "Max generation tokens", value: String(overview.generation_max_tokens) },
          ],
        },
        {
          title: "Governance",
          description: "Eval health, prompt visibility, and integration readiness.",
          fields: [
            { kind: "toggle", label: "Prompt versioning enabled", value: overview.prompt_versioning_enabled },
            { kind: "input", label: "Healthy integrations", value: `${overview.integration_status_summary.healthy ?? 0}/${overview.integration_status_summary.total ?? 0}` },
            { kind: "input", label: "Latest root-cause accuracy", value: latestEval.root_cause_accuracy ? `${Math.round(Number(latestEval.root_cause_accuracy) * 100)}%` : "No eval run yet" },
            { kind: "input", label: "Latest citation coverage", value: latestEval.citation_coverage ? `${Math.round(Number(latestEval.citation_coverage) * 100)}%` : "No eval run yet" },
          ],
        },
      ]
    : settingsSections;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {runtimeConnections.map((connection) => (
            <div key={connection.name} className="rounded-xl border border-line bg-panel px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{connection.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{connection.subtitle}</div>
                </div>
                <span className="rounded-full border border-[#568dff]/30 bg-[#568dff1a] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#b0c6ff]">
                  {connection.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {runtimeSections.map((section) => (
          <SettingsSection key={section.title} title={section.title} description={section.description} fields={section.fields} />
        ))}
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-panel px-4 py-4">
          <div className="text-sm font-medium text-white">Budgetary Guardrails</div>
          <div className="mt-2 text-xs text-slate-500">Monthly cost limit</div>
          <div className="mt-2 rounded-md border border-line bg-[#0b0f19] px-3 py-2 text-sm text-white">$500</div>
          <div className="mt-3 text-[11px] text-slate-500">
            Current spent: {latestEval.avg_cost_usd ? `$${Number(latestEval.avg_cost_usd).toFixed(2)} USD per eval run average` : "$0.00 USD in mock mode"}
          </div>
          <div className="mt-3 rounded-md border border-[#f85149]/30 bg-[#25161a] px-3 py-3 text-xs text-[#ffb4ab]">
            Autofail warning: production-changing actions remain approval-gated and mock mode is active by default.
          </div>
        </div>
        <div className="rounded-xl border border-line bg-panel px-4 py-4">
          <div className="text-sm font-medium text-white">Reasoning Engine Health</div>
          <div className="mt-3 space-y-2 text-xs text-slate-300">
            <div className="flex justify-between"><span>Avg Latency</span><span>{latestEval.avg_latency_ms ? `${Math.round(Number(latestEval.avg_latency_ms))}ms` : "No eval run yet"}</span></div>
            <div className="flex justify-between"><span>Mock Mode</span><span>{overview?.mock_mode ? "Enabled" : "Disabled"}</span></div>
            <div className="flex justify-between"><span>Prompt Versions</span><span>{overview?.prompt_versions.length ?? 0}</span></div>
          </div>
          <Button variant="secondary" size="sm" className="mt-4 w-full">Run Optimization Trace</Button>
        </div>
        <div className="rounded-xl border border-line bg-panel px-4 py-4">
          <div className="text-sm font-medium text-white">Need help with tuning?</div>
          <div className="mt-2 text-xs leading-5 text-slate-400">Check our guide on optimizing context retrieval for large-scale Kubernetes outages.</div>
        </div>
      </div>
    </div>
  );
}
