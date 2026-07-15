import { describe, expect, it } from "vitest";

import { getLesson, toPublicLesson } from "@/lib/content";
import { LearnerSession } from "@/lib/engine/session";
import {
  MAIA_PERSONA,
  buildStateBlock,
  buildSystemPrompt,
} from "@/lib/maia/prompt";

function snapshot(withMistake = false) {
  const session = new LearnerSession(getLesson("linear-equations-intro")!);
  if (withMistake) session.submitAnswer("2");
  return session.snapshot();
}

describe("Maia prompt", () => {
  it("contains the non-revelation guardrail in the persona", () => {
    expect(MAIA_PERSONA).toContain("NEVER state the final answer");
  });

  it("injects the verified solution, attempts and misconception", () => {
    const block = buildStateBlock(snapshot(true));
    expect(block).toContain("VERIFIED SOLUTION");
    expect(block).toContain("Subtracting 6"); // ground truth is in context
    expect(block).toContain("Learner's attempts so far: 2");
    expect(block).toContain("MISCONCEPTION detected");
    expect(block).toContain("SCAFFOLDING: novice");
  });

  it("renders cleanly with no attempts yet", () => {
    const block = buildStateBlock(snapshot());
    expect(block).toContain("none yet");
    expect(block).not.toContain("MISCONCEPTION");
  });

  it("caches only the stable persona block", () => {
    const [persona, state] = buildSystemPrompt(snapshot());
    expect(persona.cache_control).toEqual({ type: "ephemeral" });
    expect(persona.text).toBe(MAIA_PERSONA);
    expect("cache_control" in state).toBe(false);
  });
});

describe("public lesson sanitization", () => {
  it("never ships answers, solutions or hints to the browser", () => {
    const lesson = getLesson("linear-equations-intro")!;
    const serialized = JSON.stringify(toPublicLesson(lesson));
    expect(serialized).not.toContain("solution");
    expect(serialized).not.toContain("hints");
    expect(serialized).not.toContain("misconception");
    expect(serialized).not.toContain("correctIndex");
    expect(serialized).not.toContain('"value"');
    // Practice bank contents must not leak either — only the flag.
    expect(serialized).not.toContain('"practice"');
    expect(toPublicLesson(lesson).practiceAvailable).toBe(true);
  });
});
