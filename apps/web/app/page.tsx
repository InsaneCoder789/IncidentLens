import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Crosshair, FileSearch, GitBranch, LockKeyhole } from "lucide-react";
import { PublicHeader } from "@/components/public-header";

const method = [
  { number: "01", title: "Observe", copy: "Capture logs, traces, metrics, deployments, and operator context as evidence." },
  { number: "02", title: "Correlate", copy: "Connect related signals across sources without flattening their provenance." },
  { number: "03", title: "Explain", copy: "Build a cited timeline and surface the strongest root-cause hypothesis." },
  { number: "04", title: "Approve", copy: "Keep consequential actions behind explicit, recorded human decisions." },
];

export default function HomePage() {
  return (
    <div className="public-site min-h-screen bg-ink text-bone">
      <PublicHeader />
      <main>
        <section className="relative min-h-[940px] overflow-hidden border-b border-white/10 lg:min-h-[min(940px,100vh)]">
          <Image src="/visuals/incident-observatory.png" alt="Signals converging through an incident correlation lens" fill priority className="object-cover object-center opacity-65" sizes="100vw" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,11,13,.98)_0%,rgba(7,11,13,.9)_31%,rgba(7,11,13,.16)_68%,rgba(7,11,13,.62)_100%)]" />
          <div className="public-grid relative mx-auto flex min-h-[940px] max-w-[1800px] items-end px-5 pb-16 pt-36 sm:px-8 lg:min-h-[min(940px,100vh)] lg:px-14 lg:pb-20">
            <div className="max-w-[780px]">
              <div className="mb-7 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
                <span className="h-px w-10 bg-signal" /> Evidence-grounded incident intelligence
              </div>
              <h1 className="font-display text-[clamp(4.4rem,9vw,9.5rem)] font-semibold uppercase leading-[0.78] tracking-[-0.035em] text-bone">
                See the failure before the room gets loud.
              </h1>
              <div className="mt-9 max-w-[530px] border-l-2 border-decision pl-5">
                <p className="text-base leading-7 text-bone/70 sm:text-lg">IncidentLens assembles telemetry, evidence, and agent reasoning into one defensible incident narrative.</p>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <Link href="/signup" className="instrument-button group">Enter command <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                <a href="#method" className="inline-flex items-center gap-3 border-b border-decision/80 pb-2 text-sm text-bone/75 transition-colors hover:text-bone">See how it works <ArrowDown className="h-4 w-4 text-decision" /></a>
              </div>
            </div>
            <div className="absolute bottom-8 right-8 hidden items-center gap-3 font-mono text-[9px] uppercase tracking-[0.18em] text-bone/45 lg:flex">
              <Crosshair className="h-4 w-4 text-cyan" /> One version of events
            </div>
          </div>
        </section>

        <section id="method" className="bg-paper text-ink">
          <div className="mx-auto max-w-[1800px] px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
              <div>
                <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-decision">{"// The IncidentLens method"}</div>
                <h2 className="max-w-[1100px] font-display text-[clamp(4rem,8vw,8rem)] font-semibold uppercase leading-[0.82] tracking-[-0.03em]">An investigation, not another inbox.</h2>
              </div>
              <p className="border-t border-ink/30 pt-5 text-xl leading-8 text-ink/65">Signals arrive separately. The response should not.</p>
            </div>

            <div className="mt-20 grid border-y border-ink/25 lg:grid-cols-4">
              {method.map((item, index) => (
                <article key={item.number} className="relative border-b border-ink/20 px-0 py-8 lg:border-b-0 lg:border-r lg:px-7 lg:last:border-r-0">
                  <div className="flex items-center gap-3"><span className="font-mono text-sm text-signal">{item.number}</span><h3 className="font-display text-3xl font-semibold uppercase tracking-wide">{item.title}</h3></div>
                  <p className="mt-4 max-w-[280px] text-sm leading-6 text-ink/60">{item.copy}</p>
                  {index < method.length - 1 ? <ArrowRight className="absolute right-5 top-9 hidden h-4 w-4 text-signal lg:block" /> : null}
                </article>
              ))}
            </div>

            <div className="relative mt-14 overflow-hidden border border-ink/20 bg-ink">
              <Image src="/visuals/evidence-archive.png" alt="Incident evidence connected into a causal chain" width={1536} height={1024} className="aspect-[4/5] w-full object-cover opacity-90 sm:aspect-[4/3] lg:aspect-[16/8]" sizes="(max-width: 1800px) 100vw, 1700px" />
              <div className="absolute inset-x-0 bottom-0 grid gap-3 bg-gradient-to-t from-ink via-ink/90 to-transparent px-6 pb-7 pt-20 text-bone sm:grid-cols-3 lg:px-10">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan">Payment API / deployment regression</span>
                <span className="text-sm text-bone/65">Eight sources correlated into one cited timeline.</span>
                <span className="text-sm text-bone sm:text-right">Root cause confidence <strong className="text-cyan">87%</strong></span>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="bg-ink text-bone">
          <div className="mx-auto max-w-[1800px] px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
            <div className="grid gap-16 lg:grid-cols-[1.05fr_.75fr_.9fr] lg:items-start">
              <div>
                <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">Humans in control</div>
                <h2 className="font-display text-[clamp(4rem,7vw,7.2rem)] font-semibold uppercase leading-[0.82] tracking-[-0.03em]">Automation can propose. <span className="text-decision">Operators decide.</span></h2>
                <p className="mt-8 max-w-lg text-lg leading-8 text-bone/60">Every consequential action stays approval-gated, cited, and auditable.</p>
              </div>
              <div className="relative border-l border-cyan/35 pl-7 lg:mt-24">
                {[
                  ["EVID-7A3F2C1B", "Alert triggered on elevated error rate"],
                  ["EVID-19D4E7A6", "Latency objective breached after deploy"],
                  ["EVID-3C9B0D91", "Configuration diff narrows causal path"],
                  ["EVID-8F21C6DE", "Runbook recommends rollback with approval"],
                ].map(([id, copy]) => <div key={id} className="relative border-b border-white/10 py-5 first:pt-0"><span className="absolute -left-[33px] top-6 h-3 w-3 rounded-full border border-cyan bg-ink" /><div className="font-mono text-[10px] text-cyan">{id}</div><p className="mt-2 text-sm leading-6 text-bone/65">{copy}</p></div>)}
              </div>
              <div className="approval-instrument lg:mt-10">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone/50">Proposed action</div>
                <div className="mt-5 border-y border-white/15 py-5 text-xl">Rollback payments-api to the prior stable release</div>
                <div className="mt-7 font-mono text-[10px] uppercase tracking-[0.16em] text-decision">Requires operator approval</div>
                <div className="mx-auto mt-9 flex aspect-square max-w-[220px] items-center justify-center rounded-full border-[18px] border-[#2b2f2f] bg-decision text-center font-display text-4xl font-semibold uppercase text-ink shadow-[inset_0_0_0_2px_rgba(0,0,0,.45),0_15px_45px_rgba(0,0,0,.4)]">Approve</div>
                <div className="mt-8 flex justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-bone/35"><span>Review evidence</span><span>Modify / deny</span></div>
              </div>
            </div>

            <div className="mt-24 flex flex-col gap-8 border-t border-white/15 pt-10 lg:flex-row lg:items-end lg:justify-between">
              <h3 className="max-w-[900px] font-display text-[clamp(3.5rem,6vw,6.5rem)] font-semibold uppercase leading-[0.85]">Bring clarity to the next incident.</h3>
              <Link href="/signup" className="decision-button group shrink-0">Start with IncidentLens <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></Link>
            </div>
          </div>
        </section>

        <section id="security" className="border-t border-white/10 bg-[#050809] px-5 py-14 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1800px] gap-8 md:grid-cols-3">
            <div className="flex items-start gap-4"><LockKeyhole className="mt-1 h-5 w-5 text-cyan" /><div><div className="text-sm font-medium">Approval-gated by design</div><p className="mt-2 text-sm leading-6 text-bone/45">No autonomous production changes.</p></div></div>
            <div className="flex items-start gap-4"><FileSearch className="mt-1 h-5 w-5 text-cyan" /><div><div className="text-sm font-medium">Evidence before claims</div><p className="mt-2 text-sm leading-6 text-bone/45">Every recommendation carries its sources.</p></div></div>
            <div className="flex items-start gap-4"><GitBranch className="mt-1 h-5 w-5 text-cyan" /><div><div className="text-sm font-medium">A complete decision trail</div><p className="mt-2 text-sm leading-6 text-bone/45">Agent traces, actions, and outcomes remain reviewable.</p></div></div>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 bg-ink px-5 py-8 text-bone/45 sm:px-8 lg:px-14">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between"><span>IncidentLens / Evidence. Reasoning. Control.</span><span className="font-mono text-[9px] uppercase tracking-[0.16em]">Built for engineering operations</span></div>
      </footer>
    </div>
  );
}
