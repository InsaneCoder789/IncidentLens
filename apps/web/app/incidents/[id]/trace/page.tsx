import { toolCalls, traceNodes } from "@/lib/mock-data";
import { AgentRunCard, AgentTraceGraph, ToolCallPanel } from "@/components/evidence-citation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TracePage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Trace Viewer</div>
                <div className="mt-1 text-xs text-slate-500">Multi-agent execution graph, run cards, latency, token usage, and raw panels.</div>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">trace :: tr-8829-x</div>
            </div>
          </CardHeader>
          <CardContent>
            <AgentTraceGraph nodes={traceNodes} />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {traceNodes.map((node) => (
            <AgentRunCard
              key={node.id}
              title={node.name}
              latency={node.latencyLabel}
              tokens={node.tokenLabel}
              model={node.model}
              toolCalls={node.toolCalls}
              summary={node.summary}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <ToolCallPanel calls={toolCalls} />
        <Card>
          <CardHeader><div className="text-sm font-medium text-white">Expandable JSON Panel</div></CardHeader>
          <CardContent>
            <div className="terminal px-3 py-3 font-mono text-[11px] leading-6 text-[#7ee787]">
              {`{\n  "query": "strict validation rollback",\n  "incident_id": 1,\n  "selected_tools": ["search_evidence", "list_sentry_errors"],\n  "approval_required": true,\n  "prompt_version": "v4.2-stable"\n}`}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
