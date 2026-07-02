import { Badge } from "@/components/ui/badge";
import type { Status } from "@/lib/types";

const statusClasses: Record<Status, string> = {
  open: "border-[#30363d] bg-[#181b24] text-slate-300",
  investigating: "border-[#0070ff]/30 bg-[#0070ff1a] text-[#b0c6ff]",
  mitigated: "border-[#ff8b3d]/30 bg-[#ff8b3d1a] text-[#ffb86b]",
  resolved: "border-[#2ea043]/30 bg-[#2ea0431a] text-[#7ee787]",
  postmortem_ready: "border-[#8957e5]/30 bg-[#8957e51f] text-[#d3bbff]",
};

export function StatusBadge({ status }: { status: Status }) {
  return <Badge className={statusClasses[status]}>{status.replace(/_/g, " ")}</Badge>;
}
