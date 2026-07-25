import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildTrail, trailComplete } from "@/lib/design/course-trail";

/**
 * The course trail is the flagship of the energy pass, and the two claims it
 * must never break are honesty claims: every node state derives from the real
 * completion record, and nothing on the path is locked. The pure helper pins
 * the first; a source scan of the component pins the second, the same way the
 * Maia and pressable contracts are pinned in this repo without a render stack.
 */

const ids = ["one", "two", "three"] as const;

describe("buildTrail", () => {
  it("marks everything ahead with the first lesson current when nothing is recorded", () => {
    expect(buildTrail(ids, new Set()).map(({ state }) => state)).toEqual(["current", "ahead", "ahead"]);
  });

  it("marks completed lessons done and the first gap current", () => {
    expect(buildTrail(ids, new Set(["one"])).map(({ state }) => state)).toEqual(["done", "current", "ahead"]);
  });

  it("has no current node once every lesson has a completed record", () => {
    expect(buildTrail(ids, new Set(ids)).map(({ state }) => state)).toEqual(["done", "done", "done"]);
  });

  it("points current at the earliest gap even when later lessons were finished out of order", () => {
    // Museion recommends order, it does not lock it, so the record can be
    // non-linear. The path must report the record, not tidy it up.
    expect(buildTrail(ids, new Set(["three"])).map(({ state }) => state)).toEqual(["current", "ahead", "done"]);
  });

  it("colours a rail segment traversed only when the lesson it leaves is done", () => {
    const trail = buildTrail(ids, new Set(["one", "three"]));
    expect(trail.map(({ traversedFrom }) => traversedFrom)).toEqual([false, true, false]);
  });
});

describe("trailComplete", () => {
  it("is true only when every lesson has a completed record", () => {
    expect(trailComplete(ids, new Set(ids))).toBe(true);
    expect(trailComplete(ids, new Set(["one", "two"]))).toBe(false);
    expect(trailComplete([], new Set())).toBe(false);
  });
});

describe("the trail component's honesty and accessibility contract", () => {
  const source = readFileSync(path.resolve("src/components/CourseTrail.tsx"), "utf8");

  it("never draws a padlock — ahead nodes are quieter links, not locked content", () => {
    // The comments may talk about the rule; the markup may not break it. What
    // would break it is a lock glyph, so that is what the scan looks for.
    expect(source).not.toMatch(/\w*Lock\w*Icon|🔒/);
  });

  it("marks the current node as the step the learner is standing on", () => {
    expect(source).toContain('aria-current="step"');
  });

  it("keeps Maia still and posed curious — a move is available, nothing more", () => {
    expect(source).toContain('state="curious"');
    expect(source).not.toMatch(/\banimated\b/);
  });

  it("crowns the final node only from the completion record", () => {
    // `crowned` must derive from trailComplete, which reads completedLessons.
    expect(source).toMatch(/crowned = complete && index === total - 1/);
  });

  it("keeps every lesson description on the page — the path replaces a list, it does not delete one", () => {
    expect(source).toMatch(/lesson\.description/);
  });
});

describe("the halo in globals.css", () => {
  const globals = readFileSync(path.resolve("src/app/globals.css"), "utf8");

  it("breathes by opacity and scale only — no colour nobody contrast-checked, no shadow", () => {
    const keyframes = /@keyframes path-halo \{[\s\S]*?\n\}/.exec(globals)?.[0] ?? "";
    expect(keyframes).not.toBe("");
    expect(keyframes).not.toMatch(/box-shadow|color-mix/);
  });

  it("holds still under prefers-reduced-motion", () => {
    const reduced = /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*$/.exec(globals)?.[0] ?? "";
    expect(reduced).toContain(".path-halo");
  });
});
