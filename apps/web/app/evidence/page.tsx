import { EvidenceCard } from "@/components/evidence-card";
import { EvidenceUploadPanel, ProcessAllEvidenceButton, RetrievalResults, SemanticSearchPanel } from "@/components/evidence-citation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getIncidentEvidence, searchEvidence } from "@/lib/api";
import { evidenceSources } from "@/lib/mock-data";

export default async function EvidencePage() {
  const evidence = await getIncidentEvidence(1);
  const retrieval = await searchEvidence({ incident_id: 1, query: "strict validation webhook", top_k: 5, score_threshold: 0.2 });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <EvidenceUploadPanel />
          <ProcessAllEvidenceButton incidentId={1} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {evidenceSources.map((source) => (
            <div key={source.name} className="rounded-xl border border-line bg-panel px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{source.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{source.subtitle}</div>
                </div>
                <span className="rounded-full border border-line bg-[#10131b] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-300">
                  {source.status}
                </span>
              </div>
              <div className="mt-4 text-xs text-slate-300">{source.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <div className="text-sm font-medium text-white">Evidence Workspace</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {evidence.map((item) => (
                <EvidenceCard key={item.id} evidence={item} />
              ))}
            </div>
            <div className="terminal px-4 py-3 font-mono text-[11px] leading-6 text-[#ffb86b]">
              normalizer :: status=ready
              <br />
              chunker :: overlap=120 size=900
              <br />
              embeddings :: sentence-transformers/all-MiniLM-L6-v2
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <SemanticSearchPanel incidentId={1} initialResults={retrieval.results} />
          <Card>
            <CardHeader>
              <div className="text-sm font-medium text-white">Latest Retrieval Hits</div>
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
