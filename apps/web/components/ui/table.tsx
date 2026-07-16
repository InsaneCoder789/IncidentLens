import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <table className={cn("w-full border-collapse text-left text-sm", className)}>{children}</table>;
}

export function THead({ children }: React.PropsWithChildren) {
  return <thead className="text-xs uppercase tracking-[0.18em] text-slate-400">{children}</thead>;
}

export function TBody({ children }: React.PropsWithChildren) {
  return <tbody className="divide-y divide-white/8">{children}</tbody>;
}

export function Tr({ className, children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLTableRowElement>>) {
  return <tr className={cn("transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-line/[0.035]", className)} {...props}>{children}</tr>;
}

export function Th({ className, children, ...props }: React.PropsWithChildren<React.ThHTMLAttributes<HTMLTableCellElement>>) {
  return <th className={cn("px-4 py-3 font-medium", className)} {...props}>{children}</th>;
}

export function Td({ className, children, ...props }: React.PropsWithChildren<React.TdHTMLAttributes<HTMLTableCellElement>>) {
  return <td className={cn("px-4 py-4 align-top", className)} {...props}>{children}</td>;
}
