import { Activity, ChartNoAxesCombined, Database, LayoutDashboard, ListChecks, Settings2 } from "lucide-react";

export const navigationItems = [
  { href: "/", label: "Command", description: "Operational overview", icon: LayoutDashboard },
  { href: "/incidents", label: "Incidents", description: "Triage and investigate", icon: ListChecks },
  { href: "/evidence", label: "Evidence", description: "Ingest and retrieve", icon: Database },
  { href: "/incidents/1/trace", label: "Agent trace", description: "Inspect reasoning runs", icon: Activity },
  { href: "/evals", label: "Evaluations", description: "Quality and regressions", icon: ChartNoAxesCombined },
  { href: "/settings", label: "LLMOps", description: "Models and guardrails", icon: Settings2 },
] as const;

export const incidentSearchItems = [
  { id: 1, title: "Payment API failures after webhook deployment", service: "payments-api", status: "investigating" },
  { id: 2, title: "Auth token refresh failures in prod-east-1", service: "auth-service", status: "open" },
  { id: 3, title: "Checkout latency regression in pay-v4", service: "pay-v4", status: "investigating" },
  { id: 4, title: "Redis node memory pressure", service: "redis-node-2", status: "mitigated" },
] as const;

export function routeContext(pathname: string): { eyebrow: string; title: string } {
  if (/^\/incidents\/\d+\/trace/.test(pathname)) return { eyebrow: "Reasoning telemetry", title: "Agent trace" };
  if (/^\/incidents\/\d+/.test(pathname)) return { eyebrow: "Active investigation", title: "Incident workspace" };
  if (pathname === "/incidents") return { eyebrow: "Operations queue", title: "Incidents" };
  if (pathname === "/evidence") return { eyebrow: "Knowledge pipeline", title: "Evidence" };
  if (pathname === "/evals") return { eyebrow: "Quality control", title: "Evaluations" };
  if (pathname === "/settings") return { eyebrow: "Runtime control", title: "LLMOps settings" };
  return { eyebrow: "Production overview", title: "Incident command" };
}
