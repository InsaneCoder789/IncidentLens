"use client";

import { useMemo, useState } from "react";
import type { Incident } from "@/lib/types";
import { IncidentTable } from "@/components/incident-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function IncidentsListClient({ incidents }: { incidents: Incident[] }) {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesSearch =
        !search ||
        incident.title.toLowerCase().includes(search.toLowerCase()) ||
        incident.affected_service.toLowerCase().includes(search.toLowerCase());
      const matchesSeverity = !severity || incident.severity === severity;
      const matchesStatus = !status || incident.status === status;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [incidents, search, severity, status]);

  const selected = filtered[0] ?? incidents[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-white">Incident List</div>
              <div className="mt-1 text-xs text-slate-500">Match the Stitch queue layout with compact filters, table density, and a quick summary rail.</div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">Showing {filtered.length} incidents</div>
          </div>
        </CardHeader>
        <CardContent>
          <IncidentTable incidents={filtered} search={search} onSearch={setSearch} severity={severity} onSeverity={setSeverity} status={status} onStatus={setStatus} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Quick Summary</div>
              <div className="mt-1 text-xs text-slate-500">Selected: INC-{String(selected.id).padStart(4, "0")}</div>
            </div>
            <button className="text-slate-500">×</button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-line bg-[#11161f] px-3 py-3">
            <div className="label-caps text-[#b48fff]">AI Hypothesis</div>
            <div className="mt-2 text-sm text-white">Root cause: release-timed regression likely introduced a validation or saturation path under burst production load.</div>
            <div className="mt-3 text-xs leading-5 text-slate-400">
              Confidence score: {Math.round((selected.latest_confidence_score ?? 0) * 100)}% based on code change timing, traces, and correlated latency spikes.
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="label-caps text-slate-500">Observed symptoms</div>
              <div className="mt-2 space-y-2 text-xs text-slate-300">
                <div>Severity: {selected.severity}</div>
                <div>Status: {selected.status}</div>
                <div>Evidence count: {selected.evidence_count}</div>
              </div>
            </div>
            <div>
              <div className="label-caps text-slate-500">Traffic analysis</div>
              <div className="mt-3 grid h-20 grid-cols-5 gap-2">
                {[28, 31, 29, 56, 58].map((value, index) => (
                  <div key={index} className="flex items-end rounded-sm bg-[#11161f] p-1">
                    <div className={`w-full rounded-sm ${index > 2 ? "bg-[#ffb4ab]" : "bg-[#293347]"}`} style={{ height: `${value}%` }} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="label-caps text-slate-500">Next steps</div>
              <div className="mt-2 space-y-2">
                {["Open investigation workspace", "Review approval-gated actions", "Replay semantic retrieval query"].map((step) => (
                  <div key={step} className="rounded-md border border-line bg-[#11161f] px-3 py-2 text-xs text-slate-300">
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
