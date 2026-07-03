import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { ConfidenceGauge } from "@/components/confidence-gauge";
import { ChunkList, EvidenceCitation, RetrievalStatusStrip, RootCauseHypothesisCard, SemanticSearchPanel } from "@/components/evidence-citation";
import { EvidenceCard } from "@/components/evidence-card";
import { IncidentTimeline } from "@/components/incident-timeline";
import { InvestigationWorkspace } from "@/components/investigation-ui";
import { SeverityBadge } from "@/components/severity-badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getIncident, getIncidentChunks, getIncidentEvidence, getIncidentReport, getIncidentTrace, searchEvidence } from "@/lib/api";
import { hypotheses, incidentTimeline } from "@/lib/mock-data";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incidentId = Number(id);
  const incident = await getIncident(incidentId);
  if (!incident) notFound();

  const [evidence, chunks, retrieval, report, trace] = await Promise.all([
    getIncidentEvidence(incident.id),
    getIncidentChunks(incident.id),
    searchEvidence({ incident_id: incident.id, query: "What caused the payment API failure?", top_k: 8, score_threshold: 0.2 }),
    getIncidentReport(incident.id),
    getIncidentTrace(incident.id),
  ]);

  const activeHypotheses = report
    ? [
        ...hypotheses.filter((item) => item.title === report.selected_root_cause),
        ...hypotheses.filter((item) => item.title !== report.selected_root_cause),
      ]
    : hypotheses;

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_380px]">
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
              <Link href={`/incidents/${incident.id}/trace`}>
                <Button variant="secondary" className="gap-2">
                  <PlayCircle className="h-3.5 w-3.5" />
                  View Trace
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-line bg-[#10131b] px-4 py-4">
              <div className="label-caps text-slate-500">Current Investigation Summary</div>
              <div className="mt-3 text-sm leading-6 text-white">
                {report
                  ? `Latest report identifies ${report.selected_root_cause} as the likely cause with ${Math.round(report.confidence_score * 100)}% confidence.`
                  : "No incident report has been generated yet. Run the investigation to create a persisted, evidence-grounded report."}
              </div>
            </div>

            <RetrievalStatusStrip evidenceItems={evidence} />

            <div className="space-y-3">
              <div className="label-caps text-slate-500">Evidence Processing</div>
              <div className="grid gap-3 md:grid-cols-2">
                {evidence.map((item) => (
                  <EvidenceCard
                    key={item.id}
                    evidence={item}
                    chunkCount={chunks.filter((chunk) => chunk.evidence_item_id === item.id).length}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-[#10131b] px-4 py-4">
                <div className="label-caps text-slate-500">Chunk Store</div>
                <div className="mt-3">
                  <ChunkList chunks={chunks} />
                </div>
              </div>
              <SemanticSearchPanel incidentId={incident.id} initialResults={retrieval.results} metadataFilters={{ service: incident.affected_service }} />
            </div>

            <div className="space-y-3">
              <div className="label-caps text-slate-500">Root Cause Hypotheses</div>
              {activeHypotheses.map((hypothesis) => (
                <RootCauseHypothesisCard key={hypothesis.id} {...hypothesis} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <ConfidenceGauge value={report?.confidence_score ?? incident.latest_confidence_score ?? 0.86} />
        <InvestigationWorkspace incidentId={incident.id} initialReport={report} initialTrace={trace} />
        <Card>
          <CardHeader><div className="text-sm font-medium text-white">Key Evidence</div></CardHeader>
          <CardContent className="space-y-3">
            {retrieval.results.slice(0, 6).map((result) => (
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
      </div>
    </div>
  );
}
