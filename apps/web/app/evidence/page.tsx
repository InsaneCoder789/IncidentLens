import { IntegrationHealthPanel } from "@/components/integration-health-panel";
import { PageIntro, SectionHeading } from "@/components/page-intro";
import { ChunkList, RetrievalResults, SemanticSearchPanel, VectorIndexStatusCard } from "@/components/evidence-citation";
import { EmbeddingStatusBadge, ProcessingStatusBadge, SourceTypeBadge } from "@/components/evidence-citation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MultimodalEvidenceCard, MultimodalUploadPanel } from "@/components/multimodal-evidence";
import { Database, FileSearch } from "lucide-react";
import { getIncidentChunks, getIncidentEvidence, getIntegrationHealth, searchEvidence } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const [evidence, chunks, retrieval, integrations] = await Promise.all([
    getIncidentEvidence(1),
    getIncidentChunks(1),
    searchEvidence({ incident_id: 1, query: "What caused the payment API failure?", top_k: 8, score_threshold: 0.2 }),
    getIntegrationHealth(),
  ]);

  const chunkCounts = new Map<number, number>();
  const citationIds = new Map<number, string[]>();
  for (const chunk of chunks) {
    chunkCounts.set(chunk.evidence_item_id, (chunkCounts.get(chunk.evidence_item_id) ?? 0) + 1);
    citationIds.set(chunk.evidence_item_id, [...(citationIds.get(chunk.evidence_item_id) ?? []), chunk.citation_id]);
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

  return (
    <div>
      <PageIntro eyebrow="Incident 0001 / corpus" title="Evidence workspace" description="Ingest screenshots, PDFs, voice notes, logs, and connected service data. Every source is extracted, normalized, chunked, embedded, and kept citation-ready for investigation." meta={<div className="flex flex-wrap gap-2"><span className="rounded-full border border-line/10 bg-panel px-2.5 py-1 font-mono text-[10px] text-muted">{evidence.length} sources</span><span className="rounded-full border border-line/10 bg-panel px-2.5 py-1 font-mono text-[10px] text-muted">{chunks.length} chunks</span><span className="rounded-full border border-success/20 bg-success/5 px-2.5 py-1 font-mono text-[10px] text-success">index ready</span></div>} />
    <div className="space-y-5">
      <MultimodalUploadPanel incidentId={1} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div>
            <SectionHeading eyebrow="Connected sources" title="Integration health" description="Production adapters remain separated from agent logic and can import evidence into this incident." />
          </div>
          <IntegrationHealthPanel incidentId={1} integrations={integrations} />
        </div>
        <VectorIndexStatusCard />
      </div>

      <Card>
        <CardHeader>
          <div>
            <SectionHeading eyebrow="Extracted sources" title="Multimodal evidence" description="Screenshots, PDFs, and voice notes transformed into citation-grounded retrieval evidence." />
          </div>
        </CardHeader>
        <CardContent>
          {multimodalEvidence.length ? (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {multimodalEvidence.map((item) => (
                <MultimodalEvidenceCard key={item.id} evidence={item} citationIds={citationIds.get(item.id)} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line/15 px-4 py-10 text-center">
              <Database className="mx-auto h-5 w-5 text-muted" strokeWidth={1.5} />
              <div className="mt-3 text-sm font-medium text-text">No multimodal evidence yet</div>
              <div className="mt-1 text-xs text-muted">Upload a screenshot, PDF, or voice note to begin extraction.</div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <SectionHeading eyebrow="Corpus" title="Evidence inventory" description="Processing and embedding state for every incident source." />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="scrollbar-thin overflow-x-auto rounded-xl border border-line/10">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-bg/60 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  <tr>
                    <th className="px-3 py-3">Title</th>
                    <th className="px-3 py-3">Source</th>
                    <th className="px-3 py-3">Processing</th>
                    <th className="px-3 py-3">Embedding</th>
                    <th className="px-3 py-3">Chunks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/8 bg-panel">
                  {evidence.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-3">
                        <div className="font-medium text-text">{item.title}</div>
                        <div className="mt-1 line-clamp-2 text-[11px] text-muted">{item.normalized_content ?? item.raw_content}</div>
                      </td>
                      <td className="px-3 py-3"><SourceTypeBadge sourceType={item.source_type} /></td>
                      <td className="px-3 py-3"><ProcessingStatusBadge status={item.processing_status} /></td>
                      <td className="px-3 py-3"><EmbeddingStatusBadge status={item.embedding_status} /></td>
                      <td className="px-3 py-3 text-slate-300">{chunkCounts.get(item.id) ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text"><FileSearch className="h-4 w-4 text-accent" strokeWidth={1.5} />Chunk preview</div>
              <ChunkList chunks={chunks} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <SemanticSearchPanel incidentId={1} initialResults={retrieval.results} metadataFilters={{ service: "payments-api" }} />
          <Card>
            <CardHeader>
              <SectionHeading eyebrow="Ranking" title="Retrieved evidence" />
            </CardHeader>
            <CardContent>
              <RetrievalResults results={retrieval.results} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
}
