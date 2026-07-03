"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Bell, Database, Gauge, Home, Settings2, Siren, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/incidents", label: "Incidents", icon: Bell },
  { href: "/evidence", label: "Evidence", icon: Database },
  { href: "/incidents/1/trace", label: "Agent Traces", icon: Activity },
  { href: "/evals", label: "Evals", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-[#10131b] xl:flex">
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#568dff] text-[#001945]">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-base font-semibold leading-none text-[#b0c6ff]">IncidentLens AI</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">SRE Copilot</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                active ? "bg-[#5b21b5] text-white" : "text-slate-300 hover:bg-[#1c1f28] hover:text-white",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-[#d3bbff]" : "text-slate-400")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4 border-t border-line px-4 py-4">
        <Button variant="secondary" size="md" className="w-full justify-center gap-2 border-[#8957e5] bg-[#8957e5] text-white hover:bg-[#7445d0]">
          <Sparkles className="h-3.5 w-3.5" />
          Run AI Diagnosis
        </Button>
        <div className="rounded-lg border border-line bg-[#161b22] px-3 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-200">Prod command mode</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">payments-oncall</div>
            </div>
            <Siren className="h-4 w-4 text-[#ff8b3d]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
