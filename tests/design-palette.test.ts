import { describe, expect, it } from "vitest";

import { contrastRatio, relativeLuminance } from "@/lib/design/contrast";
import { STATE_DEEPS, SUBJECT_PALETTE, TINTS } from "@/lib/design/palette";

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

  // The accent is what `subjectColor()` returns and therefore what actually
  // gets painted, including as text on the subject's own tint. This assertion
  // used to run against a parallel `accentText` field that no CSS variable
  // carried and no component read, so the rule the design system rests on was
  // pinned against a value nothing rendered.
  it.each(subjects)("%s accent clears 4.5:1 on its own tint, where it is the text colour", (key) => {
    const entry = SUBJECT_PALETTE[key];
    expect(contrastRatio(entry.accent, entry.tint)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps one colour per role — a second per-subject text colour is one nobody checks", () => {
    expect(Object.keys(SUBJECT_PALETTE.algebra).sort()).toEqual(["accent", "accentVar", "deep", "deepVar", "tint", "tintVar"]);
  });

  // The deep shade is the hard bottom edge of a pressable element. Its whole
  // job is to read as the same hue in shadow, so the property that matters —
  // and the one a wrong literal would break — is that it is actually darker
  // than the accent it sits under. Asserted on relative luminance, not on the
  // hex strings, so a re-derivation cannot pass by matching the old numbers.
  it.each(subjects)("%s deep edge is genuinely darker than its accent", (key) => {
    const entry = SUBJECT_PALETTE[key];
    expect(relativeLuminance(entry.deep)).toBeLessThan(relativeLuminance(entry.accent) * 0.8);
  });

  it("keeps the state deeps darker than the accents they press", () => {
    const pairs = [
      [STATE_DEEPS.lapis, "#2b5ee7"],
      [STATE_DEEPS.gold, "#c79114"],
      [STATE_DEEPS.correct, "#137638"],
    ] as const;
    for (const [deep, accent] of pairs) {
      expect(relativeLuminance(deep)).toBeLessThan(relativeLuminance(accent) * 0.8);
    }
  });

  // Pressable primary puts white text on the full accent fill. Legal for all
  // six subjects (worst case algebra at 5.44:1) — and *only* for them: gold
  // fails at 2.80:1, which is why the attention Pressable takes ink instead.
  it.each(subjects)("%s accent carries white Pressable text at 4.5:1 or better", (key) => {
    expect(contrastRatio("#ffffff", SUBJECT_PALETTE[key].accent)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the gold Pressable honest — ink on gold, because white on gold fails", () => {
    expect(contrastRatio("#ffffff", "#c79114")).toBeLessThan(4.5);
    expect(contrastRatio("#10131b", "#c79114")).toBeGreaterThanOrEqual(4.5);
  });

  // The one documented exception, and the only reason algebra needs no second
  // palette field: --color-lapis-dark is a token in globals.css, rendered by
  // every `text-lapis-dark` in the app.
  it("keeps algebra's stronger text option honest — lapis-dark on sky", () => {
    expect(contrastRatio("#20379b", TINTS.sky)).toBeGreaterThanOrEqual(7);
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
    expect(contrastRatio(SUBJECT_PALETTE.default.accent, SUBJECT_PALETTE.default.tint)).toBeGreaterThanOrEqual(4.5);
  });
});
