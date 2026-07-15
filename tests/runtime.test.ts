import { describe, expect, it } from "vitest";

import { CourseArtifactV2Schema, type LearningBlock } from "@/lib/compiler";
import {
  initializeBlock,
  reduceBlock,
  replayRuntime,
  validateInteractiveBlock,
  type InteractiveBlock,
} from "@/lib/runtime";
import goldenArtifactJson from "./fixtures/binary-search-course-artifact-v2.json";

const artifact = CourseArtifactV2Schema.parse(goldenArtifactJson);
const block = <Kind extends InteractiveBlock["kind"]>(kind: Kind) =>
  Object.values(artifact.blocks).find((candidate): candidate is Extract<LearningBlock, { kind: Kind }> => candidate.kind === kind) as Extract<InteractiveBlock, { kind: Kind }>;

describe("typed deterministic runtime", () => {
  it.each(["prediction-choice", "range-explorer", "state-trace", "sequence-builder"] as const)("validates golden %s", (kind) => {
    expect(validateInteractiveBlock(block(kind))).toEqual([]);
  });

  it("detects the low = mid off-by-one state without mutating truth", () => {
    const range = block("range-explorer");
    const initial = initializeBlock(range);
    const outcome = reduceBlock(range, initial, { kind: "range_update", low: 3, high: 6 });
    expect(outcome.accepted).toBe(false);
    expect(outcome.misconceptionId).toBe("mis_mid_reused_small");
    expect(outcome.state).toEqual(initial);
  });

  it("reaches target 19 only through strictly shrinking updates", async () => {
    const result = await replayRuntime(block("range-explorer"), [
      { kind: "range_update", low: 4, high: 6 },
      { kind: "range_confirm_found", index: 5 },
    ]);
    expect(result.state).toMatchObject({ status: "found", low: 4, high: 6, mid: 5 });
    expect(result.events.every((event) => event.accepted && event.correct)).toBe(true);
  });

  it("replays the same actions to identical state hashes", async () => {
    const actions = [
      { kind: "range_update", low: 4, high: 6 },
      { kind: "range_confirm_found", index: 5 },
    ] as const;
    const first = await replayRuntime(block("range-explorer"), [...actions]);
    const second = await replayRuntime(block("range-explorer"), [...actions]);
    expect(first.events.map((event) => event.stateSha256)).toEqual(second.events.map((event) => event.stateSha256));
  });

  it("grades prediction and sequence through their registered reducers", () => {
    const prediction = block("prediction-choice");
    expect(reduceBlock(prediction, initializeBlock(prediction), { kind: "prediction_select", optionIndex: prediction.correctIndex }).correct).toBe(true);
    const sequence = block("sequence-builder");
    expect(reduceBlock(sequence, initializeBlock(sequence), { kind: "sequence_submit", order: sequence.correctOrder }).correct).toBe(true);
  });

  it("accepts only the expected next trace state", () => {
    const trace = block("state-trace");
    const initial = initializeBlock(trace);
    const wrong = reduceBlock(trace, initial, { kind: "trace_submit", low: 0, high: 2, mid: 1 });
    expect(wrong.correct).toBe(false);
    const expected = trace.expectedStates[1];
    const correct = reduceBlock(trace, wrong.state, { kind: "trace_submit", low: expected.low, high: expected.high, mid: expected.mid });
    expect(correct.correct).toBe(true);
  });

  it("rejects unknown actions", () => {
    const prediction = block("prediction-choice");
    expect(reduceBlock(prediction, initializeBlock(prediction), { kind: "execute_javascript", code: "alert(1)" }).accepted).toBe(false);
  });

  it("rejects a sequence order that duplicates one item and omits another", () => {
    const sequence = structuredClone(block("sequence-builder"));
    sequence.correctOrder = sequence.correctOrder.map((id, index) => index === 1 ? sequence.correctOrder[0] : id);
    expect(validateInteractiveBlock(sequence).map((issue) => issue.code)).toContain("invalid_order");
  });

  it("requires a predictive trace to prove its declared terminal condition", () => {
    const trace = structuredClone(block("state-trace"));
    trace.expectedStates = trace.expectedStates.slice(0, 1);
    expect(validateInteractiveBlock(trace).map((issue) => issue.code)).toContain("invalid_trace");
  });
});
