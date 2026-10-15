import type { ChipTone } from "@/components/ui";
import type { DashboardSnapshot } from "@/lib/dashboard";

type EvidenceResult = DashboardSnapshot["evidence"][number]["result"];

/**
 * Checked outcomes carry the tone of what was actually observed, and the two
 * failure-ish results are not the same thing: `incorrect` is a wrong answer,
 * `developing` is partial work that needs attention. Folding them into one
 * colour — which the Evidence page used to do — tells the learner an answer
 * was wrong when the engine only recorded that it was not yet consistent.
 *
 * Shared so the dashboard and the Evidence page cannot drift apart on it.
 */
export function evidenceTone(result: EvidenceResult): ChipTone {
  if (result === "incorrect") return "wrong";
  if (result === "developing") return "attention";
  return "correct";
}
