"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Bell, Database, Gauge, Home, Settings2 } from "lucide-react";
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
    <aside className="sticky top-0 hidden h-screen w-[104px] shrink-0 flex-col border-r border-line bg-[#0f131c] xl:flex">
      <div className="border-b border-line px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-[#8faeff]/50 bg-[#101826] text-[10px] text-[#d9e2ff]">
            ◇
          </div>
          <div>
            <div className="text-[10px] font-semibold leading-none text-white">IncidentLens AI</div>
            <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-slate-500">SRE Copilot</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-[11px] text-slate-300 transition",
                active ? "border-[#7d4eff] bg-[#6f2df31f] text-white" : "border-transparent hover:border-line hover:bg-panel",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", active ? "text-[#b48fff]" : "text-slate-400")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-line p-3">
        <Button variant="secondary" size="md" className="w-full justify-center gap-2 bg-[#7b3ff3] text-white hover:bg-[#6d31e5]">
          <Gauge className="h-3.5 w-3.5" />
          Run AI Diagnosis
        </Button>
        <div className="rounded-md border border-line px-3 py-2">
          <div className="text-[11px] text-slate-200">User Profile</div>
          <div className="mt-1 text-[10px] text-slate-500">Admin Access</div>
        </div>
      </div>
    </aside>
  );
}
