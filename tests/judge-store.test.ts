import { beforeEach, describe, expect, it } from "vitest";

import {
  createJudgeSession,
  deleteJudgeSession,
  dispatchJudgeAction,
  getJudgeSession,
  resetJudgeStoreForTests,
  updateJudgeTransfer,
} from "@/lib/judge";

function completeLesson(sessionId: string, ownerId: string) {
  dispatchJudgeAction({ sessionId, ownerId, blockId: "prediction_discard", action: { kind: "prediction_select", optionIndex: 0 } });
  dispatchJudgeAction({ sessionId, ownerId, blockId: "range_boundary", action: { kind: "range_update", low: 4, high: 6 } });
  dispatchJudgeAction({ sessionId, ownerId, blockId: "range_boundary", action: { kind: "range_confirm_found", index: 5 } });
  dispatchJudgeAction({ sessionId, ownerId, blockId: "trace_absent", action: { kind: "trace_submit", low: 0, high: 1, mid: 0 } });
  dispatchJudgeAction({ sessionId, ownerId, blockId: "trace_absent", action: { kind: "trace_submit", low: 1, high: 1, mid: 1 } });
  dispatchJudgeAction({ sessionId, ownerId, blockId: "sequence_reasoning", action: { kind: "sequence_submit", order: ["compare_mid", "prove_region", "move_past_mid", "check_shrink"] } });
}

describe("verified judge session store", () => {
  beforeEach(() => resetJudgeStoreForTests());

  it("creates an idempotent owner-bound replay with no private truth", () => {
    const first = createJudgeSession("learner-a", "browser-run-a");
    const repeated = createJudgeSession("learner-a", "browser-run-a");
    expect(repeated.sessionId).toBe(first.sessionId);
    expect(() => getJudgeSession(first.sessionId, "learner-b")).toThrow("JUDGE_SESSION_NOT_FOUND");

    const serialized = JSON.stringify(first);
    expect(serialized).not.toContain("answerSpecs");
    expect(serialized).not.toContain("correctOrder");
    expect(serialized).not.toContain("expectedStates");
    expect(serialized).not.toContain("misconceptionRules");
    expect(first.mode).toBe("verified-replay");
  });

  it("keeps transfer locked until every interactive block is complete", async () => {
    const session = createJudgeSession("learner-a", "browser-run-a");
    await expect(updateJudgeTransfer({ sessionId: session.sessionId, ownerId: "learner-a", kind: "start" })).rejects.toThrow("TRANSFER_LOCKED");
    completeLesson(session.sessionId, "learner-a");
    const active = await updateJudgeTransfer({ sessionId: session.sessionId, ownerId: "learner-a", kind: "start" });
    expect(active.transfer.status).toBe("active");
  });

  it("scores exactly one answer and returns a reconciled bounded observation", async () => {
    const session = createJudgeSession("learner-a", "browser-run-a");
    completeLesson(session.sessionId, "learner-a");
    await updateJudgeTransfer({ sessionId: session.sessionId, ownerId: "learner-a", kind: "start" });
    const scored = await updateJudgeTransfer({ sessionId: session.sessionId, ownerId: "learner-a", kind: "submit", attemptId: "attempt-one", answer: "4" });
    expect(scored.transfer).toMatchObject({ status: "scored", correct: true });
    expect(scored.transfer.observation?.assistance).toEqual({ maiaTurns: 0, hints: 0, solutions: 0 });
    expect(scored.transfer.observation?.limitations).toHaveLength(2);
    await expect(updateJudgeTransfer({ sessionId: session.sessionId, ownerId: "learner-a", kind: "submit", attemptId: "attempt-two", answer: "4" })).rejects.toThrow("exactly one");
  });

  it("deletes only the owned transient run", () => {
    const session = createJudgeSession("learner-a", "browser-run-a");
    expect(() => deleteJudgeSession(session.sessionId, "learner-b")).toThrow("JUDGE_SESSION_NOT_FOUND");
    expect(deleteJudgeSession(session.sessionId, "learner-a")).toBe(true);
    expect(() => getJudgeSession(session.sessionId, "learner-a")).toThrow("JUDGE_SESSION_NOT_FOUND");
  });
});
