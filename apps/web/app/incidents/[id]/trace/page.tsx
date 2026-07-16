import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { AgentRunCard, AgentTraceGraph, CostLatencySummary, ToolCallPanel, TraceTimeline } from "@/components/investigation-ui";
import { PageIntro, SectionHeading } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getIncident, getIncidentReport, getIncidentTrace } from "@/lib/api";

export default async function TracePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incidentId = Number(id);
  const incident = await getIncident(incidentId);
  if (!incident) notFound();

  const [report, trace] = await Promise.all([getIncidentReport(incidentId), getIncidentTrace(incidentId)]);

  return (
    <div>
      <PageIntro eyebrow={`INC-${String(incidentId).padStart(4, "0")} / observability`} title="Agent trace" description="Follow the complete reasoning path from retrieval through evaluation, with tool inputs, outputs, latency, token usage, and model versions kept inspectable." actions={<><Link href={`/incidents/${incidentId}`}><Button variant="secondary"><ArrowLeft className="mr-2 h-4 w-4" strokeWidth={1.5} />Investigation</Button></Link><Link href={`/incidents/${incidentId}`}><Button><FileText className="mr-2 h-4 w-4" strokeWidth={1.5} />View report</Button></Link></>} />
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <SectionHeading eyebrow="Execution graph" title="Reasoning sequence" description="Persisted agent runs and their operational cost." />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">incident :: {incidentId}</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AgentTraceGraph runs={trace.agent_runs} />
            <CostLatencySummary trace={trace} />
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          {trace.agent_runs.map((run) => (
            <AgentRunCard key={run.id} run={run} />
          ))}
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <Card>
          <CardHeader><SectionHeading eyebrow="Sequence" title="Trace timeline" /></CardHeader>
          <CardContent>
            <TraceTimeline runs={trace.agent_runs} />
          </CardContent>
        </Card>
        <ToolCallPanel calls={trace.tool_calls} />
        <Card>
          <CardHeader><SectionHeading eyebrow="Output" title="Latest report snapshot" /></CardHeader>
          <CardContent>
            <div className="terminal px-3 py-3 font-mono text-[11px] leading-6 text-[#8FD8AF]">
              {report?.report_markdown ?? "No report generated yet."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
