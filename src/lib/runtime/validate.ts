import type { InteractiveBlock } from "./registry";

export interface RuntimeValidationIssue {
  code: "unsorted_values" | "invalid_bounds" | "invalid_answer" | "invalid_order" | "invalid_trace" | "non_terminating";
  path: string;
  message: string;
}

const comparison = (value: number, target: number) => value < target ? "less" : value > target ? "greater" : "equal";
const midpoint = (low: number, high: number, policy: "floor" | "ceiling") =>
  policy === "floor" ? low + Math.floor((high - low) / 2) : low + Math.ceil((high - low) / 2);

export function validateInteractiveBlock(block: InteractiveBlock): RuntimeValidationIssue[] {
  const issues: RuntimeValidationIssue[] = [];
  if (block.kind === "prediction-choice" && block.correctIndex >= block.options.length) {
    issues.push({ code: "invalid_answer", path: "correctIndex", message: "Correct option is outside the option list." });
  }
  if (block.kind === "sequence-builder") {
    const ids = block.items.map((item) => item.id);
    if (new Set(ids).size !== ids.length || block.correctOrder.length !== ids.length || new Set(block.correctOrder).size !== ids.length || block.correctOrder.some((id) => !ids.includes(id))) {
      issues.push({ code: "invalid_order", path: "correctOrder", message: "Correct order must contain every unique item exactly once." });
    }
  }
  if (block.kind === "range-explorer" || block.kind === "state-trace") {
    if (block.values.some((value, index) => index > 0 && value < block.values[index - 1])) issues.push({ code: "unsorted_values", path: "values", message: "Binary-search values must be sorted." });
  }
  if (block.kind === "range-explorer") {
    let { low, high } = block.initialState;
    if (low > high || high >= block.values.length) issues.push({ code: "invalid_bounds", path: "initialState", message: "Initial inclusive bounds are outside the values array." });
    let steps = 0;
    while (!issues.length && low <= high && steps <= block.values.length) {
      const mid = midpoint(low, high, block.midpointPolicy);
      const value = block.values[mid];
      if (value === block.target) break;
      if (value < block.target) low = mid + 1;
      else high = mid - 1;
      steps += 1;
    }
    if (steps > block.values.length) issues.push({ code: "non_terminating", path: "initialState", message: "Range configuration did not terminate within the state bound." });
  }
  if (block.kind === "state-trace") {
    const expected = block.expectedStates;
    if (expected.length < 2) {
      issues.push({ code: "invalid_trace", path: "expectedStates", message: "A predictive trace requires at least one state transition." });
    }
    if (!expected.length || expected[0].low !== block.initialState.low || expected[0].high !== block.initialState.high || expected[0].mid !== block.initialState.mid) {
      issues.push({ code: "invalid_trace", path: "expectedStates[0]", message: "Trace must begin at initialState." });
    }
    for (let index = 0; index < expected.length; index += 1) {
      const state = expected[index];
      if (state.step !== index || state.mid < state.low || state.mid > state.high || state.high >= block.values.length || state.mid !== midpoint(state.low, state.high, block.midpointPolicy) || comparison(block.values[state.mid], block.target) !== state.comparison) {
        issues.push({ code: "invalid_trace", path: `expectedStates[${index}]`, message: "Trace comparison or bounds are inconsistent with the values." });
        continue;
      }
      const next = expected[index + 1];
      if (next && (state.comparison === "equal" || (state.comparison === "less" ? next.low !== state.mid + 1 || next.high !== state.high : next.high !== state.mid - 1 || next.low !== state.low))) {
        issues.push({ code: "invalid_trace", path: `expectedStates[${index + 1}]`, message: "Trace does not move the required boundary past mid." });
      }
    }
    const last = expected.at(-1);
    if (last) {
      const nextLow = last.comparison === "less" ? last.mid + 1 : last.low;
      const nextHigh = last.comparison === "greater" ? last.mid - 1 : last.high;
      const actualTerminal = last.comparison === "equal" ? "found" : nextLow > nextHigh ? "absent" : null;
      if (actualTerminal !== block.terminalCondition) {
        issues.push({ code: "invalid_trace", path: "terminalCondition", message: "The final trace state does not prove the declared terminal condition." });
      }
    }
  }
  return issues;
}
