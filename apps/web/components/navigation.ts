import { ChartNoAxesCombined, Database, LayoutDashboard, ListChecks, Settings2 } from "lucide-react";

export const navigationItems = [
  { href: "/dashboard", label: "Command", description: "Operational overview", icon: LayoutDashboard },
  { href: "/incidents", label: "Incidents", description: "Triage and investigate", icon: ListChecks },
  { href: "/evidence", label: "Evidence", description: "Ingest and retrieve", icon: Database },
  { href: "/evals", label: "Evaluations", description: "Quality and regressions", icon: ChartNoAxesCombined },
  { href: "/settings", label: "LLMOps", description: "Models and guardrails", icon: Settings2 },
] as const;

export function routeContext(pathname: string): { eyebrow: string; title: string } {
  if (/^\/incidents\/\d+\/trace/.test(pathname)) return { eyebrow: "Reasoning telemetry", title: "Agent trace" };
  if (/^\/incidents\/\d+/.test(pathname)) return { eyebrow: "Active investigation", title: "Incident workspace" };
  if (pathname === "/incidents") return { eyebrow: "Operations queue", title: "Incidents" };
  if (pathname === "/evidence") return { eyebrow: "Knowledge pipeline", title: "Evidence" };
  if (pathname === "/evals") return { eyebrow: "Quality control", title: "Evaluations" };
  if (pathname === "/settings") return { eyebrow: "Runtime control", title: "LLMOps settings" };
  if (pathname === "/dashboard") return { eyebrow: "Production overview", title: "Incident command" };
  return { eyebrow: "Production overview", title: "Incident command" };
}
