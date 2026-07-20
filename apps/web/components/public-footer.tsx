import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const footerLinks = [
  {
    title: "Product",
    links: [
      ["Investigation", "#product"],
      ["Method", "#method"],
      ["Security", "#security"],
    ],
  },
  {
    title: "Workspace",
    links: [
      ["Incident command", "/dashboard"],
      ["Evidence archive", "/evidence"],
      ["Evaluation lab", "/evals"],
    ],
  },
  {
    title: "Access",
    links: [
      ["Sign in", "/login"],
      ["Create workspace", "/signup"],
      ["View source", "https://github.com/InsaneCoder789/IncidentLens"],
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="public-footer bg-[#050809] text-bone">
      <div className="mx-auto max-w-[1800px] px-5 pb-8 pt-20 sm:px-8 lg:px-14 lg:pb-10 lg:pt-28">
        <div className="grid gap-16 border-b border-white/15 pb-20 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/brand/incidentlens-mark-v2.png" alt="" width={40} height={40} className="h-10 w-10 bg-bone p-1.5 object-contain" />
              <span className="text-lg font-semibold tracking-[-0.03em]">IncidentLens</span>
            </div>
            <h2 className="mt-10 max-w-[980px] font-display text-[clamp(4rem,7vw,7.5rem)] font-semibold uppercase leading-[0.8] tracking-[-0.035em]">
              Make the next decision <span className="text-cyan">defensible.</span>
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="max-w-md text-lg leading-8 text-bone/55">Bring telemetry, evidence, agent reasoning, and human approval into one accountable operating loop.</p>
            <Link href="/signup" className="instrument-button group mt-8 min-w-[270px] justify-between">
              Create your workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="grid gap-14 py-16 lg:grid-cols-[1.2fr_1fr]">
          <div className="max-w-xl">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-decision">The operating principle</div>
            <p className="mt-5 font-display text-3xl font-medium uppercase leading-tight text-bone/85 sm:text-4xl">Evidence before claims. Approval before action. Evaluation after every outcome.</p>
          </div>
          <nav className="grid grid-cols-2 gap-10 sm:grid-cols-3" aria-label="Footer navigation">
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone/35">{group.title}</h3>
                <ul className="mt-5 space-y-3">
                  {group.links.map(([label, href]) => {
                    const external = href.startsWith("http");
                    return (
                      <li key={label}>
                        <Link href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="group inline-flex items-center gap-2 text-sm text-bone/60 transition-colors hover:text-bone">
                          {label}
                          {external ? <ArrowUpRight className="h-3.5 w-3.5 text-cyan transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-7 font-mono text-[9px] uppercase tracking-[0.14em] text-bone/35 sm:flex-row sm:items-center sm:justify-between">
          <span>IncidentLens / Evidence-grounded incident intelligence</span>
          <div className="flex gap-6"><span>Engineering operations</span><span>2026</span></div>
        </div>
      </div>
    </footer>
  );
}
