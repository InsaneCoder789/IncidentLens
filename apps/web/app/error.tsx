"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="mx-auto max-w-xl rounded-2xl border border-danger/20 bg-danger/[0.04] p-8"><div className="label-caps text-danger">Operational error</div><h1 className="mt-3 text-2xl font-semibold text-text">The live data request failed</h1><p className="mt-3 text-sm leading-6 text-muted">{error.message || "IncidentLens could not complete this request. Check API readiness and the request ID in the response headers."}</p><Button className="mt-6" onClick={reset}>Retry request</Button></div>;
}
