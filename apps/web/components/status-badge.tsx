import { Badge } from "@/components/ui/badge";
import type { Status } from "@/lib/types";

const statusClasses: Record<Status, string> = {
  open: "border-[#30363d] bg-[#181b24] text-slate-300",
  investigating: "border-[#56B8C7]/30 bg-[#56B8C71a] text-[#8FD3DD]",
  mitigated: "border-[#E7A75D]/30 bg-[#E7A75D1a] text-[#EDBC82]",
  resolved: "border-[#4E9E77]/30 bg-[#4E9E771a] text-[#8FD8AF]",
  postmortem_ready: "border-accent/25 bg-accent/[0.07] text-accent",
};

export function StatusBadge({ status }: { status: Status }) {
  return <Badge className={statusClasses[status]}>{status.replace(/_/g, " ")}</Badge>;
}
