import { describe, expect, it } from "vitest";

import { CourseArtifactV2Schema, type LearningBlock } from "@/lib/compiler";
import {
  allowedRuntimeTargets,
  buildRuntimeTutorSnapshot,
  buildRuntimeTutorIntervention,
  gateRuntimeTutorActions,
  initializeBlock,
  offByOneCounterexample,
  reduceBlock,
  type InteractiveBlock,
} from "@/lib/runtime";
import goldenArtifactJson from "./fixtures/binary-search-course-artifact-v2.json";

const artifact = CourseArtifactV2Schema.parse(goldenArtifactJson);
const range = Object.values(artifact.blocks).find((candidate): candidate is Extract<LearningBlock, { kind: "range-explorer" }> => candidate.kind === "range-explorer") as Extract<InteractiveBlock, { kind: "range-explorer" }>;

describe("bounded Maia runtime observation", () => {
  it("builds a public snapshot with runtime-issued targets", () => {
    const state = initializeBlock(range);
    const snapshot = buildRuntimeTutorSnapshot({ artifactId: artifact.id, block: range, state });
    expect(snapshot.allowedTargetIds).toEqual(allowedRuntimeTargets(range));
    expect(JSON.stringify(snapshot)).not.toContain("misconceptionRules");
    expect(JSON.stringify(snapshot)).not.toContain("target\":19");
  });

  it("drops arbitrary selectors and state-changing actions", () => {
    const snapshot = buildRuntimeTutorSnapshot({ artifactId: artifact.id, block: range, state: initializeBlock(range) });
    const gated = gateRuntimeTutorActions(snapshot, [
      { kind: "highlight", targetId: `value:${range.id}:3`, text: "Inspect this midpoint." },
      { kind: "focus", targetId: "body", text: null },
      { kind: "set_score", targetId: `block:${range.id}`, text: "100" },
    ]);
    expect(gated.accepted).toHaveLength(1);
    expect(gated.dropped).toBe(2);
  });

  it("returns a local counterexample for midpoint reuse", () => {
    const state = initializeBlock(range);
    if (state.kind !== "range-explorer") throw new Error("Unexpected state");
    const action = { kind: "range_update", low: 3, high: 6 } as const;
    const outcome = reduceBlock(range, state, action);
    const counterexample = offByOneCounterexample(range, state, action);
    expect(outcome.misconceptionId).toBe("mis_mid_reused_small");
    expect(counterexample?.before).toEqual({ low: 0, high: 6, mid: 3 });
    expect(counterexample?.proposed).toEqual({ low: 3, high: 6 });
  });

  it("turns an incorrect outcome into a gated visible intervention", () => {
    const state = initializeBlock(range);
    if (state.kind !== "range-explorer") throw new Error("Unexpected state");
    const action = { kind: "range_update", low: 3, high: 6 } as const;
    const intervention = buildRuntimeTutorIntervention({
      artifactId: artifact.id,
      block: range,
      stateBefore: state,
      action,
      outcome: reduceBlock(range, state, action),
    });
    expect(intervention?.turn.pedagogicalMove).toBe("address-misconception");
    expect(intervention?.turn.uiActions.every((item) => intervention.snapshot.allowedTargetIds.includes(item.targetId))).toBe(true);
    expect(JSON.stringify(intervention)).not.toContain("misconceptionRules");
  });
});
