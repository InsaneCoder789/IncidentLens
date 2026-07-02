import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, PlayCircle, Sparkles, Upload } from "lucide-react";
import {
  actionPlans,
  dangerousActions,
  hypotheses,
  incidentTimeline,
  missingEvidence,
  retrievalResults,
} from "@/lib/mock-data";
import { getIncident, getIncidentEvidence } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/severity-badge";
import { StatusBadge } from "@/components/status-badge";
import { IncidentTimeline } from "@/components/incident-timeline";
import { ConfidenceGauge } from "@/components/confidence-gauge";
import { EvidenceCitation, RootCauseHypothesisCard, ActionPlanCard } from "@/components/evidence-citation";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incident = await getIncident(Number(id));
  if (!incident) notFound();
  const evidence = await getIncidentEvidence(incident.id);

  return (
    <div className="grid gap-3 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
      <div className="space-y-3">
        <Link href="/incidents" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to incident queue
        </Link>

        <Card>
          <CardHeader>
            <div className="label-caps text-slate-500">Incident Metadata</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400"><span>Status</span><StatusBadge status={incident.status} /></div>
              <div className="flex items-center justify-between text-xs text-slate-400"><span>Severity</span><SeverityBadge severity={incident.severity} /></div>
              <div className="flex items-center justify-between text-xs text-slate-400"><span>Service</span><span className="font-mono text-slate-200">{incident.affected_service}</span></div>
            </div>
          </CardContent>
        </Card>

        <IncidentTimeline events={incidentTimeline} />
      </div>

      <div className="space-y-3">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold leading-tight text-white">{incident.title}</div>
                <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-slate-500">
                  Incident ID: INC-{String(incident.id).padStart(4, "0")}
                </div>
              </div>
              <Button className="gap-2 bg-[#7b3ff3] hover:bg-[#6d31e5]">
                <Sparkles className="h-3.5 w-3.5" />
                Run Investigation
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-line bg-[#11161f] px-4 py-4">
              <div className="label-caps text-slate-500">Executive Summary</div>
              <div className="mt-3 text-sm leading-6 text-white">
                Anomalous latency spike detected in {incident.affected_service}. Current evidence strongly suggests a deployment regression introduced by PR #482 that tightened webhook signature validation in release v1.42.0.
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-line bg-[#11161f] px-4 py-3">
                <div className="label-caps text-slate-500">Current Status</div>
                <div className="mt-2 space-y-2 text-xs text-slate-300">
                  <div>Error rate: 18.4%</div>
                  <div>P95 latency: 1.8s</div>
                  <div>Payment completion: degraded</div>
                </div>
              </div>
              <div className="rounded-lg border border-line bg-[#11161f] px-4 py-3">
                <div className="label-caps text-slate-500">Blast Radius</div>
                <div className="mt-2 space-y-2 text-xs text-slate-300">
                  <div>Estimated 1.2K affected users</div>
                  <div>Impact concentrated in North America</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="label-caps text-slate-500">Root Cause Hypotheses</div>
              {hypotheses.map((hypothesis) => (
                <RootCauseHypothesisCard key={hypothesis.id} id={hypothesis.id} title={hypothesis.title} confidence={hypothesis.confidence} summary={hypothesis.summary} />
              ))}
            </div>

            <div className="space-y-3">
              <div className="label-caps text-slate-500">Recommended Action Plan</div>
              {actionPlans.map((plan) => (
                <ActionPlanCard key={plan.id} title={plan.title} description={plan.description} steps={plan.steps} tone={plan.tone} />
              ))}
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <Button variant="secondary" className="gap-2">
                <Upload className="h-3.5 w-3.5" />
                Add Evidence
              </Button>
              <Button variant="secondary" className="gap-2">
                <FileText className="h-3.5 w-3.5" />
                Generate Postmortem
              </Button>
              <Link href={`/incidents/${incident.id}/trace`} className="block">
                <Button variant="outline" className="w-full gap-2">
                  <PlayCircle className="h-3.5 w-3.5" />
                  Run Eval
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <ConfidenceGauge value={incident.latest_confidence_score ?? 0.89} />
        <Card>
          <CardHeader><div className="label-caps text-slate-500">Evidence Citations</div></CardHeader>
          <CardContent className="space-y-3">
            {retrievalResults.map((result) => (
              <EvidenceCitation key={result.citationId} citationId={result.citationId} title={result.title} sourceType={result.sourceType} excerpt={result.excerpt} />
            ))}
            <div className="rounded-lg border border-dashed border-line bg-panel px-3 py-3 text-center text-xs text-slate-400">+ Add Manual Evidence</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div className="label-caps text-[#ff8b3d]">Dangerous Actions</div></CardHeader>
          <CardContent className="space-y-2">
            {dangerousActions.map((item) => (
              <div key={item} className="rounded-md border border-[#f85149]/30 bg-[#25161a] px-3 py-3 text-xs text-[#ffb4ab]">{item}</div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div className="label-caps text-slate-500">Missing Evidence</div></CardHeader>
          <CardContent className="space-y-2">
            {missingEvidence.map((item) => (
              <div key={item} className="text-xs leading-5 text-slate-400">{item}</div>
            ))}
            <div className="rounded-lg border border-line bg-[#050505] px-3 py-3 font-mono text-[11px] text-[#7ee787]">
              {evidence[0]?.raw_content ?? "Awaiting evidence import..."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
