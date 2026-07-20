import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Crosshair,
  FileSearch,
  GitBranch,
  LockKeyhole,
} from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

const method = [
  { number: "01", title: "Observe", copy: "Capture logs, traces, metrics, deployments, and operator context as evidence." },
  { number: "02", title: "Correlate", copy: "Connect related signals across sources without flattening their provenance." },
  { number: "03", title: "Explain", copy: "Build a cited timeline and surface the strongest root-cause hypothesis." },
  { number: "04", title: "Approve", copy: "Keep consequential actions behind explicit, recorded human decisions." },
];

const sourceTypes = [
  ["Alerts", "The first indication, not the final explanation."],
  ["Logs + traces", "Runtime detail normalized into retrievable evidence."],
  ["Deployments", "Code and configuration changes placed on the same clock."],
  ["Runbooks", "Operational knowledge retrieved with source boundaries intact."],
  ["Operator context", "Human observations preserved alongside machine telemetry."],
];

const agentStages = [
  ["01", "Intake", "Classify severity, affected services, and the investigation scope."],
  ["02", "Retrieve", "Find relevant evidence across uploaded and connected sources."],
  ["03", "Reason", "Compare causal hypotheses against the timeline and citations."],
  ["04", "Plan", "Draft reversible remediation with risks and prerequisites."],
  ["05", "Evaluate", "Score the report before it reaches an operator."],
];

const reportAnatomy = [
  ["Cited timeline", "Every material event points back to its source."],
  ["Ranked hypotheses", "Competing explanations stay visible with confidence and counter-evidence."],
  ["Missing evidence", "Unknowns are called out instead of being filled with confident prose."],
  ["Action plan", "Suggested next steps include risk, reversibility, and approval status."],
];

const evaluationMeasures = [
  ["Grounding", "Are material claims supported by retrieved evidence?"],
  ["Causal accuracy", "Does the ranked root cause match the known incident outcome?"],
  ["Operational safety", "Are risky or irreversible actions correctly gated?"],
  ["Regression", "Did a prompt, model, or retrieval change make prior cases worse?"],
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
                <a href="#method" className="inline-flex items-center gap-3 border-b border-decision/80 pb-2 text-sm text-bone/75 transition-colors hover:text-bone">Follow the investigation <ArrowDown className="h-4 w-4 text-decision" /></a>
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
                  <div className="flex items-center gap-4"><span className="font-display text-3xl font-semibold leading-none text-[#087985]">{item.number}</span><h3 className="font-display text-3xl font-semibold uppercase tracking-wide">{item.title}</h3></div>
                  <p className="mt-4 max-w-[280px] text-sm leading-6 text-ink/60">{item.copy}</p>
                  {index < method.length - 1 ? <ArrowRight className="absolute right-5 top-9 hidden h-4 w-4 text-signal lg:block" /> : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="product" className="overflow-hidden bg-ink text-bone">
          <div className="editorial-chapter mx-auto max-w-[1800px] px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
            <div className="chapter-marker"><span>01</span><span>From noise to evidence</span></div>
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <div>
                <p className="eyebrow">What enters the system</p>
                <h2 className="editorial-title">Incidents do not arrive as stories.</h2>
              </div>
              <p className="max-w-2xl text-xl leading-8 text-bone/60 lg:justify-self-end lg:text-2xl lg:leading-9">They arrive as timestamps, screenshots, traces, alerts, deploys, and incomplete human observations. IncidentLens keeps each source intact while placing every event on a shared investigative timeline.</p>
            </div>
            <div className="editorial-media mt-16">
              <Image src="/visuals/signal-convergence.png" alt="Fragmented telemetry signals converging through a correlation plane" width={1672} height={941} className="h-full w-full object-cover" sizes="(max-width: 1800px) 100vw, 1700px" />
              <div className="media-caption"><span>Input / raw operational evidence</span><span>Normalize without erasing provenance</span></div>
            </div>
            <div className="mt-12 grid border-t border-white/15 md:grid-cols-5">
              {sourceTypes.map(([title, copy]) => (
                <article key={title} className="border-b border-white/10 py-6 md:border-b-0 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0">
                  <h3 className="font-display text-2xl font-semibold uppercase tracking-wide">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-bone/50">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-paper text-ink">
          <div className="editorial-chapter mx-auto max-w-[1800px] px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
            <div className="chapter-marker chapter-marker-dark"><span>02</span><span>Coordinated investigation</span></div>
            <div className="grid gap-10 lg:grid-cols-[1.15fr_.65fr] lg:items-end">
              <h2 className="editorial-title max-w-[1050px]">Five agents. One accountable chain of reasoning.</h2>
              <p className="border-t border-ink/25 pt-5 text-lg leading-8 text-ink/60">Specialized agents do focused work. The orchestrator carries evidence, uncertainty, and tool results forward as typed state, producing a trace that can be inspected after the incident.</p>
            </div>
            <div className="mt-16 bg-[#0a0d0e]">
              <Image src="/visuals/investigation-instruments.png" alt="Five investigative instruments linked by evidence signals" width={1672} height={941} className="aspect-[16/10] w-full object-cover lg:aspect-[16/8]" sizes="(max-width: 1800px) 100vw, 1700px" />
            </div>
            <div className="agent-sequence">
              {agentStages.map(([number, title, copy]) => (
                <article key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-[#050809] text-bone">
          <div className="editorial-chapter mx-auto max-w-[1800px] px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
            <div className="chapter-marker"><span>03</span><span>The investigation output</span></div>
            <div className="grid gap-14 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
              <div>
                <p className="eyebrow">One defensible incident report</p>
                <h2 className="editorial-title">Claims carry receipts.</h2>
                <p className="mt-8 max-w-xl text-lg leading-8 text-bone/58">The report is not a summary pasted over uncertainty. It is a structured operational artifact that separates observed facts, agent inference, unresolved questions, and proposed action.</p>
                <div className="mt-10 border-t border-white/15">
                  {reportAnatomy.map(([title, copy], index) => (
                    <div key={title} className="grid grid-cols-[34px_1fr] gap-4 border-b border-white/10 py-5">
                      <span className="font-mono text-xs text-cyan">0{index + 1}</span>
                      <div><h3 className="text-sm font-semibold text-bone">{title}</h3><p className="mt-1 text-sm leading-6 text-bone/45">{copy}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="report-plate">
                <Image src="/visuals/cited-incident-report.png" alt="Forensic incident report connected to its evidence sources" width={1448} height={1086} className="h-auto w-full" sizes="(max-width: 1024px) 100vw, 62vw" />
                <div className="report-stamp">Evidence linked<br />Confidence explicit</div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-paper text-ink">
          <div className="mx-auto max-w-[1800px] px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
            <div className="chapter-marker chapter-marker-dark"><span>04</span><span>Human decision point</span></div>
            <div className="grid gap-16 lg:grid-cols-[1.05fr_.75fr_.9fr] lg:items-start">
              <div>
                <p className="eyebrow text-decision">Humans remain in control</p>
                <h2 className="font-display text-[clamp(4rem,7vw,7.2rem)] font-semibold uppercase leading-[0.82] tracking-[-0.03em]">Automation can propose. <span className="text-decision">Operators decide.</span></h2>
                <p className="mt-8 max-w-lg text-lg leading-8 text-ink/60">Every consequential action stays approval-gated, cited, and auditable. The system can prepare a rollback, but it cannot quietly cross the production boundary.</p>
              </div>
              <div className="relative border-l border-cyan/50 pl-7 lg:mt-24">
                {[
                  ["EVID-7A3F2C1B", "Alert triggered on elevated error rate"],
                  ["EVID-19D4E7A6", "Latency objective breached after deploy"],
                  ["EVID-3C9B0D91", "Configuration diff narrows causal path"],
                  ["EVID-8F21C6DE", "Runbook recommends rollback with approval"],
                ].map(([id, copy]) => <div key={id} className="relative border-b border-ink/15 py-5 first:pt-0"><span className="absolute -left-[33px] top-6 h-3 w-3 rounded-full border border-cyan bg-paper" /><div className="font-mono text-[10px] text-[#087985]">{id}</div><p className="mt-2 text-sm leading-6 text-ink/60">{copy}</p></div>)}
              </div>
              <div className="approval-instrument lg:mt-10">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone/50">Proposed action</div>
                <div className="mt-5 border-y border-white/15 py-5 text-xl">Rollback payments-api to the prior stable release</div>
                <div className="mt-7 font-mono text-[10px] uppercase tracking-[0.16em] text-decision">Requires operator approval</div>
                <div className="mx-auto mt-9 flex aspect-square max-w-[220px] items-center justify-center rounded-full border-[18px] border-[#2b2f2f] bg-decision text-center font-display text-4xl font-semibold uppercase text-ink shadow-[inset_0_0_0_2px_rgba(0,0,0,.45),0_15px_45px_rgba(0,0,0,.4)]">Approve</div>
                <div className="mt-8 flex justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-bone/35"><span>Review evidence</span><span>Modify / deny</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-ink text-bone">
          <div className="editorial-chapter mx-auto max-w-[1800px] px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
            <div className="chapter-marker"><span>05</span><span>Evaluation and learning</span></div>
            <div className="grid gap-10 lg:grid-cols-[1.05fr_.75fr] lg:items-end">
              <div>
                <p className="eyebrow">Resolution is not the end</p>
                <h2 className="editorial-title">Every incident calibrates the next.</h2>
              </div>
              <p className="max-w-2xl border-t border-white/15 pt-5 text-lg leading-8 text-bone/58 lg:justify-self-end">Resolved outcomes become evaluation cases. Prompt versions, retrieval settings, model routes, cost, latency, and safety behavior can be compared before a change reaches production.</p>
            </div>
            <div className="evaluation-visual mt-16">
              <Image src="/visuals/evaluation-loop.png" alt="Circular calibration instrument evaluating incident outcomes" width={1672} height={941} className="h-full w-full object-cover" sizes="(max-width: 1800px) 100vw, 1700px" />
            </div>
            <div className="evaluation-sequence">
              {evaluationMeasures.map(([title, copy]) => (
                <article key={title}><Check className="h-4 w-4 text-emerald-400" /><h3>{title}</h3><p>{copy}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-paper text-ink">
          <div className="mx-auto max-w-[1800px] px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
            <div className="grid gap-12 lg:grid-cols-[1fr_.7fr] lg:items-end">
              <div>
                <p className="eyebrow text-decision">The complete operating loop</p>
                <h2 className="editorial-title max-w-[1050px]">From first signal to reviewed outcome.</h2>
              </div>
              <p className="text-lg leading-8 text-ink/60">IncidentLens is built as one connected system, not a collection of disconnected AI screens.</p>
            </div>
            <div className="mt-16 grid border-y border-ink/25 md:grid-cols-7">
              {["Ingest", "Normalize", "Retrieve", "Investigate", "Report", "Approve", "Evaluate"].map((item, index) => (
                <div key={item} className="relative border-b border-ink/15 py-6 md:border-b-0 md:border-r md:px-4 md:last:border-r-0">
                  <div className="font-mono text-[10px] text-decision">0{index + 1}</div><div className="mt-2 font-display text-xl font-semibold uppercase">{item}</div>
                  {index < 6 ? <ArrowRight className="absolute -right-2 top-8 z-10 hidden h-4 w-4 bg-paper text-decision md:block" /> : null}
                </div>
              ))}
            </div>
            <div className="mt-16 flex flex-col gap-8 border-t border-ink/20 pt-10 lg:flex-row lg:items-end lg:justify-between">
              <h3 className="max-w-[950px] font-display text-[clamp(3.5rem,6vw,6.5rem)] font-semibold uppercase leading-[0.85]">Bring clarity to the next incident.</h3>
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
      <PublicFooter />
    </div>
  );
}
