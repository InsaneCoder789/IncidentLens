import type {
  ActionPlan,
  ConnectionHealth,
  EvalFailure,
  EvalMetric,
  EvidenceChunk,
  EvidenceItem,
  EvidenceSourceSummary,
  Hypothesis,
  IncidentReport,
  IncidentTrace,
  Incident,
  InvestigationRunResponse,
  MetricStat,
  RetrievalResult,
  SettingSectionData,
  TimelineEvent,
  ToolCallSummary,
  TraceNode,
} from "@/lib/types";

export const metrics: MetricStat[] = [
  { label: "Open incidents", value: "12", delta: "+2 today", trend: [4, 5, 4, 6, 7, 9, 12], tone: "warning" },
  { label: "Critical active", value: "3", delta: "1 new", trend: [1, 1, 2, 2, 2, 3, 3], tone: "danger" },
  { label: "AI confidence", value: "89%", delta: "+7 pts", trend: [71, 73, 77, 80, 84, 86, 89], tone: "accent" },
  { label: "Mean time to hypothesis", value: "12.4s", delta: "-1.6s", trend: [19, 18, 17, 15, 14, 13, 12], tone: "success" },
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
    title: "Auth token refresh failures in prod-east-1",
    description: "Identity refresh endpoint returns elevated 401s after cache rotation.",
    severity: "critical",
    status: "open",
    affected_service: "auth-service",
    incident_type: "infra_issue",
    latest_confidence_score: 0.82,
    owner: "identity-oncall",
    created_at: "2026-07-02T03:40:00Z",
    updated_at: "2026-07-02T03:52:00Z",
    resolved_at: null,
    evidence_count: 8,
  },
  {
    id: 3,
    title: "Checkout latency regression in pay-v4",
    description: "Latency rose after rollout and retry volume doubled.",
    severity: "medium",
    status: "investigating",
    affected_service: "pay-v4",
    incident_type: "performance_degradation",
    latest_confidence_score: 0.74,
    owner: "checkout-sre",
    created_at: "2026-07-02T01:10:00Z",
    updated_at: "2026-07-02T01:34:00Z",
    resolved_at: null,
    evidence_count: 4,
  },
  {
    id: 4,
    title: "Redis cache miss surge on shard-2",
    description: "Primary shard saturation is driving fallback reads to Postgres.",
    severity: "low",
    status: "mitigated",
    affected_service: "redis-node-2",
    incident_type: "database_issue",
    latest_confidence_score: 0.63,
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
      "Sentry trace shows SignatureMismatchError after release v1.42.0. file=payments/webhook.py. first_seen=17m after deploy. users impacted=1240.",
    normalized_content:
      "Sentry reported SignatureMismatchError after release v1.42.0 in payments/webhook.py. Failures began 17 minutes after deployment and impacted paid users.",
    metadata_json: { release: "v1.42.0", file: "payments/webhook.py", affected_users: 1240 },
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
      "PR #482 enforces strict webhook signature validation. Changed payments/webhook.py and serializer normalization logic. Merged 17 minutes before the incident.",
    normalized_content:
      "PR #482 introduced strict webhook signature validation and normalization changes shortly before the incident window.",
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
    raw_content:
      "5xx error rate increased from 0.2% to 18.4%. P95 latency increased from 240ms to 1800ms. Payment completion rate dropped 37% within the same window.",
    normalized_content:
      "Prometheus confirms error rate and latency rose immediately after release v1.42.0, with degraded payment completion.",
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
    raw_content:
      "If signature mismatch appears post-deploy, disable payment_webhook_strict_mode or rollback the release. Verify with payment completion, 5xx rate, and dead-letter queue depth.",
    normalized_content:
      "Runbook recommends disabling the strict mode flag first, then rolling back if the success rate does not recover.",
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
    raw_content:
      "A similar incident in March was caused by strict validation rejecting legitimate payloads. Mitigation was to disable the flag and patch canonicalization.",
    normalized_content:
      "INC-104 provides a close historical match and points to the same remediation path.",
    metadata_json: { incident_key: "INC-104" },
    created_at: "2026-07-02T06:20:00Z",
    embedding_status: "completed",
    processing_status: "embedded",
  },
  {
    id: 106,
    incident_id: 1,
    source_type: "statuspage",
    title: "Payment provider status operational",
    raw_content: "Provider status operational. No upstream degradation reported during the incident window.",
    normalized_content:
      "Statuspage did not report a provider outage, reducing the likelihood of an external dependency failure.",
    metadata_json: { provider: "Acme Payments", status: "operational" },
    created_at: "2026-07-02T06:21:00Z",
    embedding_status: "completed",
    processing_status: "embedded",
  },
];

export const incidentChunks: EvidenceChunk[] = [
  {
    id: 201,
    evidence_item_id: 101,
    incident_id: 1,
    chunk_index: 0,
    citation_id: "EVID-001",
    content: "SignatureMismatchError began 17 minutes after release v1.42.0. The stack trace points to payments/webhook.py strict validation path.",
    token_count: 26,
    metadata_json: { evidence_title: "SignatureMismatchError in payments/webhook.py" },
    created_at: "2026-07-02T06:22:00Z",
  },
  {
    id: 202,
    evidence_item_id: 102,
    incident_id: 1,
    chunk_index: 0,
    citation_id: "EVID-002",
    content: "PR #482 introduced stricter webhook signature validation and payload normalization changes just before deployment.",
    token_count: 21,
    metadata_json: { evidence_title: "PR #482 changed webhook validation" },
    created_at: "2026-07-02T06:22:10Z",
  },
  {
    id: 203,
    evidence_item_id: 104,
    incident_id: 1,
    chunk_index: 0,
    citation_id: "EVID-003",
    content: "Runbook mitigation recommends disabling payment_webhook_strict_mode or rolling back if mismatch appears immediately after deploy.",
    token_count: 23,
    metadata_json: { evidence_title: "Payment webhook failure runbook" },
    created_at: "2026-07-02T06:22:20Z",
  },
];

export const incidentTimeline: TimelineEvent[] = [
  {
    time: "06:02:41",
    title: "Sentry spike in payments-api",
    description: "SignatureMismatchError crossed the alert threshold at 4.2x baseline.",
    tone: "critical",
  },
  {
    time: "06:10:55",
    title: "Release v1.42.0 completed",
    description: "Deployment pipeline finished in prod-east-1 for payments-api.",
    tone: "accent",
  },
  {
    time: "06:17:12",
    title: "Prometheus confirms error-rate surge",
    description: "Error rate 18.4%, P95 latency 1.8s, payment completion sharply down.",
    tone: "warning",
  },
  {
    time: "06:22:09",
    title: "Runbook matched prior regression",
    description: "Strict validation flag identified as the fastest non-destructive mitigation.",
    tone: "accent",
  },
];

export const dashboardActivity = [
  "Retrieval agent pulled 12 relevant evidence chunks from logs, GitHub, Sentry, and runbooks.",
  "Root cause confidence rose from 82% to 89% after prior-incident evidence matched the same mitigation path.",
  "Evaluation suite flagged one low-confidence recommendation in the inventory-service regression set.",
];

export const dashboardHealth = [
  { label: "GitHub", value: "Healthy", tone: "success" },
  { label: "Sentry", value: "Healthy", tone: "success" },
  { label: "Prometheus", value: "Latency 241ms", tone: "warning" },
  { label: "Statuspage", value: "Operational", tone: "success" },
];

export const evidenceSources: EvidenceSourceSummary[] = [
  { name: "GitHub", subtitle: "PRs, commits, and diffs", count: "4,281 indexed chunks", status: "active" },
  { name: "Sentry", subtitle: "Issues and traces", count: "1,024 live issue groups", status: "live feed" },
  { name: "Prometheus", subtitle: "Time-series metrics", count: "84 monitored targets", status: "healthy" },
  { name: "Runbooks", subtitle: "Operational knowledge base", count: "312 procedures", status: "synced" },
];

export const retrievalResults: RetrievalResult[] = [
  {
    citation_id: "EVID-001",
    source_type: "sentry_issue",
    title: "SignatureMismatchError stack trace",
    content: "Failure occurs in payments/webhook.py after the strict-mode gate, matching the latest deploy.",
    relevance_score: 0.96,
    metadata: { release: "v1.42.0" },
  },
  {
    citation_id: "EVID-002",
    source_type: "github_pr",
    title: "PR #482 changed strict signature validation",
    content: "The new validation path rejects webhook payloads missing the normalized digest format.",
    relevance_score: 0.94,
    metadata: { pr_number: 482 },
  },
  {
    citation_id: "EVID-003",
    source_type: "runbook",
    title: "Payment webhook failure mitigation",
    content: "Disable payment_webhook_strict_mode or rollback v1.42.0 to restore accepted payload processing.",
    relevance_score: 0.89,
    metadata: { priority: "safe_first" },
  },
];

export const hypotheses: Hypothesis[] = [
  {
    id: "H1",
    title: "Webhook validation regression",
    confidence: 0.89,
    summary: "PR #482 tightened webhook signature enforcement and the error spike aligns exactly with release v1.42.0.",
    supportingEvidence: ["EVID-001", "EVID-002", "EVID-003"],
    contradictingEvidence: [],
  },
  {
    id: "H2",
    title: "Provider-side signing drift",
    confidence: 0.31,
    summary: "A payload format change could explain signature mismatches, but status evidence argues against it.",
    supportingEvidence: ["EVID-001"],
    contradictingEvidence: ["EVID-006"],
  },
  {
    id: "H3",
    title: "Replay protection regression",
    confidence: 0.18,
    summary: "Could be tied to timestamp normalization, but current evidence is weak and incomplete.",
    supportingEvidence: ["EVID-002"],
    contradictingEvidence: [],
  },
];

export const actionPlans: ActionPlan[] = [
  {
    id: "safe-1",
    title: "Immediate safe mitigation",
    description: "Disable strict webhook validation flag to restore successful payload acceptance while preserving trace visibility.",
    steps: [
      "Disable payment_webhook_strict_mode in prod-east-1.",
      "Watch payment success rate, 5xx rate, and Sentry volume for 15 minutes.",
      "Keep retrieval trace running to compare pre and post metrics.",
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

export const dangerousActions = [
  "Do not disable webhook authentication globally without product and security approval.",
  "Avoid replaying queued payment events until duplicate-charge protection is verified.",
];

export const missingEvidence = [
  "Need dead-letter queue depth after strict mode disable.",
  "Need canary replay sample to validate normalized digest fix.",
  "Need confirmation from release manager on rollback blast radius.",
];

export const traceNodes: TraceNode[] = [
  {
    id: "intake",
    name: "Intake Agent",
    status: "completed",
    latencyLabel: "420ms",
    tokenLabel: "260",
    model: "gpt-4o",
    toolCalls: 0,
    summary: "Classified the incident as deployment regression and anchored the investigation around payments-api.",
  },
  {
    id: "retrieval",
    name: "Retrieval Agent",
    status: "completed",
    latencyLabel: "1.2s",
    tokenLabel: "450",
    model: "gpt-4o",
    toolCalls: 2,
    summary: "Retrieved 12 relevant chunks from logs, Sentry, GitHub, and runbooks.",
  },
  {
    id: "root-cause",
    name: "Root Cause Agent",
    status: "running",
    latencyLabel: "890ms",
    tokenLabel: "300",
    model: "gpt-4o-mini",
    toolCalls: 0,
    summary: "Ranking hypotheses and checking contradictions against external outage evidence.",
  },
  {
    id: "approval",
    name: "Approval Gate",
    status: "pending",
    latencyLabel: "--",
    tokenLabel: "--",
    model: "policy",
    toolCalls: 1,
    summary: "Waiting for approval before rollback recommendation can be escalated.",
  },
];

export const toolCalls: ToolCallSummary[] = [
  { name: "search_evidence", status: "success", latency: "240ms" },
  { name: "list_sentry_errors", status: "success", latency: "680ms" },
  { name: "compare_prompt_versions", status: "warning", latency: "1.1s" },
];

export const mockIncidentReport: IncidentReport = {
  incident_id: "1",
  report_id: "report-mock-1",
  report_markdown: `# Incident Report
## 1. Executive Summary
Payment failures are most likely caused by a deployment regression introduced by PR #482 in webhook signature validation [EVID-002] with matching runtime failures in payments/webhook.py [EVID-001].
## 2. Current Status
The incident remains investigating with elevated payment failures and degraded completion rate [EVID-003].
## 3. Affected Services
payments-api [EVID-001]
## 4. Severity Assessment
high [EVID-003]
## 5. Timeline
- Release v1.42.0 deployed [EVID-002]
- SignatureMismatchError started after deploy [EVID-001]
- Prometheus error spike confirmed [EVID-003]
## 6. Key Evidence
- [EVID-001] SignatureMismatchError in payments/webhook.py
- [EVID-002] PR #482 changed webhook validation
- [EVID-003] Payment service error rate spike
- [EVID-004] Payment webhook failure runbook
- [EVID-005] INC-104 similar signature mismatch regression
- [EVID-006] Payment provider status operational
## 7. Root Cause Hypotheses
- Webhook validation regression
- Third-party payment provider outage
## 8. Most Likely Root Cause
Webhook validation regression [EVID-001] [EVID-002] [EVID-004] [EVID-005]
## 9. Confidence Score
0.86
## 10. Recommended Immediate Actions
- Confirm current payment_webhook_strict_mode feature flag state.
- Review Sentry SignatureMismatchError volume for release v1.42.0.
## 11. Approval-Gated Actions
- Disable payment_webhook_strict_mode feature flag.
- Rollback release v1.42.0.
## 12. Rollback or Hotfix Plan
- Prepare rollback plan for release v1.42.0 if mitigation fails.
## 13. Verification Checklist
- 5xx rate returns near baseline.
- Webhook success rate recovers.
## 14. Customer-Facing Update
We are investigating elevated payment failures affecting a subset of checkout attempts.
## 15. Postmortem Draft
Strict validation regression introduced in release v1.42.0.
## 16. Missing Evidence
- exact rollback result
- feature flag state at incident start
## 17. Evaluation Notes
The report is well supported by GitHub, Sentry, Prometheus, runbook, and previous incident evidence.`,
  selected_root_cause: "Webhook validation regression",
  confidence_score: 0.86,
  evaluation_score: 0.9,
  created_at: "2026-07-02T06:31:00Z",
};

export const mockInvestigationRun: InvestigationRunResponse = {
  incident_id: "1",
  status: "completed",
  report_id: "report-mock-1",
  selected_root_cause: "Webhook validation regression",
  confidence_score: 0.86,
  quality_score: 0.9,
};

export const mockIncidentTrace: IncidentTrace = {
  incident_id: "1",
  agent_runs: [
    {
      id: "run-1",
      agent_name: "Intake Agent",
      status: "completed",
      input_summary: "Payment API incident with 6 evidence items.",
      output_summary: "Classified as deployment_regression affecting payments-api.",
      model_name: "mock-llm",
      prompt_version: "intake_agent_v1",
      latency_ms: 120,
      token_input: 420,
      token_output: 180,
      estimated_cost_usd: 0,
      started_at: "2026-07-02T06:30:00Z",
      completed_at: "2026-07-02T06:30:00Z",
      error_message: null,
    },
    {
      id: "run-2",
      agent_name: "Retrieval Agent",
      status: "completed",
      input_summary: "Classified payment incident ready for evidence search.",
      output_summary: "Collected 6 evidence bundle items and noted 2 missing evidence gaps.",
      model_name: "mock-llm",
      prompt_version: "retrieval_agent_v1",
      latency_ms: 180,
      token_input: 520,
      token_output: 210,
      estimated_cost_usd: 0,
      started_at: "2026-07-02T06:30:01Z",
      completed_at: "2026-07-02T06:30:01Z",
      error_message: null,
    },
    {
      id: "run-3",
      agent_name: "Tool Execution Agent",
      status: "completed",
      input_summary: "Executing safe mock tools for github, sentry, prometheus, statuspage, runbooks, and prior incidents.",
      output_summary: "Executed 6 safe mock tools and persisted their outputs.",
      model_name: "mock-llm",
      prompt_version: "retrieval_agent_v1",
      latency_ms: 95,
      token_input: 180,
      token_output: 120,
      estimated_cost_usd: 0,
      started_at: "2026-07-02T06:30:02Z",
      completed_at: "2026-07-02T06:30:02Z",
      error_message: null,
    },
    {
      id: "run-4",
      agent_name: "Root Cause Agent",
      status: "completed",
      input_summary: "Evidence bundle ready for root cause ranking.",
      output_summary: "Generated 2 hypotheses and selected Webhook validation regression.",
      model_name: "mock-llm",
      prompt_version: "root_cause_agent_v1",
      latency_ms: 150,
      token_input: 610,
      token_output: 250,
      estimated_cost_usd: 0,
      started_at: "2026-07-02T06:30:03Z",
      completed_at: "2026-07-02T06:30:03Z",
      error_message: null,
    },
    {
      id: "run-5",
      agent_name: "Remediation Agent",
      status: "completed",
      input_summary: "Selected root cause available for safe planning.",
      output_summary: "Created immediate, approval-gated, rollback, verification, and customer update plans.",
      model_name: "mock-llm",
      prompt_version: "remediation_agent_v1",
      latency_ms: 135,
      token_input: 490,
      token_output: 280,
      estimated_cost_usd: 0,
      started_at: "2026-07-02T06:30:04Z",
      completed_at: "2026-07-02T06:30:04Z",
      error_message: null,
    },
    {
      id: "run-6",
      agent_name: "Evaluation Agent",
      status: "completed",
      input_summary: "Draft report and remediation plan available for review.",
      output_summary: "Assigned quality score 0.9 with citation coverage 0.94.",
      model_name: "mock-llm",
      prompt_version: "evaluator_agent_v1",
      latency_ms: 110,
      token_input: 300,
      token_output: 160,
      estimated_cost_usd: 0,
      started_at: "2026-07-02T06:30:05Z",
      completed_at: "2026-07-02T06:30:05Z",
      error_message: null,
    },
  ],
  tool_calls: [
    {
      id: "tool-1",
      agent_run_id: "run-3",
      tool_name: "search_github_changes",
      status: "completed",
      input_json: { incident_id: 1, source_types: ["github_pr", "github_commit"] },
      output_json: { results: [{ title: "PR #482 changed webhook validation" }] },
      latency_ms: 14,
      created_at: "2026-07-02T06:30:02Z",
      error_message: null,
    },
    {
      id: "tool-2",
      agent_run_id: "run-3",
      tool_name: "fetch_sentry_issue",
      status: "completed",
      input_json: { incident_id: 1, source_types: ["sentry_issue"] },
      output_json: { results: [{ title: "SignatureMismatchError in payments/webhook.py" }] },
      latency_ms: 17,
      created_at: "2026-07-02T06:30:02Z",
      error_message: null,
    },
  ],
};

export const evalMetrics: EvalMetric[] = [
  { label: "Retrieval precision", value: "94.2%", sublabel: "up 2.1", tone: "success" },
  { label: "Faithfulness", value: "91.8%", sublabel: "stable", tone: "accent" },
  { label: "Hallucination rate", value: "2.7%", sublabel: "down 1.3", tone: "success" },
  { label: "P90 latency", value: "11.4s", sublabel: "under budget", tone: "success" },
  { label: "Cost / run", value: "$0.38", sublabel: "watch trend", tone: "warning" },
];

export const evalTrend = {
  labels: ["v3.8", "v3.9", "v4.0", "v4.1", "v4.2", "v4.3", "beta"],
  accuracy: [81, 85, 84, 89, 92, 94, 90],
  latency: [16, 15, 14, 13, 12, 11, 13],
};

export const evalFailures: EvalFailure[] = [
  {
    incidentId: "INC-2048",
    timestamp: "2026-07-02 05:21 UTC",
    reason: "Missed contradictory evidence",
    confidence: "61%",
    action: "Inspect trace",
  },
  {
    incidentId: "INC-2011",
    timestamp: "2026-07-02 01:03 UTC",
    reason: "Low citation coverage",
    confidence: "57%",
    action: "Replay retrieval",
  },
];

export const llmopsConnections: ConnectionHealth[] = [
  { name: "OpenAI", subtitle: "Reasoning and report generation", status: "connected" },
  { name: "Embeddings", subtitle: "all-MiniLM-L6-v2", status: "active" },
  { name: "Tracing", subtitle: "Agent spans and tool telemetry", status: "enabled" },
];

export const settingsSections: SettingSectionData[] = [
  {
    title: "Model Providers",
    description: "Primary reasoning and fallback model controls.",
    fields: [
      { kind: "select", label: "Primary model", value: "gpt-4o", options: ["gpt-4o", "gpt-4.1", "mock-mode"] },
      { kind: "select", label: "Fallback model", value: "gpt-4o-mini", options: ["gpt-4o-mini", "gpt-4.1-mini"] },
      { kind: "toggle", label: "Mock mode", value: false, description: "Return deterministic mock traces for local development." },
      { kind: "slider", label: "Max reasoning tokens", value: 8192, min: 1024, max: 32768, step: 1024 },
    ],
  },
  {
    title: "Retrieval",
    description: "Embedding, reranking, and semantic search behavior.",
    fields: [
      { kind: "input", label: "Embedding model", value: "sentence-transformers/all-MiniLM-L6-v2" },
      { kind: "toggle", label: "Reranker enabled", value: true },
      { kind: "slider", label: "Top-K retrieval", value: 8, min: 3, max: 20, step: 1 },
      { kind: "slider", label: "Score threshold", value: 0.25, min: 0.05, max: 1, step: 0.05 },
    ],
  },
  {
    title: "Governance",
    description: "Tracing, approval gates, and evaluation thresholds.",
    fields: [
      { kind: "toggle", label: "Trace every tool call", value: true },
      { kind: "toggle", label: "Approval gate for rollback", value: true },
      { kind: "slider", label: "Eval pass threshold", value: 92, min: 70, max: 99, step: 1 },
      { kind: "input", label: "Prompt version", value: "v4.2-stable" },
    ],
  },
];
