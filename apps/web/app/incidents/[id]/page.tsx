import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ArrowLeft, Database, PlayCircle } from "lucide-react";
import { ConfidenceGauge } from "@/components/confidence-gauge";
import { ChunkList, EvidenceCitation, RetrievalStatusStrip, RootCauseHypothesisCard, SemanticSearchPanel } from "@/components/evidence-citation";
import { EvidenceCard } from "@/components/evidence-card";
import { IncidentTimeline } from "@/components/incident-timeline";
import { PageIntro, SectionHeading } from "@/components/page-intro";
import { InvestigationWorkspace } from "@/components/investigation-ui";
import { MultimodalEvidenceCard, MultimodalUploadPanel } from "@/components/multimodal-evidence";
import { SeverityBadge } from "@/components/severity-badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getApprovals, getIncident, getIncidentChunks, getIncidentEvents, getIncidentEvidence, getIncidentReport, getIncidentTrace, searchEvidence } from "@/lib/api";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incidentId = Number(id);
  const incident = await getIncident(incidentId);
  if (!incident) notFound();

  const [evidence, chunks, retrieval, report, trace, events, approvals] = await Promise.all([
    getIncidentEvidence(incident.id),
    getIncidentChunks(incident.id),
    searchEvidence({ incident_id: incident.id, query: "What caused the payment API failure?", top_k: 8, score_threshold: 0.2 }),
    getIncidentReport(incident.id),
    getIncidentTrace(incident.id),
    getIncidentEvents(incident.id),
    getApprovals(incident.id),
  ]);

  const activeHypotheses = (report?.analysis_json.hypotheses ?? [])
    .map((item, index) => ({
      id: `hypothesis-${index}`,
      title: item.title,
      confidence: item.confidence,
      summary: item.reasoning_summary,
      supportingEvidence: item.supporting_evidence,
      contradictingEvidence: item.contradicting_evidence,
    }))
    .sort((left, right) => Number(right.title === report?.selected_root_cause) - Number(left.title === report?.selected_root_cause));
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const citationsByEvidenceId = new Map<number, string[]>();
  const citationSourceTypes: Record<string, string> = {};
  for (const chunk of chunks) {
    citationsByEvidenceId.set(chunk.evidence_item_id, [
      ...(citationsByEvidenceId.get(chunk.evidence_item_id) ?? []),
      chunk.citation_id,
    ]);
    citationSourceTypes[chunk.citation_id] = evidenceById.get(chunk.evidence_item_id)?.source_type ?? "log";
  }
  const multimodalSourceTypes = new Set([
    "screenshot",
    "dashboard_screenshot",
    "sentry_screenshot",
    "architecture_diagram",
    "pdf_runbook",
    "pdf_postmortem",
    "voice_note",
  ]);
  const multimodalEvidence = evidence.filter((item) => multimodalSourceTypes.has(item.source_type));
  const textEvidence = evidence.filter((item) => !multimodalSourceTypes.has(item.source_type));

  return (
    <div>
      <PageIntro
        eyebrow={`INC-${String(incident.id).padStart(4, "0")} / ${incident.affected_service}`}
        title={incident.title}
        description="Evidence-grounded investigation workspace. Review the timeline, validate the report, and keep production-changing actions behind explicit approval."
        meta={<div className="flex flex-wrap gap-2"><SeverityBadge severity={incident.severity} /><StatusBadge status={incident.status} /><span className="rounded-full border border-line/10 bg-panel px-2.5 py-1 font-mono text-[10px] text-muted">{evidence.length} evidence items</span></div>}
        actions={<><Link href="/evidence"><Button variant="secondary"><Database className="mr-2 h-4 w-4" strokeWidth={1.5} />Evidence</Button></Link><Link href={`/incidents/${incident.id}/trace`}><Button><Activity className="mr-2 h-4 w-4" strokeWidth={1.5} />Inspect trace</Button></Link></>}
      />
    <div className="grid min-w-0 gap-5 xl:grid-cols-[240px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-4">
        <Link href="/incidents" className="inline-flex min-h-11 items-center gap-2 text-xs text-muted transition-colors hover:text-text">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to incidents
        </Link>

        <Card>
          <CardHeader>
            <SectionHeading eyebrow="Context" title="Incident metadata" />
          </CardHeader>
          <CardContent className="divide-y divide-line/8 text-xs text-text">
            <div className="flex items-center justify-between py-2.5"><span className="text-muted">Status</span><StatusBadge status={incident.status} /></div>
            <div className="flex items-center justify-between py-2.5"><span className="text-muted">Severity</span><SeverityBadge severity={incident.severity} /></div>
            <div className="flex items-center justify-between py-2.5"><span className="text-muted">Service</span><span className="font-mono">{incident.affected_service}</span></div>
            <div className="flex items-center justify-between py-2.5"><span className="text-muted">Owner</span><span>{incident.owner ?? "unassigned"}</span></div>
            <div className="flex items-center justify-between py-2.5"><span className="text-muted">Evidence</span><span>{evidence.length} items</span></div>
          </CardContent>
        </Card>

        <IncidentTimeline events={events.map((event) => ({ time: new Date(event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), title: event.title, description: event.description, tone: event.event_type.includes("approval") ? "warning" as const : event.event_type.includes("investigation") ? "accent" as const : "neutral" as const }))} />
      </div>

      <div className="min-w-0 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionHeading eyebrow="Synthesis" title="Investigation report" description="The persisted report remains linked to supporting evidence and agent telemetry." />
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
            <div className="rounded-xl border border-accent/12 bg-accent/[0.045] px-4 py-4">
              <div className="label-caps text-accent">Current finding</div>
              <div className="mt-3 text-sm leading-6 text-text">
                {report
                  ? `Latest report identifies ${report.selected_root_cause} as the likely cause with ${Math.round(report.confidence_score * 100)}% confidence.`
                  : "No incident report has been generated yet. Run the investigation to create a persisted, evidence-grounded report."}
              </div>
            </div>

            <RetrievalStatusStrip evidenceItems={evidence} />

            <MultimodalUploadPanel incidentId={incident.id} compact />

            <div className="space-y-3">
              <div className="label-caps text-muted">Text evidence</div>
              <div className="grid gap-3 md:grid-cols-2">
                {textEvidence.map((item) => (
                  <EvidenceCard
                    key={item.id}
                    evidence={item}
                    chunkCount={chunks.filter((chunk) => chunk.evidence_item_id === item.id).length}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="label-caps text-muted">Multimodal evidence</div>
                <div className="mt-1 text-xs text-muted">Extracted visual, document, and audio evidence available to the latest investigation.</div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {multimodalEvidence.map((item) => {
                  const itemCitations = citationsByEvidenceId.get(item.id) ?? [];
                  return (
                    <MultimodalEvidenceCard
                      key={item.id}
                      evidence={item}
                      citationIds={itemCitations}
                      usedInInvestigation={Boolean(report && itemCitations.some((citation) => report.report_markdown.includes(`[${citation}]`)))}
                    />
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-line/10 bg-bg/35 px-4 py-4">
                <div className="label-caps text-muted">Chunk store</div>
                <div className="mt-3">
                  <ChunkList chunks={chunks} />
                </div>
              </div>
              <SemanticSearchPanel incidentId={incident.id} initialResults={retrieval.results} metadataFilters={{ service: incident.affected_service }} />
            </div>

            <div className="space-y-3">
              <div className="label-caps text-muted">Root cause hypotheses</div>
              {activeHypotheses.length ? activeHypotheses.map((hypothesis) => (
                <RootCauseHypothesisCard key={hypothesis.id} {...hypothesis} />
              )) : <div className="rounded-xl border border-dashed border-line/15 p-4 text-xs text-muted">Run the investigation to generate evidence-grounded hypotheses.</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 space-y-4 xl:col-span-2 2xl:col-span-1">
        <ConfidenceGauge value={report?.confidence_score ?? incident.latest_confidence_score ?? 0.86} />
        <InvestigationWorkspace
          incidentId={incident.id}
          initialReport={report}
          initialTrace={trace}
          citationSourceTypes={citationSourceTypes}
          initialApprovals={approvals}
        />
        <Card>
          <CardHeader><SectionHeading eyebrow="Grounding" title="Key evidence" /></CardHeader>
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
    </div>
  );
}
