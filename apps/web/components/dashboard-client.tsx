"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, CircleDot, Database, ShieldCheck } from "lucide-react";
import { IncidentTable } from "@/components/incident-table";
import { MetricCard } from "@/components/metric-card";
import { PageIntro, SectionHeading } from "@/components/page-intro";
import { SeverityBadge } from "@/components/severity-badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DashboardData } from "@/lib/types";


export function DashboardClient({ dashboard }: { dashboard: DashboardData }) {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const filteredIncidents = useMemo(() => dashboard.incidents.filter((incident) => {
    const matchesSearch = !search || `${incident.title} ${incident.affected_service}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (!severity || incident.severity === severity) && (!status || incident.status === status);
  }), [dashboard.incidents, search, severity, status]);
  const active = dashboard.incidents[0];

  return (
    <div>
      <PageIntro
        eyebrow="Production operations"
        title="Incident command"
        description="Triage active failures, inspect grounded evidence, and move from signal to an approval-ready response without leaving the operational context."
        meta={active ? <div className="flex flex-wrap gap-2"><SeverityBadge severity={active.severity} /><StatusBadge status={active.status} /><span className="rounded-full border border-line/10 bg-panel px-2.5 py-1 font-mono text-[10px] text-muted">INC-{String(active.id).padStart(4, "0")}</span></div> : undefined}
        actions={<><Link href="/evidence"><Button variant="secondary"><Database className="mr-2 h-4 w-4" strokeWidth={1.5} />Add evidence</Button></Link>{active ? <Link href={`/incidents/${active.id}`}><Button>Open investigation<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Button></Link> : null}</>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric, index) => <MetricCard key={metric.label} label={metric.label} value={metric.value} delta={metric.detail} trend={[2, 3, 2, 4, 3, 5, Math.max(1, Number(metric.value.replace(/\D/g, "")) || index + 2)]} tone={metric.tone} />)}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader><SectionHeading eyebrow="Triage queue" title="Active incidents" description="Live incidents persisted by the operations API." action={<Link href="/incidents"><Button variant="ghost" size="sm">View full queue<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Button></Link>} /></CardHeader>
          <CardContent>{dashboard.incidents.length ? <IncidentTable incidents={filteredIncidents} search={search} onSearch={setSearch} severity={severity} onSeverity={setSeverity} status={status} onStatus={setStatus} /> : <div className="rounded-xl border border-dashed border-line/15 p-8 text-center text-sm text-muted">No incidents have been created.</div>}</CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><SectionHeading eyebrow="Audit stream" title="Recent activity" /></CardHeader>
            <CardContent className="space-y-1">
              {dashboard.recent_events.length ? dashboard.recent_events.map((item) => (
                <div key={item.id} className="grid grid-cols-[20px_1fr] gap-3 border-b border-line/8 py-3 last:border-0">
                  <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-accent/20 bg-accent/5"><CircleDot className="h-2.5 w-2.5 text-accent" /></span>
                  <div><div className="text-xs leading-5 text-text">{item.title}</div><div className="text-[11px] leading-5 text-muted">{item.description}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{new Date(item.created_at).toLocaleString()}</div></div>
                </div>
              )) : <div className="py-6 text-xs text-muted">Activity will appear after the first incident mutation.</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><SectionHeading eyebrow="Human control" title="Approval readiness" /></CardHeader>
            <CardContent><div className="flex items-center justify-between rounded-xl border border-line/10 bg-bg/40 p-4"><span className="flex items-center gap-2 text-xs text-muted"><ShieldCheck className="h-4 w-4 text-warning" />Pending decisions</span><span className="font-mono text-xl text-text">{dashboard.pending_approvals}</span></div></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
