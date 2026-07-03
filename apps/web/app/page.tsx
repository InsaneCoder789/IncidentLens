"use client";

import { ArrowRight, Cpu, Radar, TerminalSquare } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { IncidentTable } from "@/components/incident-table";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { dashboardActivity, dashboardHealth, incidents, metrics } from "@/lib/mock-data";

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesSearch =
        !search ||
        incident.title.toLowerCase().includes(search.toLowerCase()) ||
        incident.affected_service.toLowerCase().includes(search.toLowerCase());
      const matchesSeverity = !severity || incident.severity === severity;
      const matchesStatus = !status || incident.status === status;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [search, severity, status]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Incident Command</div>
                <div className="mt-1 text-xs text-slate-500">Payments incident remains the highest-priority active workspace.</div>
              </div>
              <Radar className="h-4 w-4 text-[#b0c6ff]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardActivity.map((item) => (
              <div key={item} className="rounded-lg border border-line bg-[#10131b] px-3 py-3 text-xs leading-5 text-slate-300">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">Live Incident Queue</div>
                <div className="mt-1 text-xs text-slate-500">Dashboard route implemented from the Stitch layout as the default landing screen.</div>
              </div>
              <Link href="/incidents">
                <Button variant="secondary" size="sm" className="gap-2">
                  Open queue
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <IncidentTable
              incidents={filteredIncidents}
              search={search}
              onSearch={setSearch}
              severity={severity}
              onSeverity={setSeverity}
              status={status}
              onStatus={setStatus}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">Integration Health</div>
                <Cpu className="h-4 w-4 text-[#b0c6ff]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardHealth.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-line bg-[#10131b] px-3 py-3 text-xs">
                  <span className="text-slate-300">{item.label}</span>
                  <span className={item.tone === "warning" ? "text-[#ffb86b]" : "text-[#7ee787]"}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">Retrieval Console</div>
                <TerminalSquare className="h-4 w-4 text-[#b0c6ff]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="terminal px-4 py-4 font-mono text-[11px] leading-6 text-[#7ee787]">
                search_evidence :: top_k=8 threshold=0.25
                <br />
                chunk_store :: 1 incident corpus loaded
                <br />
                approval_gate :: rollback actions require human sign-off
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
