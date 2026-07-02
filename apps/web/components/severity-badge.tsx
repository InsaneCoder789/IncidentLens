import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/lib/types";

const severityClasses: Record<Severity, string> = {
  low: "border-[#2ea043]/30 bg-[#2ea0431a] text-[#7ee787]",
  medium: "border-[#ff8b3d]/30 bg-[#ff8b3d1a] text-[#ffb86b]",
  high: "border-[#f85149]/30 bg-[#f851491a] text-[#ff7b72]",
  critical: "border-[#ff4d6d]/40 bg-[#ff4d6d26] text-[#ffb3c1]",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge className={severityClasses[severity]}>{severity === "critical" ? "sev-1 critical" : `sev-${severity}`}</Badge>;
}
