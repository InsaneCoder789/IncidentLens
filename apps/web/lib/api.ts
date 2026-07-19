import type {
  ApprovalRequest,
  DashboardData,
  EvidenceChunk,
  EvidenceItem,
  EvidenceProcessResponse,
  EvidenceUploadResponse,
  EvalRun,
  EvalRunTriggerResponse,
  Incident,
  IncidentCreate,
  IncidentEvent,
  IncidentReport,
  IncidentTrace,
  IncidentUpdate,
  IntegrationHealth,
  IntegrationImportResponse,
  InvestigationRunResponse,
  Job,
  LlmopsOverview,
  ProcessAllEvidenceResponse,
  RetrievalSearchRequest,
  RetrievalSearchResponse,
  RuntimeSettings,
} from "@/lib/types";

const SERVER_API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const CLIENT_API_URL = "/api/backend";
const API_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function apiUrl(path: string): string {
  return `${typeof window === "undefined" ? SERVER_API_URL : CLIENT_API_URL}${path}`;
}

async function requestJson<T>(path: string, init?: RequestInit, timeoutMs = API_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const serverToken = typeof window === "undefined" ? process.env.BACKEND_API_TOKEN : undefined;

  try {
    const response = await fetch(apiUrl(path), {
      ...init,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(serverToken ? { Authorization: `Bearer ${serverToken}` } : {}),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
      throw new ApiError(payload?.detail ?? `Request failed with status ${response.status}`, response.status);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("The API request timed out", 504);
    }
    throw new ApiError("The IncidentLens API is unavailable", 503);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getIncidents(): Promise<Incident[]> {
  return requestJson<Incident[]>("/api/incidents");
}

export async function createIncident(payload: IncidentCreate): Promise<Incident> {
  return requestJson<Incident>("/api/incidents", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateIncident(id: number, payload: IncidentUpdate): Promise<Incident> {
  return requestJson<Incident>(`/api/incidents/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteIncident(id: number): Promise<void> {
  return requestJson<void>(`/api/incidents/${id}`, { method: "DELETE" });
}

export async function getDashboard(): Promise<DashboardData> {
  return requestJson<DashboardData>("/api/dashboard");
}

export async function getIncidentEvents(id: number): Promise<IncidentEvent[]> {
  return requestJson<IncidentEvent[]>(`/api/incidents/${id}/events`);
}

export async function getApprovals(id: number): Promise<ApprovalRequest[]> {
  return requestJson<ApprovalRequest[]>(`/api/incidents/${id}/approvals`);
}

export async function requestApproval(id: number, action: string, rationale = ""): Promise<ApprovalRequest> {
  return requestJson<ApprovalRequest>(`/api/incidents/${id}/approvals`, {
    method: "POST",
    body: JSON.stringify({ action, rationale }),
  });
}

export async function decideApproval(
  approvalId: string,
  decision: "approved" | "rejected" | "cancelled",
  expectedVersion: number,
  decisionNote = "",
): Promise<ApprovalRequest> {
  return requestJson<ApprovalRequest>(`/api/approvals/${approvalId}`, {
    method: "PATCH",
    body: JSON.stringify({ decision, decision_note: decisionNote, expected_version: expectedVersion }),
  });
}

export async function getIncident(id: number): Promise<Incident | undefined> {
  try {
    return await requestJson<Incident>(`/api/incidents/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

export async function getIncidentEvidence(id: number): Promise<EvidenceItem[]> {
  return requestJson<EvidenceItem[]>(`/api/incidents/${id}/evidence`);
}

export async function getIncidentChunks(id: number): Promise<EvidenceChunk[]> {
  return requestJson<EvidenceChunk[]>(`/api/incidents/${id}/chunks`);
}

export async function processEvidence(evidenceId: number): Promise<EvidenceProcessResponse> {
  return requestJson<EvidenceProcessResponse>(`/api/evidence/${evidenceId}/process`, { method: "POST" });
}

export async function uploadEvidence(
  incidentId: number,
  file: File,
  options?: {
    title?: string;
    description?: string;
    sourceType?: string;
    processImmediately?: boolean;
    onProgress?: (progress: number) => void;
  },
): Promise<EvidenceUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (options?.title) formData.append("title", options.title);
  if (options?.description) formData.append("description", options.description);
  if (options?.sourceType) formData.append("source_type", options.sourceType);
  formData.append("process_immediately", String(options?.processImmediately ?? true));

  if (typeof XMLHttpRequest === "undefined") {
    return requestJson<EvidenceUploadResponse>(
      `/api/incidents/${incidentId}/evidence/upload`,
      { method: "POST", body: formData },
      60_000,
    );
  }

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", apiUrl(`/api/incidents/${incidentId}/evidence/upload`));
    request.timeout = 60_000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) options?.onProgress?.(Math.round((event.loaded / event.total) * 90));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        options?.onProgress?.(100);
        resolve(JSON.parse(request.responseText) as EvidenceUploadResponse);
        return;
      }
      try {
        const payload = JSON.parse(request.responseText) as { detail?: string };
        reject(new ApiError(payload.detail ?? `Upload failed with status ${request.status}`, request.status));
      } catch {
        reject(new ApiError(`Upload failed with status ${request.status}`, request.status));
      }
    };
    request.onerror = () => reject(new ApiError("Could not reach the evidence API", 503));
    request.ontimeout = () => reject(new ApiError("Evidence upload timed out", 504));
    request.send(formData);
  });
}

export function evidenceFileUrl(evidenceId: number): string {
  return `${CLIENT_API_URL}/api/evidence/${evidenceId}/file`;
}

export async function processAllEvidence(incidentId: number): Promise<ProcessAllEvidenceResponse> {
  const job = await requestJson<Job>(`/api/incidents/${incidentId}/evidence-jobs`, {
    method: "POST",
    headers: { "Idempotency-Key": `evidence:${incidentId}:${crypto.randomUUID()}` },
  });
  const completed = await waitForJob(job.id);
  return {
    incident_id: incidentId,
    processed: Number(completed.result_json.processed),
    failed: Number(completed.result_json.failed),
    chunks_created: Number(completed.result_json.chunks_created),
  };
}

export async function searchEvidence(payload: RetrievalSearchRequest): Promise<RetrievalSearchResponse> {
  return requestJson<RetrievalSearchResponse>("/api/retrieval/search", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function runInvestigation(incidentId: number): Promise<InvestigationRunResponse> {
  const job = await requestJson<Job>(`/api/incidents/${incidentId}/investigation-jobs`, {
    method: "POST",
    headers: { "Idempotency-Key": `investigation:${incidentId}:${crypto.randomUUID()}` },
  });
  const completed = await waitForJob(job.id);
  return {
    incident_id: String(incidentId),
    status: completed.status,
    report_id: String(completed.result_json.report_id),
    selected_root_cause: String(completed.result_json.selected_root_cause),
    confidence_score: Number(completed.result_json.confidence_score),
    quality_score: Number(completed.result_json.quality_score),
  };
}

export async function getJob(jobId: string): Promise<Job> {
  return requestJson<Job>(`/api/jobs/${jobId}`);
}

export async function cancelJob(jobId: string): Promise<Job> {
  return requestJson<Job>(`/api/jobs/${jobId}/cancel`, { method: "POST" });
}

async function waitForJob(jobId: string, timeoutMs = 300_000): Promise<Job> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const job = await getJob(jobId);
    if (job.status === "completed") return job;
    if (job.status === "failed" || job.status === "cancelled") {
      throw new ApiError(job.error_message ?? `Job ${job.status}`, 409);
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new ApiError("Job did not complete before the client timeout; it remains visible in the job ledger", 504);
}

export async function getIncidentReport(incidentId: number): Promise<IncidentReport | undefined> {
  try {
    return await requestJson<IncidentReport>(`/api/incidents/${incidentId}/report`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

export async function getIncidentTrace(incidentId: number): Promise<IncidentTrace> {
  return requestJson<IncidentTrace>(`/api/incidents/${incidentId}/trace`);
}

export async function getIntegrationHealth(): Promise<IntegrationHealth[]> {
  return requestJson<IntegrationHealth[]>("/api/integrations/health");
}

export async function importIntegrationEvidence(incidentId: number, integrationKey: string): Promise<IntegrationImportResponse> {
  return requestJson<IntegrationImportResponse>(`/api/integrations/${integrationKey}/incidents/${incidentId}/import`, {
    method: "POST",
  });
}

export async function getEvalRuns(): Promise<EvalRun[]> {
  return requestJson<EvalRun[]>("/api/evals/history");
}

export async function runEvalSuite(): Promise<EvalRunTriggerResponse> {
  const job = await requestJson<Job>("/api/evaluation-jobs", {
    method: "POST",
    headers: { "Idempotency-Key": `evaluation:${crypto.randomUUID()}` },
  });
  const completed = await waitForJob(job.id);
  const runId = String(completed.result_json.eval_run_id);
  const run = (await getEvalRuns()).find((candidate) => candidate.id === runId);
  if (!run) throw new ApiError("The completed evaluation run could not be loaded", 500);
  return { status: "completed", run };
}

export async function getLlmopsOverview(): Promise<LlmopsOverview> {
  return requestJson<LlmopsOverview>("/api/llmops/overview");
}

export async function getRuntimeSettings(): Promise<RuntimeSettings> {
  return requestJson<RuntimeSettings>("/api/settings");
}

export async function updateRuntimeSettings(payload: Partial<RuntimeSettings>): Promise<RuntimeSettings> {
  return requestJson<RuntimeSettings>("/api/settings", { method: "PATCH", body: JSON.stringify(payload) });
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
