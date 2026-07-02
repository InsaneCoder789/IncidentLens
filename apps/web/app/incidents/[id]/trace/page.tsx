import { traceNodes, traceToolCalls } from "@/lib/mock-data";
import { AgentRunCard, AgentTraceGraph, ToolCallPanel } from "@/components/evidence-citation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TracePage() {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Trace: TR-8829-X</div>
                <div className="mt-1 text-xs text-slate-500">Live streaming retrieval and reasoning execution details.</div>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">Prod · Staging</div>
            </div>
          </CardHeader>
          <CardContent>
            <AgentTraceGraph nodes={traceNodes} />
          </CardContent>
        </Card>

        <div className="grid gap-3 lg:grid-cols-2">
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

      <div className="space-y-3">
        <ToolCallPanel calls={traceToolCalls} />
        <Card>
          <CardHeader><div className="text-sm font-medium text-white">Prompt Input / Raw Completion</div></CardHeader>
          <CardContent>
            <div className="terminal px-3 py-3 font-mono text-[11px] leading-6 text-[#7ee787]">
              {`{\n  "role": "user",\n  "query": "Why did checkout service fail?",\n  "context": {\n    "service": "payments-api",\n    "deployment": "v1.42.0"\n  }\n}`}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

