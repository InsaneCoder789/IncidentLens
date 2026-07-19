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

export type IncidentCreate = Pick<Incident, "title" | "description" | "severity" | "status" | "affected_service" | "incident_type" | "owner">;
export type IncidentUpdate = Partial<IncidentCreate>;

export type IncidentEvent = {
  id: string;
  incident_id: number;
  event_type: string;
  title: string;
  description: string;
  actor: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type ApprovalRequest = {
  id: string;
  incident_id: number;
  action: string;
  rationale: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requested_by: string;
  reviewed_by: string | null;
  decision_note: string | null;
  version: number;
  created_at: string;
  reviewed_at: string | null;
};

export type DashboardData = {
  incidents: Incident[];
  metrics: Array<{ label: string; value: string; detail: string; tone: "neutral" | "warning" | "danger" | "accent" | "success" }>;
  recent_events: IncidentEvent[];
  pending_approvals: number;
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

export type EvidenceUploadResponse = {
  evidence: EvidenceItem;
  processing: EvidenceProcessResponse | null;
  upload_status: "uploaded" | "processed";
};

export type ProcessAllEvidenceResponse = {
  incident_id: number;
  processed: number;
  failed: number;
  chunks_created: number;
};

export type IntegrationHealth = {
  key: string;
  label: string;
  status: string;
  detail: string;
  source_types: string[];
};

export type IntegrationImportResponse = {
  incident_id: number;
  integration_key: string;
  imported: number;
  updated: number;
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
  metadata_filters?: Record<string, string | number | boolean>;
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

export type ToolCallSummary = {
  name: string;
  status: "success" | "queued" | "warning";
  latency: string;
};

export type AgentRun = {
  id: string;
  agent_name: string;
  status: "pending" | "running" | "completed" | "failed";
  input_summary: string;
  output_summary: string;
  model_name: string;
  prompt_version: string;
  latency_ms: number;
  token_input: number;
  token_output: number;
  estimated_cost_usd: number;
  started_at: string;
  completed_at?: string | null;
  error_message?: string | null;
};

export type ToolCall = {
  id: string;
  agent_run_id: string;
  tool_name: string;
  status: "completed" | "failed";
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  latency_ms: number;
  created_at: string;
  error_message?: string | null;
};

export type IncidentReport = {
  incident_id: string;
  report_id: string;
  report_markdown: string;
  selected_root_cause: string;
  confidence_score: number;
  evaluation_score: number;
  analysis_json: {
    hypotheses?: Array<{
      title: string;
      confidence: number;
      supporting_evidence: string[];
      contradicting_evidence: string[];
      reasoning_summary: string;
    }>;
    missing_evidence?: string[];
    remediation_plan?: Record<string, unknown> | null;
    evaluation?: Record<string, unknown> | null;
  };
  created_at: string;
};

export type InvestigationRunResponse = {
  incident_id: string;
  status: string;
  report_id: string;
  selected_root_cause: string;
  confidence_score: number;
  quality_score: number;
};

export type Job = {
  id: string;
  kind: string;
  incident_id: number | null;
  status: "queued" | "running" | "cancellation_requested" | "cancelled" | "completed" | "failed";
  progress: number;
  result_json: Record<string, unknown>;
  error_message: string | null;
  attempts: number;
  max_attempts: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

export type IncidentTrace = {
  incident_id: string;
  agent_runs: AgentRun[];
  tool_calls: ToolCall[];
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

export type EvalRun = {
  id: string;
  dataset_name: string;
  recall_at_5: number;
  recall_at_10: number;
  mrr: number;
  root_cause_accuracy: number;
  citation_coverage: number;
  unsupported_claim_rate: number;
  unsafe_action_rate: number;
  avg_latency_ms: number;
  avg_cost_usd: number;
  summary_json: Record<string, unknown>;
  failed_cases_json: EvalFailure[];
  created_at: string;
};

export type EvalRunTriggerResponse = {
  status: string;
  run: EvalRun;
};

export type PromptVersionSummary = {
  name: string;
  version: string;
};

export type LlmopsOverview = {
  provider_configured: boolean;
  reasoning_model_primary: string;
  reasoning_model_fallback: string;
  embedding_model_name: string;
  tracing_enabled: boolean;
  cost_tracking_enabled: boolean;
  prompt_versioning_enabled: boolean;
  generation_temperature: number;
  generation_max_tokens: number;
  integration_status_summary: Record<string, number>;
  latest_eval_summary: Record<string, string | number>;
  prompt_versions: PromptVersionSummary[];
};

export type RuntimeSettings = {
  reasoning_model_primary: string;
  reasoning_model_fallback: string;
  embedding_model_name: string;
  tracing_enabled: boolean;
  cost_tracking_enabled: boolean;
  prompt_versioning_enabled: boolean;
  generation_temperature: number;
  generation_max_tokens: number;
  monthly_cost_limit_usd: number;
  eval_root_cause_threshold: number;
  eval_citation_threshold: number;
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
