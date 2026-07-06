"use client";

import { useState, useTransition } from "react";
import { importIntegrationEvidence } from "@/lib/api";
import type { IntegrationHealth } from "@/lib/types";
import { Button } from "@/components/ui/button";


export function IntegrationHealthPanel({
  incidentId,
  integrations,
}: {
  incidentId: number;
  integrations: IntegrationHealth[];
}) {
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {integrations.map((integration) => (
        <div key={integration.key} className="rounded-xl border border-line bg-panel px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-white">{integration.label}</div>
              <div className="mt-1 text-xs text-slate-500">{integration.detail}</div>
            </div>
            <span className="rounded-full border border-line bg-[#10131b] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-300">
              {integration.status}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {integration.source_types.map((sourceType) => (
              <span key={sourceType} className="rounded-full border border-line bg-[#10131b] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400">
                {sourceType}
              </span>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <Button
              size="sm"
              variant="secondary"
              className="w-full justify-center"
              onClick={() =>
                startTransition(async () => {
                  const result = await importIntegrationEvidence(incidentId, integration.key);
                  setMessages((current) => ({
                    ...current,
                    [integration.key]: `Imported ${result.imported} · updated ${result.updated}`,
                  }));
                })
              }
            >
              {isPending ? "Importing..." : "Import Evidence"}
            </Button>
            {messages[integration.key] ? <div className="text-[11px] text-slate-500">{messages[integration.key]}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
