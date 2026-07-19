import { IncidentsListClient } from "@/components/incidents-list-client";
import { getIncidents } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const incidents = await getIncidents();
  return <IncidentsListClient incidents={incidents} />;
}
