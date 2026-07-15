import type { LearningBlock } from "@/lib/compiler";

import { RuntimeActionSchema, type RuntimeAction, type RuntimeOutcome, type RuntimeState } from "./contracts";

type PredictionBlock = Extract<LearningBlock, { kind: "prediction-choice" }>;
type SequenceBlock = Extract<LearningBlock, { kind: "sequence-builder" }>;
type RangeBlock = Extract<LearningBlock, { kind: "range-explorer" }>;
type TraceBlock = Extract<LearningBlock, { kind: "state-trace" }>;
export type InteractiveBlock = PredictionBlock | SequenceBlock | RangeBlock | TraceBlock;

const midpoint = (low: number, high: number, policy: RangeBlock["midpointPolicy"]): number =>
  policy === "floor" ? low + Math.floor((high - low) / 2) : low + Math.ceil((high - low) / 2);

export function initializeBlock(block: InteractiveBlock): RuntimeState {
  if (block.kind === "prediction-choice") return { kind: block.kind, selectedIndex: null, complete: false, correct: null };
  if (block.kind === "sequence-builder") return { kind: block.kind, submittedOrder: [], complete: false, correct: null };
  if (block.kind === "range-explorer") {
    const { low, high } = block.initialState;
    return { kind: block.kind, low, high, mid: low <= high ? midpoint(low, high, block.midpointPolicy) : null, step: 0, status: low <= high ? "active" : "absent" };
  }
  return { kind: block.kind, cursor: 0, complete: block.expectedStates.length <= 1, attempts: 0 };
}

function reject(state: RuntimeState, message: string, misconceptionId: string | null = null): RuntimeOutcome {
  return { state, accepted: false, correct: false, misconceptionId, message };
}

export function reduceBlock(
  block: InteractiveBlock,
  current: RuntimeState,
  candidate: unknown,
): RuntimeOutcome {
  const parsed = RuntimeActionSchema.safeParse(candidate);
  if (!parsed.success) return reject(current, "Unknown or malformed runtime action.");
  const action: RuntimeAction = parsed.data;

  if (block.kind === "prediction-choice" && current.kind === block.kind) {
    if (action.kind !== "prediction_select" || action.optionIndex >= block.options.length || current.complete) return reject(current, "Choose one available prediction.");
    const correct = action.optionIndex === block.correctIndex;
    return {
      state: { ...current, selectedIndex: action.optionIndex, complete: correct, correct },
      accepted: true,
      correct,
      misconceptionId: correct ? null : block.misconceptionByIndex[String(action.optionIndex)] ?? null,
      message: correct ? "Prediction matches the deterministic answer." : "That region is not justified by the comparison.",
    };
  }

  if (block.kind === "sequence-builder" && current.kind === block.kind) {
    if (action.kind !== "sequence_submit" || current.complete) return reject(current, "Submit one ordered sequence.");
    const known = new Set(block.items.map((item) => item.id));
    if (action.order.length !== known.size || new Set(action.order).size !== known.size || action.order.some((id) => !known.has(id))) return reject(current, "The sequence must contain every registered item exactly once.");
    const correct = action.order.every((id, index) => id === block.correctOrder[index]);
    return { state: { ...current, submittedOrder: action.order, complete: correct, correct }, accepted: true, correct, misconceptionId: null, message: correct ? "The reasoning order is valid." : "The steps are valid items but not yet in a justified order." };
  }

  if (block.kind === "range-explorer" && current.kind === block.kind) {
    if (current.status !== "active" || current.mid === null) return reject(current, "The search is already complete.");
    const value = block.values[current.mid];
    if (action.kind === "range_confirm_found") {
      const correct = value === block.target && action.index === current.mid;
      if (!correct) return reject(current, "The current midpoint does not prove that index is the target.");
      return { state: { ...current, status: "found" }, accepted: true, correct: true, misconceptionId: null, message: "Target found at the verified midpoint." };
    }
    if (action.kind !== "range_update" || value === block.target) return reject(current, "Inspect the midpoint comparison before updating a boundary.");
    const tooSmall = value < block.target;
    const expectedLow = tooSmall ? current.mid + 1 : current.low;
    const expectedHigh = tooSmall ? current.high : current.mid - 1;
    if (action.low !== expectedLow || action.high !== expectedHigh) {
      const reused = tooSmall && action.low === current.mid
        ? "mid-reused-after-too-small"
        : !tooSmall && action.high === current.mid
          ? "mid-reused-after-too-large"
          : "wrong-half-discarded";
      const misconceptionId = block.misconceptionRules.find((rule) => rule.when === reused)?.id ?? null;
      return reject(current, "The update must preserve the possible region and move past the disproved midpoint.", misconceptionId);
    }
    const nextMid = expectedLow <= expectedHigh ? midpoint(expectedLow, expectedHigh, block.midpointPolicy) : null;
    const status = nextMid === null ? "absent" as const : "active" as const;
    return { state: { ...current, low: expectedLow, high: expectedHigh, mid: nextMid, step: current.step + 1, status }, accepted: true, correct: true, misconceptionId: null, message: status === "absent" ? "No candidate index remains." : "The active interval strictly shrank." };
  }

  if (block.kind === "state-trace" && current.kind === block.kind) {
    if (action.kind !== "trace_submit" || current.complete) return reject(current, "Submit the next trace state.");
    const expected = block.expectedStates[current.cursor + 1];
    if (!expected) return reject({ ...current, complete: true }, "The trace is already complete.");
    const correct = action.low === expected.low && action.high === expected.high && action.mid === expected.mid;
    if (!correct) return { state: { ...current, attempts: current.attempts + 1 }, accepted: true, correct: false, misconceptionId: null, message: "That state does not follow from the previous midpoint comparison." };
    const cursor = current.cursor + 1;
    return { state: { ...current, cursor, complete: cursor === block.expectedStates.length - 1 }, accepted: true, correct: true, misconceptionId: null, message: cursor === block.expectedStates.length - 1 ? "Trace complete." : "State accepted; continue the trace." };
  }

  return reject(current, "Action and block state do not belong to the same registered reducer.");
}
