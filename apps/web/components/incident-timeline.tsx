import type { TimelineEvent } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function IncidentTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="label-caps text-slate-500">Live Timeline</div>
          <div className="font-mono text-[10px] text-slate-500">UTC +04:00</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => {
            const tone =
              event.tone === "critical" ? "#F06A6A" : event.tone === "warning" ? "#E7A75D" : event.tone === "accent" ? "#56B8C7" : "#7D8A99";
            return (
              <div key={`${event.time}-${index}`} className="grid grid-cols-[16px_1fr] gap-3">
                <div className="relative flex justify-center">
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tone }} />
                  {index < events.length - 1 ? <span className="absolute top-4 h-[calc(100%+12px)] w-px bg-line" /> : null}
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">{event.time}</div>
                  <div className="mt-1 text-sm font-medium text-white">{event.title}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{event.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
