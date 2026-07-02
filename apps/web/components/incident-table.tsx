"use client";

import Link from "next/link";
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
}: {
  incidents: Incident[];
  search: string;
  onSearch: (value: string) => void;
  severity: string;
  onSeverity: (value: string) => void;
  status: string;
  onStatus: (value: string) => void;
}) {
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
        <Select defaultValue="">
          <option value="">Service: All</option>
          <option value="payments-api">payments-api</option>
          <option value="auth-service">auth-service</option>
          <option value="pay-v4">pay-v4</option>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-line">
        <Table>
          <THead>
            <Tr className="bg-[#0f131c] hover:bg-[#0f131c]">
              <Th className="text-[10px]">Incident Title</Th>
              <Th className="text-[10px]">Severity</Th>
              <Th className="text-[10px]">Status</Th>
              <Th className="text-[10px]">Service</Th>
              <Th className="text-[10px] text-right">AI Confidence</Th>
            </Tr>
          </THead>
          <TBody>
            {incidents.map((incident) => (
              <Tr key={incident.id}>
                <Td>
                  <Link href={`/incidents/${incident.id}`} className="block">
                    <div className="text-sm font-medium text-white">{incident.title}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">INC-{String(incident.id).padStart(4, "0")}</div>
                  </Link>
                </Td>
                <Td>
                  <SeverityBadge severity={incident.severity} />
                </Td>
                <Td>
                  <StatusBadge status={incident.status} />
                </Td>
                <Td>
                  <Badge className="border-line bg-[#171b24] text-slate-300">{incident.affected_service}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="inline-flex items-center gap-2 text-xs text-slate-300">
                    <span>{Math.round((incident.latest_confidence_score ?? 0) * 100)}%</span>
                    <span className="h-1.5 w-10 rounded-full bg-[#232833]">
                      <span
                        className="block h-1.5 rounded-full bg-[#b0c6ff]"
                        style={{ width: `${Math.round((incident.latest_confidence_score ?? 0) * 100)}%` }}
                      />
                    </span>
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
