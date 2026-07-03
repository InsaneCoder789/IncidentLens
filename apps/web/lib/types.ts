export type Severity = "low" | "medium" | "high" | "critical";
export type Status = "open" | "investigating" | "mitigated" | "resolved" | "postmortem_ready";
export type IncidentType =
  | "deployment_regression"
  | "database_issue"
  | "auth_failure"
  | "third_party_outage"
  | "infra_issue"
  | "performance_degradation"
  | "security_suspicious"
  | "frontend_bug"
  | "unknown";

export type Incident = {
  id: number;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  affected_service: string;
  incident_type: IncidentType;
  latest_confidence_score: number | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  evidence_count: number;
};

export type EvidenceItem = {
  id: number;
  incident_id: number;
  source_type: string;
  title: string;
  raw_content: string;
  normalized_content: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  embedding_status: string;
  processing_status: string;
};

export type EvidenceChunk = {
  id: number;
  evidence_item_id: number;
  incident_id: number;
  chunk_index: number;
  citation_id: string;
  content: string;
  token_count: number;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type EvidenceProcessResponse = {
  evidence_id: number;
  status: string;
  chunks_created: number;
  embedding_status: string;
};

export type ProcessAllEvidenceResponse = {
  incident_id: number;
  processed: number;
  failed: number;
  chunks_created: number;
};

export type MetricStat = {
  label: string;
  value: string;
  delta: string;
  trend: number[];
  tone?: "neutral" | "warning" | "danger" | "accent" | "success";
};

export type TimelineEvent = {
  time: string;
  title: string;
  description: string;
  tone?: "critical" | "warning" | "accent" | "neutral";
};

export type Hypothesis = {
  id: string;
  title: string;
  confidence: number;
  summary: string;
  supportingEvidence: string[];
  contradictingEvidence: string[];
};

export type ActionPlan = {
  id: string;
  title: string;
  description: string;
  steps: string[];
  tone?: "safe" | "warning" | "danger";
};

export type RetrievalResult = {
  citation_id: string;
  source_type: string;
  title: string;
  content: string;
  relevance_score: number;
  metadata: Record<string, unknown>;
};

export type RetrievalSearchRequest = {
  incident_id: number;
  query: string;
  source_types?: string[];
  top_k?: number;
  score_threshold?: number;
};

export type RetrievalSearchResponse = {
  query: string;
  results: RetrievalResult[];
};

export type TraceNode = {
  id: string;
  name: string;
  status: "completed" | "running" | "pending";
  latencyLabel: string;
  tokenLabel: string;
  model: string;
  toolCalls: number;
  summary: string;
};

export type ToolCall = {
  name: string;
  status: "success" | "queued" | "warning";
  latency: string;
};

export type EvidenceSourceSummary = {
  name: string;
  subtitle: string;
  count: string;
  status: string;
};

export type ConnectionHealth = {
  name: string;
  subtitle: string;
  status: string;
};

export type EvalMetric = {
  label: string;
  value: string;
  sublabel: string;
  tone?: "accent" | "warning" | "danger" | "success";
};

export type EvalFailure = {
  incidentId: string;
  timestamp: string;
  reason: string;
  confidence: string;
  action: string;
};

export type SettingField =
  | {
      kind: "select";
      label: string;
      value: string;
      description?: string;
      options: string[];
    }
  | {
      kind: "toggle";
      label: string;
      value: boolean;
      description?: string;
    }
  | {
      kind: "slider";
      label: string;
      value: number;
      min: number;
      max: number;
      step: number;
      description?: string;
    }
  | {
      kind: "input";
      label: string;
      value: string;
      description?: string;
    };

export type SettingSectionData = {
  title: string;
  description: string;
  fields: SettingField[];
};
