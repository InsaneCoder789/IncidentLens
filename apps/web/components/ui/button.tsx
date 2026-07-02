import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "default", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md border font-medium transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-8 px-2.5 text-[11px]",
        size === "md" && "h-9 px-3 text-xs",
        size === "lg" && "h-10 px-4 text-sm",
        variant === "default" && "border-accent bg-accent text-white hover:bg-[#0d63db]",
        variant === "secondary" && "border-[#30363d] bg-panel text-slate-100 hover:bg-panel2",
        variant === "ghost" && "border-transparent bg-transparent text-slate-200 hover:border-[#30363d] hover:bg-panel",
        variant === "outline" && "border-[#30363d] bg-transparent text-slate-100 hover:bg-panel",
        className,
      )}
      {...props}
    />
  );
}
