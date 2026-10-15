import type { PublicStep, Step } from "../content/types";
import type { TutorUiAction } from "./contracts";

/** Only surfaces that the authored activity actually renders. No answer choice,
 * submit button, score, or hidden target value is addressable by the tutor. */
export function allowedAuthoredUiTargets(step: Step | PublicStep): string[] {
  const kind = "kind" in step ? step.kind : step.answer.kind;
  const targets = ["prompt"];
  if (kind === "graph" && ("answer" in step || step.graph)) targets.push("graph:canvas", "graph:a", "graph:h", "graph:k");
  const runtime = "answer" in step ? step.runtimeBlock : step.runtime;
  if (runtime) {
    targets.push(`block:${runtime.id}`, `prompt:${runtime.id}`, `status:${runtime.id}`);
    if (runtime.kind === "range-explorer" || runtime.kind === "state-trace") targets.push(`control:${runtime.id}:low`, `control:${runtime.id}:high`);
    if (runtime.kind === "state-trace") targets.push(`control:${runtime.id}:mid`);
    if (runtime.kind === "sequence-builder") for (const item of runtime.items) targets.push(`item:${runtime.id}:${item.id}`);
  }
  if (step.lab) {
    targets.push("recursion:code", "recursion:trace");
    for (const slot of step.lab.slots) {
      if (/^[a-zA-Z]+$/.test(slot.id) && step.lab.lines.some((line) => line.includes(`{${slot.id}}`))) targets.push(`recursion:slot:${slot.id}`);
    }
  }
  return [...new Set(targets)];
}

/** The UI repeats the target boundary for stale deliveries. Text remains the
 * server-validated, leak-gated text; this helper never invents guidance. */
export function authoredUiActions(step: Step | PublicStep, actions: readonly TutorUiAction[]): TutorUiAction[] {
  const allowed = new Set(allowedAuthoredUiTargets(step));
  return actions.filter((action) => allowed.has(action.targetId));
}

export function targetUiActions(targetId: string, actions: readonly TutorUiAction[]): TutorUiAction[] {
  return actions.filter((action) => action.targetId === targetId);
}
