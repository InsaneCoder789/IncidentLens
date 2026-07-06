import type {
  EvidenceChunk,
  EvidenceItem,
  EvidenceProcessResponse,
  EvalRun,
  EvalRunTriggerResponse,
  IncidentReport,
  IncidentTrace,
  IntegrationHealth,
  IntegrationImportResponse,
  Incident,
  LlmopsOverview,
  InvestigationRunResponse,
  ProcessAllEvidenceResponse,
  RetrievalSearchRequest,
  RetrievalSearchResponse,
} from "@/lib/types";
import {
  evidence as mockEvidence,
  incidentChunks as mockIncidentChunks,
  incidents as mockIncidents,
  mockIncidentReport,
  mockIncidentTrace,
  mockInvestigationRun,
  retrievalResults as mockRetrievalResults,
} from "@/lib/mock-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_TIMEOUT_MS = 1200;

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return (await response.json()) as T;
  } catch {
    throw new Error("API unavailable");
  } finally {
    clearTimeout(timeoutId);
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

export async function runInvestigation(incidentId: number): Promise<InvestigationRunResponse> {
  try {
    return await requestJson<InvestigationRunResponse>(`/api/incidents/${incidentId}/investigate`, { method: "POST" });
  } catch {
    return mockInvestigationRun;
  }
}

export async function getIncidentReport(incidentId: number): Promise<IncidentReport | undefined> {
  try {
    return await requestJson<IncidentReport>(`/api/incidents/${incidentId}/report`);
  } catch {
    return Number(mockIncidentReport.incident_id) === incidentId ? mockIncidentReport : undefined;
  }
}

export async function getIncidentTrace(incidentId: number): Promise<IncidentTrace> {
  try {
    return await requestJson<IncidentTrace>(`/api/incidents/${incidentId}/trace`);
  } catch {
    return mockIncidentTrace;
  }
}

export async function getIntegrationHealth(): Promise<IntegrationHealth[]> {
  try {
    return await requestJson<IntegrationHealth[]>("/api/integrations/health");
  } catch {
    return [
      {
        key: "github",
        label: "GitHub",
        status: "healthy",
        detail: "Mock PR and deployment history are available.",
        source_types: ["github_pr", "github_commit"],
      },
      {
        key: "sentry",
        label: "Sentry",
        status: "healthy",
        detail: "SignatureMismatchError traces are indexed for the seeded incident.",
        source_types: ["sentry_issue"],
      },
      {
        key: "prometheus",
        label: "Prometheus",
        status: "healthy",
        detail: "Error-rate and latency snapshots are available.",
        source_types: ["prometheus_metric"],
      },
      {
        key: "statuspage",
        label: "Statuspage",
        status: "healthy",
        detail: "Provider availability feed is operational.",
        source_types: ["statuspage"],
      },
      {
        key: "runbook",
        label: "Runbook Search",
        status: "healthy",
        detail: "Runbook and prior-incident knowledge is available.",
        source_types: ["runbook", "previous_incident"],
      },
    ];
  }
}

export async function importIntegrationEvidence(incidentId: number, integrationKey: string): Promise<IntegrationImportResponse> {
  try {
    return await requestJson<IntegrationImportResponse>(`/api/integrations/${integrationKey}/incidents/${incidentId}/import`, {
      method: "POST",
    });
  } catch {
    return {
      incident_id: incidentId,
      integration_key: integrationKey,
      imported: 1,
      updated: 0,
    };
  }
}

export async function getEvalRuns(): Promise<EvalRun[]> {
  try {
    return await requestJson<EvalRun[]>("/api/evals/history");
  } catch {
    return [];
  }
}

export async function runEvalSuite(): Promise<EvalRunTriggerResponse> {
  return requestJson<EvalRunTriggerResponse>("/api/evals/run", { method: "POST" });
}

export async function getLlmopsOverview(): Promise<LlmopsOverview | null> {
  try {
    return await requestJson<LlmopsOverview>("/api/llmops/overview");
  } catch {
    return null;
  }
}

export function traceSummary(trace: IncidentTrace): { totalLatencyMs: number; totalCostUsd: number; completed: number; failed: number } {
  return trace.agent_runs.reduce(
    (accumulator, run) => {
      accumulator.totalLatencyMs += run.latency_ms;
      accumulator.totalCostUsd += run.estimated_cost_usd;
      if (run.status === "completed") accumulator.completed += 1;
      if (run.status === "failed") accumulator.failed += 1;
      return accumulator;
    },
    { totalLatencyMs: 0, totalCostUsd: 0, completed: 0, failed: 0 },
  );
}
