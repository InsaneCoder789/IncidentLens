"use client";

import { useState, useTransition } from "react";
import { updateRuntimeSettings } from "@/lib/api";
import type { RuntimeSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


const textFields: Array<{ key: keyof RuntimeSettings; label: string; type?: "number"; step?: string }> = [
  { key: "reasoning_model_primary", label: "Primary reasoning model" },
  { key: "reasoning_model_fallback", label: "Fallback reasoning model" },
  { key: "embedding_model_name", label: "Embedding model" },
  { key: "generation_temperature", label: "Generation temperature", type: "number", step: "0.05" },
  { key: "generation_max_tokens", label: "Maximum generation tokens", type: "number", step: "1" },
  { key: "monthly_cost_limit_usd", label: "Monthly cost limit (USD)", type: "number", step: "1" },
  { key: "eval_root_cause_threshold", label: "Root-cause accuracy threshold", type: "number", step: "0.01" },
  { key: "eval_citation_threshold", label: "Citation coverage threshold", type: "number", step: "0.01" },
];

const toggles: Array<{ key: keyof RuntimeSettings; label: string }> = [
  { key: "tracing_enabled", label: "Agent tracing" },
  { key: "cost_tracking_enabled", label: "Cost tracking" },
  { key: "prompt_versioning_enabled", label: "Prompt versioning" },
];

export function RuntimeSettingsForm({ initialSettings }: { initialSettings: RuntimeSettings }) {
  const [values, setValues] = useState(initialSettings);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="surface-shell">
      <div className="surface-core">
        <div className="flex items-center justify-between border-b border-line/10 px-5 py-4">
          <div><div className="text-sm font-medium text-text">Runtime policy</div><div className="mt-1 text-xs text-muted">Persisted model, observability, budget, and evaluation controls.</div></div>
          <Button size="sm" disabled={isPending} onClick={() => startTransition(async () => {
            setMessage(null);
            try {
              const saved = await updateRuntimeSettings(values);
              setValues(saved);
              setMessage("Settings saved to the control plane");
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Settings could not be saved");
            }
          })}>{isPending ? "Saving..." : "Save changes"}</Button>
        </div>
        {message ? <div role="status" className="border-b border-line/10 px-5 py-3 text-xs text-muted">{message}</div> : null}
        <div className="divide-y divide-line/8 px-5">
          {textFields.map((field) => <div key={field.key} className="grid gap-3 py-4 md:grid-cols-[1fr_320px] md:items-center"><label htmlFor={field.key} className="text-sm text-text">{field.label}</label><Input id={field.key} type={field.type ?? "text"} step={field.step} value={String(values[field.key])} onChange={(event) => setValues((current) => ({ ...current, [field.key]: field.type === "number" ? Number(event.target.value) : event.target.value }))} /></div>)}
          {toggles.map((field) => <div key={field.key} className="flex items-center justify-between py-4"><span className="text-sm text-text">{field.label}</span><button type="button" role="switch" aria-checked={Boolean(values[field.key])} onClick={() => setValues((current) => ({ ...current, [field.key]: !current[field.key] }))} className={`relative h-6 w-11 rounded-full transition-colors ${values[field.key] ? "bg-accent" : "bg-panel3"}`}><span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-text transition-transform ${values[field.key] ? "translate-x-5" : "translate-x-0"}`} /></button></div>)}
        </div>
      </div>
    </div>
  );
}
