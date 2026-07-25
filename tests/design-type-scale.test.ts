import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

/**
 * The scale is five steps — micro 11, label 12, body-sm 13, body 15, lead 17 —
 * plus Tailwind's own text-lg and up for display headings. Three families of
 * size sit outside it, and each is treated according to how much debt it
 * carries:
 *
 *   1. Arbitrary absolute sizes — text-[13px], text-[0.9em], text-[length:…],
 *      calc/clamp — are banned outright, with no allowlist. Nothing in the app
 *      has ever needed one, so there is no reason to leave the door open.
 *   2. Arbitrary rem sizes — text-[0.82rem] — are banned outside a shrinking
 *      allowlist.
 *   3. Tailwind's named sizes below lead — text-xs 12, text-sm 14, text-base
 *      16 — are off the scale too, and get their own shrinking allowlist.
 *      text-lg and above stay legal: those are the display steps the design
 *      system sanctions above lead.
 *
 * The original ratchet checked only rule 2, which is how a whole Studio
 * surface built out of text-sm stayed invisible through fifteen tasks.
 */

/**
 * Files still carrying arbitrary rem font sizes. This list may only shrink —
 * each surface task deletes its own entry. Adding an entry is a review
 * failure, not a fix.
 *
 * The lesson canvas round cleared its files; what is left is the marketing
 * landing's course preview, out of scope for that round by design.
 */
const ARBITRARY_REM_DEBT = [
  "src/components/LandingCoursePreview.tsx",
  "src/components/MaiaPanel.tsx",
  "src/components/MethodTraceDemo.tsx",
  "src/components/ScientificMethodDiagram.tsx",
];

/**
 * Files still carrying Tailwind's named off-scale sizes. Seeded from what the
 * codebase actually had when this rule was added, so the rule could start
 * holding immediately instead of waiting on a sweep it would have to block on.
 *
 * Same contract as the list above: it may only get shorter, and the staleness
 * test below forces an entry out the moment its file is clean.
 *
 * The app-shell chrome this list was seeded with — SiteHeader, AuthButton,
 * AppCommandPalette, LessonCatalog, OnboardingTour, CourseArchitectPanel,
 * SourceLearningDesign, SourcePackEditor and the About page — is gone, and
 * the lesson canvas round cleared its own files. What remains is the Judge
 * canvas and the marketing landing, which are out of scope by design rather
 * than un-swept: clearing them is a content decision about those surfaces,
 * not a sweep of chrome.
 *
 * One thing the sweep could not delete: a focused form field under 16px makes
 * iOS zoom the viewport, so the app's inputs, selects and textareas take lead
 * (17px) rather than body (15px). That is the smallest step on the scale above
 * the floor, and it is why those files are clean without their fields shrinking.
 */
const NAMED_OFF_SCALE_DEBT = [
  "src/components/JudgeDeferredPanels.tsx",
  "src/components/JudgeExperience.tsx",
  "src/components/LandingCoursePreview.tsx",
  "src/components/MaiaPanel.tsx",
  "src/components/MethodTraceDemo.tsx",
  "src/components/ScientificMethodDiagram.tsx",
];

/**
 * `rem` is deliberately absent from the unit list: those are rule 2's, and
 * folding them in here would make their allowlist unreachable.
 */
const ARBITRARY_ABSOLUTE =
  String.raw`text-\[(length:|[0-9.]+(px|pt|pc|em|ex|ch|cap|ic|lh|rlh|vw|vh|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|cq[a-z]+|%)|(calc|clamp|min|max)\()`;

const ARBITRARY_REM = String.raw`text-\[[0-9.]+rem\]`;

/**
 * Class boundaries are spelled out rather than written as \b, which is a GNU
 * extension BSD grep does not have. They also keep `text-balance` and any
 * `…-text-sm` suffix from registering as a font size.
 */
const NAMED_OFF_SCALE = String.raw`(^|[^a-zA-Z0-9_-])text-(xs|sm|base)([^a-zA-Z0-9_-]|$)`;

/**
 * grep exits 1 for "no matches" and >=2 for real errors. Collapsing both to
 * an empty result would make every assertion here pass vacuously, so only
 * status 1 is treated as "clean".
 */
function filesMatching(pattern: string): string[] {
  let output = "";
  try {
    // -e keeps a pattern that starts with "-" from being read as an option.
    output = execFileSync("grep", ["-rlE", "-e", pattern, "src"], { encoding: "utf8" });
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 1) return [];
    throw error;
  }
  return output.split("\n").filter(Boolean).sort();
}

describe("type scale enforcement", () => {
  it("bans arbitrary absolute font sizes outright — this rule has no allowlist", () => {
    expect(filesMatching(ARBITRARY_ABSOLUTE)).toEqual([]);
  });

  it("catches the forms the original rule missed", () => {
    // The regexes, not the tree: a rule that only ever runs against a clean
    // codebase cannot show that it would catch anything.
    for (const sample of ["text-[13px]", "text-[0.9em]", "text-[length:14px]", "text-[clamp(1rem,2vw,2rem)]"]) {
      expect(sample).toMatch(new RegExp(ARBITRARY_ABSOLUTE));
    }
    for (const sample of ["text-sm", "sm:text-xs", '"text-base"']) {
      expect(sample).toMatch(new RegExp(NAMED_OFF_SCALE));
    }
    // Sanctioned display steps and near-misses stay legal.
    for (const sample of ["text-lg", "text-2xl", "text-balance", "text-body-sm", "text-[#d6e0ff]"]) {
      expect(sample).not.toMatch(new RegExp(NAMED_OFF_SCALE));
      expect(sample).not.toMatch(new RegExp(ARBITRARY_ABSOLUTE));
    }
  });

  describe.each([
    ["arbitrary rem font sizes", ARBITRARY_REM, ARBITRARY_REM_DEBT] as const,
    ["named sizes below lead", NAMED_OFF_SCALE, NAMED_OFF_SCALE_DEBT] as const,
  ])("%s", (_name, pattern, allowlist) => {
    it("appear in no file outside the shrinking allowlist", () => {
      expect(filesMatching(pattern).filter((file) => !allowlist.includes(file))).toEqual([]);
    });

    it("keep the allowlist honest — every listed file still exists and still has a violation", () => {
      const current = filesMatching(pattern);
      expect(allowlist.filter((file) => !current.includes(file))).toEqual([]);
    });
  });
});
