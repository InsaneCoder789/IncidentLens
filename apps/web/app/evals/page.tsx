import { EvalsClient } from "@/components/evals-client";
import { getEvalRuns } from "@/lib/api";

export default async function EvalsPage() {
  const runs = await getEvalRuns();
  return <EvalsClient initialRuns={runs} />;
}
