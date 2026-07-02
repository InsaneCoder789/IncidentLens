import type {
  ActionPlan,
  EvalFailure,
  EvalMetric,
  EvidenceItem,
  Hypothesis,
  Incident,
  MetricStat,
  RetrievalResult,
  SettingSectionData,
  TimelineEvent,
  TraceNode,
} from "@/lib/types";

export const metrics: MetricStat[] = [
  { label: "Open Incidents", value: "12", delta: "+2 active", trend: [4, 5, 4, 6, 7, 9, 12], tone: "warning" },
  { label: "Critical Incidents", value: "3", delta: "1 new", trend: [1, 1, 2, 2, 2, 3, 3], tone: "danger" },
  { label: "Average AI Confidence", value: "89%", delta: "+3 pts", trend: [72, 74, 78, 81, 84, 87, 89], tone: "accent" },
  { label: "P95 Investigation Latency", value: "12.4s", delta: "-1.6s", trend: [18, 17, 16, 15, 14, 13, 12], tone: "success" },
  { label: "Eval Pass Rate", value: "95%", delta: "OPS stable", trend: [82, 86, 84, 90, 91, 94, 95], tone: "success" },
];

export const incidents: Incident[] = [
  {
    id: 1,
    title: "Payment API failures after webhook deployment",
    description:
      "Payment success rate dropped after the latest webhook validation deployment. Sentry is reporting SignatureMismatchError and Prometheus shows a sharp increase in 5xx errors.",
    severity: "high",
    status: "investigating",
    affected_service: "payments-api",
    incident_type: "deployment_regression",
    latest_confidence_score: 0.89,
    owner: "payments-oncall",
    created_at: "2026-07-02T06:12:00Z",
    updated_at: "2026-07-02T06:29:00Z",
    resolved_at: null,
    evidence_count: 6,
  },
  {
    id: 2,
    title: "API Error Rate Spike in Prod-East-1",
    description: "Auth-service error rate rose after a traffic shift.",
    severity: "critical",
    status: "open",
    affected_service: "auth-service",
    incident_type: "infra_issue",
    latest_confidence_score: 0.92,
    owner: "identity-oncall",
    created_at: "2026-07-02T03:40:00Z",
    updated_at: "2026-07-02T03:52:00Z",
    resolved_at: null,
    evidence_count: 8,
  },
  {
    id: 3,
    title: "Payment Gateway latency degradation",
    description: "Latency rose in `pay-v4` shortly after rollout.",
    severity: "medium",
    status: "investigating",
    affected_service: "pay-v4",
    incident_type: "performance_degradation",
    latest_confidence_score: 0.78,
    owner: "checkout-sre",
    created_at: "2026-07-02T01:10:00Z",
    updated_at: "2026-07-02T01:34:00Z",
    resolved_at: null,
    evidence_count: 4,
  },
  {
    id: 4,
    title: "Redis cache miss surge",
    description: "Primary shard saturation is driving fallback DB reads.",
    severity: "low",
    status: "open",
    affected_service: "redis-node-2",
    incident_type: "database_issue",
    latest_confidence_score: 0.64,
    owner: "data-platform",
    created_at: "2026-07-01T22:10:00Z",
    updated_at: "2026-07-01T23:05:00Z",
    resolved_at: null,
    evidence_count: 3,
  },
];

export const evidence: EvidenceItem[] = [
  {
    id: 101,
    incident_id: 1,
    source_type: "sentry_issue",
    title: "SignatureMismatchError in payments/webhook.py",
    raw_content:
      "SignatureMismatchError affecting paid users. release v1.42.0. file: payments/webhook.py. stack trace points to signature validation.",
    normalized_content:
      "Sentry reported SignatureMismatchError after release v1.42.0 in payments/webhook.py.",
    metadata_json: { release: "v1.42.0", file: "payments/webhook.py", affectedUsers: 1024 },
    created_at: "2026-07-02T06:17:00Z",
    embedding_status: "completed",
    processing_status: "embedded",
  },
  {
    id: 102,
    incident_id: 1,
    source_type: "github_pr",
    title: "PR #482 changed webhook validation",
    raw_content:
      "PR #482: Enforce strict webhook signature validation. Merged 17 minutes before incident. Changed payments/webhook.py and linked to release v1.42.0.",
    normalized_content: "PR #482 introduced strict validation shortly before the incident.",
    metadata_json: { pr_number: 482, release: "v1.42.0" },
    created_at: "2026-07-02T05:55:00Z",
    embedding_status: "completed",
    processing_status: "embedded",
  },
  {
    id: 103,
    incident_id: 1,
    source_type: "prometheus_metric",
    title: "payments-api error rate spike",
    raw_content: "Error rate increased from 0.2% to 18.4%. P95 latency increased from 240ms to 1800ms.",
    normalized_content: "Prometheus shows error rate and latency rose immediately after release v1.42.0.",
    metadata_json: { error_rate_after: 18.4, p95_after_ms: 1800 },
    created_at: "2026-07-02T06:18:00Z",
    embedding_status: "completed",
    processing_status: "embedded",
  },
  {
    id: 104,
    incident_id: 1,
    source_type: "runbook",
    title: "Payment webhook failure runbook",
    raw_content: "Disable payment_webhook_strict_mode or rollback release when signature mismatch emerges post-deploy.",
    normalized_content: "Runbook points to strict-mode disable or rollback for immediate mitigation.",
    metadata_json: { feature_flag: "payment_webhook_strict_mode" },
    created_at: "2026-07-02T06:19:00Z",
    embedding_status: "completed",
    processing_status: "embedded",
  },
  {
    id: 105,
    incident_id: 1,
    source_type: "previous_incident",
    title: "INC-104 strict validation regression",
    raw_content: "A similar incident was resolved by disabling strict validation after a deploy.",
    normalized_content: "INC-104 provides prior art for this remediation path.",
    metadata_json: { incident_key: "INC-104" },
    created_at: "2026-07-02T06:20:00Z",
    embedding_status: "completed",
    processing_status: "embedded",
  },
  {
    id: 106,
    incident_id: 1,
    source_type: "statuspage",
    title: "Provider status operational",
    raw_content: "Payment provider operational with no concurrent incident.",
    normalized_content: "External provider outage is unlikely.",
    metadata_json: { provider: "Acme Payments", status: "operational" },
    created_at: "2026-07-02T06:21:00Z",
    embedding_status: "completed",
    processing_status: "embedded",
  },
];

export const incidentTimeline: TimelineEvent[] = [
  {
    time: "06:02:41",
    title: "Sentry spike in payments-api",
    description: "SignatureMismatchError crosses alert threshold 4.2x above baseline.",
    tone: "critical",
  },
  {
    time: "06:10:55",
    title: "Webhook release v1.42.0 completed",
    description: "Deployment pipeline finished in `prod-east-1` for `payments-api`.",
    tone: "accent",
  },
  {
    time: "06:17:12",
    title: "Prometheus confirms error-rate surge",
    description: "Error rate 18.4%, p95 latency 1.8s, payment completion sharply down.",
    tone: "warning",
  },
  {
    time: "06:22:09",
    title: "Runbook matched similar regression",
    description: "Strict validation flag identified as fastest non-destructive mitigation.",
    tone: "accent",
  },
];

export const dashboardActivity = [
  "Retrieval agent pulled 12 relevant evidence chunks from logs, GitHub, and Sentry.",
  "Root cause confidence rose from 82% to 89% after runbook and prior-incident evidence matched.",
  "Evaluation suite flagged one low-confidence conclusion in the inventory-service regression case.",
];

export const dashboardHealth = [
  { label: "GitHub", value: "Healthy", tone: "success" },
  { label: "Sentry", value: "Healthy", tone: "success" },
  { label: "Prometheus", value: "Latency 241ms", tone: "warning" },
  { label: "Statuspage", value: "Operational", tone: "success" },
];

export const evidenceSources = [
  { name: "GitHub", subtitle: "PRs and commit diffs", count: "4,281 vectors", status: "Active" },
  { name: "Sentry", subtitle: "Errors and traces", count: "1,024 issues", status: "Live feed" },
  { name: "Prometheus", subtitle: "Time-series metrics", count: "84 targets", status: "Healthy" },
  { name: "Custom Logs", subtitle: "Structured log streams", count: "4 connectors", status: "Processing" },
];

export const retrievalResults: RetrievalResult[] = [
  {
    citationId: "EVID-001",
    sourceType: "github_pr",
    title: "PR #482 changed strict signature validation",
    excerpt: "The new validation path rejects webhook payloads missing the normalized digest format.",
    relevanceScore: 0.96,
  },
  {
    citationId: "EVID-002",
    sourceType: "sentry_issue",
    title: "SignatureMismatchError stack trace",
    excerpt: "Failure occurs in payments/webhook.py after the strict-mode gate, matching the latest deploy.",
    relevanceScore: 0.94,
  },
  {
    citationId: "EVID-003",
    sourceType: "runbook",
    title: "Payment webhook failure mitigation",
    excerpt: "Disable `payment_webhook_strict_mode` or rollback v1.42.0 to restore accepted payload processing.",
    relevanceScore: 0.89,
  },
];

export const hypotheses: Hypothesis[] = [
  {
    id: "H1",
    title: "Webhook validation regression",
    confidence: 0.89,
    summary: "PR #482 introduced stricter webhook signature enforcement and the error spike aligns exactly with release v1.42.0.",
    supportingEvidence: ["EVID-001", "EVID-002", "EVID-003"],
    contradictingEvidence: [],
  },
  {
    id: "H2",
    title: "Provider-side signing format drift",
    confidence: 0.31,
    summary: "A payload format change could explain signature mismatches, but Statuspage shows provider systems operational.",
    supportingEvidence: ["EVID-002"],
    contradictingEvidence: ["EVID-006"],
  },
];

export const actionPlans: ActionPlan[] = [
  {
    id: "safe-1",
    title: "Immediate safe mitigation",
    description: "Disable strict webhook validation flag to restore successful payload acceptance while preserving trace visibility.",
    steps: [
      "Disable `payment_webhook_strict_mode` in prod-east-1.",
      "Watch payment success rate, 5xx rate, and Sentry volume for 15 minutes.",
      "Keep retrieval trace running to compare pre/post metrics.",
    ],
    tone: "safe",
  },
  {
    id: "gate-1",
    title: "Approval-gated rollback",
    description: "Rollback release v1.42.0 if the flag mitigation fails to recover payment completion rate.",
    steps: [
      "Get release manager approval for rollback.",
      "Rollback payments-api to v1.41.8.",
      "Run verification checklist before reopening traffic.",
    ],
    tone: "danger",
  },
];

export const traceNodes: TraceNode[] = [
  {
    id: "intake",
    name: "Intake Agent",
    status: "completed",
    latencyLabel: "420ms",
    tokenLabel: "260",
    model: "GPT-4o",
    toolCalls: 0,
    summary: "Classified incident as deployment regression and selected payments-api.",
  },
  {
    id: "retrieval",
    name: "Retrieval Agent",
    status: "completed",
    latencyLabel: "1.2s",
    tokenLabel: "450",
    model: "GPT-4o",
    toolCalls: 2,
    summary: "Retrieved 12 relevant chunks from logs, Sentry, GitHub, and runbooks.",
  },
  {
    id: "root-cause",
    name: "Root Cause Agent",
    status: "running",
    latencyLabel: "890ms",
    tokenLabel: "300",
    model: "GPT-4o",
    toolCalls: 0,
    summary: "Ranking hypotheses and checking contradictions against external outage evidence.",
  },
  {
    id: "evaluator",
    name: "Evaluation Agent",
    status: "pending",
    latencyLabel: "--",
    tokenLabel: "--",
    model: "mock-llm",
    toolCalls: 0,
    summary: "Waiting for final report output.",
  },
];

export const traceToolCalls = [
  { name: "fetch_logs", status: "success", latency: "520ms" },
  { name: "search_recent_prs", status: "success", latency: "305ms" },
  { name: "search_runbooks", status: "warning", latency: "188ms" },
];

export const evalMetrics: EvalMetric[] = [
  { label: "Retrieval Recall@5", value: "92%", sublabel: "+2.6", tone: "success" },
  { label: "Root Cause Accuracy", value: "88%", sublabel: "+1.3", tone: "accent" },
  { label: "Mean Reciprocal Rank", value: "0.85", sublabel: "+0.07", tone: "accent" },
  { label: "Citation Coverage", value: "95%", sublabel: "-1.2", tone: "warning" },
  { label: "Unsafe Recommendations", value: "0%", sublabel: "within threshold", tone: "success" },
];

export const evalFailures: EvalFailure[] = [
  { incidentId: "#INC-9821-A", timestamp: "2026-07-01 14:22:01", reason: "Missing Evidence", confidence: "12%", action: "Debug trace" },
  { incidentId: "#INC-7001-B", timestamp: "2026-07-01 12:05:44", reason: "Low Confidence", confidence: "54%", action: "Open trace" },
  { incidentId: "#INC-7779-C", timestamp: "2026-06-30 23:12:10", reason: "Context Saturation", confidence: "42%", action: "Debug trace" },
  { incidentId: "#INC-9755-D", timestamp: "2026-06-29 18:44:32", reason: "Missing Evidence", confidence: "15%", action: "Open trace" },
];

export const evalTrend = {
  labels: ["06/26", "06/27", "06/28", "06/29", "06/30", "07/01", "07/02"],
  accuracy: [74, 78, 72, 83, 79, 88, 92],
  latency: [11, 10, 12, 9, 10, 8, 7],
};

export const settingsSections: SettingSectionData[] = [
  {
    title: "Model Configuration",
    description: "Configure the primary reasoning stack for the SRE copilot.",
    fields: [
      { kind: "select", label: "Primary Reasoning Model", value: "GPT-4o (Prod)", options: ["GPT-4o (Prod)", "Claude 3.5 Sonnet", "mock-llm"] },
      { kind: "select", label: "Embedding Model", value: "text-embedding-3-small", options: ["text-embedding-3-small", "all-MiniLM-L6-v2"] },
      { kind: "toggle", label: "Cohere Reranker V3", value: true, description: "Enable semantic reranking of retrieved chunks." },
      { kind: "slider", label: "Temperature", value: 0.2, min: 0, max: 1, step: 0.1 },
      { kind: "input", label: "Max Retrieval Chunks", value: "20", description: "Recommended 5-25 for hidden context." },
    ],
  },
  {
    title: "Operational Controls",
    description: "Guardrails and versioning controls for mock and live runs.",
    fields: [
      { kind: "toggle", label: "Mock Mode", value: false },
      { kind: "select", label: "Prompt Version", value: "v4.2-stable", options: ["v4.2-stable", "v4.3-beta", "v4.1-fallback"] },
      { kind: "toggle", label: "Tracing Enabled", value: true },
      { kind: "select", label: "Fallback Model", value: "GPT-4o-mini", options: ["GPT-4o-mini", "mock-llm", "Claude Haiku"] },
      { kind: "slider", label: "Eval Gate Threshold", value: 0.85, min: 0.5, max: 1, step: 0.05 },
    ],
  },
];

export const llmopsConnections = [
  { name: "Anthropic", subtitle: "Claude-3.5-Sonnet", status: "Connected" },
  { name: "OpenAI", subtitle: "GPT-4o", status: "Connected" },
  { name: "Pinecone", subtitle: "Serverless-East", status: "Connected" },
];

export const missingEvidence = [
  "Exact rollback verification result for release v1.42.0.",
  "Provider-side signature format sample for the first failed payload.",
];

export const dangerousActions = [
  "Rollback payments-api to v1.41.8",
  "Disable strict webhook validation in production",
];
