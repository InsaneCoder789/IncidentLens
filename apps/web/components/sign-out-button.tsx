"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  return <button type="button" onClick={signOut} className="flex min-h-11 w-full items-center justify-center gap-2 border border-line/10 text-xs text-muted transition-colors hover:border-line/25 hover:text-text" aria-label="Sign out"><LogOut className="h-4 w-4" />{compact ? null : "Sign out"}</button>;
}
