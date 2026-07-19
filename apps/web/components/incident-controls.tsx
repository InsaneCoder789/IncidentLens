"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createIncident, deleteIncident, updateIncident } from "@/lib/api";
import type { Incident, IncidentCreate, Severity, Status } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";


const emptyIncident: IncidentCreate = { title: "", description: "", severity: "medium", status: "open", affected_service: "", incident_type: "unknown", owner: null };

export function CreateIncidentDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(emptyIncident);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>Create incident</Button></DialogTrigger><DialogContent><div className="space-y-5 p-5"><div><DialogTitle>Create incident</DialogTitle><DialogDescription>Open a persisted incident and begin collecting operational evidence.</DialogDescription></div><div className="space-y-3"><Input aria-label="Incident title" placeholder="Incident title" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} /><textarea aria-label="Incident description" placeholder="Describe the observed impact and signals" value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} className="min-h-28 w-full rounded-[10px] border border-line/15 bg-bg/70 p-3 text-sm text-text outline-none focus:border-accent/60" /><div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Affected service" placeholder="Affected service" value={values.affected_service} onChange={(event) => setValues({ ...values, affected_service: event.target.value })} /><Input aria-label="Owner" placeholder="Owner or on-call team" value={values.owner ?? ""} onChange={(event) => setValues({ ...values, owner: event.target.value || null })} /><Select aria-label="Severity" value={values.severity} onChange={(event) => setValues({ ...values, severity: event.target.value as Severity })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></Select><Select aria-label="Incident type" value={values.incident_type} onChange={(event) => setValues({ ...values, incident_type: event.target.value as IncidentCreate["incident_type"] })}><option value="unknown">Unknown</option><option value="deployment_regression">Deployment regression</option><option value="database_issue">Database issue</option><option value="auth_failure">Authentication failure</option><option value="third_party_outage">Third-party outage</option><option value="infra_issue">Infrastructure issue</option><option value="performance_degradation">Performance degradation</option><option value="security_suspicious">Security suspicious</option><option value="frontend_bug">Frontend bug</option></Select></div></div>{error ? <div className="text-xs text-danger">{error}</div> : null}<Button className="w-full" disabled={isPending} onClick={() => startTransition(async () => { setError(null); try { const incident = await createIncident(values); setOpen(false); setValues(emptyIncident); router.push(`/incidents/${incident.id}`); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Incident could not be created"); } })}>{isPending ? "Creating..." : "Create incident"}</Button></div></DialogContent></Dialog>;
}

export function IncidentMetadataControls({ incident }: { incident: Incident }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(incident.status);
  const [severity, setSeverity] = useState<Severity>(incident.severity);
  const [owner, setOwner] = useState(incident.owner ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  return <div className="space-y-3"><Select aria-label="Incident status" value={status} onChange={(event) => setStatus(event.target.value as Status)}><option value="open">Open</option><option value="investigating">Investigating</option><option value="mitigated">Mitigated</option><option value="resolved">Resolved</option><option value="postmortem_ready">Postmortem ready</option></Select><Select aria-label="Incident severity" value={severity} onChange={(event) => setSeverity(event.target.value as Severity)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></Select><Input aria-label="Incident owner" value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Owner" /><Button size="sm" className="w-full" disabled={isPending} onClick={() => startTransition(async () => { try { await updateIncident(incident.id, { status, severity, owner: owner || null }); setMessage("Incident updated"); router.refresh(); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Update failed"); } })}>Save metadata</Button><Button size="sm" variant="outline" className="w-full text-danger" disabled={isPending} onClick={() => { if (!confirmDelete) { setConfirmDelete(true); return; } startTransition(async () => { try { await deleteIncident(incident.id); router.push("/incidents"); router.refresh(); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Delete failed"); } }); }}>{confirmDelete ? "Confirm permanent deletion" : "Delete incident"}</Button>{message ? <div role="status" className="text-[11px] text-muted">{message}</div> : null}</div>;
}
