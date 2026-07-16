import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, description, actions, meta }: { eyebrow: string; title: string; description: string; actions?: ReactNode; meta?: ReactNode }) {
  return (
    <section className="mb-6 grid gap-5 border-b border-line/10 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="max-w-3xl">
        <div className="label-caps text-accent">{eyebrow}</div>
        <h1 className="mt-2 text-[clamp(1.6rem,2.5vw,2.4rem)] font-semibold leading-[1.08] tracking-[-0.045em] text-text">{title}</h1>
        <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted">{description}</p>
        {meta ? <div className="mt-4">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <div className="label-caps text-muted">{eyebrow}</div> : null}
        <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-text">{title}</h2>
        {description ? <p className="mt-1 max-w-[65ch] text-xs leading-5 text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
