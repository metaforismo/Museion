import { describe, expect, it } from "vitest";

import { getLesson } from "@/lib/content";
import { LearnerSession } from "@/lib/engine/session";
import {
  observationsFromSessions,
  planRevisits,
  REVISIT_INTERVALS_DAYS,
  scheduleConcept,
  type ConceptObservation,
} from "@/lib/revisit/scheduler";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const T0 = Date.parse("2026-07-01T09:00:00Z");

const ok = (ts: number): ConceptObservation => ({ ts, correct: true, assisted: false });
const okAssisted = (ts: number): ConceptObservation => ({ ts, correct: true, assisted: true });
const miss = (ts: number): ConceptObservation => ({ ts, correct: false, assisted: false });

describe("spaced revisit scheduler", () => {
  it("schedules nothing before the first unassisted verification", () => {
    expect(scheduleConcept([], T0)).toBeNull();
    expect(scheduleConcept([miss(T0)], T0 + DAY)).toBeNull();
    expect(scheduleConcept([okAssisted(T0)], T0 + DAY)).toBeNull();
  });

  it("puts a fresh verification on the first rung: due after one day", () => {
    const schedule = scheduleConcept([ok(T0)], T0 + HOUR)!;
    expect(schedule.rung).toBe(0);
    expect(schedule.intervalDays).toBe(1);
    expect(schedule.status).toBe("scheduled");
    expect(schedule.dueAt).toBe(T0 + DAY);
    expect(scheduleConcept([ok(T0)], T0 + DAY + HOUR)!.status).toBe("due");
  });

  it("climbs one rung per spaced retrieval and expands the interval", () => {
    const schedule = scheduleConcept([ok(T0), ok(T0 + DAY)], T0 + DAY + HOUR)!;
    expect(schedule.rung).toBe(1);
    expect(schedule.intervalDays).toBe(3);
    expect(schedule.dueAt).toBe(T0 + DAY + 3 * DAY);
  });

  it("does not climb on same-sitting retrievals — cramming refreshes the clock only", () => {
    const schedule = scheduleConcept([ok(T0), ok(T0 + HOUR)], T0 + 2 * HOUR)!;
    expect(schedule.rung).toBe(0);
    expect(schedule.dueAt).toBe(T0 + HOUR + DAY);
  });

  it("caps the ladder at its last interval", () => {
    const observations = Array.from({ length: 10 }, (_, index) => ok(T0 + index * DAY));
    const schedule = scheduleConcept(observations, T0 + 10 * DAY)!;
    expect(schedule.rung).toBe(REVISIT_INTERVALS_DAYS.length - 1);
    expect(schedule.intervalDays).toBe(30);
  });

  it("makes a concept due immediately after a post-verification miss and resets the ladder", () => {
    const missed = scheduleConcept([ok(T0), ok(T0 + DAY), miss(T0 + 2 * DAY)], T0 + 2 * DAY + HOUR)!;
    expect(missed.status).toBe("due");
    expect(missed.missedSinceVerified).toBe(true);
    const recovered = scheduleConcept(
      [ok(T0), ok(T0 + DAY), miss(T0 + 2 * DAY), ok(T0 + 2 * DAY + HOUR)],
      T0 + 2 * DAY + 2 * HOUR,
    )!;
    expect(recovered.rung).toBe(0);
    expect(recovered.missedSinceVerified).toBe(false);
    expect(recovered.dueAt).toBe(T0 + 2 * DAY + HOUR + DAY);
  });

  it("is deterministic for the same observations and now", () => {
    const observations = [ok(T0), miss(T0 + DAY), ok(T0 + DAY + HOUR), ok(T0 + 3 * DAY)];
    expect(scheduleConcept(observations, T0 + 5 * DAY)).toEqual(scheduleConcept(observations, T0 + 5 * DAY));
  });

  it("extracts observations with assistance flags from real session events", () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    session.requestHint();
    session.submitAnswer("2");
    session.submitAnswer("6");
    const observations = observationsFromSessions([session]).get("balance-principle")!;
    expect(observations).toHaveLength(2);
    expect(observations[0]).toMatchObject({ correct: false, assisted: true });
    expect(observations[1]).toMatchObject({ correct: true, assisted: true });
  });

  it("plans real sessions into targeted revisit items with practice links", () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    session.submitAnswer("6");
    const now = Date.now() + 2 * DAY;
    const plan = planRevisits([session], now);
    const item = plan.find((candidate) => candidate.concept === "balance-principle")!;
    expect(item.status).toBe("due");
    expect(item.href).toBe("/lessons/linear-equations-intro/practice");
    expect(item.reason).toContain("1-day check due");
    // Due items sort before scheduled ones.
    expect(plan.every((candidate, index) => index === 0 || plan[index - 1].status !== "scheduled" || candidate.status === "scheduled")).toBe(true);
  });
});
