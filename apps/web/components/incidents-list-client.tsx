"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Clock3, FileStack, Route } from "lucide-react";
import type { Incident } from "@/lib/types";
import { IncidentTable } from "@/components/incident-table";
import { PageIntro, SectionHeading } from "@/components/page-intro";
import { SeverityBadge } from "@/components/severity-badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function IncidentsListClient({ incidents }: { incidents: Incident[] }) {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState(incidents[0]?.id);

  const filtered = useMemo(() => incidents.filter((incident) => {
    const matchesSearch = !search || `${incident.title} ${incident.affected_service}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (!severity || incident.severity === severity) && (!status || incident.status === status);
  }), [incidents, search, severity, status]);
  const selected = incidents.find((incident) => incident.id === selectedId) ?? filtered[0] ?? incidents[0];

  if (!selected) return <div className="py-20 text-center text-sm text-muted">No incidents are available.</div>;

  return (
    <div>
      <PageIntro eyebrow="Production queue" title="Incidents" description="Prioritize by impact, inspect the current hypothesis, and enter a grounded investigation with the relevant context already selected." meta={<div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{filtered.length} shown / {incidents.length} total</div>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader><SectionHeading eyebrow="Triage" title="Incident queue" description="Select any row to update the context rail. Open the title to enter its workspace." /></CardHeader>
          <CardContent><IncidentTable incidents={filtered} search={search} onSearch={setSearch} severity={severity} onSeverity={setSeverity} status={status} onStatus={setStatus} selectedId={selected.id} onSelect={(incident) => setSelectedId(incident.id)} /></CardContent>
        </Card>

        <aside className="xl:sticky xl:top-[92px] xl:self-start">
          <Card>
            <CardHeader><SectionHeading eyebrow={`INC-${String(selected.id).padStart(4, "0")}`} title="Triage brief" /></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2"><SeverityBadge severity={selected.severity} /><StatusBadge status={selected.status} /></div>
              <h2 className="mt-4 text-lg font-semibold leading-6 tracking-[-0.025em] text-text">{selected.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{selected.description}</p>

              <div className="mt-5 divide-y divide-line/8 border-y border-line/8">
                <div className="flex items-center justify-between py-3 text-xs"><span className="flex items-center gap-2 text-muted"><Route className="h-3.5 w-3.5" strokeWidth={1.5} />Service</span><span className="font-mono text-text">{selected.affected_service}</span></div>
                <div className="flex items-center justify-between py-3 text-xs"><span className="flex items-center gap-2 text-muted"><FileStack className="h-3.5 w-3.5" strokeWidth={1.5} />Evidence</span><span className="font-mono text-text">{selected.evidence_count} items</span></div>
                <div className="flex items-center justify-between py-3 text-xs"><span className="flex items-center gap-2 text-muted"><Clock3 className="h-3.5 w-3.5" strokeWidth={1.5} />Updated</span><span className="font-mono text-text">{new Date(selected.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
              </div>

              <div className="mt-5 rounded-xl border border-accent/12 bg-accent/[0.045] p-4">
                <div className="label-caps text-accent">Current hypothesis</div>
                <p className="mt-2 text-sm leading-6 text-text">A release-timed signature validation regression is the leading cause, supported by traces and correlated payment error spikes.</p>
                <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">Grounded confidence / {Math.round((selected.latest_confidence_score ?? 0) * 100)}%</div>
              </div>

              <Link href={`/incidents/${selected.id}`} className="mt-5 block"><Button className="group w-full justify-between">Open investigation<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} /></span></Button></Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
