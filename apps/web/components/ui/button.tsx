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
        "inline-flex min-h-11 items-center justify-center rounded-[10px] border font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
        size === "sm" && "h-11 px-3 text-xs md:h-9 md:min-h-9",
        size === "md" && "h-11 px-4 text-xs",
        size === "lg" && "h-12 px-5 text-sm",
        variant === "default" && "border-accent/70 bg-accent text-[#071014] hover:bg-[#69c2cf]",
        variant === "secondary" && "border-line/15 bg-panel2 text-text hover:border-line/25 hover:bg-panel3",
        variant === "ghost" && "border-transparent bg-transparent text-muted hover:bg-panel2 hover:text-text",
        variant === "outline" && "border-line/20 bg-transparent text-text hover:border-accent/35 hover:bg-accent/5",
        className,
      )}
      {...props}
    />
  );
}
