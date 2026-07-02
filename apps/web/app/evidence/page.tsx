import { evidenceSources, retrievalResults } from "@/lib/mock-data";
import { EvidenceUploadPanel, RetrievalResults } from "@/components/evidence-citation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function EvidencePage() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[340px_minmax(0,1fr)]">
        <EvidenceUploadPanel />
        <div className="grid gap-3 md:grid-cols-2">
          {evidenceSources.map((source) => (
            <div key={source.name} className="rounded-lg border border-line bg-panel px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{source.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{source.subtitle}</div>
                </div>
                <span className="rounded-full border border-line bg-[#11161f] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-300">
                  {source.status}
                </span>
              </div>
              <div className="mt-4 text-xs text-slate-300">{source.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <div className="text-sm font-medium text-white">Evidence Repository</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-[#0f131c] text-[10px] uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Filename</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Chunking</th>
                    <th className="px-3 py-3">Embedding</th>
                    <th className="px-3 py-3">Vectorized</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-panel">
                  {[
                    ["api-server-prod-logs-july.log", "LOG_STREAM", "1,085", "Success", "2m ago"],
                    ["architecture_v2_draft.pdf", "DOCUMENT", "104", "Success", "7m ago"],
                    ["pr-4402-fix-db-leak.diff", "GIT_DIFF", "18", "Success", "Just now"],
                    ["grafana-outage-spike.png", "IMAGE_OCR", "34", "Success", "12m ago"],
                  ].map(([filename, type, chunks, embedding, last]) => (
                    <tr key={filename}>
                      <td className="px-3 py-3 text-slate-200">{filename}</td>
                      <td className="px-3 py-3 font-mono text-[10px] text-slate-500">{type}</td>
                      <td className="px-3 py-3 text-slate-300">{chunks}</td>
                      <td className="px-3 py-3 text-[#7ee787]">{embedding}</td>
                      <td className="px-3 py-3 text-slate-400">{last}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="terminal px-4 py-3 font-mono text-[11px] leading-6 text-[#ffb86b]">
              [0.78] Found reference to &quot;OOM kill&quot; in architecture_v2_draft.pdf<br />
              [0.64] Correlating database leak PR #4402 with memory spike in prometheus<br />
              [0.73] Possible architectural bottleneck identified on page 4
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-sm font-medium text-white">Retrieval Results</div>
          </CardHeader>
          <CardContent>
            <RetrievalResults results={retrievalResults} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
