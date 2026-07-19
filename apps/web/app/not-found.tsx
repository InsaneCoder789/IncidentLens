import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <div className="mx-auto max-w-xl rounded-2xl border border-line/15 bg-panel p-8 text-center"><div className="label-caps text-muted">404 / Not found</div><h1 className="mt-3 text-2xl font-semibold text-text">This operational record does not exist</h1><p className="mt-3 text-sm text-muted">It may have been removed or the identifier is invalid.</p><Link href="/incidents"><Button className="mt-6">Return to incidents</Button></Link></div>;
}
