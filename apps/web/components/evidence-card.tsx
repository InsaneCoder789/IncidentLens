import type { EvidenceItem } from "@/lib/types";
import { EvidenceProcessingStatus, ProcessEvidenceButton, SourceTypeBadge } from "@/components/evidence-citation";
import { Card, CardContent } from "@/components/ui/card";

export function EvidenceCard({ evidence, chunkCount = 0 }: { evidence: EvidenceItem; chunkCount?: number }) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-white">{evidence.title}</div>
            <p className="mt-1 text-xs leading-5 text-slate-400">{evidence.normalized_content ?? evidence.raw_content}</p>
          </div>
          <SourceTypeBadge sourceType={evidence.source_type} />
        </div>
        <EvidenceProcessingStatus processingStatus={evidence.processing_status} embeddingStatus={evidence.embedding_status} chunkCount={chunkCount} />
        <ProcessEvidenceButton evidenceId={evidence.id} />
      </CardContent>
    </Card>
  );
}
