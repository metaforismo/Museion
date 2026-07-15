import { describe, expect, it } from "vitest";

import { getLesson } from "@/lib/content";
import { toPublicLesson } from "@/lib/content";
import { buildSessionState } from "@/lib/api-types";
import { LearnerSession } from "@/lib/engine/session";

function newSession() {
  return new LearnerSession(getLesson("linear-equations-intro")!);
}

function solveAndAdvance(session: LearnerSession, answer: string) {
  const outcome = session.submitAnswer(answer);
  expect(outcome.correct).toBe(true);
  const advanced = session.advance();
  return { outcome, advanced };
}

describe("LearnerSession", () => {
  it("walks through the lesson on correct answers", () => {
    const session = newSession();
    for (const answer of ["6", "4", "5"]) solveAndAdvance(session, answer);
    const last = session.submitAnswer("3");
    expect(last.correct).toBe(true);
    expect(last.finalStepSolved).toBe(true);
    expect(last.lessonComplete).toBe(false);
    expect(session.complete).toBe(false);
    expect(session.advance().lessonComplete).toBe(true);
    expect(session.complete).toBe(true);
  });

  it("stays on the step after a wrong answer and reports the misconception", () => {
    const session = newSession();
    const outcome = session.submitAnswer("2");
    expect(outcome.correct).toBe(false);
    expect(outcome.misconceptionId).toBe("subtract-the-coefficient");
    expect(session.stepIndex).toBe(0);
    expect(session.submitAnswer("6").correct).toBe(true);
    expect(session.awaitingAdvance).toBe(true);
    session.advance();
    expect(session.stepIndex).toBe(1);
  });

  it("caps the hint ladder for a novice at the authored depth", () => {
    const session = newSession();
    const hints = [1, 2, 3, 4].map(() => session.requestHint());
    expect(hints.slice(0, 3).every((h) => h !== null)).toBe(true);
    expect(hints[3]).toBeNull();
  });

  it("gives a proficient learner fewer hints (fading)", () => {
    const session = newSession();
    for (let i = 0; i < 10; i++) {
      session.mastery.recordAttempt("balance-principle", true, true, 0);
    }
    expect(session.requestHint()).not.toBeNull();
    expect(session.requestHint()).toBeNull(); // proficient cap: depth 1
  });

  it("exposes ground truth and learner state in the snapshot", () => {
    const session = newSession();
    session.submitAnswer("2");
    const snap = session.snapshot();
    expect(snap.lessonTitle).toBe("Solving Linear Equations");
    expect(snap.verifiedSolution).toContain("Subtracting 6");
    expect(snap.attempts).toEqual(["2"]);
    expect(snap.lastMisconception).not.toBeNull();
    expect(snap.scaffolding).toBe("novice");
  });

  it("records every interaction in the event log", () => {
    const session = newSession();
    session.submitAnswer("2");
    session.requestHint();
    session.submitAnswer("6");
    expect(session.events.map((e) => e.kind)).toEqual([
      "answer_submitted",
      "hint_given",
      "answer_submitted",
    ]);
  });

  it("reports revealed hints for resume", () => {
    const session = newSession();
    expect(session.revealedHints()).toEqual([]);
    session.requestHint();
    session.requestHint();
    expect(session.revealedHints()).toHaveLength(2);
    expect(session.revealedHints()[0]).toContain("left side");
  });

  it("aggregates completion stats", () => {
    const session = newSession();
    session.submitAnswer("2"); // wrong
    session.requestHint();
    session.submitAnswer("6"); // correct, assisted
    session.advance();
    solveAndAdvance(session, "4"); // first-try
    solveAndAdvance(session, "5"); // first-try
    solveAndAdvance(session, "3"); // first-try
    const stats = session.stats();
    expect(stats.steps).toBe(4);
    expect(stats.totalAttempts).toBe(5);
    expect(stats.firstTryCorrect).toBe(3);
    expect(stats.hintsUsed).toBe(1);
    expect(Object.keys(stats.conceptMastery)).toEqual([
      "balance-principle",
      "inverse-operations",
      "combining-like-terms",
    ]);
  });

  it("refuses answers after completion", () => {
    const session = newSession();
    for (const answer of ["6", "4", "5", "3"]) solveAndAdvance(session, answer);
    expect(() => session.submitAnswer("1")).toThrow();
  });

  it("keeps the solved step authoritative until explicit advance", () => {
    const session = newSession();
    const stepId = session.currentStep.id;
    const outcome = session.submitAnswer("6");
    expect(outcome.awaitingAdvance).toBe(true);
    expect(session.currentStep.id).toBe(stepId);
    expect(session.snapshot().verifiedSolution).toContain("Subtracting 6");
    const resumed = buildSessionState(session, toPublicLesson(session.lesson));
    expect(resumed.awaitingAdvance).toBe(true);
    expect(resumed.currentStepId).toBe(stepId);
    expect(resumed.solvedStep?.solution).toContain("Subtracting 6");
    expect(() => session.submitAnswer("4")).toThrow(/Advance/);
  });

  it("rejects stale commands and replays answer and advance idempotently", () => {
    const session = newSession();
    const stepId = session.currentStep.id;
    const answerGuard = { expectedStepId: stepId, expectedVersion: 0, idempotencyKey: "answer-1" };
    const first = session.submitAnswer("6", answerGuard);
    expect(session.submitAnswer("6", answerGuard)).toEqual(first);
    expect(session.events.filter((event) => event.kind === "answer_submitted")).toHaveLength(1);
    expect(() => session.advance({ ...answerGuard, idempotencyKey: "stale" })).toThrow(/version conflict/);

    const advanceGuard = { expectedStepId: stepId, expectedVersion: first.sessionVersion, idempotencyKey: "advance-1" };
    const advanced = session.advance(advanceGuard);
    expect(session.advance(advanceGuard)).toEqual({ ...advanced, replayed: true });
    expect(session.stepIndex).toBe(1);
    expect(session.events.filter((event) => event.kind === "step_advanced")).toHaveLength(1);
  });

  it("replays a guarded hint without consuming another rung", () => {
    const session = newSession();
    const guard = {
      expectedStepId: session.currentStep.id,
      expectedVersion: 0,
      idempotencyKey: "hint-1",
    };
    const first = session.requestHintOutcome(guard);
    expect(session.requestHintOutcome(guard)).toEqual(first);
    expect(session.revealedHints()).toHaveLength(1);
    expect(session.events.filter((event) => event.kind === "hint_given")).toHaveLength(1);
  });
});
