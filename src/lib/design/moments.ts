import type { DashboardSnapshot } from "@/lib/dashboard/contracts";

/**
 * Verified moments celebrate exactly what the evidence model can support —
 * a checked observation — and never imply durable mastery. Each moment
 * carries the line that justifies it, so the celebration is also a claim
 * the product can defend.
 *
 * No streaks, no XP, no badges, no counters. Three engine-checked triggers,
 * each restating the record rather than embellishing it.
 */

export const MOMENT_KINDS = ["transfer", "course-complete", "misconception-resolved"] as const;
export type MomentKind = (typeof MOMENT_KINDS)[number];

const COPY: Record<MomentKind, { title: string; evidence: string }> = {
  transfer: {
    title: "A new problem, solved on your own",
    // Verbatim from the observation the engine writes in
    // src/lib/evidence/transfer.ts: "correctly without Maia, hints, or a
    // solution reveal".
    evidence: "You solved a related problem on your own: no hints, no Maia and no solution reveal.",
  },
  "course-complete": {
    title: "You finished a course",
    // Completion means every lesson in the path was advanced to the end, and
    // a lesson cannot advance without a checked answer. It says nothing about
    // how many of those answers were right, and it must not.
    evidence: "Each lesson in this course recorded a checked step.",
  },
  "misconception-resolved": {
    title: "You found a way through",
    // The record only supports "a later answer on the same step was correct,
    // within the same session". The dashboard chip for the same signal reads
    // "worth rechecking", so this line may not claim the concept has held.
    evidence: "You tried again during this lesson and found a correct move. Come back for a recheck later.",
  },
};

export function momentCopy(kind: MomentKind): { title: string; evidence: string } {
  return COPY[kind];
}

/**
 * The strongest verified moment the learning record currently supports, or
 * null when it supports none. Ordered by evidential strength: an unaided
 * transfer outranks a completed path, which outranks an in-session
 * correction. Nothing here is inferred — every branch reads a counted,
 * engine-written field.
 */
export function verifiedMomentFor(
  snapshot: Pick<DashboardSnapshot, "journey" | "misconceptions">,
): MomentKind | null {
  if (snapshot.journey.unassistedTransfers > 0) return "transfer";
  if (snapshot.journey.coursesCompleted > 0) return "course-complete";
  if (snapshot.misconceptions.some((item) => item.status === "corrected-in-session")) {
    return "misconception-resolved";
  }
  return null;
}
