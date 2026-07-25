import { describe, expect, it } from "vitest";

import { subjectColor, subjectKey, subjectTextColor, subjectTint } from "@/lib/curriculum/subjects";
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

  it("returns var-backed accent, tint and text colours", () => {
    expect(subjectColor("Physics")).toBe("var(--color-subject-physics)");
    expect(subjectTint("Physics")).toBe("var(--color-subject-physics-tint)");
    expect(subjectTextColor("Physics")).toBe("var(--color-subject-physics)");
  });

  it("falls back to the default pair for unknown subjects", () => {
    expect(subjectTint("Nonsense")).toBe("var(--color-subject-default-tint)");
  });
});

describe("subjectObjectSrc", () => {
  it.each([
    ["Algebra", "/landing/subject-mathematics-v2.png"],
    ["Arithmetic", "/landing/subject-arithmetic-v2.png"],
    ["Computer Science", "/landing/subject-computer-science-v2.png"],
    ["Physics", "/landing/subject-physics-v2.png"],
    ["Biology", "/landing/subject-biology-v2.png"],
    ["Research Methods", "/landing/subject-research-v2.png"],
  ])("maps %s to its clay object", (subject, expected) => {
    expect(subjectObjectSrc(subject)).toBe(expected);
  });

  it("falls back to the mathematics object for unknown subjects", () => {
    expect(subjectObjectSrc("Nonsense")).toBe("/landing/subject-mathematics-v2.png");
  });
});
