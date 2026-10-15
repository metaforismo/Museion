import { describe, expect, it } from "vitest";

import { getLesson, toPublicLesson } from "@/lib/content";
import type { PublicStep } from "@/lib/content/types";
import type { TutorUiAction } from "@/lib/maia/contracts";
import { allowedAuthoredUiTargets, authoredUiActions, targetUiActions } from "@/lib/maia/ui-targets";

const graphLesson = getLesson("functions-as-change-transformation-lab")!;
const recursionLesson = getLesson("recursion-code-lab")!;

describe("authored tutor target boundary", () => {
  it("exposes only the prompt on a prediction step, never options or submit controls", () => {
    expect(allowedAuthoredUiTargets(graphLesson.steps[0])).toEqual(["prompt"]);
  });

  it("gives internal and public graph steps the same finite rendered targets", () => {
    const graph = graphLesson.steps.find((step) => step.answer.kind === "graph")!;
    const publicGraph = toPublicLesson(graphLesson).steps.find((step) => step.kind === "graph")!;
    expect(allowedAuthoredUiTargets(graph)).toEqual(["prompt", "graph:canvas", "graph:a", "graph:h", "graph:k"]);
    expect(allowedAuthoredUiTargets(publicGraph)).toEqual(allowedAuthoredUiTargets(graph));
    expect(allowedAuthoredUiTargets({ ...publicGraph, graph: undefined })).toEqual(["prompt"]);
  });

  it("registers recursion slots only when the code renderer can show their placeholders", () => {
    const step = toPublicLesson(recursionLesson).steps.find((candidate) => candidate.lab)!;
    expect(allowedAuthoredUiTargets(step)).toContain("recursion:slot:next");
    const broken: PublicStep = {
      ...step,
      lab: { ...step.lab!, slots: [...step.lab!.slots, { id: "hidden", options: ["n"] }, { id: "not-rendered", options: ["n"] }], lines: [...step.lab!.lines, "{not-rendered}"] },
    };
    expect(allowedAuthoredUiTargets(broken)).not.toContain("recursion:slot:hidden");
    expect(allowedAuthoredUiTargets(broken)).not.toContain("recursion:slot:not-rendered");
  });

  it("drops stale or unrelated actions while preserving server-checked annotation text", () => {
    const step = toPublicLesson(recursionLesson).steps.find((candidate) => candidate.lab)!;
    const actions: TutorUiAction[] = [
      { kind: "annotate", targetId: "recursion:slot:next", text: "What changes between one call and the next?" },
      { kind: "highlight", targetId: "graph:h", text: null },
      { kind: "focus", targetId: "answer", text: null },
      { kind: "pulse", targetId: "submit", text: null },
    ];
    expect(authoredUiActions(step, actions)).toEqual([actions[0]]);
    expect(targetUiActions("recursion:slot:next", actions)).toEqual([actions[0]]);
  });
});
