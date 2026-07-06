import { IntegrationHealthPanel } from "@/components/integration-health-panel";
import { ChunkList, RetrievalResults, SemanticSearchPanel, VectorIndexStatusCard } from "@/components/evidence-citation";
import { EmbeddingStatusBadge, ProcessingStatusBadge, SourceTypeBadge } from "@/components/evidence-citation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getIncidentChunks, getIncidentEvidence, getIntegrationHealth, searchEvidence } from "@/lib/api";

export default async function EvidencePage() {
  const [evidence, chunks, retrieval, integrations] = await Promise.all([
    getIncidentEvidence(1),
    getIncidentChunks(1),
    searchEvidence({ incident_id: 1, query: "What caused the payment API failure?", top_k: 8, score_threshold: 0.2 }),
    getIntegrationHealth(),
  ]);

  const chunkCounts = new Map<number, number>();
  for (const chunk of chunks) {
    chunkCounts.set(chunk.evidence_item_id, (chunkCounts.get(chunk.evidence_item_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-white">Integration Health</div>
            <div className="mt-1 text-xs text-slate-500">Mock production adapters stay separated from agent logic and can import evidence into the demo incident.</div>
          </div>
          <IntegrationHealthPanel incidentId={1} integrations={integrations} />
        </div>
        <VectorIndexStatusCard />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <div className="text-sm font-medium text-white">Evidence Table</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-[#10131b] text-[10px] uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Title</th>
                    <th className="px-3 py-3">Source</th>
                    <th className="px-3 py-3">Processing</th>
                    <th className="px-3 py-3">Embedding</th>
                    <th className="px-3 py-3">Chunks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-panel">
                  {evidence.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-200">{item.title}</div>
                        <div className="mt-1 line-clamp-2 text-[11px] text-slate-500">{item.normalized_content ?? item.raw_content}</div>
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
              <div className="mb-3 text-sm font-medium text-white">Chunk Preview</div>
              <ChunkList chunks={chunks} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <SemanticSearchPanel incidentId={1} initialResults={retrieval.results} metadataFilters={{ service: "payments-api" }} />
          <Card>
            <CardHeader>
              <div className="text-sm font-medium text-white">Ranked Evidence Results</div>
            </CardHeader>
            <CardContent>
              <RetrievalResults results={retrieval.results} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
