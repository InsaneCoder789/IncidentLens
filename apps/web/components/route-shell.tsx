"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app-shell";

const workspacePrefixes = ["/dashboard", "/incidents", "/evidence", "/evals", "/settings"];

export function RouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWorkspace = workspacePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return isWorkspace ? <AppShell>{children}</AppShell> : children;
}
