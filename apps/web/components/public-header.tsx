import Image from "next/image";
import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-40 border-b border-white/10 bg-ink/55 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between px-5 sm:px-8 lg:px-14">
        <Link href="/" className="flex items-center gap-3" aria-label="IncidentLens home">
          <Image src="/brand/incidentlens-mark-v2.png" alt="" width={34} height={34} className="h-9 w-9 bg-bone p-1 object-contain" priority />
          <span className="text-lg font-semibold tracking-[-0.03em] text-bone">IncidentLens</span>
        </Link>
        <nav className="hidden items-center gap-9 text-sm text-bone/60 md:flex" aria-label="Public navigation">
          <a href="#product" className="transition-colors hover:text-bone">Investigation</a>
          <a href="#method" className="transition-colors hover:text-bone">Method</a>
          <a href="#security" className="transition-colors hover:text-bone">Security</a>
        </nav>
        <div className="flex items-center gap-4"><Link href="/login" className="text-sm text-bone/70 hover:text-bone">Sign in</Link><Link href="/signup" className="hidden border-l border-decision pl-4 text-sm text-bone sm:block">Create workspace</Link></div>
      </div>
    </header>
  );
}
