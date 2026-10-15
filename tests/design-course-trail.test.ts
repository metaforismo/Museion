import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CourseTrail from "@/components/CourseTrail";
import CourseLearningPath from "@/components/CourseLearningPath";

import { buildTrail, trailComplete } from "@/lib/design/course-trail";

/** Node states follow the real record, while authored lessons remain open out of order. */

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

describe("the shared path's progress and access contract", () => {
  const lessons = ids.map((id) => ({ id, title: `Lesson ${id}`, description: `Explore ${id}.` }));
  const renderTrail = (completed: string[]) => renderToStaticMarkup(createElement(CourseTrail, {
    courseId: "course", subject: "Algebra", lessons, completed: new Set(completed),
  }));

  it("keeps every authored lesson linked when nothing is recorded", () => {
    const html = renderTrail([]);
    for (const id of ids) expect(html).toContain(`/lessons/${id}?course=course`);
    expect(html).not.toContain('data-state="locked"');
    expect(html).not.toContain("Completed · revisit");
  });

  it("gives one current step to the earliest gap, including out-of-order records", () => {
    const html = renderTrail(["three"]);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-label="Lesson 1 of 3: Lesson one\. Up next" aria-current="step"/);
    expect(html).toContain("Lesson 3 of 3: Lesson three. Completed");
    expect(html).toContain("Explore one.");
  });

  it("marks completion without inventing a next step when every lesson is done", () => {
    const html = renderTrail([...ids]);
    expect(html).not.toContain('aria-current="step"');
    expect(html.match(/data-state="done"/g)).toHaveLength(3);
    expect(html).not.toContain("Start lesson");
  });

  it("shows a real locked generated checkpoint without giving it a working action", () => {
    const html = renderToStaticMarkup(createElement(CourseLearningPath, { nodes: [
      { id: "lesson", title: "An idea", state: "current", href: "/learn/run?lesson=idea" },
      { id: "transfer", title: "Independent challenge", kind: "challenge", state: "locked", href: "/forbidden", meta: "Finish the lesson first" },
    ] }));
    expect(html).toContain('data-state="locked"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("Finish the lesson first");
    expect(html).not.toContain('href="/forbidden"');
  });

  it("ignores an arrival hint for a lesson without recorded completion", () => {
    const html = renderToStaticMarkup(createElement(CourseLearningPath, { justCompletedId: "one", nodes: [
      { id: "one", title: "First idea", state: "current", href: "/learn/first" },
    ] }));
    expect(html).not.toMatch(/class="[^"]*arrived/);
  });
  it("does not paint a start or revisit control on an inert review preview", () => {
    const html = renderToStaticMarkup(createElement(CourseLearningPath, { nodes: [
      { id: "pending", title: "Review required", state: "current" },
      { id: "finished", title: "Recorded activity", state: "done" },
    ] }));
    expect(html).not.toContain("Start lesson");
    expect(html).not.toContain("revisit");
  });
});

describe("the shared path's motion defaults", () => {
  const css = readFileSync(path.resolve("src/components/CourseLearningPath.module.css"), "utf8");

  it("gates hover feedback to a precise pointer", () => {
    expect(css).toContain("@media (hover:hover) and (pointer:fine)");
  });

  it("keeps recorded arrival still under reduced motion", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion:reduce\)[\s\S]*\.arrived \{ animation:none; \}/);
  });
});
