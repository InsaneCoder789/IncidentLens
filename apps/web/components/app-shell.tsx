import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-bg text-text">
      <div className="flex min-h-[100dvh]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="app-canvas relative flex-1 overflow-hidden px-4 py-5 md:px-7 md:py-7">
            <div className="pointer-events-none absolute right-0 top-0 h-[360px] w-[360px] opacity-25 [background:radial-gradient(circle_at_center,rgba(58,212,230,.16),transparent_68%)]" />
            <div className="page-enter mx-auto max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
