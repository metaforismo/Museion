import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { pressableClasses } from "@/components/ui/pressable-classes";

/**
 * The pressable treatment is the system's second depth device — hard edge =
 * "you can press this", blur = "this floats" — and this repo has no
 * component-render stack, so the contract is pinned the same way the cards
 * pin theirs: through the pure class helper, token by token.
 */
function tokens(classes: string): string[] {
  return classes.split(/\s+/).filter(Boolean);
}

const globals = readFileSync(path.resolve("src/app/globals.css"), "utf8");

describe("pressableClasses", () => {
  it.each(["primary", "attention", "secondary"] as const)("%s carries the press physics, the radius and the 44px floor", (variant) => {
    const emitted = tokens(pressableClasses(variant));
    expect(emitted).toContain("pressable");
    expect(emitted).toContain("rounded-2xl");
    expect(emitted).toContain("min-h-11");
  });

  it("puts white text on the primary fill and leaves the fill to the caller's accent", () => {
    const emitted = tokens(pressableClasses("primary"));
    expect(emitted).toContain("text-white");
    // The fill arrives as an inline subjectColor(); a bg- utility here would
    // hard-code one subject's colour into every subject's button.
    expect(emitted.some((token) => token.startsWith("bg-"))).toBe(false);
  });

  it("keeps the attention variant's checked pair — gold fill under ink, never white", () => {
    // White on gold is 2.80:1 and fails; ink is 6.62:1. The pair is baked into
    // the variant so no call site can re-decide it.
    const emitted = tokens(pressableClasses("attention"));
    expect(emitted).toContain("bg-gold");
    expect(emitted).toContain("text-ink");
    expect(emitted).not.toContain("text-white");
    expect(emitted).toContain("[--pressable-edge:var(--color-gold-deep)]");
  });

  it("gives the secondary variant a surface fill with ink text", () => {
    const emitted = tokens(pressableClasses("secondary"));
    expect(emitted).toContain("bg-surface");
    expect(emitted).toContain("text-ink");
  });

  it.each(["primary", "attention", "secondary"] as const)("%s never mixes the hard edge with a blur shadow", (variant) => {
    // Edge = presses, blur = floats. One depth grammar per element.
    expect(pressableClasses(variant)).not.toMatch(/shadow-\[?(var\(--shadow|\d)/);
  });

  it("never emits an off-scale font size", () => {
    for (const variant of ["primary", "attention", "secondary"] as const) {
      expect(pressableClasses(variant)).not.toMatch(/text-\[|(^|\s)text-(xs|sm|base)(\s|$)/);
    }
  });
});

describe("press physics in globals.css", () => {
  it("rests on a 4px deep edge and collapses it on press", () => {
    expect(globals).toMatch(/\.pressable\s*\{[^}]*box-shadow:\s*0 4px 0 0 var\(--pressable-edge\)/);
    expect(globals).toMatch(/\.pressable:not\(:disabled\):active\s*\{[^}]*box-shadow:\s*0 0 0 0 var\(--pressable-edge\)/);
    expect(globals).toMatch(/\.pressable:not\(:disabled\):active\s*\{[^}]*translateY\(2px\)/);
  });

  it("lifts 1px on hover", () => {
    expect(globals).toMatch(/\.pressable:hover\s*\{[^}]*translateY\(-1px\)/);
  });
});
