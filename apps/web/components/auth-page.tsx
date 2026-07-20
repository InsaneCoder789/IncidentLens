import Image from "next/image";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { AuthForm } from "@/components/auth-form";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const login = mode === "login";
  const paper = (
    <section className={`auth-paper relative z-10 flex min-h-[100dvh] items-center px-6 py-28 text-ink sm:px-12 lg:px-16 ${login ? "auth-paper-login" : "auth-paper-signup"}`}>
      <div className={`w-full max-w-[610px] ${login ? "lg:ml-auto" : ""}`}>
        <h1 className="font-display text-[clamp(4.5rem,7vw,7.8rem)] font-semibold uppercase leading-[0.8] tracking-[-0.035em]">{login ? "Return to the incident room." : "Build a calmer incident room."}</h1>
        <div className="mt-6 h-1 w-9 bg-decision" />
        <p className="mt-6 max-w-lg text-base leading-7 text-ink/65">{login ? "Your evidence, traces, and decisions are waiting." : "Create the workspace your operators can trust when production gets noisy."}</p>
        <AuthForm mode={mode} />
        <div className="mt-12 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/55"><LockKeyhole className="h-4 w-4 text-signal" />{login ? "Protected operator access" : "No autonomous production changes. Ever."}</div>
      </div>
    </section>
  );
  const visual = (
    <section className="relative hidden min-h-[100dvh] overflow-hidden bg-ink lg:block">
      <Image src={login ? "/visuals/incident-observatory.png" : "/visuals/evidence-archive.png"} alt={login ? "Incident signals converging through a correlation lens" : "Evidence connected into one causal chain"} fill priority className="object-cover" sizes="60vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/30" />
      <div className="absolute bottom-10 left-10 border-l border-cyan/60 pl-4 font-mono text-[9px] uppercase tracking-[0.16em] text-bone/60">Observation / evidence / resolution</div>
    </section>
  );
  return (
    <main className="relative min-h-screen bg-ink">
      <Link href="/" className={`absolute left-6 top-6 z-30 flex items-center gap-3 sm:left-10 sm:top-9 ${login ? "text-bone lg:text-bone" : "text-ink"}`}>
        <Image src="/brand/incidentlens-mark-v2.png" alt="" width={34} height={34} className="h-10 w-10 bg-bone p-1 object-contain" priority /><span className="text-lg font-semibold tracking-[-0.03em]">IncidentLens</span>
      </Link>
      <div className={`grid min-h-screen lg:grid-cols-[1.08fr_.92fr] ${login ? "" : "lg:grid-cols-[.92fr_1.08fr]"}`}>{login ? <>{visual}{paper}</> : <>{paper}{visual}</>}</div>
    </main>
  );
}
