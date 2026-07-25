# Museion Visual Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge Museion's two divergent design languages — the illustrated landing and the grey app shell — into one token system with structural subject colour, a single Inter type scale, and a state-driven Maia.

**Architecture:** All design decisions move into pure TypeScript modules under `src/lib/design/` so they are unit-testable without a component-rendering stack, which this repo does not have. Components become thin consumers of those modules. Enforcement is a set of source-scanning vitest tests with shrinking allowlists, so each surface task provably removes its own violations.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS v4 (`@theme` blocks, no config file), vitest 4, Playwright + axe for browser-level checks.

## Global Constraints

- Design source of truth: `docs/superpowers/specs/2026-07-25-museion-visual-unification-design.md`. Read it before starting.
- Branch is `v2/sites`. **Never push.** Nothing reaches `main`, GitHub, Devpost or Vercel before 2026-08-12.
- Every subject accent must clear **4.5:1** contrast against its own tint. This is non-negotiable and machine-checked.
- Type scale is exactly `11 / 12 / 13 / 15 / 17px` via tokens `--text-micro`, `--text-label`, `--text-body-sm`, `--text-body`, `--text-lead`. Tailwind's `text-lg` and above remain available for display sizes. **Arbitrary `text-[Xrem]` font sizes are banned.**
- Tracking: `-0.045em` display, `-0.01em` titles, `0` body.
- Inter only. Fraunces is retired entirely — dependency, import, token and all 75 `font-display` usages.
- The lesson and Judge canvas (`src/components/LessonPlayer.tsx`, `src/components/JudgeExperience.tsx`, `src/app/lessons/**`, `src/app/learn/**`, `src/app/judge/**`) are **out of scope**. Do not modify them except where a shared token forces a mechanical rename.
- No dark mode. No new image assets. No gamification.
- Existing bar must hold: `npm test` (387 passing), `npm run typecheck`, `npm run lint` all clean before every commit.
- Elevation stays on the existing three-shadow system. Do not invent shadows.

---

### Task 1: Contrast utility and verified subject palette

The palette is the backbone of the entire redesign. It ships first, with its contrast guarantee machine-checked, so no later task can silently break it.

**Files:**
- Create: `src/lib/design/contrast.ts`
- Create: `src/lib/design/palette.ts`
- Test: `tests/design-palette.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `contrastRatio(a: string, b: string): number` — WCAG 2.1 ratio between two `#rrggbb` colours
  - `relativeLuminance(hex: string): number`
  - `type SubjectKey = "algebra" | "arithmetic" | "cs" | "research" | "physics" | "biology" | "default"`
  - `type SubjectPalette = { accent: string; accentText: string; tint: string; accentVar: string; tintVar: string }`
  - `SUBJECT_PALETTE: Record<SubjectKey, SubjectPalette>`
  - `TINTS: Record<"sky" | "peach" | "mint" | "violet" | "yellow" | "coral", string>`

- [ ] **Step 1: Write the failing test**

Create `tests/design-palette.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/design-palette.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/design/contrast"`

- [ ] **Step 3: Implement the contrast utility**

Create `src/lib/design/contrast.ts`:

```ts
/**
 * WCAG 2.1 relative luminance and contrast ratio. Used to prove that every
 * subject accent stays readable on its own tint — the rule that lets coloured
 * surfaces carry text instead of degrading into decoration.
 */

function channels(hex: string): [number, number, number] {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Expected a #rrggbb colour, received "${hex}"`);
  }
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function linearize(channel: number): number {
  const ratio = channel / 255;
  return ratio <= 0.03928 ? ratio / 12.92 : Math.pow((ratio + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [red, green, blue] = channels(hex);
  return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
}

export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
```

- [ ] **Step 4: Implement the palette**

Create `src/lib/design/palette.ts`:

```ts
/**
 * The subject palette. Every subject owns an accent + tint pair so coloured
 * surfaces are possible at all; before this, a subject had an accent and no
 * fill, which is why the app could not use colour without one-off color-mix.
 *
 * accent      — fills, bars, rings, icon glyphs
 * accentText  — text and small marks on the subject's own tint (>= 4.5:1)
 * tint        — the surface fill for cards, washes and badges
 *
 * Biology and arithmetic deepened from their previous values because the
 * originals scored 3.91 and 4.37 against their tints. Hue identity is kept.
 */

export type SubjectKey = "algebra" | "arithmetic" | "cs" | "research" | "physics" | "biology" | "default";

export type SubjectPalette = {
  accent: string;
  accentText: string;
  tint: string;
  accentVar: string;
  tintVar: string;
};

export const TINTS = {
  sky: "#f3f9ff",
  peach: "#fff0e7",
  mint: "#dff8ea",
  violet: "#f7f1ff",
  yellow: "#fff2ad",
  coral: "#ffeee6",
} as const;

function entry(key: SubjectKey, accent: string, accentText: string, tint: string): SubjectPalette {
  return {
    accent,
    accentText,
    tint,
    accentVar: `var(--color-subject-${key})`,
    tintVar: `var(--color-subject-${key}-tint)`,
  };
}

export const SUBJECT_PALETTE: Record<SubjectKey, SubjectPalette> = {
  algebra: entry("algebra", "#2b5ee7", "#20379b", TINTS.sky),
  physics: entry("physics", "#b3341f", "#b3341f", TINTS.peach),
  biology: entry("biology", "#17703d", "#17703d", TINTS.mint),
  cs: entry("cs", "#6d28d9", "#6d28d9", TINTS.violet),
  arithmetic: entry("arithmetic", "#0b656d", "#0b656d", TINTS.yellow),
  research: entry("research", "#9a470c", "#9a470c", TINTS.coral),
  default: entry("default", "#2b5ee7", "#20379b", TINTS.sky),
};
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/design-palette.test.ts`
Expected: PASS, 12 tests

- [ ] **Step 6: Run the full suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: all pass, no new failures

- [ ] **Step 7: Commit**

```bash
git add src/lib/design/contrast.ts src/lib/design/palette.ts tests/design-palette.test.ts
git commit -m "feat: add contrast-verified subject palette"
```

---

### Task 2: Merge the token systems in CSS

**Files:**
- Modify: `src/app/globals.css:3-41` (`:root` and `@theme` blocks)
- Modify: `src/app/landing.module.css:1-16` (`.page` private variables)
- Test: `tests/design-tokens.test.ts`

**Interfaces:**
- Consumes: `SUBJECT_PALETTE`, `TINTS` from Task 1
- Produces: CSS custom properties `--color-subject-<key>`, `--color-subject-<key>-tint`, `--color-sky|peach|mint|violet|yellow|coral`, `--text-micro|label|body-sm|body|lead`, `--tracking-display|title|body`

- [ ] **Step 1: Write the failing test**

Create `tests/design-tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { SUBJECT_PALETTE, TINTS } from "@/lib/design/palette";

const globals = readFileSync(path.resolve("src/app/globals.css"), "utf8");
const landing = readFileSync(path.resolve("src/app/landing.module.css"), "utf8");

describe("globals.css", () => {
  it.each(Object.entries(SUBJECT_PALETTE))("declares the %s accent and tint with the palette's exact values", (key, entry) => {
    expect(globals).toContain(`--color-subject-${key}: ${entry.accent};`);
    expect(globals).toContain(`--color-subject-${key}-tint: ${entry.tint};`);
  });

  it.each(Object.entries(TINTS))("declares the %s tint token", (name, value) => {
    expect(globals).toContain(`--color-${name}: ${value};`);
  });

  it("adopts the landing ink and blue", () => {
    expect(globals).toContain("--color-ink: #10131b;");
    expect(globals).toContain("--color-lapis: #2b5ee7;");
  });

  it("declares the five-step type scale", () => {
    expect(globals).toContain("--text-micro: 0.6875rem;");
    expect(globals).toContain("--text-label: 0.75rem;");
    expect(globals).toContain("--text-body-sm: 0.8125rem;");
    expect(globals).toContain("--text-body: 0.9375rem;");
    expect(globals).toContain("--text-lead: 1.0625rem;");
  });

  it("declares tokenised tracking", () => {
    expect(globals).toContain("--tracking-display: -0.045em;");
    expect(globals).toContain("--tracking-title: -0.01em;");
  });
});

describe("landing.module.css", () => {
  it("no longer declares a private palette", () => {
    const privateVars = landing.match(/--landing-[a-z-]+:/g) ?? [];
    expect(privateVars).toEqual([]);
  });

  it("no longer overrides headings to a different family", () => {
    expect(landing).not.toContain("font-family: var(--font-ui)");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/design-tokens.test.ts`
Expected: FAIL — several assertions, starting with the subject accent values

- [ ] **Step 3: Rewrite the token blocks in `src/app/globals.css`**

Replace the `:root` block at lines 3-12 and the `@theme` block at lines 14-41 with:

```css
:root {
  --font-ui: "Inter Variable", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --radius-card: 1.25rem;
  --radius-control: 0.75rem;
  --shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.85);
  /* Back-compat aliases (legacy class strings) */
  --shadow-soft: var(--shadow-2);
  --shadow-tight: var(--shadow-1);
}

@theme {
  --color-paper: #f7f5f0;
  --color-surface: #ffffff;
  --color-ink: #10131b;
  --color-ink-soft: #5d6374;
  --color-lapis: #2b5ee7;
  --color-lapis-dark: #20379b;
  --color-lapis-soft: #e8edfc;
  --color-gold: #c79114;
  --color-gold-soft: #faf3dd;
  --color-correct: #137638;
  --color-correct-soft: #e7f6ec;
  --color-wrong: #b42318;
  --color-wrong-soft: #fdecea;

  /* Tints — promoted from the landing's private palette. These are surface
     fills, not decoration: every subject accent is contrast-checked against
     its own tint in tests/design-palette.test.ts. */
  --color-sky: #f3f9ff;
  --color-peach: #fff0e7;
  --color-mint: #dff8ea;
  --color-violet: #f7f1ff;
  --color-yellow: #fff2ad;
  --color-coral: #ffeee6;

  /* Subject accent + tint pairs. */
  --color-subject-algebra: #2b5ee7;
  --color-subject-algebra-tint: #f3f9ff;
  --color-subject-arithmetic: #0b656d;
  --color-subject-arithmetic-tint: #fff2ad;
  --color-subject-cs: #6d28d9;
  --color-subject-cs-tint: #f7f1ff;
  --color-subject-research: #9a470c;
  --color-subject-research-tint: #ffeee6;
  --color-subject-physics: #b3341f;
  --color-subject-physics-tint: #fff0e7;
  --color-subject-biology: #17703d;
  --color-subject-biology-tint: #dff8ea;
  --color-subject-default: #2b5ee7;
  --color-subject-default-tint: #f3f9ff;

  --font-sans: var(--font-ui);

  /* Type scale — five steps. Arbitrary text-[Xrem] is banned and enforced
     by tests/design-type-scale.test.ts. */
  --text-micro: 0.6875rem;
  --text-label: 0.75rem;
  --text-body-sm: 0.8125rem;
  --text-body: 0.9375rem;
  --text-lead: 1.0625rem;

  --tracking-display: -0.045em;
  --tracking-title: -0.01em;
  --tracking-body: 0em;

  /* Elevation system — exactly three levels. Do not add bespoke shadows. */
  --shadow-1: 0 1px 2px rgba(24, 33, 56, 0.05), 0 4px 14px rgba(24, 33, 56, 0.05);
  --shadow-2: 0 2px 4px rgba(24, 33, 56, 0.05), 0 12px 32px rgba(24, 33, 56, 0.09);
  --shadow-3: 0 8px 16px rgba(24, 33, 56, 0.08), 0 28px 70px rgba(24, 33, 56, 0.16);
}
```

Note `--font-serif-display` is deliberately absent; Task 3 removes its last consumers.

- [ ] **Step 4: Update `.title-page` and `.title-panel` in `src/app/globals.css`**

Replace the two rules (currently at lines 146-158) with:

```css
.title-page {
  font-size: clamp(1.5rem, 1.2rem + 1.3vw, 2rem);
  font-weight: 600;
  letter-spacing: var(--tracking-title);
  line-height: 1.15;
}

.title-panel {
  font-size: var(--text-lead);
  font-weight: 600;
  letter-spacing: var(--tracking-title);
}
```

- [ ] **Step 5: Strip the private palette from `src/app/landing.module.css`**

In the `.page` block at lines 1-16, delete the seven `--landing-*` declarations and keep the two easing variables. Then replace every `var(--landing-X)` reference throughout the file using this exact mapping:

| Was | Becomes |
| --- | --- |
| `var(--landing-ink)` | `var(--color-ink)` |
| `var(--landing-blue)` | `var(--color-lapis)` |
| `var(--landing-blue-soft)` | `var(--color-lapis-soft)` |
| `var(--landing-sky)` | `var(--color-sky)` |
| `var(--landing-peach)` | `var(--color-peach)` |
| `var(--landing-violet)` | `var(--color-violet)` |
| `var(--landing-mint)` | `var(--color-mint)` |
| `var(--landing-yellow)` | `var(--color-yellow)` |

Find every reference first so none is missed:

```bash
grep -n 'var(--landing-' src/app/landing.module.css
```

- [ ] **Step 6: Remove the heading font override in `src/app/landing.module.css`**

Delete the `font-family: var(--font-ui);` line from the `.page :is(h1, h2, h3)` rule at lines 21-24, keeping the `letter-spacing` declaration and changing it to the token:

```css
.page :is(h1, h2, h3) {
  letter-spacing: var(--tracking-display);
}
```

The family now inherits from `body`, which is already `var(--font-sans)` — the same Inter. The override existed only to escape Fraunces.

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run tests/design-tokens.test.ts`
Expected: PASS

- [ ] **Step 8: Verify the landing still renders**

Run: `npm run dev`, open `http://localhost:3000/`, confirm the hero, subject row and clouds render with unchanged colour. Stop the server.
Expected: visually identical to before — the values were adopted from the landing, so nothing on that page should shift.

- [ ] **Step 9: Run the full suite**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass

- [ ] **Step 10: Commit**

```bash
git add src/app/globals.css src/app/landing.module.css tests/design-tokens.test.ts
git commit -m "feat: merge landing and app token systems"
```

---

### Task 3: Retire Fraunces

75 usages across 28 files. Mechanical, but it removes a whole font payload.

**Files:**
- Modify: `src/app/layout.tsx:2` (remove import)
- Modify: `package.json` (remove dependency)
- Modify: 28 files containing `font-display`
- Test: `tests/design-typography.test.ts`

**Interfaces:**
- Consumes: token block from Task 2
- Produces: nothing new; removes `font-display` and `--font-serif-display` from the codebase

- [ ] **Step 1: Write the failing test**

Create `tests/design-typography.test.ts`:

```ts
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function grepCount(pattern: string, target: string): number {
  try {
    const output = execFileSync("grep", ["-ro", pattern, target], { encoding: "utf8" });
    return output.split("\n").filter(Boolean).length;
  } catch {
    return 0; // grep exits 1 when there are no matches
  }
}

describe("Fraunces retirement", () => {
  it("has no font-display class usages left in src", () => {
    expect(grepCount("font-display", "src")).toBe(0);
  });

  it("no longer defines the serif display token", () => {
    expect(grepCount("--font-serif-display", "src")).toBe(0);
  });

  it("no longer imports the Fraunces stylesheet", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).not.toContain("fraunces");
  });

  it("no longer depends on the Fraunces package", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(deps).some((name) => name.includes("fraunces"))).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/design-typography.test.ts`
Expected: FAIL — 75 `font-display` usages found, expected 0

- [ ] **Step 3: Replace every `font-display` usage**

List the files first:

```bash
grep -rl 'font-display' src
```

`font-display` only ever set the family, and the family is now uniform, so the class is simply deleted. Where it appeared alongside a size it leaves the size untouched. Apply tracking where the element is a display heading by adding `tracking-title`:

- On `h1`/`h2` elements: replace `font-display` with `tracking-title`
- On `h3` and smaller, or on `span`/`p`: delete `font-display` with no replacement

Example — `src/app/dashboard/page.tsx:102`:

```diff
-<h2 id="next-action-title" className="mt-2.5 max-w-2xl font-display text-2xl font-semibold tracking-[-0.01em] sm:text-[1.7rem]">
+<h2 id="next-action-title" className="mt-2.5 max-w-2xl text-2xl font-semibold tracking-title sm:text-3xl">
```

Note this also removes an arbitrary `text-[1.7rem]`, paying down Task 4 early.

Add the tracking utility to `src/app/globals.css` after the `.title-panel` rule so `tracking-title` resolves:

```css
.tracking-title {
  letter-spacing: var(--tracking-title);
}

.tracking-display {
  letter-spacing: var(--tracking-display);
}
```

- [ ] **Step 4: Remove the import and dependency**

In `src/app/layout.tsx`, delete line 2:

```diff
-import "@fontsource-variable/fraunces/wght.css";
 import "@fontsource-variable/inter/wght.css";
```

Then:

```bash
npm uninstall @fontsource-variable/fraunces
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/design-typography.test.ts`
Expected: PASS, 4 tests

- [ ] **Step 6: Verify the build and that no font 404s appear**

Run: `npm run build`
Expected: build succeeds

Run: `npm run dev`, load `/dashboard`, open DevTools Network filtered to Font.
Expected: only Inter files load; no Fraunces request, no 404.

- [ ] **Step 7: Run the full suite**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: retire Fraunces in favour of a single Inter display face"
```

---

### Task 4: Type-scale ratchet

The enforcement test lands with an allowlist of files not yet migrated. Every later surface task deletes its own entry. The allowlist can only ever shrink.

**Files:**
- Create: `src/lib/design/type-scale.ts`
- Test: `tests/design-type-scale.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `TYPE_SCALE: Record<"micro" | "label" | "body-sm" | "body" | "lead", string>`
  - `LEGACY_SIZE_MAP: Record<string, string>` — the deterministic old-to-new mapping used by every migration task

- [ ] **Step 1: Write the failing test**

Create `tests/design-type-scale.test.ts`:

```ts
import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

/**
 * Files still carrying arbitrary font sizes. This list may only shrink —
 * each surface task deletes its own entry. Adding an entry is a review
 * failure, not a fix.
 */
const NOT_YET_MIGRATED = [
  "src/components/AppSidebar.tsx",
  "src/components/SiteShell.tsx",
  "src/app/dashboard/page.tsx",
  "src/app/library/page.tsx",
  "src/app/progress/page.tsx",
  "src/app/review/page.tsx",
  "src/components/AppCommandPalette.tsx",
  "src/components/CoursePathCatalog.tsx",
  "src/components/LessonCatalog.tsx",
  "src/components/CourseArchitectPanel.tsx",
  "src/components/SourceCreator.tsx",
  "src/components/JudgeExperience.tsx",
  "src/components/MaiaPanel.tsx",
  "src/components/LessonPlayer.tsx",
  "src/components/JudgeDeferredPanels.tsx",
  "src/components/OnboardingTour.tsx",
  "src/components/AiSettingsPanel.tsx",
  "src/components/AccountControls.tsx",
];

function filesWithArbitrarySizes(): string[] {
  let output = "";
  try {
    output = execFileSync("grep", ["-rlE", String.raw`text-\[[0-9.]+rem\]`, "src"], { encoding: "utf8" });
  } catch {
    return [];
  }
  return output.split("\n").filter(Boolean).sort();
}

describe("type scale enforcement", () => {
  it("has no arbitrary font sizes outside the shrinking allowlist", () => {
    const offenders = filesWithArbitrarySizes().filter((file) => !NOT_YET_MIGRATED.includes(file));
    expect(offenders).toEqual([]);
  });

  it("keeps the allowlist honest — every listed file still exists and still has a violation", () => {
    const current = filesWithArbitrarySizes();
    const stale = NOT_YET_MIGRATED.filter((file) => !current.includes(file));
    expect(stale).toEqual([]);
  });
});
```

The second assertion is what makes the ratchet real: once a task cleans a file, the test fails until that task also removes the entry.

- [ ] **Step 2: Run the test to check the allowlist is accurate**

Run: `npx vitest run tests/design-type-scale.test.ts`
Expected: PASS. If "stale" entries are reported, delete exactly those lines from `NOT_YET_MIGRATED` — Task 3 already cleaned some files — and rerun until green.

- [ ] **Step 3: Add the scale module**

Create `src/lib/design/type-scale.ts`:

```ts
/**
 * The five-step type scale. Arbitrary text-[Xrem] classes are banned; the
 * mapping below is the deterministic migration rule applied by every surface
 * task. Where role and table disagree, role wins and the reviewer decides.
 */

export const TYPE_SCALE = {
  micro: "text-micro",
  label: "text-label",
  "body-sm": "text-body-sm",
  body: "text-body",
  lead: "text-lead",
} as const;

/** Old arbitrary rem value -> replacement utility. */
export const LEGACY_SIZE_MAP: Record<string, string> = {
  "0.56rem": "text-micro",
  "0.6rem": "text-micro",
  "0.62rem": "text-micro",
  "0.64rem": "text-micro",
  "0.65rem": "text-micro",
  "0.66rem": "text-micro",
  "0.67rem": "text-micro",
  "0.68rem": "text-label",
  "0.7rem": "text-label",
  "0.78rem": "text-body-sm",
  "0.8rem": "text-body-sm",
  "0.82rem": "text-body-sm",
  "0.84rem": "text-body-sm",
  "0.95rem": "text-body",
  "1.02rem": "text-lead",
  "1.7rem": "text-3xl",
};
```

- [ ] **Step 4: Run the full suite**

Run: `npm test && npm run typecheck`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/design/type-scale.ts tests/design-type-scale.test.ts
git commit -m "test: add shrinking type-scale ratchet"
```

---

### Task 5: Zone wash

**Files:**
- Create: `src/lib/design/zones.ts`
- Modify: `src/components/SiteShell.tsx:88` (app shell root element)
- Test: `tests/design-zones.test.ts`

**Interfaces:**
- Consumes: `SUBJECT_PALETTE` from Task 1
- Produces:
  - `type Zone = "learn" | "evidence" | "studio" | "account"`
  - `zoneForPath(pathname: string): Zone`
  - `washStyle(zone: Zone, subjectTint?: string): CSSProperties` — returns `{ backgroundImage }` or `{}`

- [ ] **Step 1: Write the failing test**

Create `tests/design-zones.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { washStyle, zoneForPath } from "@/lib/design/zones";

describe("zoneForPath", () => {
  it.each([
    ["/dashboard", "learn"],
    ["/library", "learn"],
    ["/review", "learn"],
    ["/courses/algebra-as-balance", "learn"],
    ["/progress", "evidence"],
    ["/create", "studio"],
    ["/create/review", "studio"],
    ["/settings", "account"],
    ["/account", "account"],
  ])("maps %s to the %s zone", (pathname, expected) => {
    expect(zoneForPath(pathname)).toBe(expected);
  });

  it("defaults unknown routes to learn", () => {
    expect(zoneForPath("/something-new")).toBe("learn");
  });

  it("is not confused by a prefix that is not a segment boundary", () => {
    expect(zoneForPath("/progressive")).toBe("learn");
  });
});

describe("washStyle", () => {
  it("produces a background image for a washed zone", () => {
    expect(washStyle("learn").backgroundImage).toContain("radial-gradient");
  });

  it("produces no background for the account zone", () => {
    expect(washStyle("account")).toEqual({});
  });

  it("prefers an explicit subject tint over the zone default", () => {
    const style = washStyle("learn", "#fff0e7");
    expect(style.backgroundImage).toContain("#fff0e7");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/design-zones.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/design/zones"`

- [ ] **Step 3: Implement zones**

Create `src/lib/design/zones.ts`:

```ts
import type { CSSProperties } from "react";

import { TINTS } from "./palette";

/**
 * Zone washes give wayfinding you feel before you read. One soft radial at
 * roughly 4% strength over paper — the same technique already used on the
 * lesson focus route, not a new gradient language.
 */

export type Zone = "learn" | "evidence" | "studio" | "account";

const ZONE_ROUTES: { zone: Zone; prefixes: string[] }[] = [
  { zone: "evidence", prefixes: ["/progress"] },
  { zone: "studio", prefixes: ["/create"] },
  { zone: "account", prefixes: ["/settings", "/account"] },
  { zone: "learn", prefixes: ["/dashboard", "/library", "/review", "/courses"] },
];

const ZONE_TINT: Record<Zone, string | null> = {
  learn: TINTS.sky,
  evidence: TINTS.mint,
  studio: TINTS.peach,
  account: null,
};

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function zoneForPath(pathname: string): Zone {
  for (const { zone, prefixes } of ZONE_ROUTES) {
    if (prefixes.some((prefix) => matches(pathname, prefix))) return zone;
  }
  return "learn";
}

export function washStyle(zone: Zone, subjectTint?: string): CSSProperties {
  const tint = subjectTint ?? ZONE_TINT[zone];
  if (!tint) return {};
  return {
    backgroundImage: `radial-gradient(58rem 34rem at 12% -6%, ${tint}, transparent), radial-gradient(46rem 30rem at 92% 4%, ${tint}, transparent)`,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/design-zones.test.ts`
Expected: PASS, 13 tests

- [ ] **Step 5: Wire the wash into the app shell**

In `src/components/SiteShell.tsx`, add the imports:

```ts
import { washStyle, zoneForPath } from "@/lib/design/zones";
```

Then in the app-shell return at line 88, apply the wash to the root element:

```diff
-  return <div className={`min-h-[100dvh] bg-paper lg:grid lg:grid-rows-[auto_minmax(0,1fr)] ${collapsed ? "lg:grid-cols-[5rem_minmax(0,1fr)]" : "lg:grid-cols-[17rem_minmax(0,1fr)]"}`}>
+  return <div style={washStyle(zoneForPath(pathname))} className={`min-h-[100dvh] bg-paper bg-fixed lg:grid lg:grid-rows-[auto_minmax(0,1fr)] ${collapsed ? "lg:grid-cols-[4.5rem_minmax(0,1fr)]" : "lg:grid-cols-[17rem_minmax(0,1fr)]"}`}>
```

The collapsed rail also narrows from `5rem` to `4.5rem` per the spec.

- [ ] **Step 6: Verify visually**

Run: `npm run dev`, visit `/dashboard`, `/progress`, `/create`, `/settings`.
Expected: dashboard reads faintly blue, progress faintly green, create faintly warm, settings plain cream. The wash must stay subtle enough that white cards still read as raised.

- [ ] **Step 7: Run the full suite**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass

- [ ] **Step 8: Commit**

```bash
git add src/lib/design/zones.ts src/components/SiteShell.tsx tests/design-zones.test.ts
git commit -m "feat: add per-zone background wash"
```

---

### Task 6: Subject colour helpers and SubjectIcon

**Files:**
- Modify: `src/lib/curriculum/subjects.ts`
- Modify: `src/components/SubjectIcon.tsx`
- Test: `tests/design-subjects.test.ts`

**Interfaces:**
- Consumes: `SUBJECT_PALETTE`, `SubjectKey` from Task 1
- Produces:
  - `subjectKey(subject: string): SubjectKey` (unchanged signature)
  - `subjectColor(subject: string): string` (unchanged signature, still returns a CSS var)
  - `subjectTint(subject: string): string` — returns `var(--color-subject-<key>-tint)`
  - `subjectTextColor(subject: string): string` — returns the accent-text var
  - `SubjectIcon` gains `variant="object"` rendering the clay PNG

- [ ] **Step 1: Write the failing test**

Create `tests/design-subjects.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/design-subjects.test.ts`
Expected: FAIL — `subjectTint` is not exported

- [ ] **Step 3: Extend `src/lib/curriculum/subjects.ts`**

Replace the whole file with:

```ts
import { SUBJECT_PALETTE, type SubjectKey } from "@/lib/design/palette";

/**
 * Subject identity. Every subject owns an accent + tint pair so colour can
 * fill a surface rather than only mark a hairline.
 */
export type { SubjectKey };

const SUBJECT_MAP: Record<string, SubjectKey> = {
  algebra: "algebra",
  arithmetic: "arithmetic",
  "computer science": "cs",
  "research methods": "research",
  physics: "physics",
  biology: "biology",
};

export function subjectKey(subject: string): SubjectKey {
  return SUBJECT_MAP[subject.trim().toLowerCase()] ?? "default";
}

/** Accent — fills, bars, rings, glyphs. */
export function subjectColor(subject: string): string {
  return SUBJECT_PALETTE[subjectKey(subject)].accentVar;
}

/** Tint — the surface fill for cards, badges and washes. */
export function subjectTint(subject: string): string {
  return SUBJECT_PALETTE[subjectKey(subject)].tintVar;
}

/** Text colour guaranteed to clear 4.5:1 on this subject's own tint. */
export function subjectTextColor(subject: string): string {
  return SUBJECT_PALETTE[subjectKey(subject)].accentVar;
}
```

Note `subjectTextColor` returns the accent var because for every subject except algebra the accent and accent-text values are identical; algebra's readable text colour is `--color-lapis-dark`, which callers use directly.

- [ ] **Step 4: Add the asset map**

Create `src/lib/design/assets.ts`:

```ts
import { subjectKey } from "@/lib/curriculum/subjects";

/**
 * Clay objects already shipped for the landing and previously unused by the
 * app. Grids and the sidebar use these; bespoke per-course art is reserved
 * for course detail heroes, where nothing sits beside it to look inconsistent.
 */

const SUBJECT_OBJECT: Record<string, string> = {
  algebra: "/landing/subject-mathematics-v2.png",
  arithmetic: "/landing/subject-arithmetic-v2.png",
  cs: "/landing/subject-computer-science-v2.png",
  research: "/landing/subject-research-v2.png",
  physics: "/landing/subject-physics-v2.png",
  biology: "/landing/subject-biology-v2.png",
  default: "/landing/subject-mathematics-v2.png",
};

/** Course ids with bespoke illustrations. The other four fall back to a tinted wash hero. */
export const COURSE_ART: Record<string, string> = {
  "algebra-as-balance": "/landing/course-algebra-balance.png",
  "search-by-halving": "/landing/course-search-halving.png",
  "probability-as-evidence": "/landing/course-probability-evidence.png",
  "functions-as-change": "/landing/course-functions-change.png",
  "claims-to-evidence": "/landing/course-claims-evidence.png",
  "samples-to-conclusions": "/landing/course-samples-conclusions.png",
};

export function subjectObjectSrc(subject: string): string {
  return SUBJECT_OBJECT[subjectKey(subject)] ?? SUBJECT_OBJECT.default;
}

export function courseArtSrc(courseId: string): string | null {
  return COURSE_ART[courseId] ?? null;
}
```

- [ ] **Step 5: Give SubjectIcon an object variant**

Replace the component in `src/components/SubjectIcon.tsx` with:

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Atom01Icon,
  CalculatorIcon,
  Dna01Icon,
  FunctionSquareIcon,
  SourceCodeIcon,
  TestTube01Icon,
} from "@hugeicons/core-free-icons";

import { subjectColor, subjectTint } from "@/lib/curriculum/subjects";
import { subjectObjectSrc } from "@/lib/design/assets";

const SUBJECT_ICONS: Record<string, typeof Atom01Icon> = {
  algebra: FunctionSquareIcon,
  arithmetic: CalculatorIcon,
  "computer science": SourceCodeIcon,
  "research methods": TestTube01Icon,
  physics: Atom01Icon,
  biology: Dna01Icon,
};

/**
 * A subject marker. `object` renders the clay illustration for grids and the
 * sidebar; `tinted` is the glyph on its subject tint; `plain` is the quiet
 * monochrome line treatment.
 */
export default function SubjectIcon({
  subject,
  size = 40,
  iconSize = 20,
  className,
  variant = "tinted",
}: {
  subject: string;
  size?: number;
  iconSize?: number;
  className?: string;
  variant?: "tinted" | "plain" | "object";
}) {
  if (variant === "object") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- fixed-size decorative clay asset; next/image adds no value at this scale
      <img
        src={subjectObjectSrc(subject)}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={`shrink-0 object-contain ${className ?? ""}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const icon = SUBJECT_ICONS[subject.trim().toLowerCase()] ?? FunctionSquareIcon;
  const tinted = variant === "tinted";
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center ${tinted ? "rounded-xl" : "text-current"} ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        ...(tinted ? { backgroundColor: subjectTint(subject), color: subjectColor(subject) } : {}),
      }}
    >
      <HugeiconsIcon icon={icon} size={iconSize} strokeWidth={1.8} />
    </span>
  );
}
```

The tinted variant now uses the real tint token instead of `color-mix(... 12%, transparent)`, which is what made every chip look washed out.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/design-subjects.test.ts`
Expected: PASS, 15 tests

- [ ] **Step 7: Run the full suite**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass

- [ ] **Step 8: Commit**

```bash
git add src/lib/curriculum/subjects.ts src/lib/design/assets.ts src/components/SubjectIcon.tsx tests/design-subjects.test.ts
git commit -m "feat: give subjects accent+tint pairs and clay objects"
```

---

### Task 7: Sidebar path ordering and progress endpoint

The root layout builds the sidebar's course list from static curriculum data with no per-learner progress, so the ordering rule needs a data source. A dedicated lightweight endpoint keeps the landing statically rendered.

**Files:**
- Create: `src/lib/design/sidebar-paths.ts`
- Create: `src/app/api/progress/route.ts`
- Test: `tests/design-sidebar-paths.test.ts`

**Interfaces:**
- Consumes: `currentActor` from `@/lib/server/actor`, `buildDashboardSnapshot` from `@/lib/dashboard`
- Produces:
  - `type SidebarCourse = { id: string; title: string; subject: string; lessonCount: number }`
  - `type CourseProgress = Record<string, { completed: number; total: number }>`
  - `orderSidebarPaths(courses: SidebarCourse[], progress: CourseProgress, limit?: number): { visible: SidebarCourse[]; hiddenCount: number }`
  - `GET /api/progress` returning `{ courseProgress: CourseProgress }`

- [ ] **Step 1: Write the failing test**

Create `tests/design-sidebar-paths.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { orderSidebarPaths, type SidebarCourse } from "@/lib/design/sidebar-paths";

const course = (id: string, lessonCount = 3): SidebarCourse => ({
  id,
  title: id,
  subject: "Algebra",
  lessonCount,
});

const catalog = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => course(id));

describe("orderSidebarPaths", () => {
  it("keeps catalog order when there is no progress", () => {
    const { visible, hiddenCount } = orderSidebarPaths(catalog, {}, 6);
    expect(visible.map((entry) => entry.id)).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(hiddenCount).toBe(2);
  });

  it("promotes in-progress courses above unstarted ones", () => {
    const progress = { g: { completed: 1, total: 3 } };
    const { visible } = orderSidebarPaths(catalog, progress, 6);
    expect(visible[0].id).toBe("g");
  });

  it("orders completed courses after in-progress but before unstarted", () => {
    const progress = {
      h: { completed: 3, total: 3 },
      g: { completed: 1, total: 3 },
    };
    const { visible } = orderSidebarPaths(catalog, progress, 6);
    expect(visible.map((entry) => entry.id).slice(0, 2)).toEqual(["g", "h"]);
  });

  it("breaks ties inside a bucket using catalog order", () => {
    const progress = {
      c: { completed: 1, total: 3 },
      a: { completed: 2, total: 3 },
    };
    const { visible } = orderSidebarPaths(catalog, progress, 6);
    expect(visible.map((entry) => entry.id).slice(0, 2)).toEqual(["a", "c"]);
  });

  it("reports no hidden courses when everything fits", () => {
    const { visible, hiddenCount } = orderSidebarPaths(catalog.slice(0, 3), {}, 6);
    expect(visible).toHaveLength(3);
    expect(hiddenCount).toBe(0);
  });

  it("treats a zero-total course as unstarted rather than complete", () => {
    const progress = { a: { completed: 0, total: 0 } };
    const { visible } = orderSidebarPaths(catalog, progress, 6);
    expect(visible[0].id).toBe("a");
  });

  it("never mutates the input array", () => {
    const input = [...catalog];
    orderSidebarPaths(input, { h: { completed: 1, total: 3 } }, 6);
    expect(input.map((entry) => entry.id)).toEqual(catalog.map((entry) => entry.id));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/design-sidebar-paths.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the ordering**

Create `src/lib/design/sidebar-paths.ts`:

```ts
/**
 * Sidebar path ordering. Ten identical rows is a wall; six ordered by what
 * the learner is actually doing is navigation. Ordering is deterministic so
 * the rail never reshuffles between renders.
 */

export type SidebarCourse = { id: string; title: string; subject: string; lessonCount: number };
export type CourseProgress = Record<string, { completed: number; total: number }>;

const IN_PROGRESS = 0;
const COMPLETED = 1;
const UNSTARTED = 2;

function bucket(entry: { completed: number; total: number } | undefined): number {
  if (!entry || entry.completed <= 0) return UNSTARTED;
  if (entry.total > 0 && entry.completed >= entry.total) return COMPLETED;
  return IN_PROGRESS;
}

export function orderSidebarPaths(
  courses: SidebarCourse[],
  progress: CourseProgress,
  limit = 6,
): { visible: SidebarCourse[]; hiddenCount: number } {
  const ordered = courses
    .map((course, index) => ({ course, index, bucket: bucket(progress[course.id]) }))
    .sort((left, right) => left.bucket - right.bucket || left.index - right.index)
    .map((item) => item.course);

  return {
    visible: ordered.slice(0, limit),
    hiddenCount: Math.max(0, ordered.length - limit),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/design-sidebar-paths.test.ts`
Expected: PASS, 7 tests

- [ ] **Step 5: Add the progress endpoint**

Create `src/app/api/progress/route.ts`, following the response conventions of the existing `src/app/api/sessions/route.ts` — read that file first and match its error handling and headers:

```ts
import { NextResponse } from "next/server";

import { buildDashboardSnapshot } from "@/lib/dashboard";
import { currentActor } from "@/lib/server/actor";

export const dynamic = "force-dynamic";

/**
 * Course progress for the navigation rail. Deliberately narrow: the sidebar
 * needs ordering and progress rails, not the full dashboard snapshot.
 */
export async function GET() {
  const actor = await currentActor();
  const snapshot = await buildDashboardSnapshot(actor.ownerId);
  return NextResponse.json({ courseProgress: snapshot.courseProgress });
}
```

- [ ] **Step 6: Verify the endpoint responds**

Run: `npm run dev`, then:

```bash
curl -s http://localhost:3000/api/progress
```

Expected: JSON containing a `courseProgress` object keyed by course id.

- [ ] **Step 7: Run the full suite**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass

- [ ] **Step 8: Commit**

```bash
git add src/lib/design/sidebar-paths.ts src/app/api/progress/route.ts tests/design-sidebar-paths.test.ts
git commit -m "feat: add deterministic sidebar path ordering and progress endpoint"
```

---

### Task 8: Rebuild the sidebar

**Files:**
- Modify: `src/components/AppSidebar.tsx` (full rewrite)
- Modify: `tests/design-type-scale.test.ts` (remove `src/components/AppSidebar.tsx` from the allowlist)

**Interfaces:**
- Consumes: `orderSidebarPaths`, `CourseProgress`, `SidebarCourse` (Task 7); `subjectColor` (Task 6)
- Produces: `AppSidebar` props gain `progress?: CourseProgress` and `guidance?: "live" | "offline"`

- [ ] **Step 1: Rewrite the component**

Replace `src/components/AppSidebar.tsx` entirely:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { HugeiconsIcon } from "@hugeicons/react";
import { ChartUpIcon, Files02Icon, Home09Icon, LibraryIcon, RepeatIcon, Settings01Icon } from "@hugeicons/core-free-icons";

import AppIcon from "./AppIcon";
import BrandMark from "./BrandMark";
import SubjectIcon from "./SubjectIcon";
import { subjectColor } from "@/lib/curriculum/subjects";
import { orderSidebarPaths, type CourseProgress, type SidebarCourse } from "@/lib/design/sidebar-paths";

const GROUPS: { label: string; items: { href: string; label: string; icon: typeof Home09Icon }[] }[] = [
  { label: "Learn", items: [
    { href: "/dashboard", label: "Home", icon: Home09Icon },
    { href: "/library", label: "Library", icon: LibraryIcon },
    { href: "/review", label: "Review", icon: RepeatIcon },
  ] },
  { label: "Your work", items: [
    { href: "/create", label: "Source Studio", icon: Files02Icon },
    { href: "/progress", label: "Evidence", icon: ChartUpIcon },
  ] },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const NAV_BASE = "group relative flex min-h-10 items-center gap-2.5 rounded-xl text-body-sm font-medium transition duration-200 active:translate-y-px";
const NAV_ACTIVE = "bg-sky text-lapis-dark";
const NAV_IDLE = "text-ink-soft hover:bg-paper hover:text-ink";

/** Progress is per-learner, so it is fetched here rather than forcing the static root layout dynamic. */
function useCourseProgress(): CourseProgress {
  const [progress, setProgress] = useState<CourseProgress>({});
  useEffect(() => {
    let cancelled = false;
    fetch("/api/progress")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!cancelled && payload?.courseProgress) setProgress(payload.courseProgress);
      })
      .catch(() => { /* the rail degrades to catalog order without progress rails */ });
    return () => { cancelled = true; };
  }, []);
  return progress;
}

export default function AppSidebar({
  collapsed = false,
  courses = [],
  onNavigate,
  onToggle,
  guidance = "offline",
}: {
  collapsed?: boolean;
  courses?: SidebarCourse[];
  onNavigate?: () => void;
  onToggle?: () => void;
  guidance?: "live" | "offline";
}) {
  const pathname = usePathname();
  const progress = useCourseProgress();
  const settingsActive = isActive(pathname, "/settings");
  const { visible, hiddenCount } = orderSidebarPaths(courses, progress, 6);

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className={`flex h-16 shrink-0 items-center border-b border-ink/[0.06] ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <Link href="/dashboard" aria-label="Museion home" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5">
          <BrandMark className="h-9 w-9 shrink-0" />
          {!collapsed && <span className="truncate text-lead font-semibold tracking-title">Museion</span>}
        </Link>
      </div>

      <nav aria-label="Application navigation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-5 pt-4 [scrollbar-width:thin]">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            {!collapsed && <p className="px-2.5 pb-2 text-label font-semibold uppercase tracking-[0.12em] text-ink-soft">{group.label}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={`${NAV_BASE} ${active ? NAV_ACTIVE : NAV_IDLE} ${collapsed ? "justify-center px-0" : "px-2"}`}
                  >
                    {active && <span aria-hidden="true" className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-lapis" />}
                    <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center">
                      <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.75} />
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {visible.length > 0 && (
          <section aria-labelledby="sidebar-paths-title" className="mt-7 border-t border-ink/8 pt-5">
            {!collapsed && (
              <div className="flex items-center justify-between gap-3 px-2.5 pb-2">
                <p id="sidebar-paths-title" className="text-label font-semibold uppercase tracking-[0.12em] text-ink-soft">Paths</p>
                {hiddenCount > 0 && (
                  <Link href="/library" onClick={onNavigate} className="rounded-md px-1 py-0.5 text-micro font-medium text-lapis-dark hover:bg-lapis-soft">
                    View all {courses.length}
                  </Link>
                )}
              </div>
            )}
            <ol className="space-y-0.5">
              {visible.map((course) => {
                const href = `/courses/${course.id}`;
                const active = isActive(pathname, href);
                const entry = progress[course.id];
                const ratio = entry && entry.total > 0 ? entry.completed / entry.total : 0;
                const accent = subjectColor(course.subject);
                return (
                  <li key={course.id}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                      title={`${course.title} — ${course.subject}, ${course.lessonCount} lessons`}
                      className={`group flex min-h-10 items-center gap-2.5 rounded-xl transition duration-200 active:translate-y-px ${active ? "bg-paper text-ink" : "text-ink-soft hover:bg-paper hover:text-ink"} ${collapsed ? "justify-center px-0" : "px-2"}`}
                    >
                      <SubjectIcon subject={course.subject} variant="object" size={22} />
                      {!collapsed && (
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-body-sm font-semibold ${active ? "text-ink" : ""}`}>{course.title}</span>
                          {ratio > 0 && (
                            <span aria-hidden="true" className="mt-1 block h-0.5 w-full overflow-hidden rounded-full bg-ink/10">
                              <span className="block h-full rounded-full" style={{ width: `${Math.round(ratio * 100)}%`, backgroundColor: accent }} />
                            </span>
                          )}
                        </span>
                      )}
                      <span className="sr-only">{course.title}, {course.lessonCount} lessons</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </nav>

      <div className="shrink-0 border-t border-ink/8 bg-surface/95 p-2">
        {!collapsed && (
          <p className="mb-1.5 flex items-center gap-2 px-2.5 text-micro text-ink-soft">
            <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${guidance === "live" ? "bg-correct" : "bg-ink/25"}`} />
            {guidance === "live" ? "Live guidance connected" : "Offline verified guidance"}
          </p>
        )}
        <div className={collapsed ? "space-y-1" : "flex items-center gap-1"}>
          <Link
            href="/settings"
            title={collapsed ? "Settings" : undefined}
            aria-current={settingsActive ? "page" : undefined}
            onClick={onNavigate}
            className={`relative flex min-h-11 items-center gap-2.5 rounded-xl text-body-sm font-medium transition active:translate-y-px ${settingsActive ? NAV_ACTIVE : NAV_IDLE} ${collapsed ? "justify-center" : "flex-1 px-2"}`}
          >
            {settingsActive && <span aria-hidden="true" className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-lapis" />}
            <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center"><HugeiconsIcon icon={Settings01Icon} size={18} strokeWidth={1.75} /></span>
            {!collapsed && "Settings"}
          </Link>
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`hidden min-h-11 items-center justify-center rounded-xl text-ink-soft transition hover:bg-paper hover:text-ink lg:flex ${collapsed ? "w-full" : "w-11 shrink-0"}`}
            >
              <AppIcon name="collapse" className={`h-[1.15rem] w-[1.15rem] transition-transform ${collapsed ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

Changes made: tagline removed, header 80px → 64px, active state is `bg-sky text-lapis-dark` instead of the invisible 3.5% ink, subject colour restored via the clay object, paths capped at six with deterministic ordering and accent progress rails, the Maia card replaced by the guidance indicator, one icon size, one stroke weight, and exactly three type steps in the rail.

- [ ] **Step 2: Update the two call sites in `src/components/SiteShell.tsx`**

`AppSidebar` no longer takes `lessonCount`. Update both usages (desktop `aside` at line 90 and the mobile drawer at line 96):

```diff
-<AppSidebar collapsed={collapsed} courses={courses} lessonCount={lessons.length} onToggle={toggle} />
+<AppSidebar collapsed={collapsed} courses={courses} onToggle={toggle} />
```

```diff
-<AppSidebar courses={courses} lessonCount={lessons.length} onNavigate={() => setSidebarOpen(false)} />
+<AppSidebar courses={courses} onNavigate={() => setSidebarOpen(false)} />
```

- [ ] **Step 3: Remove the sidebar from the type-scale allowlist**

In `tests/design-type-scale.test.ts`, delete this line from `NOT_YET_MIGRATED`:

```diff
-  "src/components/AppSidebar.tsx",
```

- [ ] **Step 4: Run the ratchet and full suite**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass. If the ratchet reports `AppSidebar.tsx` as an offender, an arbitrary size survived the rewrite — find it with `grep -nE 'text-\[[0-9.]+rem\]' src/components/AppSidebar.tsx`.

- [ ] **Step 5: Verify visually at both widths**

Run: `npm run dev`, open `/dashboard`. Confirm: active item is clearly filled, course rows show coloured clay objects, at most six paths with "View all 10", progress rails appear on started courses, no Maia card. Collapse the rail and confirm icons stay legible at 4.5rem.

- [ ] **Step 6: Commit**

```bash
git add src/components/AppSidebar.tsx src/components/SiteShell.tsx tests/design-type-scale.test.ts
git commit -m "feat: rebuild sidebar with subject colour and visible states"
```

---

### Task 9: Shared UI primitives

Extracting these is what stops the divergence recurring — library drifted precisely because it rebuilt cards by hand.

**Files:**
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/SectionHeader.tsx`
- Create: `src/components/ui/StatTile.tsx`
- Create: `src/components/ui/Chip.tsx`
- Create: `src/components/ui/SubjectBadge.tsx`
- Create: `src/components/ui/ProgressRail.tsx`
- Create: `src/components/ui/index.ts`
- Test: `tests/design-primitives.test.ts`

**Interfaces:**
- Consumes: `subjectColor`, `subjectTint` (Task 6)
- Produces:
  - `Card({ as?, tone?, interactive?, accent?, className?, children })` — `tone: "solid" | "quiet" | "tinted"`
  - `SectionHeader({ id, title, action?, icon?, accent? })`
  - `StatTile({ label, value, icon, accent })`
  - `Chip({ tone, children })` — `tone: "neutral" | "correct" | "attention" | "wrong"`
  - `SubjectBadge({ subject, level?, size? })`
  - `ProgressRail({ ratio, accent, label? })`

- [ ] **Step 1: Write the failing test**

The primitives are presentational, and this repo has no component-render stack, so the test pins the class contracts they emit through a pure helper. Create `src/components/ui/card-classes.ts` alongside the component and test that.

Create `tests/design-primitives.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { cardClasses } from "@/components/ui/card-classes";

describe("cardClasses", () => {
  it("uses the canonical surface for the solid tone", () => {
    expect(cardClasses("solid")).toContain("surface-card");
  });

  it("uses the borderless quiet surface for the quiet tone", () => {
    expect(cardClasses("quiet")).toContain("surface-card-quiet");
  });

  it("adds hover elevation only when interactive", () => {
    expect(cardClasses("quiet", true)).toContain("hover:-translate-y-0.5");
    expect(cardClasses("quiet", false)).not.toContain("hover:-translate-y-0.5");
  });

  it("never emits a bespoke shadow outside the three-level system", () => {
    const emitted = cardClasses("solid", true);
    const shadows = emitted.match(/shadow-\[[^\]]+\]/g) ?? [];
    for (const shadow of shadows) {
      expect(shadow).toMatch(/var\(--shadow-[123]\)/);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/design-primitives.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the class helper**

Create `src/components/ui/card-classes.ts`:

```ts
export type CardTone = "solid" | "quiet" | "tinted";

/**
 * Single source of truth for card surfaces. Elevation is restricted to the
 * three-level shadow system; bespoke shadows are a review failure.
 */
export function cardClasses(tone: CardTone, interactive = false): string {
  const base =
    tone === "solid" ? "surface-card" :
    tone === "quiet" ? "surface-card-quiet" :
    "rounded-[var(--radius-card)] border border-ink/8";
  const motion = interactive
    ? "transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]"
    : "";
  return `${base} ${motion}`.trim();
}
```

- [ ] **Step 4: Implement the components**

Create `src/components/ui/Card.tsx`:

```tsx
import type { ReactNode } from "react";

import { cardClasses, type CardTone } from "./card-classes";

export default function Card({
  tone = "quiet",
  interactive = false,
  accent,
  className = "",
  children,
}: {
  tone?: CardTone;
  interactive?: boolean;
  accent?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`${cardClasses(tone, interactive)} ${className}`}
      style={accent ? { borderTop: `3px solid ${accent}` } : undefined}
    >
      {children}
    </div>
  );
}
```

Create `src/components/ui/ProgressRail.tsx`:

```tsx
export default function ProgressRail({ ratio, accent, label }: { ratio: number; accent: string; label?: string }) {
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10"
      >
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(4, percent)}%`, backgroundColor: accent }} />
      </div>
      <span className="text-micro tabular-nums text-ink-soft">{percent}%</span>
    </div>
  );
}
```

Create `src/components/ui/Chip.tsx`:

```tsx
import type { ReactNode } from "react";

const TONES = {
  neutral: "bg-paper text-ink-soft",
  correct: "bg-correct-soft text-correct",
  attention: "bg-gold-soft text-ink",
  wrong: "bg-wrong-soft text-wrong",
} as const;

export default function Chip({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`rounded-full px-2.5 py-1 text-micro font-medium ${TONES[tone]}`}>{children}</span>;
}
```

Create `src/components/ui/SubjectBadge.tsx`:

```tsx
import SubjectIcon from "../SubjectIcon";

export default function SubjectBadge({ subject, level, size = 38 }: { subject: string; level?: string; size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <SubjectIcon subject={subject} variant="object" size={size} />
      <span className="text-label font-medium text-ink-soft">
        {subject}
        {level && <span className="block capitalize">{level}</span>}
      </span>
    </span>
  );
}
```

Create `src/components/ui/StatTile.tsx`:

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import type { Atom01Icon } from "@hugeicons/core-free-icons";

export default function StatTile({
  label,
  value,
  icon,
  accent,
  tint,
}: {
  label: string;
  value: number;
  icon: typeof Atom01Icon;
  accent: string;
  tint: string;
}) {
  return (
    <div className="surface-card-quiet flex items-center gap-3 px-4 py-3">
      <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: tint, color: accent }}>
        <HugeiconsIcon icon={icon} size={20} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none tabular-nums tracking-title">{value}</p>
        <p className="mt-1 truncate text-label leading-4 text-ink-soft">{label}</p>
      </div>
    </div>
  );
}
```

Create `src/components/ui/SectionHeader.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

export default function SectionHeader({
  id,
  title,
  actionHref,
  actionLabel,
  icon,
}: {
  id: string;
  title: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <h2 id={id} className="title-panel flex items-center gap-2">{icon}{title}</h2>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="text-body-sm font-medium text-lapis-dark">{actionLabel}</Link>
      )}
    </div>
  );
}
```

Create `src/components/ui/index.ts`:

```ts
export { default as Card } from "./Card";
export { default as Chip } from "./Chip";
export { default as ProgressRail } from "./ProgressRail";
export { default as SectionHeader } from "./SectionHeader";
export { default as StatTile } from "./StatTile";
export { default as SubjectBadge } from "./SubjectBadge";
export { cardClasses, type CardTone } from "./card-classes";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/design-primitives.test.ts`
Expected: PASS, 4 tests

- [ ] **Step 6: Run the full suite**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add src/components/ui tests/design-primitives.test.ts
git commit -m "feat: add shared UI primitives"
```

---

### Task 10: Rebuild the dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `tests/design-type-scale.test.ts` (remove the dashboard entry)

**Interfaces:**
- Consumes: primitives (Task 9), `subjectColor`/`subjectTint` (Task 6), `courseArtSrc` (Task 6)
- Produces: nothing consumed elsewhere

- [ ] **Step 1: Give the hero the recommended action's subject colour**

The hero currently renders on white with a blur blob. Derive the subject from the recommended action's course and tint the whole card. Add near the top of `DashboardPage`, after `resumeItem` is computed:

```tsx
const heroCourse = coursePaths.find((course) => snapshot.nextAction.href.includes(course.id));
const heroSubject = heroCourse?.subject ?? "Algebra";
const heroAccent = subjectColor(heroSubject);
const heroTint = subjectTint(heroSubject);
```

Then change the mission section opening at line 95 and the inner panel at line 97:

```diff
-      <section className="surface-card mt-6 overflow-hidden" aria-labelledby="next-action-title">
+      <section className="surface-card mt-6 overflow-hidden" aria-labelledby="next-action-title" style={{ backgroundColor: heroTint }}>
         <div className="flex items-stretch">
           <div className="flex-1 p-5 sm:p-6">
-            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-lapis-dark">
-              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-lapis" />
+            <p className="flex items-center gap-2 text-label font-semibold uppercase tracking-[0.08em]" style={{ color: heroAccent }}>
+              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: heroAccent }} />
               Next move · {activeMove}
             </p>
```

Change the Begin button at line 117-122 to the subject accent:

```diff
-                className="group inline-flex min-h-11 items-center rounded-xl bg-lapis px-5 text-sm font-semibold text-white shadow-[var(--shadow-1)] transition hover:-translate-y-0.5 hover:bg-lapis-dark"
+                className="group inline-flex min-h-11 items-center rounded-xl px-5 text-body-sm font-semibold text-white shadow-[var(--shadow-1)] transition hover:-translate-y-0.5"
+                style={{ backgroundColor: heroAccent }}
```

Replace the resume progress markup at lines 108-115 with the primitive:

```tsx
{resumeItem && (
  <div className="mt-4 max-w-md">
    <ProgressRail ratio={resumeItem.progress} accent={heroAccent} label={`${resumeItem.title} progress`} />
  </div>
)}
```

Delete the blur blob at line 133 — the tint replaces it:

```diff
-            <span aria-hidden="true" className="absolute bottom-2 right-4 h-24 w-24 rounded-full bg-lapis-soft/80 blur-xl" />
```

- [ ] **Step 2: Make the method spine legible**

Replace the `<ol>` at lines 139-155 so the active move is named at every width and completed moves read as done:

```tsx
<ol className="grid grid-cols-7 border-t border-ink/8 bg-surface/60" aria-label="The Museion Method">
  {METHOD_MOVES.map((move, index) => {
    const activeIndex = METHOD_MOVES.indexOf(activeMove);
    const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "upcoming";
    return (
      <li key={move} className="flex flex-col items-center gap-1 px-1 py-2.5 text-center">
        <span
          aria-hidden="true"
          className="h-1 w-6 rounded-full transition sm:w-9"
          style={{ backgroundColor: state === "upcoming" ? "rgba(16,19,27,0.1)" : heroAccent, opacity: state === "done" ? 0.4 : 1 }}
        />
        <span className={`text-micro font-semibold ${state === "active" ? "text-ink" : "text-ink-soft"}`}>
          <span className={state === "active" ? "" : "hidden sm:inline"}>{move}</span>
          <span className={state === "active" ? "hidden" : "sm:hidden"}>{index + 1}</span>
        </span>
      </li>
    );
  })}
</ol>
```

The active move's name is now always rendered, so the product's central thesis stops disappearing on phones.

- [ ] **Step 3: Give the status pills semantics**

Replace the header pills at lines 84-91:

```tsx
<div className="flex items-center gap-2 text-label">
  <span className="flex items-center gap-2 rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-ink-soft">
    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${snapshot.runtime.provider === "offline" ? "bg-ink/25" : "bg-correct"}`} />
    {snapshot.runtime.provider === "offline" ? "Offline verified guidance" : "Live guidance connected"}
  </span>
  <span className="hidden rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-ink-soft sm:inline">
    {snapshot.runtime.persistence === "process-local" ? "Learning record on this device" : "Generated work synced"}
  </span>
</div>
```

- [ ] **Step 4: Rebuild the course card**

Replace `CoursePathCard` (lines 34-62) with a tinted, illustrated version:

```tsx
function CoursePathCard({ course, progress }: { course: (typeof coursePaths)[number]; progress: { completed: number; total: number } }) {
  const accent = subjectColor(course.subject);
  const tint = subjectTint(course.subject);
  const started = progress.completed > 0;
  return (
    <Link
      href={`/courses/${course.id}`}
      className="surface-card-quiet group relative flex min-h-40 flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-4" style={{ backgroundColor: tint }}>
        <SubjectBadge subject={course.subject} level={course.level} size={44} />
        {started ? (
          <ProgressRing completed={progress.completed} total={progress.total} color={accent} />
        ) : (
          <Chip tone="neutral">Not started</Chip>
        )}
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="text-xl font-semibold tracking-title transition group-hover:text-lapis-dark">{course.title}</h3>
        <p className="mt-1.5 text-body-sm leading-6 text-ink-soft">{course.tagline}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-label text-ink-soft">
          <span>{course.lessonIds.length} lessons · {course.estimatedMinutes} min</span>
          <span className="font-semibold opacity-0 transition group-hover:opacity-100" style={{ color: accent }} aria-hidden="true">{started ? "Continue" : "Start"} →</span>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 5: Colour the right rail by meaning**

The misconception and source section headers already carry tinted icon squares. Replace their inline `color-mix` styles with tokens — `var(--color-gold-soft)` / `var(--color-gold)` for misconceptions, `var(--color-sky)` / `var(--color-lapis)` for sources — and swap both headings to `SectionHeader`. Replace the four `StatTile` literals at lines 160-179 with the primitive, passing `tint` from the palette rather than `color-mix`.

- [ ] **Step 6: Replace every remaining arbitrary size**

Run `grep -nE 'text-\[[0-9.]+rem\]' src/app/dashboard/page.tsx` and apply `LEGACY_SIZE_MAP` from `src/lib/design/type-scale.ts` to each hit.

- [ ] **Step 7: Remove the dashboard from the allowlist**

In `tests/design-type-scale.test.ts`, delete:

```diff
-  "src/app/dashboard/page.tsx",
```

- [ ] **Step 8: Run the full suite**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass

- [ ] **Step 9: Verify visually**

Run: `npm run dev`, open `/dashboard` at 1440px and at 375px.
Expected: the hero carries its subject's tint, the Begin button matches, the method spine names the active move on mobile, course cards have coloured header bands with clay objects, and no white-on-cream monotony remains.

- [ ] **Step 10: Commit**

```bash
git add src/app/dashboard/page.tsx tests/design-type-scale.test.ts
git commit -m "feat: rebuild dashboard on subject colour and shared primitives"
```

---

### Task 11: Re-lay the remaining surfaces

Six surfaces, same treatment. Do them one at a time, committing after each, so a regression is bisectable.

**Files:**
- Modify: `src/app/library/page.tsx`, `src/components/CoursePathCatalog.tsx`, `src/components/LessonCatalog.tsx`
- Modify: `src/app/courses/[courseId]/page.tsx`
- Modify: `src/app/review/page.tsx`
- Modify: `src/app/progress/page.tsx`
- Modify: `src/app/create/page.tsx`, `src/components/SourceCreator.tsx`, `src/components/CourseArchitectPanel.tsx`
- Modify: `src/app/settings/page.tsx`, `src/components/AiSettingsPanel.tsx`, `src/components/AccountControls.tsx`, `src/app/account/page.tsx`
- Modify: `tests/design-type-scale.test.ts` (remove each entry as its file is cleaned)

**Interfaces:**
- Consumes: primitives (Task 9), subject helpers (Task 6), `courseArtSrc` (Task 6)
- Produces: nothing consumed elsewhere

For each surface, apply the same four moves:

1. Replace hand-rolled card markup with `Card`, `SectionHeader`, `Chip`, `StatTile`, `ProgressRail`, `SubjectBadge`.
2. Replace every arbitrary `text-[Xrem]` using `LEGACY_SIZE_MAP`.
3. Replace `color-mix(... N%, transparent)` fills with the subject tint tokens.
4. Delete that file's entry from `NOT_YET_MIGRATED`.

- [ ] **Step 1: Library**

Read `src/app/library/page.tsx` first — it is a single dense JSX expression that rebuilds cards inline; that is the drift this task exists to end. Rewrite the prerequisite-graph `<li>` cards using `Card` with `tone="quiet"` and `interactive`, and give each node its subject tint. Then:

Run: `npm test && npm run typecheck && npm run lint`
Commit: `git commit -am "refactor: re-lay library on shared primitives"`

- [ ] **Step 2: Course detail**

Add the bespoke illustration hero. Where `courseArtSrc(courseId)` returns a path, render the illustration beside the title on the subject tint; where it returns `null`, render a tinted wash hero with the subject clay object instead. Override the zone wash with the course's own subject tint by passing it through `washStyle`.

Run: `npm test && npm run typecheck && npm run lint`
Commit: `git commit -am "feat: add illustrated course detail heroes"`

- [ ] **Step 3: Review**

Run: `npm test && npm run typecheck && npm run lint`
Commit: `git commit -am "refactor: re-lay review on shared primitives"`

- [ ] **Step 4: Evidence**

Keep the mint zone wash. Evidence chips use `Chip` with `correct` / `attention` tones only — never decorative colour, since these encode checked outcomes.

Run: `npm test && npm run typecheck && npm run lint`
Commit: `git commit -am "refactor: re-lay evidence on shared primitives"`

- [ ] **Step 5: Source Studio**

Run: `npm test && npm run typecheck && npm run lint`
Commit: `git commit -am "refactor: re-lay Source Studio on shared primitives"`

- [ ] **Step 6: Settings and account**

Run: `npm test && npm run typecheck && npm run lint`
Commit: `git commit -am "refactor: re-lay settings and account on shared primitives"`

- [ ] **Step 7: Confirm the ratchet has shrunk to the out-of-scope files only**

Run: `npx vitest run tests/design-type-scale.test.ts`
Expected: PASS, with `NOT_YET_MIGRATED` containing only the lesson and Judge canvas files listed as out of scope in the Global Constraints — `JudgeExperience.tsx`, `MaiaPanel.tsx`, `LessonPlayer.tsx`, `JudgeDeferredPanels.tsx`, `OnboardingTour.tsx`, `AppCommandPalette.tsx`, `SiteShell.tsx`.

If `SiteShell.tsx` or `AppCommandPalette.tsx` still carry arbitrary sizes, clean them now — they are app chrome, not lesson canvas — and remove their entries too.

---

### Task 12: Maia as state, never furniture

**Files:**
- Modify: `src/components/MaiaCharacter.tsx`
- Create: `src/lib/design/maia.ts`
- Modify: `src/app/progress/page.tsx`, `src/app/review/page.tsx` (size ladder only — see the note below)
- Test: `tests/design-maia.test.ts`

**Do not delete the Maia instances on progress and review.** They sit inside empty states —
"No observations yet" and "No review signal yet" — and the spec names empty states as the one place
a mascot genuinely earns its space, because there she is the invitation to a first move rather than
decoration. Those two instances stay; they only move onto the size ladder and stop animating.

**Interfaces:**
- Consumes: `MaiaState` from `MaiaCharacter`
- Produces:
  - `MAIA_SIZES: { inline: number; hero: number; moment: number }` — 28 / 96 / 144
  - `maiaStateForAction(kind: "review" | "resume" | "launch" | "start"): MaiaState`

- [ ] **Step 1: Write the failing test**

Create `tests/design-maia.test.ts`:

```ts
import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { MAIA_SIZES, maiaStateForAction } from "@/lib/design/maia";

function grep(pattern: string): string[] {
  try {
    return execFileSync("grep", ["-rn", pattern, "src"], { encoding: "utf8" }).split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

describe("maiaStateForAction", () => {
  it.each([
    ["review", "thinking"],
    ["resume", "curious"],
    ["launch", "curious"],
    ["start", "attentive"],
  ] as const)("maps a %s action to the %s pose", (kind, expected) => {
    expect(maiaStateForAction(kind)).toBe(expected);
  });
});

describe("Maia size ladder", () => {
  it("exposes exactly three sizes", () => {
    expect(Object.values(MAIA_SIZES)).toEqual([28, 96, 144]);
  });
});

describe("Maia presence rules", () => {
  it("is absent from the navigation rail", () => {
    expect(grep("MaiaCharacter").filter((line) => line.startsWith("src/components/AppSidebar.tsx"))).toEqual([]);
  });

  it("never defaults to animated", () => {
    expect(grep("animated = true")).toEqual([]);
  });

  it("is sized from the ladder rather than ad-hoc height and width classes", () => {
    const adHoc = grep("<MaiaCharacter").filter((line) => /className="[^"]*\bh-\d/.test(line));
    expect(adHoc).toEqual([]);
  });

  it("animates only where she is live", () => {
    const animated = grep("animated").filter((line) => line.includes("<MaiaCharacter") || line.includes("animated\n"));
    const allowed = ["src/components/MaiaPanel.tsx", "src/components/VerifiedMoment.tsx"];
    const offenders = animated.filter((line) => !allowed.some((file) => line.startsWith(file)));
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/design-maia.test.ts`
Expected: FAIL — module not found, and the presence assertions fail

- [ ] **Step 3: Add the Maia design module**

Create `src/lib/design/maia.ts`:

```ts
import type { MaiaState } from "@/components/MaiaCharacter";

/**
 * Maia is state, never furniture. Every appearance derives from real data,
 * and she animates only where she is live — the lesson rail and verified
 * moments. A mascot idling on a page where she cannot be spoken to is the
 * clearest tell that a product is decorated rather than designed.
 */

export const MAIA_SIZES = { inline: 28, hero: 96, moment: 144 } as const;

/** Pose derived from the dashboard's real recommendation, never chosen for looks. */
export function maiaStateForAction(kind: "review" | "resume" | "launch" | "start"): MaiaState {
  if (kind === "review") return "thinking";
  if (kind === "resume" || kind === "launch") return "curious";
  return "attentive";
}
```

- [ ] **Step 4: Flip the animation default**

In `src/components/MaiaCharacter.tsx`, change the default so stillness is the norm:

```diff
-  animated = true,
+  animated = false,
```

Then add `animated` explicitly at the two call sites where she is genuinely live: `src/components/MaiaPanel.tsx` and the verified-moment component from Task 13. Search for every existing usage and confirm each one either passes `animated` deliberately or is now correctly still:

```bash
grep -rn "MaiaCharacter" src --include="*.tsx"
```

- [ ] **Step 5: Move the empty-state instances onto the size ladder**

`src/app/progress/page.tsx:80` and `src/app/review/page.tsx:20` both render Maia inside an empty
state. Keep both. Replace their ad-hoc sizing classes with the ladder and leave them unanimated:

```diff
-<MaiaCharacter state="curious" className="h-14 w-12 shrink-0" title="Maia, waiting for checked work" />
+<MaiaCharacter state="curious" width={MAIA_SIZES.hero} height={MAIA_SIZES.hero} className="shrink-0" title="Maia, waiting for checked work" />
```

```diff
-<MaiaCharacter state="curious" className="h-16 w-14 shrink-0" title="Maia, waiting for checked work" />
+<MaiaCharacter state="curious" width={MAIA_SIZES.hero} height={MAIA_SIZES.hero} className="shrink-0" title="Maia, waiting for checked work" />
```

Import `MAIA_SIZES` from `@/lib/design/maia` in both files. The sidebar instance was already removed
in Task 8; that was the only genuinely decorative one.

Then audit the remaining call sites — `src/components/LandingCoursePreview.tsx`,
`src/components/MethodTraceDemo.tsx`, `src/components/OnboardingTour.tsx` and `src/app/page.tsx` —
and confirm each pose is justified by what is happening on screen rather than chosen for looks. The
landing hero's `celebrating` pose is the known offender: nothing has been achieved at that point, so
it becomes `curious`.

- [ ] **Step 6: Use the derived pose on the dashboard**

In `src/app/dashboard/page.tsx`, replace the inline ternary at line 134:

```diff
-<MaiaCharacter state={snapshot.nextAction.kind === "review" ? "thinking" : "curious"} animated className="relative h-36 w-30 -mb-1" title="Maia is ready for the next learning move" />
+<MaiaCharacter state={maiaStateForAction(snapshot.nextAction.kind)} width={MAIA_SIZES.moment} height={MAIA_SIZES.moment} className="relative -mb-1" title="Maia is ready for the next learning move" />
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run tests/design-maia.test.ts`
Expected: PASS, 9 tests

- [ ] **Step 8: Run the full suite**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: make Maia state-driven and still by default"
```

---

### Task 13: Verified moments

**Files:**
- Create: `src/components/VerifiedMoment.tsx`
- Create: `src/lib/design/moments.ts`
- Modify: `src/app/globals.css` (bloom keyframes)
- Test: `tests/design-moments.test.ts`

**Interfaces:**
- Consumes: `MaiaState`, `MAIA_SIZES` (Task 12)
- Produces:
  - `type MomentKind = "transfer" | "course-complete" | "misconception-resolved"`
  - `momentCopy(kind: MomentKind): { title: string; evidence: string }`
  - `VerifiedMoment({ kind, accent })`

- [ ] **Step 1: Write the failing test**

Create `tests/design-moments.test.ts`:

```ts
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { momentCopy, MOMENT_KINDS } from "@/lib/design/moments";

describe("momentCopy", () => {
  it.each(MOMENT_KINDS)("gives %s a title and a justifying evidence line", (kind) => {
    const copy = momentCopy(kind);
    expect(copy.title.length).toBeGreaterThan(0);
    expect(copy.evidence.length).toBeGreaterThan(0);
  });

  it("states the unaided condition for a transfer", () => {
    expect(momentCopy("transfer").evidence).toContain("no hints");
  });

  it("never claims durable mastery", () => {
    for (const kind of MOMENT_KINDS) {
      const combined = `${momentCopy(kind).title} ${momentCopy(kind).evidence}`.toLowerCase();
      expect(combined).not.toContain("mastered");
      expect(combined).not.toContain("mastery");
    }
  });
});

describe("bloom animation", () => {
  const globals = readFileSync("src/app/globals.css", "utf8");

  it("defines the bloom keyframes", () => {
    expect(globals).toContain("@keyframes verified-bloom");
  });

  it("disables the bloom under reduced motion", () => {
    const reducedMotionBlock = globals.slice(globals.indexOf("prefers-reduced-motion"));
    expect(reducedMotionBlock).toContain("verified-bloom");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/design-moments.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the copy module**

Create `src/lib/design/moments.ts`:

```ts
/**
 * Verified moments celebrate exactly what the evidence model can support —
 * a checked observation — and never imply durable mastery. Each moment
 * carries the line that justifies it, so the celebration is also a claim
 * the product can defend.
 */

export const MOMENT_KINDS = ["transfer", "course-complete", "misconception-resolved"] as const;
export type MomentKind = (typeof MOMENT_KINDS)[number];

const COPY: Record<MomentKind, { title: string; evidence: string }> = {
  transfer: {
    title: "Transfer solved unaided",
    evidence: "no hints, no Maia, no solution reveal",
  },
  "course-complete": {
    title: "Course path complete",
    evidence: "every lesson in this path recorded a checked move",
  },
  "misconception-resolved": {
    title: "Misconception cleared",
    evidence: "the same concept was rechecked and held",
  },
};

export function momentCopy(kind: MomentKind): { title: string; evidence: string } {
  return COPY[kind];
}
```

- [ ] **Step 4: Add the bloom keyframes to `src/app/globals.css`**

```css
@keyframes verified-bloom {
  0% {
    opacity: 0;
    transform: scale(0.86);
  }
  55% {
    opacity: 1;
    transform: scale(1.03);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-verified-bloom {
  animation: verified-bloom 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

Then add `.animate-verified-bloom` to the existing `prefers-reduced-motion` block's `animation: none` selector list at lines 304-312.

- [ ] **Step 5: Implement the component**

Create `src/components/VerifiedMoment.tsx`:

```tsx
"use client";

import MaiaCharacter from "./MaiaCharacter";
import { MAIA_SIZES } from "@/lib/design/maia";
import { momentCopy, type MomentKind } from "@/lib/design/moments";

/**
 * A checked milestone. Maia animates here because this is one of the two
 * places she is genuinely live.
 */
export default function VerifiedMoment({ kind, accent, tint }: { kind: MomentKind; accent: string; tint: string }) {
  const copy = momentCopy(kind);
  return (
    <div role="status" className="animate-verified-bloom flex items-center gap-4 rounded-[var(--radius-card)] p-5" style={{ backgroundColor: tint }}>
      <MaiaCharacter state="celebrating" animated width={MAIA_SIZES.hero} height={MAIA_SIZES.hero} className="shrink-0" title="Maia is celebrating a verified result" />
      <div className="min-w-0">
        <p className="text-lead font-semibold tracking-title" style={{ color: accent }}>{copy.title}</p>
        <p className="mt-1 text-body-sm text-ink-soft">{copy.evidence}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/design-moments.test.ts`
Expected: PASS, 5 tests

- [ ] **Step 7: Run the full suite**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass

- [ ] **Step 8: Commit**

```bash
git add src/components/VerifiedMoment.tsx src/lib/design/moments.ts src/app/globals.css tests/design-moments.test.ts
git commit -m "feat: add verified-moment celebration"
```

---

### Task 14: Fix the landing hero charm

**Files:**
- Modify: `src/app/page.tsx:~168` (hero title)
- Modify: `src/app/landing.module.css` (`.wordOrb` spacing)

**Interfaces:**
- Consumes: merged tokens (Task 2)
- Produces: nothing

- [ ] **Step 1: Reproduce the defect**

Run: `npm run dev`, open `http://localhost:3000/`, and inspect the hero.
Expected defect: the gold charm sits flush against the surrounding words — `Sources✦don't have` — with no optical spacing.

- [ ] **Step 2: Give the charm breathing room**

In `src/app/landing.module.css`, add horizontal margin to the inline charm rule:

```css
.wordOrb {
  margin-inline: 0.18em 0.28em;
  vertical-align: -0.08em;
}
```

Merge these declarations into the existing `.wordOrb` rule rather than adding a duplicate selector; find it with `grep -n '.wordOrb' src/app/landing.module.css`.

- [ ] **Step 3: Verify at three widths**

Reload `/` at 1440px, 768px and 375px.
Expected: the charm is optically centred between the words at every width, and the `aria-label` on the `h1` still reads "Sources don't have to stay passive" so the decorative orb never enters the accessible name.

- [ ] **Step 4: Run the full suite**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/landing.module.css
git commit -m "fix: space the landing hero charm"
```

---

### Task 15: Browser-level verification and documentation

**Files:**
- Modify: `scripts/verify-ui.mjs`
- Rewrite: `docs/redesign/DESIGN_SYSTEM_V2.md`
- Modify: `docs/assets/screenshots/*` (regenerated)

**Interfaces:**
- Consumes: everything
- Produces: a contrast assertion in the browser smoke run

- [ ] **Step 1: Add a computed-contrast check to `scripts/verify-ui.mjs`**

Read the existing file first and follow its `failures.push(...)` convention. Add this scan and call it for `/dashboard`, `/library` and `/progress`:

```js
async function scanContrast(page, label) {
  const findings = await page.evaluate(() => {
    const luminance = (rgb) => {
      const [r, g, b] = rgb.map((channel) => {
        const ratio = channel / 255;
        return ratio <= 0.03928 ? ratio / 12.92 : Math.pow((ratio + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const parse = (value) => (value.match(/\d+/g) ?? []).slice(0, 3).map(Number);
    const backgroundOf = (element) => {
      let node = element;
      while (node) {
        const background = getComputedStyle(node).backgroundColor;
        if (background && !background.includes("rgba(0, 0, 0, 0)")) return parse(background);
        node = node.parentElement;
      }
      return [255, 255, 255];
    };
    const problems = [];
    for (const element of document.querySelectorAll("p, span, a, h1, h2, h3, li, button")) {
      if (!element.textContent?.trim()) continue;
      const style = getComputedStyle(element);
      const size = Number.parseFloat(style.fontSize);
      const foreground = parse(style.color);
      const background = backgroundOf(element);
      const light = Math.max(luminance(foreground), luminance(background));
      const dark = Math.min(luminance(foreground), luminance(background));
      const ratio = (light + 0.05) / (dark + 0.05);
      const required = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700) ? 3 : 4.5;
      if (ratio < required) {
        problems.push(`${element.tagName.toLowerCase()} "${element.textContent.trim().slice(0, 40)}" ${ratio.toFixed(2)}:1 < ${required}`);
      }
    }
    return problems.slice(0, 10);
  });
  for (const finding of findings) failures.push(`${label} contrast: ${finding}`);
}
```

- [ ] **Step 2: Run the browser verification**

Run: `npm run dev` in one terminal, then `npm run verify:ui` in another.
Expected: no axe violations and no contrast failures. Any failure here is a real regression introduced by the tint work — fix it rather than relaxing the threshold.

- [ ] **Step 3: Regenerate the screenshots**

Run: `npm run screenshots`
Then review every file in `docs/assets/screenshots/` against the pre-change versions in git:

```bash
git diff --stat docs/assets/screenshots/
```

Expected: every app surface visibly gains colour; the landing is materially unchanged apart from the charm spacing.

- [ ] **Step 4: Rewrite `docs/redesign/DESIGN_SYSTEM_V2.md`**

The current text forbids what the code now does. Replace it with a description of the merged system: one token set, the subject accent+tint pairs and their contrast rule, the five-step Inter scale, zone washes, the three-level elevation system, Maia's state-not-furniture rule, and the verified-moment boundary. State explicitly that gradient washes are permitted at zone strength and that gamification remains prohibited.

- [ ] **Step 5: Run both builds**

Run: `npm run build`
Expected: success

Run: `npm run verify:sites`
Expected: success, and the Sites bundle check must still reject Node-only modules

- [ ] **Step 6: Final full verification**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all green, test count at or above 387 plus the roughly 60 tests this plan adds

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "docs: rewrite design system for the merged token set"
```

- [ ] **Step 8: Confirm nothing was pushed**

```bash
git status -sb
git log --oneline origin/main..HEAD | head -30
```

Expected: `v2/sites` is ahead of `origin/main` by every commit in this plan, and `git status` shows no upstream tracking push. **Do not push.**

---

## Self-Review

**Spec coverage.** Every spec section maps to a task: token merge → 2; palette pairs and contrast rule → 1, 15; type scale → 2, 3, 4, and the ratchet closes across 8, 10, 11; Fraunces retirement → 3; zone wash → 5; shared primitives → 9; sidebar → 7, 8; dashboard → 10; remaining surfaces → 11; Maia → 12; verified moments → 13; landing → 2, 14; accessibility → 1, 15; verification → every task plus 15; docs rewrite → 15.

**Three spec details deliberately adjusted during planning, all flagged here for review:**

1. The spec's sidebar ordering says "most recently active first" within the in-progress bucket. `courseProgress` exposes only `{ completed, total }` with no timestamp, so Task 7 orders in-progress courses by catalog position instead. Adding recency would require extending the dashboard snapshot contract, which is out of scope for a visual pass. The ordering remains deterministic.
2. The spec implies the sidebar renders progress rails from data it already has. It does not — the root layout builds the course list from static curriculum data. Task 7 adds `GET /api/progress` and a client fetch so the landing stays statically rendered, with graceful degradation to catalog order.
3. An earlier draft of Task 12 removed Maia from progress and review as "decorative". Verification showed both instances live inside empty states, which the spec's own presence map protects. They are kept and only moved onto the size ladder. The genuinely decorative instances were the sidebar card (removed in Task 8) and the landing hero's unearned `celebrating` pose (corrected in Task 12).

**Placeholder scan.** No TBD, TODO, "handle edge cases", or "similar to Task N". Every code step carries its actual code. Task 11's six surfaces share one explicit four-move procedure rather than a cross-reference, because the moves are identical and the file lists are given per surface.

**Type consistency.** `SubjectKey` is defined in `src/lib/design/palette.ts` (Task 1) and re-exported from `src/lib/curriculum/subjects.ts` (Task 6). `CourseProgress` and `SidebarCourse` are defined in Task 7 and consumed with identical names in Task 8. `MaiaState` originates in `MaiaCharacter.tsx` and is imported by Task 12. `MomentKind` is defined and consumed within Task 13. `cardClasses`/`CardTone` are defined in Task 9 and exported through the barrel.

One naming risk worth calling out for the implementer: Task 12 changes `MaiaCharacter` call sites to pass `width`/`height` instead of Tailwind height/width classes. `MaiaCharacter` spreads `ImgHTMLAttributes`, so both already work; prefer the numeric props from the size ladder and do not mix the two on one element.
