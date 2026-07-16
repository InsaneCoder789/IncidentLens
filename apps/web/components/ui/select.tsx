import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 rounded-[10px] border border-line/15 bg-bg/70 px-3.5 text-sm text-text outline-none transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-accent/60 focus:ring-2 focus:ring-accent/10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
