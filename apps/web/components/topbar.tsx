"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, Server } from "lucide-react";
import { NavigationContent } from "@/components/sidebar";
import { navigationItems, routeContext } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getIncidents } from "@/lib/api";
import type { Incident } from "@/lib/types";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const context = routeContext(pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    let active = true;
    getIncidents().then((items) => {
      if (active) {
        setIncidents(items);
        setApiConnected(true);
      }
    }).catch(() => {
      if (active) {
        setIncidents([]);
        setApiConnected(false);
      }
    });
    return () => { active = false; };
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const routeResults = navigationItems.filter((item) => !normalized || `${item.label} ${item.description}`.toLowerCase().includes(normalized));
    const incidentResults = incidents.filter((incident) => !normalized || `${incident.title} ${incident.affected_service} ${incident.status}`.toLowerCase().includes(normalized));
    return { routes: routeResults, incidents: incidentResults };
  }, [incidents, query]);

  function navigate(href: string) {
    setSearchOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/10 bg-bg/88 px-4 py-3 backdrop-blur-xl md:px-7">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-11 w-11 px-0 xl:hidden" aria-label="Open navigation">
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="sr-only">IncidentLens navigation</SheetTitle>
              <SheetDescription className="sr-only">Navigate between command, incidents, evidence, traces, evaluations, and settings.</SheetDescription>
              <NavigationContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <div className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted">{context.eyebrow}</div>
            <div className="truncate text-sm font-semibold tracking-tight text-text">{context.title}</div>
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-10 w-full max-w-[360px] items-center gap-2 rounded-xl border border-line/12 bg-panel/80 px-3 text-left text-xs text-muted transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-line/25 hover:text-text md:flex"
          >
            <Search className="h-4 w-4" strokeWidth={1.5} />
            <span className="flex-1">Search incidents and workspaces</span>
            <kbd className="rounded-md border border-line/15 bg-bg/60 px-1.5 py-1 font-mono text-[9px]">⌘K</kbd>
          </button>

          <Button variant="ghost" size="sm" className="h-11 w-11 px-0 md:hidden" onClick={() => setSearchOpen(true)} aria-label="Search">
            <Search className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <div className="hidden items-center gap-2 rounded-xl border border-line/10 bg-panel/65 px-3 py-2 lg:flex">
            <Server className={`h-3.5 w-3.5 ${apiConnected ? "text-success" : apiConnected === false ? "text-danger" : "text-muted"}`} strokeWidth={1.5} />
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{apiConnected ? "API connected" : apiConnected === false ? "API unavailable" : "Checking API"}</span>
          </div>
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <div className="border-b border-line/10 p-5 pr-14">
            <DialogTitle>Command search</DialogTitle>
            <DialogDescription>Jump to an incident or operational workspace.</DialogDescription>
          </div>
          <div className="p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.5} />
              <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" placeholder="Search incidents, services, and workspaces..." />
            </div>
            <div className="scrollbar-thin mt-3 max-h-[55vh] overflow-y-auto">
              {results.routes.length ? <div className="label-caps px-2 py-2 text-muted">Workspaces</div> : null}
              {results.routes.map(({ href, label, description, icon: Icon }) => (
                <button key={href} type="button" onClick={() => navigate(href)} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-panel2">
                  <Icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
                  <span><span className="block text-sm text-text">{label}</span><span className="block text-xs text-muted">{description}</span></span>
                </button>
              ))}
              {results.incidents.length ? <div className="label-caps mt-2 px-2 py-2 text-muted">Incidents</div> : null}
              {results.incidents.map((incident) => (
                <button key={incident.id} type="button" onClick={() => navigate(`/incidents/${incident.id}`)} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-left hover:bg-panel2">
                  <span className="min-w-0"><span className="block truncate text-sm text-text">{incident.title}</span><span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-muted">INC-{String(incident.id).padStart(4, "0")} / {incident.affected_service}</span></span>
                  <span className="rounded-full border border-line/10 px-2 py-1 text-[10px] capitalize text-muted">{incident.status}</span>
                </button>
              ))}
              {!results.routes.length && !results.incidents.length ? <div className="px-4 py-10 text-center text-sm text-muted">No matching incidents or workspaces.</div> : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
