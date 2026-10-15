import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GraphTransformLab from "@/components/GraphTransformLab";
import RecursionCodeLab from "@/components/RecursionCodeLab";
import { getLesson, toPublicLesson } from "@/lib/content";
import { buildSessionState } from "@/lib/api-types";
import { LearnerSession } from "@/lib/engine/session";
import { graphParametersFromAttempt, recursionChoicesFromAttempt } from "@/lib/client/lab-resume";

const graphLesson = getLesson("functions-as-change-transformation-lab")!;
const graph = toPublicLesson(graphLesson).steps[1].graph!;
const recursionLesson = getLesson("recursion-code-lab")!;
const lab = toPublicLesson(recursionLesson).steps[1].lab!;
const submit = () => undefined;

function atLab(lesson: typeof graphLesson) {
  const session = new LearnerSession(lesson);
  session.submitAnswer("0");
  session.advance();
  return session;
}

describe("recorded lab submissions", () => {
  it("exposes the learner's own graph choice, with no guess before their attempt", () => {
    const session = atLab(graphLesson);
    expect(buildSessionState(session, toPublicLesson(graphLesson)).lastAttempt).toBeNull();
    session.submitAnswer("a=1,h=-3,k=2");
    const state = buildSessionState(session, toPublicLesson(graphLesson));
    expect(state.lastAttempt).toEqual({ answer: "a=1,h=-3,k=2", stepId: "step-2", variantIndex: 0 });
    expect(graphParametersFromAttempt(state.lastAttempt!.answer, graph)).toEqual({ a: 1, h: -3, k: 2 });
  });

  it("resumes a solved recursive function with filled controls and its actual output", () => {
    const session = atLab(recursionLesson);
    session.submitAnswer("base=1,baseReturn=1,head=n,next=n - 1");
    const restored = LearnerSession.fromState(JSON.parse(JSON.stringify(session.toState())));
    const state = buildSessionState(restored, toPublicLesson(recursionLesson));
    expect(state.awaitingAdvance).toBe(true);
    expect(state.lastAttempt?.answer).toBe("base=1,basereturn=1,head=n,next=n-1");
    const html = renderToStaticMarkup(createElement(RecursionCodeLab, { lab, initialAnswer: state.lastAttempt!.answer, disabled: true, checking: false, onSubmit: submit }));
    expect(html).toContain('value="n - 1" selected=""');
    expect(html).toContain("returns 6");
    expect(html).not.toContain("Fill every slot to run the function.");
    expect(html).not.toContain("waiting for all slots");
  });

  it("renders a resumed graph with the learner's recorded parameters rather than defaults", () => {
    const html = renderToStaticMarkup(createElement(GraphTransformLab, { graph, initialAnswer: "a=1,h=3,k=2", disabled: true, checking: false, onSubmit: submit }));
    expect(html).toContain("Currently h 3, k 2.");
    expect(html).toContain('value="3"');
    expect(html).toContain('value="2"');
  });

  it("does not carry a previous surface's answer into a newly activated variant", () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    session.submitAnswer("999");
    expect(buildSessionState(session, toPublicLesson(session.lesson)).lastAttempt?.answer).toBe("999");
    session.submitAnswer("888");
    const fresh = buildSessionState(session, toPublicLesson(session.lesson));
    expect(fresh.activeVariantIndex).toBe(1);
    expect(fresh.lastAttempt).toBeNull();
  });

  it("rejects malformed graph values and choices outside the public controls", () => {
    for (const answer of ["a=NaN,h=3,k=2", "a=4,h=3,k=2", "a=1,h=999,k=2", "a=1,h=3,k=2,secret=1", "a=1,h=3"]) {
      expect(graphParametersFromAttempt(answer, graph)).toBeNull();
    }
  });

  it("restores normalized slot text only when every choice is an existing option", () => {
    expect(recursionChoicesFromAttempt("base=0,basereturn=0,head=n,next=n-1", lab)).toEqual({ base: "0", baseReturn: "0", head: "n", next: "n - 1" });
    for (const answer of [null, "base=0,basereturn=0,head=n,next=eval(1)", "base=0,basereturn=0,head=n,next=n-1,next=n", "base=0,head=n,next=n-1"]) {
      expect(Object.values(recursionChoicesFromAttempt(answer, lab))).toEqual(["", "", "", ""]);
    }
  });
});
