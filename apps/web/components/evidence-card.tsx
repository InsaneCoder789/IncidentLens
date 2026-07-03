import type { EvidenceItem } from "@/lib/types";
import { ProcessEvidenceButton } from "@/components/evidence-citation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EvidenceCard({ evidence }: { evidence: EvidenceItem }) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-white">{evidence.title}</div>
            <p className="mt-1 text-xs leading-5 text-slate-400">{evidence.normalized_content ?? evidence.raw_content}</p>
          </div>
          <Badge className="border-line bg-[#10131b] text-slate-300">{evidence.source_type}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-[0.08em] text-slate-500">
          <span>EVID-{String(evidence.id).padStart(3, "0")}</span>
          <span>{evidence.processing_status}</span>
          <span>{evidence.embedding_status}</span>
        </div>
        <ProcessEvidenceButton evidenceId={evidence.id} />
      </CardContent>
    </Card>
  );
}
