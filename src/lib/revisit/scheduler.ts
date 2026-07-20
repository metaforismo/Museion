/**
 * Spaced revisit scheduler: the Revisit move, computed — never invented.
 *
 * Every input is a recorded, timestamped observation from the session
 * event log. Only unassisted correct answers count as verification.
 * The ladder expands 1 → 3 → 7 → 14 → 30 days; a verification at least
 * twelve hours after the previous one climbs a rung, a same-sitting
 * success refreshes the clock without climbing (cramming does not
 * advance the ladder), and any miss after the last verification resets
 * the ladder and makes the concept due immediately. Deterministic
 * given (observations, now) — `now` is a parameter, so the plan is
 * replayable in tests.
 */

import { allLessons } from "@/lib/content";
import { hasPractice } from "@/lib/engine/practice";
import type { LearnerSession } from "@/lib/engine/session";
import { listSessionsForLearner } from "@/lib/store";

export const REVISIT_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;
/** Minimum spacing for a retrieval to climb the ladder. */
const CLIMB_SPACING_MS = 12 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ConceptObservation {
  ts: number;
  correct: boolean;
  /** Hints were in play when this answer was recorded. */
  assisted: boolean;
}

export interface ConceptSchedule {
  status: "due" | "scheduled";
  dueAt: number;
  lastVerifiedAt: number;
  /** 0-based position on the interval ladder. */
  rung: number;
  intervalDays: number;
  /** A wrong answer landed after the last verification. */
  missedSinceVerified: boolean;
}

export interface RevisitItem extends ConceptSchedule {
  concept: string;
  lessonId: string;
  lessonTitle: string;
  href: string;
  reason: string;
}

/** Pure ladder walk over one concept's time-ordered observations. */
export function scheduleConcept(observations: ConceptObservation[], now: number): ConceptSchedule | null {
  const sorted = [...observations].sort((left, right) => left.ts - right.ts);
  let rung = 0;
  let anchor: number | null = null;
  let missedSinceVerified = false;

  for (const observation of sorted) {
    if (observation.correct && !observation.assisted) {
      if (anchor !== null && !missedSinceVerified && observation.ts - anchor >= CLIMB_SPACING_MS) {
        rung = Math.min(rung + 1, REVISIT_INTERVALS_DAYS.length - 1);
      } else if (missedSinceVerified) {
        rung = 0;
      }
      anchor = observation.ts;
      missedSinceVerified = false;
    } else if (!observation.correct && anchor !== null) {
      missedSinceVerified = true;
    }
  }

  if (anchor === null) return null;
  const intervalDays = REVISIT_INTERVALS_DAYS[rung];
  const dueAt = missedSinceVerified ? now : anchor + intervalDays * DAY_MS;
  return {
    status: dueAt <= now ? "due" : "scheduled",
    dueAt,
    lastVerifiedAt: anchor,
    rung,
    intervalDays,
    missedSinceVerified,
  };
}

/** Timestamped per-concept observations extracted from real session events. */
export function observationsFromSessions(sessions: readonly LearnerSession[]): Map<string, ConceptObservation[]> {
  const byConcept = new Map<string, ConceptObservation[]>();
  for (const session of sessions) {
    for (const event of session.events) {
      if (event.kind !== "answer_submitted" || typeof event.stepId !== "string") continue;
      const step = session.lesson.steps.find(({ id }) => id === event.stepId);
      if (!step) continue;
      const list = byConcept.get(step.concept) ?? [];
      list.push({
        ts: event.ts,
        correct: event.correct === true,
        assisted: typeof event.hintsUsed === "number" && event.hintsUsed > 0,
      });
      byConcept.set(step.concept, list);
    }
  }
  return byConcept;
}

function daysAgo(ts: number, now: number): number {
  return Math.max(0, Math.round((now - ts) / DAY_MS));
}

export function formatDueDate(dueAt: number): string {
  return new Date(dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** The full plan for a learner: due first (oldest debt first), then upcoming. */
export function planRevisits(sessions: readonly LearnerSession[], now: number): RevisitItem[] {
  const lessons = allLessons();
  const items: RevisitItem[] = [];
  for (const [concept, observations] of observationsFromSessions(sessions)) {
    const schedule = scheduleConcept(observations, now);
    if (!schedule) continue;
    const lesson =
      lessons.find((candidate) => candidate.steps.some((step) => step.concept === concept) && hasPractice(candidate)) ??
      lessons.find((candidate) => candidate.steps.some((step) => step.concept === concept));
    if (!lesson) continue;
    const practice = hasPractice(lesson);
    const verifiedAgo = daysAgo(schedule.lastVerifiedAt, now);
    const reason = schedule.missedSinceVerified
      ? "A miss landed after the last verification — recheck this first."
      : schedule.status === "due"
        ? `${schedule.intervalDays}-day check due — last verified ${verifiedAgo === 0 ? "today" : `${verifiedAgo} ${verifiedAgo === 1 ? "day" : "days"} ago`}.`
        : `Next unassisted check ${formatDueDate(schedule.dueAt)} — rung ${schedule.rung + 1} of ${REVISIT_INTERVALS_DAYS.length}.`;
    items.push({
      ...schedule,
      concept,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      href: practice ? `/lessons/${lesson.id}/practice` : `/lessons/${lesson.id}`,
      reason,
    });
  }
  return items.sort((left, right) =>
    left.status === right.status ? left.dueAt - right.dueAt : left.status === "due" ? -1 : 1,
  );
}

/** Store-backed entry point for pages. */
export function buildRevisitPlan(learnerId: string, now: number = Date.now()): RevisitItem[] {
  return planRevisits(listSessionsForLearner(learnerId), now);
}
