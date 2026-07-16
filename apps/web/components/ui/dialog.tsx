"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-bg/80 backdrop-blur-md data-[state=closed]:animate-out data-[state=open]:animate-in" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-[14vh] z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-[18px] border border-line/15 bg-panel p-1.5 shadow-panel outline-none duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100",
          className,
        )}
        {...props}
      >
        <div className="rounded-[13px] bg-panel shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">{children}</div>
        <DialogPrimitive.Close className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-panel3 hover:text-text">
          <X className="h-4 w-4" strokeWidth={1.5} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle(props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className="text-base font-semibold tracking-tight text-text" {...props} />;
}

export function DialogDescription(props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className="text-sm leading-6 text-muted" {...props} />;
}
