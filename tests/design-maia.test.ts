import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { DashboardActionSchema } from "@/lib/dashboard/contracts";
import { MAIA_SIZES, MAIA_STATE_MEANING, maiaStateForAction } from "@/lib/design/maia";

/**
 * The lesson and Judge canvas are out of scope for this pass (Global
 * Constraints), and Maia is a genuinely live tutor in both: she answers there.
 * They keep their own sizing and their own explicit `animated`. Every other
 * surface is bound by the ladder and by stillness.
 */
const LESSON_CANVAS = ["src/components/MaiaPanel.tsx", "src/components/LessonPlayer.tsx"];

/** The two places she is live enough to move. */
const ANIMATED_ALLOWED = [...LESSON_CANVAS, "src/components/VerifiedMoment.tsx"];

/**
 * grep exits 1 for "no matches" and >= 2 for a real error. An earlier test in
 * this repo collapsed both to "no matches" with a bare catch and passed
 * vacuously for three commits, so only status 1 counts as clean. `-e` keeps a
 * pattern that starts with `-` from being read as a flag.
 */
function grepFiles(pattern: string): string[] {
  let output = "";
  try {
    output = execFileSync("grep", ["-rl", "-e", pattern, "src"], { encoding: "utf8" });
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 1) return [];
    throw error;
  }
  return output.split("\n").filter(Boolean).sort();
}

/**
 * A `<MaiaCharacter …>` element routinely spans several lines, so a per-line
 * grep reports clean on a file that is not. Match whole elements instead.
 */
function maiaElementsIn(file: string): string[] {
  return [...readFileSync(file, "utf8").matchAll(/<MaiaCharacter\b[\s\S]*?\/>/g)].map(([element]) => element);
}

const RENDERING_FILES = grepFiles("<MaiaCharacter");

describe("maiaStateForAction", () => {
  it.each([
    ["review", "thinking"],
    ["resume", "curious"],
    ["launch", "curious"],
    ["practice", "curious"],
    ["create", "attentive"],
  ] as const)("maps a %s recommendation to the %s pose", (kind, expected) => {
    expect(maiaStateForAction(kind)).toBe(expected);
  });

  it("covers every recommendation the dashboard can actually produce", () => {
    // The brief mapped a "start" kind the snapshot never emits and omitted
    // "practice" and "create", which it does. Derive the list from the
    // contract so the two can never drift apart again.
    const kinds = DashboardActionSchema.shape.kind.options;
    expect(kinds.map(maiaStateForAction).every((state) => state in MAIA_STATE_MEANING)).toBe(true);
  });
});

describe("Maia state semantics", () => {
  it("gives each of the five poses exactly one meaning", () => {
    expect(Object.keys(MAIA_STATE_MEANING)).toEqual([
      "attentive",
      "curious",
      "thinking",
      "celebrating",
      "redirecting",
    ]);
  });
});

describe("Maia size ladder", () => {
  it("exposes exactly three sizes", () => {
    expect(Object.values(MAIA_SIZES)).toEqual([28, 96, 144]);
  });
});

describe("Maia presence rules", () => {
  it("is rendered somewhere at all — a silently empty scan would pass every rule below", () => {
    expect(RENDERING_FILES.length).toBeGreaterThan(3);
  });

  it("is absent from the navigation rail", () => {
    expect(RENDERING_FILES).not.toContain("src/components/AppSidebar.tsx");
  });

  it("never defaults to animated", () => {
    expect(grepFiles("animated = true")).toEqual([]);
  });

  it("animates only where she is live", () => {
    const offenders = RENDERING_FILES.filter((file) => !ANIMATED_ALLOWED.includes(file)).filter((file) =>
      maiaElementsIn(file).some((element) => /\banimated\b/.test(element)),
    );
    expect(offenders).toEqual([]);
  });

  it("is sized from the ladder rather than ad-hoc height and width classes", () => {
    // The landing sizes her from landing.module.css instead, as part of an
    // art-directed composition the spec leaves alone; what is banned
    // everywhere outside the lesson canvas is a one-off Tailwind h-/w- pair.
    // The leading `\s` requirement keeps `max-w-2xl` from reading as `w-2`.
    const offenders = RENDERING_FILES.filter((file) => !LESSON_CANVAS.includes(file)).flatMap((file) =>
      maiaElementsIn(file)
        .filter((element) => /className="(?:[^"]*\s)?-?[hw]-\d/.test(element))
        .map((element) => `${file}: ${element.replace(/\s+/g, " ")}`),
    );
    expect(offenders).toEqual([]);
  });

  it("keeps the lesson-canvas exemption honest — every exempt file still renders her", () => {
    expect(LESSON_CANVAS.filter((file) => !RENDERING_FILES.includes(file))).toEqual([]);
  });
});
