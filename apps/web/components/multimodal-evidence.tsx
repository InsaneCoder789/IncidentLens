"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Activity,
  AudioLines,
  CheckCircle2,
  FileImage,
  FileText,
  LoaderCircle,
  TerminalSquare,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { evidenceFileUrl, uploadEvidence } from "@/lib/api";
import type { EvidenceItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ACCEPTED_TYPES = ".png,.jpg,.jpeg,.webp,.pdf,.md,.txt,.mp3,.wav,.m4a";

function metadataString(evidence: EvidenceItem, key: string): string | undefined {
  const value = evidence.metadata_json[key];
  return typeof value === "string" ? value : undefined;
}

function classificationFor(evidence: EvidenceItem): { classification: string; confidence: number; signals: string[] } | null {
  const value = evidence.metadata_json.dashboard_classification;
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (typeof data.classification !== "string") return null;
  return {
    classification: data.classification,
    confidence: typeof data.confidence === "number" ? data.confidence : 0,
    signals: Array.isArray(data.signals) ? data.signals.filter((item): item is string => typeof item === "string") : [],
  };
}

function isImageEvidence(sourceType: string): boolean {
  return ["screenshot", "dashboard_screenshot", "sentry_screenshot", "architecture_diagram"].includes(sourceType);
}

function isPdfEvidence(sourceType: string): boolean {
  return ["pdf_runbook", "pdf_postmortem"].includes(sourceType);
}

export function FileTypeBadge({ sourceType }: { sourceType: string }) {
  const Icon = isImageEvidence(sourceType)
    ? FileImage
    : isPdfEvidence(sourceType)
      ? FileText
      : sourceType === "voice_note"
        ? AudioLines
        : TerminalSquare;
  return (
    <Badge className="gap-1.5 border-line bg-[#10131b] text-slate-300">
      <Icon className="h-3 w-3" />
      {sourceType.replaceAll("_", " ")}
    </Badge>
  );
}

export function ExtractionStatusBadge({ status }: { status: string }) {
  const Icon = status === "completed" ? CheckCircle2 : status === "failed" ? XCircle : LoaderCircle;
  const tone =
    status === "completed"
      ? "border-[#4E9E77]/30 bg-[#4E9E771a] text-[#8FD8AF]"
      : status === "failed"
        ? "border-[#F06A6A]/30 bg-[#F06A6A1a] text-[#F3A0A0]"
        : "border-[#56B8C7]/30 bg-[#56B8C71a] text-[#8FD3DD]";
  return (
    <Badge className={`gap-1.5 ${tone}`}>
      <Icon className={`h-3 w-3 ${status === "processing" ? "animate-spin" : ""}`} />
      extract {status}
    </Badge>
  );
}

export function ExtractedTextPanel({ text }: { text: string }) {
  return (
    <div className="terminal max-h-44 overflow-auto px-3 py-3 font-mono text-[11px] leading-5 text-slate-300">
      {text || "No extracted text is available yet."}
    </div>
  );
}

export function DashboardClassificationCard({ evidence }: { evidence: EvidenceItem }) {
  const classification = classificationFor(evidence);
  if (!classification) return null;
  return (
    <div className="rounded-lg border border-[#E7A75D]/25 bg-[#241b14] px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-[#ffd1ad]">
          <Activity className="h-3.5 w-3.5" />
          {classification.classification.replaceAll("_", " ")}
        </div>
        <span className="font-mono text-[10px] text-[#EDBC82]">{Math.round(classification.confidence * 100)}%</span>
      </div>
      <div className="mt-2 text-[11px] leading-5 text-[#ffd1ad]/70">{classification.signals.join(" · ")}</div>
    </div>
  );
}

export function ImageEvidencePreview({ evidence }: { evidence: EvidenceItem }) {
  const hasFile = Boolean(metadataString(evidence, "storage_path"));
  return (
    <div className="relative h-36 overflow-hidden rounded-lg border border-line bg-[#070b12]">
      {hasFile ? (
        <Image
          src={evidenceFileUrl(evidence.id)}
          alt={evidence.title}
          fill
          unoptimized
          className="object-cover opacity-80"
          sizes="(max-width: 768px) 100vw, 420px"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(86,141,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(86,141,255,0.08)_1px,transparent_1px)] bg-[size:18px_18px]" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#070b12] to-transparent px-3 pb-3 pt-8 text-[11px] text-slate-300">
        {metadataString(evidence, "filename") ?? "Seeded visual evidence"}
      </div>
    </div>
  );
}

export function PdfEvidencePreview({ evidence }: { evidence: EvidenceItem }) {
  const pages = evidence.metadata_json.page_count;
  return (
    <div className="flex h-28 items-center gap-4 rounded-lg border border-line bg-[#0b0f19] px-4">
      <FileText className="h-8 w-8 text-[#8FD3DD]" />
      <div>
        <div className="text-xs font-medium text-slate-200">{metadataString(evidence, "filename") ?? evidence.title}</div>
        <div className="mt-1 text-[11px] text-slate-500">{typeof pages === "number" && pages > 0 ? `${pages} pages extracted` : "PDF evidence"}</div>
      </div>
    </div>
  );
}

export function AudioEvidencePreview({ evidence }: { evidence: EvidenceItem }) {
  const hasFile = Boolean(metadataString(evidence, "storage_path"));
  return (
    <div className="rounded-lg border border-line bg-[#0b0f19] px-4 py-4">
      <div className="flex items-center gap-3">
        <AudioLines className="h-5 w-5 text-[#8FD3DD]" />
        <div className="text-xs font-medium text-slate-200">{metadataString(evidence, "filename") ?? evidence.title}</div>
      </div>
      {hasFile ? <audio className="mt-3 h-8 w-full" controls preload="metadata" src={evidenceFileUrl(evidence.id)} /> : null}
    </div>
  );
}

export function MultimodalEvidenceCard({
  evidence,
  citationIds = [],
  usedInInvestigation = false,
}: {
  evidence: EvidenceItem;
  citationIds?: string[];
  usedInInvestigation?: boolean;
}) {
  const extractionStatus = metadataString(evidence, "extraction_status") ?? (evidence.normalized_content ? "completed" : "pending");
  return (
    <article className="rounded-xl border border-line bg-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-white">{evidence.title}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {metadataString(evidence, "filename") ?? "Seeded evidence"} · {Number(evidence.metadata_json.file_size_bytes ?? 0) > 0
              ? `${Math.round(Number(evidence.metadata_json.file_size_bytes) / 1024)} KB`
              : "mock source"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <FileTypeBadge sourceType={evidence.source_type} />
          <ExtractionStatusBadge status={extractionStatus} />
        </div>
      </div>

      <div className="mt-4">
        {isImageEvidence(evidence.source_type) ? <ImageEvidencePreview evidence={evidence} /> : null}
        {isPdfEvidence(evidence.source_type) ? <PdfEvidencePreview evidence={evidence} /> : null}
        {evidence.source_type === "voice_note" ? <AudioEvidencePreview evidence={evidence} /> : null}
      </div>

      <div className="mt-3">
        <DashboardClassificationCard evidence={evidence} />
      </div>

      <div className="mt-3">
        <ExtractedTextPanel text={evidence.normalized_content ?? evidence.raw_content} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge className="border-line bg-[#10131b] text-slate-300">process {evidence.processing_status}</Badge>
        <Badge className="border-line bg-[#10131b] text-slate-300">embed {evidence.embedding_status}</Badge>
        {citationIds.map((citationId) => (
          <Badge key={citationId} className="border-[#56B8C7]/30 bg-[#56B8C71a] font-mono text-[#8FD3DD]">
            {citationId}
          </Badge>
        ))}
        <Badge className={usedInInvestigation ? "border-[#4E9E77]/30 bg-[#4E9E771a] text-[#8FD8AF]" : "border-line bg-[#10131b] text-slate-500"}>
          {usedInInvestigation ? "used in latest report" : "available to agents"}
        </Badge>
      </div>
    </article>
  );
}

export function MultimodalUploadPanel({ incidentId, compact = false }: { incidentId: number; compact?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"idle" | "uploading" | "extracting" | "completed" | "failed">("idle");
  const [message, setMessage] = useState("Drop incident evidence here or choose a file.");
  const [latestEvidence, setLatestEvidence] = useState<EvidenceItem | null>(null);

  async function handleFile(file: File) {
    setProgress(5);
    setStage("uploading");
    setMessage(`Uploading ${file.name}`);
    try {
      const result = await uploadEvidence(incidentId, file, {
        processImmediately: true,
        description: `Uploaded from the IncidentLens evidence workspace for incident ${incidentId}.`,
        onProgress: (value) => {
          setProgress(Math.max(5, Math.min(value, 92)));
          if (value >= 90) {
            setStage("extracting");
            setMessage("Extracting, chunking, and embedding evidence...");
          }
        },
      });
      setProgress(100);
      setStage("completed");
      setLatestEvidence(result.evidence);
      setMessage(`${result.evidence.title} is searchable and ready for agents.`);
      router.refresh();
    } catch (error) {
      setStage("failed");
      setMessage(error instanceof Error ? error.message : "Evidence upload failed.");
    }
  }

  return (
    <div
      className={`rounded-xl border border-dashed px-5 ${compact ? "py-5" : "py-7"} transition-colors ${
        dragging ? "border-[#56B8C7] bg-[#56B8C70f]" : "border-line bg-panel"
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files[0];
        if (file) void handleFile(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_TYPES}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.currentTarget.value = "";
        }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-[#0b0f19] text-[#8FD3DD]">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Multimodal evidence intake</div>
              <p className="mt-1 text-xs leading-5 text-slate-400">{message}</p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={stage === "uploading" || stage === "extracting"}>
              Choose file
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["PNG / JPG", "PDF", "MP3 / WAV / M4A", "MD / TXT"].map((type) => (
              <Badge key={type} className="border-line bg-[#10131b] text-slate-300">{type}</Badge>
            ))}
          </div>
          {stage !== "idle" ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">
                <span>{stage}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#20262f]">
                <div className={`h-full transition-all ${stage === "failed" ? "bg-[#F06A6A]" : "bg-[#56B8C7]"}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}
          {latestEvidence ? (
            <div className="mt-4">
              <ExtractedTextPanel text={latestEvidence.normalized_content ?? latestEvidence.raw_content} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
