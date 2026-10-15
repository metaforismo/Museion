import { describe, expect, it } from "vitest";

import { subjectColor, subjectKey, subjectTint } from "@/lib/curriculum/subjects";
import { subjectObjectSrc } from "@/lib/design/assets";

describe("subject helpers", () => {
  it.each([
    ["Algebra", "algebra"],
    ["algebra", "algebra"],
    ["  Computer Science  ", "cs"],
    ["Research Methods", "research"],
    ["Physics", "physics"],
    ["Biology", "biology"],
    ["Arithmetic", "arithmetic"],
    ["Underwater Basket Weaving", "default"],
  ])("maps %s to %s", (input, expected) => {
    expect(subjectKey(input)).toBe(expected);
  });

  it("returns var-backed accent and tint, so a token change propagates", () => {
    expect(subjectColor("Physics")).toBe("var(--color-subject-physics)");
    expect(subjectTint("Physics")).toBe("var(--color-subject-physics-tint)");
  });

  it("falls back to the default pair for unknown subjects", () => {
    expect(subjectTint("Nonsense")).toBe("var(--color-subject-default-tint)");
  });
});

describe("subjectObjectSrc", () => {
  it.each([
    ["Algebra", "/landing/product/course-algebra-as-balance.webp"],
    ["Arithmetic", "/landing/product/course-probability-as-evidence.webp"],
    ["Computer Science", "/landing/product/course-search-by-halving.webp"],
    ["Physics", "/landing/product/course-forces-and-motion.webp"],
    ["Biology", "/landing/product/course-natural-selection.webp"],
    ["Research Methods", "/landing/product/course-claims-to-evidence.webp"],
  ])("maps %s to its clay object", (subject, expected) => {
    expect(subjectObjectSrc(subject)).toBe(expected);
  });

  it("falls back to the mathematics object for unknown subjects", () => {
    expect(subjectObjectSrc("Nonsense")).toBe("/landing/product/course-algebra-as-balance.webp");
  });
});
