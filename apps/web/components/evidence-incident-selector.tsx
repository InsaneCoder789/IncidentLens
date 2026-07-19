"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import type { Incident } from "@/lib/types";

export function EvidenceIncidentSelector({ incidents, activeIncidentId }: { incidents: Incident[]; activeIncidentId: number }) {
  const router = useRouter();
  return (
    <Select
      aria-label="Evidence incident"
      value={String(activeIncidentId)}
      onChange={(event) => router.push(`/evidence?incident=${event.target.value}`)}
      className="w-full sm:w-80"
    >
      {incidents.map((incident) => (
        <option key={incident.id} value={incident.id}>{`INC-${String(incident.id).padStart(4, "0")} / ${incident.title}`}</option>
      ))}
    </Select>
  );
}
