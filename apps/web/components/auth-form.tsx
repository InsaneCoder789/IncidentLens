"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getApiErrorMessage(result, "We could not complete that request."));
      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not complete that request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8" noValidate>
      <div className={mode === "signup" ? "grid gap-5 sm:grid-cols-2" : "space-y-5"}>
        {mode === "signup" ? <AuthInput label="Full name" name="full_name" autoComplete="name" placeholder="Jane Operator" minLength={2} /> : null}
        <AuthInput label="Work email" name="email" type="email" autoComplete="email" placeholder="you@company.com" />
        <div className="block text-sm font-medium text-ink">
          <label htmlFor={`${mode}-password`}>Password</label>
          <span className="relative mt-2 block">
            <input id={`${mode}-password`} className="auth-field pr-12" name="password" type={showPassword ? "text" : "password"} minLength={mode === "signup" ? 10 : 1} autoComplete={mode === "signup" ? "new-password" : "current-password"} required />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-ink/45 hover:text-ink" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </span>
        </div>
        {mode === "signup" ? <AuthInput label="Team name" name="team_name" autoComplete="organization" placeholder="Engineering Operations" minLength={2} /> : null}
      </div>
      {error ? <div role="alert" className="mt-5 border-l-2 border-decision bg-decision/10 px-4 py-3 text-sm text-[#9a3510]">{error}</div> : null}
      <button type="submit" disabled={submitting} className="mt-6 flex min-h-14 w-full items-center justify-between bg-decision px-6 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-[#ff7a2c] disabled:cursor-wait disabled:opacity-70">
        <span>{submitting ? "Securing session" : mode === "signup" ? "Create workspace" : "Enter workspace"}</span>{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
      </button>
      <div className="mt-5 text-sm text-ink/65">{mode === "signup" ? "Already have an account?" : "New to IncidentLens?"} <Link href={mode === "signup" ? "/login" : "/signup"} className="ml-1 border-b border-decision text-ink">{mode === "signup" ? "Sign in" : "Create an account"}</Link></div>
    </form>
  );
}

function AuthInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="block text-sm font-medium text-ink"><span>{label}</span><input {...props} className="auth-field mt-2" required /></label>;
}
