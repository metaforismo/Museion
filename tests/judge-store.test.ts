import { beforeEach, describe, expect, it } from "vitest";

import {
  createJudgeSession,
  deleteJudgeSession,
  dispatchJudgeAction,
  getJudgeSession,
  resetJudgeStoreForTests,
  updateJudgeTransfer,
} from "@/lib/judge";
import { stateBackend } from "@/lib/server/durable-state";

async function completeLesson(sessionId: string, ownerId: string) {
  let revision = (await getJudgeSession(sessionId, ownerId)).revision;
  let sequence = 0;
  const act = async (blockId: string, action: Parameters<typeof dispatchJudgeAction>[0]["action"]) => {
    const result = await dispatchJudgeAction({ sessionId, ownerId, blockId, action, expectedRevision: revision, commandId: `lesson-${sequence++}` });
    revision = result.session.revision;
  };
  await act("prediction_discard", { kind: "prediction_select", optionIndex: 0 });
  await act("range_boundary", { kind: "range_update", low: 4, high: 6 });
  await act("range_boundary", { kind: "range_confirm_found", index: 5 });
  await act("trace_absent", { kind: "trace_submit", low: 0, high: 1, mid: 0 });
  await act("trace_absent", { kind: "trace_submit", low: 1, high: 1, mid: 1 });
  await act("sequence_reasoning", { kind: "sequence_submit", order: ["compare_mid", "prove_region", "move_past_mid", "check_shrink"] });
  return getJudgeSession(sessionId, ownerId);
}

describe("verified judge session store", () => {
  beforeEach(() => resetJudgeStoreForTests());

  it("creates an idempotent owner-bound replay with no private truth", async () => {
    const first = await createJudgeSession("learner-a", "browser-run-a");
    const repeated = await createJudgeSession("learner-a", "browser-run-a");
    expect(repeated.sessionId).toBe(first.sessionId);
    await expect(getJudgeSession(first.sessionId, "learner-b")).rejects.toThrow("JUDGE_SESSION_NOT_FOUND");

    const serialized = JSON.stringify(first);
    expect(serialized).not.toContain("answerSpecs");
    expect(serialized).not.toContain("correctOrder");
    expect(serialized).not.toContain("expectedStates");
    expect(serialized).not.toContain("misconceptionRules");
    expect(first.mode).toBe("verified-replay");
  });

  it("converges concurrent creates onto one stable owner-bound session", async () => {
    const [first, second] = await Promise.all([
      createJudgeSession("learner-a", "shared-browser-run"),
      createJudgeSession("learner-a", "shared-browser-run"),
    ]);

    expect(second.sessionId).toBe(first.sessionId);
    expect(await createJudgeSession("learner-b", "shared-browser-run")).not.toMatchObject({ sessionId: first.sessionId });
  });

  it("keeps transfer locked until every interactive block is complete", async () => {
    const session = await createJudgeSession("learner-a", "browser-run-a");
    await expect(updateJudgeTransfer({ sessionId: session.sessionId, ownerId: "learner-a", kind: "start", expectedRevision: session.revision, commandId: "locked-start" })).rejects.toThrow("TRANSFER_LOCKED");
    const completed = await completeLesson(session.sessionId, "learner-a");
    const active = await updateJudgeTransfer({ sessionId: session.sessionId, ownerId: "learner-a", kind: "start", expectedRevision: completed.revision, commandId: "valid-start" });
    expect(active.transfer.status).toBe("active");
  });

  it("returns bounded Maia guidance after an incorrect runtime action", async () => {
    const session = await createJudgeSession("learner-a", "browser-run-a");
    const result = await dispatchJudgeAction({
      sessionId: session.sessionId,
      ownerId: "learner-a",
      blockId: "range_boundary",
      action: { kind: "range_update", low: 3, high: 6 },
      expectedRevision: session.revision,
      commandId: "wrong-range",
    });
    expect(result.outcome.correct).toBe(false);
    expect(result.tutor?.counterexample?.before.mid).toBe(3);
    expect(result.tutor?.turn.uiActions).not.toHaveLength(0);
  });

  it("scores exactly one answer and returns a reconciled bounded observation", async () => {
    const session = await createJudgeSession("learner-a", "browser-run-a");
    const completed = await completeLesson(session.sessionId, "learner-a");
    const active = await updateJudgeTransfer({ sessionId: session.sessionId, ownerId: "learner-a", kind: "start", expectedRevision: completed.revision, commandId: "start-transfer" });
    const scored = await updateJudgeTransfer({ sessionId: session.sessionId, ownerId: "learner-a", kind: "submit", attemptId: "attempt-one", answer: "4", expectedRevision: active.revision, commandId: "submit-one" });
    expect(scored.transfer).toMatchObject({ status: "scored", correct: true });
    expect(scored.transfer.observation?.assistance).toEqual({ maiaTurns: 0, hints: 0, solutions: 0 });
    expect(scored.transfer.observation?.limitations).toHaveLength(2);
    const persisted = await stateBackend().get("judge_session", session.sessionId, "learner-a");
    expect(JSON.stringify(persisted)).not.toContain('"answer":"4"');
    await expect(updateJudgeTransfer({ sessionId: session.sessionId, ownerId: "learner-a", kind: "submit", attemptId: "attempt-two", answer: "4", expectedRevision: scored.revision, commandId: "submit-two" })).rejects.toThrow("exactly one");
  });

  it("replays identical commands and rejects stale concurrent mutations", async () => {
    const session = await createJudgeSession("learner-a", "browser-run-a");
    const command = {
      sessionId: session.sessionId,
      ownerId: "learner-a",
      blockId: "prediction_discard",
      action: { kind: "prediction_select", optionIndex: 0 } as const,
      expectedRevision: session.revision,
      commandId: "prediction-command",
    };
    const first = await dispatchJudgeAction(command);
    const replayed = await dispatchJudgeAction(command);

    expect(replayed.session.revision).toBe(first.session.revision);
    expect(replayed.outcome).toEqual(first.outcome);
    await expect(dispatchJudgeAction({
      ...command,
      blockId: "range_boundary",
      action: { kind: "range_update", low: 4, high: 6 },
      commandId: "concurrent-command",
    })).rejects.toThrow("JUDGE_VERSION_CONFLICT");
    await expect(dispatchJudgeAction({
      ...command,
      action: { kind: "prediction_select", optionIndex: 1 },
    })).rejects.toThrow("JUDGE_COMMAND_ID_REUSED");
  });

  it("allows only one simultaneous mutation to commit", async () => {
    const session = await createJudgeSession("learner-a", "concurrent-browser-run");
    const results = await Promise.allSettled([
      dispatchJudgeAction({
        sessionId: session.sessionId,
        ownerId: "learner-a",
        blockId: "prediction_discard",
        action: { kind: "prediction_select", optionIndex: 0 },
        expectedRevision: session.revision,
        commandId: "concurrent-prediction",
      }),
      dispatchJudgeAction({
        sessionId: session.sessionId,
        ownerId: "learner-a",
        blockId: "range_boundary",
        action: { kind: "range_update", low: 4, high: 6 },
        expectedRevision: session.revision,
        commandId: "concurrent-range",
      }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect((results.find((result) => result.status === "rejected") as PromiseRejectedResult).reason).toMatchObject({ message: "JUDGE_VERSION_CONFLICT" });
    expect((await getJudgeSession(session.sessionId, "learner-a")).revision).toBe(1);
  });

  it("deletes only the owned transient run", async () => {
    const session = await createJudgeSession("learner-a", "browser-run-a");
    await expect(deleteJudgeSession(session.sessionId, "learner-b")).rejects.toThrow("JUDGE_SESSION_NOT_FOUND");
    expect(await deleteJudgeSession(session.sessionId, "learner-a")).toBe(true);
    await expect(getJudgeSession(session.sessionId, "learner-a")).rejects.toThrow("JUDGE_SESSION_NOT_FOUND");
  });

  it("caps retained judge sessions per owner", async () => {
    for (let index = 0; index < 10; index += 1) {
      await createJudgeSession("learner-a", `browser-run-${index}`);
    }
    await expect(createJudgeSession("learner-a", "browser-run-overflow")).rejects.toThrow(
      "JUDGE_SESSION_QUOTA_EXCEEDED",
    );
  });
});
