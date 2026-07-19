"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { navigationItems } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NavigationContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-5">
        <Link href="/" onClick={onNavigate} className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none">
          <Image src="/brand/incidentlens-mark.svg" alt="" width={40} height={40} priority />
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.025em] text-text">IncidentLens</div>
            <div className="mt-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-muted">Incident intelligence</div>
          </div>
        </Link>
      </div>

      <nav aria-label="Primary navigation" className="flex-1 space-y-1 px-3">
        {navigationItems.map(({ href, label, description, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href) && !(href.includes("trace") && !pathname.includes("trace")));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                active ? "border-accent/15 bg-accent/[0.08] text-text" : "border-transparent text-muted hover:border-line/10 hover:bg-panel2 hover:text-text",
              )}
            >
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors", active ? "border-accent/20 bg-accent/10 text-accent" : "border-line/10 bg-bg/35 text-muted group-hover:text-text")}>
                <Icon className="h-[17px] w-[17px]" strokeWidth={1.45} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium">{label}</span>
                <span className="mt-0.5 block truncate text-[10px] text-muted/70">{description}</span>
              </span>
              {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-line/10 p-3">
        <div className="rounded-[14px] border border-line/10 bg-bg/45 p-3.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-signal-pulse rounded-full bg-success" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-xs font-medium text-text">Production connected</span>
          </div>
          <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">operations / authenticated</div>
        </div>
        <Link href="/incidents/1" onClick={onNavigate} className="block">
          <Button className="group w-full justify-between rounded-xl">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" strokeWidth={1.5} />Open active incident</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} /></span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-[248px] shrink-0 border-r border-line/10 bg-panel/90 xl:block">
      <NavigationContent />
    </aside>
  );
}
