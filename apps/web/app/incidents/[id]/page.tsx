import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, PlayCircle, ShieldAlert, Upload } from "lucide-react";
import { ConfidenceGauge } from "@/components/confidence-gauge";
import {
  ActionPlanCard,
  EvidenceCitation,
  ProcessAllEvidenceButton,
  RetrievalStatusStrip,
  RootCauseHypothesisCard,
  SemanticSearchPanel,
} from "@/components/evidence-citation";
import { IncidentTimeline } from "@/components/incident-timeline";
import { SeverityBadge } from "@/components/severity-badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getIncident, getIncidentChunks, getIncidentEvidence, searchEvidence } from "@/lib/api";
import { actionPlans, dangerousActions, hypotheses, incidentTimeline, missingEvidence } from "@/lib/mock-data";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incidentId = Number(id);
  const incident = await getIncident(incidentId);
  if (!incident) notFound();

  const [evidence, chunks, retrieval] = await Promise.all([
    getIncidentEvidence(incident.id),
    getIncidentChunks(incident.id),
    searchEvidence({ incident_id: incident.id, query: "strict validation rollback", top_k: 5, score_threshold: 0.2 }),
  ]);

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Link href="/incidents" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to incidents
        </Link>

        <Card>
          <CardHeader>
            <div className="label-caps text-slate-500">Metadata</div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between"><span className="text-slate-500">Status</span><StatusBadge status={incident.status} /></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Severity</span><SeverityBadge severity={incident.severity} /></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Service</span><span className="font-mono">{incident.affected_service}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Owner</span><span>{incident.owner ?? "unassigned"}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Evidence</span><span>{evidence.length} items</span></div>
          </CardContent>
        </Card>

        <IncidentTimeline events={incidentTimeline} />
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold leading-tight text-white">{incident.title}</div>
                <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-slate-500">
                  INC-{String(incident.id).padStart(4, "0")} · investigation workspace
                </div>
              </div>
              <ProcessAllEvidenceButton incidentId={incident.id} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-line bg-[#10131b] px-4 py-4">
              <div className="label-caps text-slate-500">AI Incident Report</div>
              <div className="mt-3 text-sm leading-6 text-white">
                Anomalous latency and 5xx errors strongly suggest a deployment regression introduced by PR #482 that tightened webhook
                signature validation in release v1.42.0. Supporting evidence spans Sentry traces, Prometheus metrics, a matching runbook,
                and a similar prior incident.
              </div>
            </div>

            <RetrievalStatusStrip evidenceItems={evidence} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-[#10131b] px-4 py-4">
                <div className="label-caps text-slate-500">Actions</div>
                <div className="mt-3 grid gap-2">
                  <Link href="/evidence"><Button variant="secondary" className="w-full justify-start gap-2"><Upload className="h-3.5 w-3.5" />Add evidence</Button></Link>
                  <Link href={`/incidents/${incident.id}/trace`}><Button variant="secondary" className="w-full justify-start gap-2"><PlayCircle className="h-3.5 w-3.5" />View trace</Button></Link>
                  <Button variant="outline" className="justify-start gap-2"><FileText className="h-3.5 w-3.5" />Generate postmortem</Button>
                </div>
              </div>
              <div className="rounded-xl border border-line bg-[#10131b] px-4 py-4">
                <div className="label-caps text-slate-500">Chunk Store</div>
                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  {chunks.map((chunk) => (
                    <div key={chunk.id} className="rounded-lg border border-line bg-[#050505] px-3 py-3 font-mono text-[11px] leading-5 text-slate-300">
                      {chunk.citation_id} :: {chunk.content}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="label-caps text-slate-500">Root Cause Hypotheses</div>
              {hypotheses.map((hypothesis) => (
                <RootCauseHypothesisCard key={hypothesis.id} {...hypothesis} />
              ))}
            </div>

            <div className="space-y-3">
              <div className="label-caps text-slate-500">Recommended Actions</div>
              {actionPlans.map((plan) => (
                <ActionPlanCard key={plan.id} {...plan} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <ConfidenceGauge value={incident.latest_confidence_score ?? 0.89} />
        <SemanticSearchPanel incidentId={incident.id} initialResults={retrieval.results} />
        <Card>
          <CardHeader>
            <div className="label-caps text-slate-500">Evidence Citations</div>
          </CardHeader>
          <CardContent className="space-y-3">
            {retrieval.results.map((result) => (
              <EvidenceCitation
                key={result.citation_id}
                citationId={result.citation_id}
                title={result.title}
                sourceType={result.source_type}
                excerpt={result.content}
                score={result.relevance_score}
              />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 label-caps text-[#ff8b3d]">
              <ShieldAlert className="h-3.5 w-3.5" />
              Approval-gated actions
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {dangerousActions.map((item) => (
              <div key={item} className="rounded-lg border border-[#f85149]/30 bg-[#22161b] px-3 py-3 text-xs text-[#ffb4ab]">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="label-caps text-slate-500">Missing Evidence</div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-400">
            {missingEvidence.map((item) => (
              <div key={item}>{item}</div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
