import { notFound } from "next/navigation";
import { AgentRunCard, AgentTraceGraph, CostLatencySummary, ToolCallPanel, TraceTimeline } from "@/components/investigation-ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getIncident, getIncidentReport, getIncidentTrace } from "@/lib/api";

export default async function TracePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incidentId = Number(id);
  const incident = await getIncident(incidentId);
  if (!incident) notFound();

  const [report, trace] = await Promise.all([getIncidentReport(incidentId), getIncidentTrace(incidentId)]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">Agent Trace Viewer</div>
                <div className="mt-1 text-xs text-slate-500">Inspect the persisted multi-agent sequence, run summaries, prompt versions, token usage, and tool calls.</div>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">incident :: {incidentId}</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AgentTraceGraph runs={trace.agent_runs} />
            <CostLatencySummary trace={trace} />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {trace.agent_runs.map((run) => (
            <AgentRunCard key={run.id} run={run} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader><div className="text-sm font-medium text-white">Trace Timeline</div></CardHeader>
          <CardContent>
            <TraceTimeline runs={trace.agent_runs} />
          </CardContent>
        </Card>
        <ToolCallPanel calls={trace.tool_calls} />
        <Card>
          <CardHeader><div className="text-sm font-medium text-white">Latest Report Snapshot</div></CardHeader>
          <CardContent>
            <div className="terminal px-3 py-3 font-mono text-[11px] leading-6 text-[#7ee787]">
              {report?.report_markdown ?? "No report generated yet."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
