import type {
  EvidenceChunk,
  EvidenceItem,
  EvidenceProcessResponse,
  Incident,
  ProcessAllEvidenceResponse,
  RetrievalSearchRequest,
  RetrievalSearchResponse,
} from "@/lib/types";
import {
  evidence as mockEvidence,
  incidentChunks as mockIncidentChunks,
  incidents as mockIncidents,
  retrievalResults as mockRetrievalResults,
} from "@/lib/mock-data";

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

function mockSearchResults(request: RetrievalSearchRequest): RetrievalSearchResponse {
  const query = request.query.toLowerCase();
  const results = mockRetrievalResults.filter((item) => {
    const haystack = `${item.title} ${item.content} ${item.source_type}`.toLowerCase();
    const matchesQuery = query.length === 0 || haystack.includes(query);
    const matchesSource = !request.source_types?.length || request.source_types.includes(item.source_type);
    const matchesMetadata =
      !request.metadata_filters ||
      Object.entries(request.metadata_filters).every(([key, value]) => String(item.metadata[key]) === String(value));
    return matchesQuery && matchesSource && matchesMetadata;
  });
  return { query: request.query, results: results.slice(0, request.top_k ?? 8) };
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
    return await requestJson<Incident>(`/api/incidents/${id}`);
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

export async function getIncidentChunks(id: number): Promise<EvidenceChunk[]> {
  try {
    return await requestJson<EvidenceChunk[]>(`/api/incidents/${id}/chunks`);
  } catch {
    return mockIncidentChunks.filter((item) => item.incident_id === id);
  }
}

export async function processEvidence(evidenceId: number): Promise<EvidenceProcessResponse> {
  try {
    return await requestJson<EvidenceProcessResponse>(`/api/evidence/${evidenceId}/process`, { method: "POST" });
  } catch {
    return {
      evidence_id: evidenceId,
      status: "completed",
      chunks_created: 3,
      embedding_status: "completed",
    };
  }
}

export async function processAllEvidence(incidentId: number): Promise<ProcessAllEvidenceResponse> {
  try {
    return await requestJson<ProcessAllEvidenceResponse>(`/api/incidents/${incidentId}/evidence/process-all`, { method: "POST" });
  } catch {
    const related = mockEvidence.filter((item) => item.incident_id === incidentId);
    return {
      incident_id: incidentId,
      processed: related.length,
      failed: 0,
      chunks_created: related.length * 2,
    };
  }
}

export async function searchEvidence(payload: RetrievalSearchRequest): Promise<RetrievalSearchResponse> {
  try {
    return await requestJson<RetrievalSearchResponse>("/api/retrieval/search", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    return mockSearchResults(payload);
  }
}
