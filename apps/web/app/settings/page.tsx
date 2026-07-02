import { llmopsConnections, settingsSections } from "@/lib/mock-data";
import { SettingsSection } from "@/components/evidence-citation";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          {llmopsConnections.map((connection) => (
            <div key={connection.name} className="rounded-lg border border-line bg-panel px-4 py-3">
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

        {settingsSections.map((section) => (
          <SettingsSection key={section.title} title={section.title} description={section.description}>
            <div className="grid gap-3 md:grid-cols-2">
              {section.fields.map((field) => (
                <div key={field.label} className="rounded-md border border-line bg-[#11161f] px-3 py-3">
                  <div className="text-xs text-slate-500">{field.label}</div>
                  <div className="mt-2 text-sm text-white">
                    {field.kind === "toggle" ? (field.value ? "Enabled" : "Disabled") : String(field.value)}
                  </div>
                  {"description" in field && field.description ? <div className="mt-2 text-[11px] text-slate-500">{field.description}</div> : null}
                </div>
              ))}
            </div>
          </SettingsSection>
        ))}
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border border-line bg-panel px-4 py-3">
          <div className="text-sm font-medium text-white">Budgetary Guardrails</div>
          <div className="mt-2 text-xs text-slate-500">Monthly cost limit</div>
          <div className="mt-2 rounded-md border border-line bg-[#0b0f19] px-3 py-2 text-sm text-white">$500</div>
          <div className="mt-3 text-[11px] text-slate-500">Current spent: $289.46 USD</div>
          <div className="mt-3 rounded-md border border-[#f85149]/30 bg-[#25161a] px-3 py-3 text-xs text-[#ffb4ab]">
            Autofail warning: prompt token generation is approaching 75% of budget.
          </div>
        </div>
        <div className="rounded-lg border border-line bg-panel px-4 py-3">
          <div className="text-sm font-medium text-white">Reasoning Engine Health</div>
          <div className="mt-3 space-y-2 text-xs text-slate-300">
            <div className="flex justify-between"><span>Avg Latency</span><span>1.2s</span></div>
            <div className="flex justify-between"><span>Tokens/sec</span><span>84</span></div>
            <div className="flex justify-between"><span>Context Recall</span><span>88.4%</span></div>
          </div>
          <Button variant="secondary" size="sm" className="mt-4 w-full">Run Optimization Trace</Button>
        </div>
        <div className="rounded-lg border border-line bg-panel px-4 py-3">
          <div className="text-sm font-medium text-white">Need help with tuning?</div>
          <div className="mt-2 text-xs leading-5 text-slate-400">Check our guide on optimizing context retrieval for large-scale Kubernetes outages.</div>
        </div>
      </div>
    </div>
  );
}
