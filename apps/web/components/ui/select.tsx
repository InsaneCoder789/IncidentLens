import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 rounded-md border border-line bg-[#0b0f19] px-3 text-xs text-slate-100 outline-none focus:border-accent",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
