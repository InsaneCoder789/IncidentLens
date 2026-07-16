"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, CircleDot, Database, Radar, Terminal } from "lucide-react";
import { IncidentTable } from "@/components/incident-table";
import { MetricCard } from "@/components/metric-card";
import { PageIntro, SectionHeading } from "@/components/page-intro";
import { SeverityBadge } from "@/components/severity-badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { dashboardActivity, dashboardHealth, incidents, metrics } from "@/lib/mock-data";

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");

  const filteredIncidents = useMemo(() => incidents.filter((incident) => {
    const matchesSearch = !search || `${incident.title} ${incident.affected_service}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (!severity || incident.severity === severity) && (!status || incident.status === status);
  }), [search, severity, status]);
  const active = incidents[0];

  return (
    <div>
      <PageIntro
        eyebrow="Production / payments"
        title="Incident command"
        description="Triage active failures, inspect grounded evidence, and move from signal to an approval-ready response without leaving the operational context."
        meta={<div className="flex flex-wrap gap-2"><SeverityBadge severity={active.severity} /><StatusBadge status={active.status} /><span className="rounded-full border border-line/10 bg-panel px-2.5 py-1 font-mono text-[10px] text-muted">INC-{String(active.id).padStart(4, "0")}</span></div>}
        actions={<><Link href="/evidence"><Button variant="secondary"><Database className="mr-2 h-4 w-4" strokeWidth={1.5} />Add evidence</Button></Link><Link href={`/incidents/${active.id}`}><Button className="group">Open investigation<span className="ml-2 flex h-7 w-7 items-center justify-center rounded-lg bg-bg/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} /></span></Button></Link></>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1fr_1fr]">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader><SectionHeading eyebrow="Triage queue" title="Active incidents" description="Filtered by production impact and latest evidence confidence." action={<Link href="/incidents"><Button variant="ghost" size="sm">View full queue<ArrowUpRight className="ml-2 h-3.5 w-3.5" strokeWidth={1.5} /></Button></Link>} /></CardHeader>
          <CardContent><IncidentTable incidents={filteredIncidents} search={search} onSearch={setSearch} severity={severity} onSeverity={setSeverity} status={status} onStatus={setStatus} /></CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><SectionHeading eyebrow="Live context" title="Incident pulse" /></CardHeader>
            <CardContent className="space-y-1">
              {dashboardActivity.map((item, index) => (
                <div key={item} className="grid grid-cols-[20px_1fr] gap-3 border-b border-line/8 py-3 last:border-0">
                  <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-accent/20 bg-accent/5"><CircleDot className="h-2.5 w-2.5 text-accent" strokeWidth={1.5} /></span>
                  <div><div className="text-xs leading-5 text-text">{item}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{index + 2}m ago</div></div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><SectionHeading eyebrow="Dependencies" title="System readiness" /></CardHeader>
            <CardContent className="space-y-1">
              {dashboardHealth.map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-line/8 py-2.5 last:border-0">
                  <span className="flex items-center gap-2 text-xs text-muted">{item.tone === "warning" ? <Radar className="h-3.5 w-3.5 text-warning" strokeWidth={1.5} /> : <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={1.5} />}{item.label}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text">{item.value}</span>
                </div>
              ))}
              <div className="terminal mt-3 px-3 py-3 font-mono text-[10px] leading-5 text-muted"><Terminal className="mb-2 h-3.5 w-3.5 text-accent" strokeWidth={1.5} />retrieval.top_k = 8<br />approval_gate = required<br />corpus = payment-api / loaded</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
