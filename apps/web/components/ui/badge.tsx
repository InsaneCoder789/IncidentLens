import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]", className)}>{children}</span>;
}
