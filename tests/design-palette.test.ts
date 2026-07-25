import { describe, expect, it } from "vitest";

import { contrastRatio, relativeLuminance } from "@/lib/design/contrast";
import { SUBJECT_PALETTE, TINTS } from "@/lib/design/palette";

describe("contrastRatio", () => {
  it("returns 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("returns 1 for a colour against itself", () => {
    expect(contrastRatio("#2b5ee7", "#2b5ee7")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#2b5ee7", "#f3f9ff")).toBeCloseTo(contrastRatio("#f3f9ff", "#2b5ee7"), 5);
  });

  it("computes relative luminance of white as 1", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("SUBJECT_PALETTE", () => {
  const subjects = ["algebra", "arithmetic", "cs", "research", "physics", "biology"] as const;

  it.each(subjects)("%s accent text clears 4.5:1 on its own tint", (key) => {
    const entry = SUBJECT_PALETTE[key];
    expect(contrastRatio(entry.accentText, entry.tint)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(subjects)("%s accent clears 3:1 on white for non-text use", (key) => {
    const entry = SUBJECT_PALETTE[key];
    expect(contrastRatio(entry.accent, "#ffffff")).toBeGreaterThanOrEqual(3);
  });

  it.each(subjects)("%s references CSS variables that follow the naming convention", (key) => {
    const entry = SUBJECT_PALETTE[key];
    expect(entry.accentVar).toBe(`var(--color-subject-${key})`);
    expect(entry.tintVar).toBe(`var(--color-subject-${key}-tint)`);
  });

  it("gives every tint at least 7:1 against ink so body text stays readable on tinted fields", () => {
    for (const tint of Object.values(TINTS)) {
      expect(contrastRatio("#10131b", tint)).toBeGreaterThanOrEqual(7);
    }
  });

  it("has a default entry that falls back to lapis on sky", () => {
    expect(SUBJECT_PALETTE.default.tint).toBe(TINTS.sky);
    expect(contrastRatio(SUBJECT_PALETTE.default.accentText, SUBJECT_PALETTE.default.tint)).toBeGreaterThanOrEqual(4.5);
  });
});
