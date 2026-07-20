import { describe, expect, it } from "vitest";

import { getLesson } from "@/lib/content";
import { LearnerSession } from "@/lib/engine/session";
import { describeActivity, describeActivityInline } from "@/lib/maia/activity";
import { buildTutorInstructions } from "@/lib/maia/prompt";
import { maiaRespond } from "@/lib/maia/tutor";

function graphSession() {
  const session = new LearnerSession(getLesson("functions-as-change-transformation-lab")!);
  session.submitAnswer("0");
  session.advance();
  return session; // now on the graph step
}

describe("live widget state for Maia", () => {
  it("describes a graph report only on a graph step", () => {
    const session = graphSession();
    const description = describeActivity(session.activeStep, { kind: "graph", a: 1, h: -3, k: 2 });
    expect(description).toContain("a=1, h=-3, k=2");
    expect(description).toContain("vertex sits at (-3, 2)");
    // Never the target's parameters — only the learner's own values.
    expect(description).not.toContain("h=3,");
  });

  it("drops a graph report on a non-graph step", () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    expect(describeActivity(session.activeStep, { kind: "graph", a: 1, h: 0, k: 0 })).toBeNull();
  });

  it("accepts only enumerated slot options for a recursion report", () => {
    const session = new LearnerSession(getLesson("recursion-code-lab")!);
    session.submitAnswer("0"); // solve MC predict step
    session.advance();
    const lab = session.activeStep.lab!;
    const slot = lab.slots[0];
    const valid = describeActivity(session.activeStep, {
      kind: "recursion",
      slots: { [slot.id]: slot.options[0] },
    });
    expect(valid).toContain(`${slot.id}=${slot.options[0]}`);
    expect(
      describeActivity(session.activeStep, { kind: "recursion", slots: { [slot.id]: "import os" } }),
    ).toBeNull();
    expect(
      describeActivity(session.activeStep, { kind: "recursion", slots: { "not-a-slot": slot.options[0] } }),
    ).toBeNull();
  });

  it("renders the live state into the tutor prompt", () => {
    const session = graphSession();
    const description = describeActivity(session.activeStep, { kind: "graph", a: 1, h: -3, k: 2 });
    const instructions = buildTutorInstructions(session.snapshot(), [], [], description);
    expect(instructions).toContain("liveWidgetState");
    expect(instructions).toContain("a=1, h=-3, k=2");
  });

  it("acknowledges the canvas in the deterministic offline reply", async () => {
    const session = graphSession();
    const delivery = await maiaRespond(
      session,
      "Why is my curve on the wrong side?",
      undefined,
      undefined,
      { kind: "graph", a: 1, h: -3, k: 2 },
    );
    expect(delivery.source).toBe("deterministic");
    expect(delivery.turn.message).toContain("I can see your canvas: a=1, h=-3, k=2.");
    expect(session.events.some((event) => event.kind === "maia_activity_observed")).toBe(true);
  });

  it("ignores a mismatched report in the offline reply", async () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    const delivery = await maiaRespond(
      session,
      "Help?",
      undefined,
      undefined,
      { kind: "graph", a: 1, h: 0, k: 0 },
    );
    expect(delivery.turn.message).not.toContain("I can see your canvas");
    expect(session.events.some((event) => event.kind === "maia_activity_observed")).toBe(false);
  });

  it("keeps inline descriptions to the learner's own values", () => {
    const session = graphSession();
    const inline = describeActivityInline(session.activeStep, { kind: "graph", a: 1, h: -3, k: 2 });
    expect(inline).toBe("I can see your canvas: a=1, h=-3, k=2.");
  });
});
