import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/lib/types";

const severityClasses: Record<Severity, string> = {
  low: "border-[#4E9E77]/30 bg-[#4E9E771a] text-[#8FD8AF]",
  medium: "border-[#E7A75D]/30 bg-[#E7A75D1a] text-[#EDBC82]",
  high: "border-[#F06A6A]/30 bg-[#F06A6A1a] text-[#ff7b72]",
  critical: "border-[#ff4d6d]/40 bg-[#ff4d6d26] text-[#ffb3c1]",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge className={severityClasses[severity]}>{severity === "critical" ? "sev-1 critical" : `sev-${severity}`}</Badge>;
}
