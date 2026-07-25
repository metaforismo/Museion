import { describe, expect, it } from "vitest";

import { cardClasses } from "@/components/ui/card-classes";
import { evidenceTone } from "@/lib/design/evidence-tone";

/**
 * The primitives are presentational and this repo has no component-render
 * stack, so the contract that can actually regress — the class strings the
 * cards emit — is pinned here through the pure helper.
 *
 * Membership is checked token-by-token rather than with `toContain`, because
 * "surface-card-quiet" contains "surface-card" as a substring: a substring
 * assertion would pass for the wrong surface.
 */
function tokens(classes: string): string[] {
  return classes.split(/\s+/).filter(Boolean);
}

describe("cardClasses", () => {
  it("uses the canonical surface for the solid tone", () => {
    expect(tokens(cardClasses("solid"))).toContain("surface-card");
  });

  it("uses the borderless quiet surface for the quiet tone", () => {
    const emitted = tokens(cardClasses("quiet"));
    expect(emitted).toContain("surface-card-quiet");
    expect(emitted).not.toContain("surface-card");
  });

  it("leaves the tinted tone without a background so the caller's subject tint shows", () => {
    const emitted = cardClasses("tinted");
    expect(emitted).not.toMatch(/\bbg-/);
    expect(tokens(emitted)).toContain("rounded-[var(--radius-card)]");
  });

  it("adds hover elevation only when interactive", () => {
    expect(cardClasses("quiet", true)).toContain("hover:-translate-y-0.5");
    expect(cardClasses("quiet", false)).not.toContain("hover:-translate-y-0.5");
  });

  it("raises a solid card past the elevation it already rests at", () => {
    // surface-card ships --shadow-1; hovering to --shadow-1 would lift the card
    // without changing its elevation.
    expect(cardClasses("solid", true)).toContain("hover:shadow-[var(--shadow-2)]");
    expect(cardClasses("quiet", true)).toContain("hover:shadow-[var(--shadow-1)]");
  });

  it("never emits a bespoke shadow outside the three-level system", () => {
    for (const tone of ["solid", "quiet", "tinted"] as const) {
      const shadows = cardClasses(tone, true).match(/shadow-\[[^\]]+\]/g) ?? [];
      expect(shadows.length).toBeGreaterThan(0);
      for (const shadow of shadows) {
        expect(shadow).toMatch(/var\(--shadow-[123]\)/);
      }
    }
  });

  it("never emits an arbitrary font size", () => {
    for (const tone of ["solid", "quiet", "tinted"] as const) {
      expect(cardClasses(tone, true)).not.toMatch(/text-\[[0-9.]+rem\]/);
    }
  });
});

describe("evidenceTone", () => {
  it("keeps a wrong answer and unfinished work apart", () => {
    // The Evidence page used to paint both gold, which reports a wrong answer
    // the engine never recorded. Pinning it so the merge cannot come back.
    expect(evidenceTone("incorrect")).toBe("wrong");
    expect(evidenceTone("developing")).toBe("attention");
    expect(evidenceTone("incorrect")).not.toBe(evidenceTone("developing"));
  });

  it("treats every accepted result as verified", () => {
    expect(evidenceTone("correct")).toBe("correct");
    expect(evidenceTone("consistent")).toBe("correct");
  });
});
