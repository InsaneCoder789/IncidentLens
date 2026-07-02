import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-line bg-[#0b0f19] px-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none ring-0 focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}
