import * as React from "react";
import { cn } from "@/lib/utils";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...props }: React.PropsWithChildren<DivProps>) {
  return (
    <div className={cn("surface-shell", className)} {...props}>
      <div className="surface-core h-full">{children}</div>
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.PropsWithChildren<DivProps>) {
  return (
    <div className={cn("border-b border-line/10 px-5 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.PropsWithChildren<DivProps>) {
  return (
    <div className={cn("px-5 py-4", className)} {...props}>
      {children}
    </div>
  );
}
