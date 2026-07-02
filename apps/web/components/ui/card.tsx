import * as React from "react";
import { cn } from "@/lib/utils";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...props }: React.PropsWithChildren<DivProps>) {
  return (
    <div className={cn("glass rounded-lg shadow-glow", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.PropsWithChildren<DivProps>) {
  return (
    <div className={cn("border-b border-line px-4 py-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.PropsWithChildren<DivProps>) {
  return (
    <div className={cn("px-4 py-3", className)} {...props}>
      {children}
    </div>
  );
}
