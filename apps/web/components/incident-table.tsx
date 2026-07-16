"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Incident } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SeverityBadge } from "@/components/severity-badge";
import { StatusBadge } from "@/components/status-badge";
import { Table, TBody, Td, THead, Th, Tr } from "@/components/ui/table";

export function IncidentTable({
  incidents,
  search,
  onSearch,
  severity,
  onSeverity,
  status,
  onStatus,
  selectedId,
  onSelect,
}: {
  incidents: Incident[];
  search: string;
  onSearch: (value: string) => void;
  severity: string;
  onSeverity: (value: string) => void;
  status: string;
  onStatus: (value: string) => void;
  selectedId?: number;
  onSelect?: (incident: Incident) => void;
}) {
  const [service, setService] = useState("");
  const visibleIncidents = useMemo(() => incidents.filter((incident) => !service || incident.affected_service === service), [incidents, service]);
  const services = useMemo(() => Array.from(new Set(incidents.map((incident) => incident.affected_service))), [incidents]);
  return (
    <div className="space-y-3">
      <div className="grid gap-2 lg:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr]">
        <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Filter incidents (e.g. status:open sev:1)" />
        <Select value={severity} onChange={(e) => onSeverity(e.target.value)}>
          <option value="">Severity: All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </Select>
        <Select value={status} onChange={(e) => onStatus(e.target.value)}>
          <option value="">Status: All</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="mitigated">Mitigated</option>
          <option value="resolved">Resolved</option>
        </Select>
        <Select value={service} onChange={(event) => setService(event.target.value)} aria-label="Filter by service">
          <option value="">Service: All</option>
          {services.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
      </div>

      <div className="scrollbar-thin overflow-x-auto rounded-xl border border-line/10">
        <Table>
          <THead>
            <Tr className="bg-bg/60 hover:bg-bg/60">
              <Th className="text-[10px]">Incident Title</Th>
              <Th className="text-[10px]">Severity</Th>
              <Th className="text-[10px]">Status</Th>
              <Th className="text-[10px]">Service</Th>
              <Th className="text-[10px] text-right">AI Confidence</Th>
            </Tr>
          </THead>
          <TBody>
            {visibleIncidents.map((incident) => (
              <Tr key={incident.id} onClick={() => onSelect?.(incident)} className={onSelect ? `cursor-pointer ${selectedId === incident.id ? "bg-accent/[0.055]" : ""}` : undefined}>
                <Td>
                  <Link href={`/incidents/${incident.id}`} className="block">
                    <div className="text-sm font-medium text-text">{incident.title}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">INC-{String(incident.id).padStart(4, "0")}</div>
                  </Link>
                </Td>
                <Td>
                  <SeverityBadge severity={incident.severity} />
                </Td>
                <Td>
                  <StatusBadge status={incident.status} />
                </Td>
                <Td>
                  <Badge className="border-line/10 bg-panel2 text-muted">{incident.affected_service}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="inline-flex items-center gap-2 font-mono text-[11px] text-text">
                    <span>{Math.round((incident.latest_confidence_score ?? 0) * 100)}%</span>
                    <span className="h-1 w-10 rounded-full bg-panel3">
                      <span
                        className="block h-1 rounded-full bg-accent"
                        style={{ width: `${Math.round((incident.latest_confidence_score ?? 0) * 100)}%` }}
                      />
                    </span>
                  </div>
                </Td>
              </Tr>
            ))}
            {!visibleIncidents.length ? <Tr><Td className="py-10 text-center text-sm text-muted" colSpan={5}>No incidents match the current filters.</Td></Tr> : null}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
