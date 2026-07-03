import Link from "next/link";
import { Bell, GitBranch, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-[#10131b]/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <Input className="pl-8" placeholder="Search incidents, traces, or logs..." />
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <span className="border-b-2 border-[#568dff] pb-1 text-sm font-medium text-[#b0c6ff]">
              Prod
            </span>
            <span className="text-sm text-slate-500">
              Staging
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden lg:inline-flex">
            <Bell className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="hidden lg:inline-flex">
            <GitBranch className="h-3.5 w-3.5" />
          </Button>
          <Link href="/evidence">
            <Button variant="secondary" size="sm" className="gap-2">
              Add Evidence
            </Button>
          </Link>
          <Link href="/incidents/1">
            <Button size="sm" className="gap-2 border-[#8957e5] bg-[#8957e5] hover:bg-[#7445d0]">
              <Sparkles className="h-3.5 w-3.5" />
              AI Report
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
