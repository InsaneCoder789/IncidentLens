import type { EvidenceItem, Incident } from "@/lib/types";
import { evidence as mockEvidence, incidents as mockIncidents } from "@/lib/mock-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return (await response.json()) as T;
  } catch {
    throw new Error("API unavailable");
  }
}

export async function getIncidents(): Promise<Incident[]> {
  try {
    return await requestJson<Incident[]>("/api/incidents");
  } catch {
    return mockIncidents;
  }
}

export async function getIncident(id: number): Promise<Incident | undefined> {
  try {
    const incidents = await requestJson<Incident[]>(`/api/incidents`);
    return incidents.find((incident) => incident.id === id);
  } catch {
    return mockIncidents.find((incident) => incident.id === id);
  }
}

export async function getIncidentEvidence(id: number): Promise<EvidenceItem[]> {
  try {
    return await requestJson<EvidenceItem[]>(`/api/incidents/${id}/evidence`);
  } catch {
    return mockEvidence.filter((item) => item.incident_id === id);
  }
}

