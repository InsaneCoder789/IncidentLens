import Link from "next/link";
import { Bell, Search, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-[#0f131c]/95 px-3 py-2 backdrop-blur md:px-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-[340px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <Input className="pl-8" placeholder="Search incidents, traces, or logs..." />
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-md border border-line bg-panel px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-300">
              Prod
            </span>
            <span className="rounded-md border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">
              Staging
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden lg:inline-flex">
            <Bell className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="hidden lg:inline-flex">
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <Button variant="secondary" size="sm" className="gap-2">
            Add Evidence
          </Button>
          <Link href="/incidents/1">
            <Button size="sm" className="gap-2 bg-[#7b3ff3] hover:bg-[#6d31e5]">
              <Sparkles className="h-3.5 w-3.5" />
              AI Report
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
