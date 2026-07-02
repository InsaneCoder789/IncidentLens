"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Cpu, Signal, TerminalSquare } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { IncidentTable } from "@/components/incident-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Incident Command</div>
                <div className="mt-1 text-xs text-slate-500">Payments incident is still actively investigating.</div>
              </div>
              <Signal className="h-4 w-4 text-[#b48fff]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardActivity.map((item) => (
              <div key={item} className="rounded-md border border-line bg-[#11161f] px-3 py-3 text-xs leading-5 text-slate-300">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Latest Incidents</div>
                <div className="mt-1 text-xs text-slate-500">Serious engineering dashboard based on the Stitch prototype.</div>
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

        <div className="space-y-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">Integration Health</div>
                <Cpu className="h-4 w-4 text-[#b0c6ff]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardHealth.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-md border border-line bg-[#11161f] px-3 py-2 text-xs">
                  <span className="text-slate-300">{item.label}</span>
                  <span className={item.tone === "warning" ? "text-[#ffb86b]" : "text-[#7ee787]"}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">System Health</div>
                <TerminalSquare className="h-4 w-4 text-[#b0c6ff]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-300">
              <div className="rounded-md border border-line bg-[#11161f] px-3 py-3">Postgres vector index healthy with 1.2M chunks loaded.</div>
              <div className="rounded-md border border-line bg-[#11161f] px-3 py-3">Prompt registry synced with `v4.2-stable` across reasoning and evaluation flows.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
