import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

/**
 * Files still carrying arbitrary font sizes. This list may only shrink —
 * each surface task deletes its own entry. Adding an entry is a review
 * failure, not a fix.
 */
const NOT_YET_MIGRATED = [
  "src/app/courses/[courseId]/page.tsx",
  "src/app/create/review/[runId]/page.tsx",
  "src/app/library/page.tsx",
  "src/app/progress/page.tsx",
  "src/components/AppCommandPalette.tsx",
  "src/components/CoursePathCatalog.tsx",
  "src/components/LandingCoursePreview.tsx",
  "src/components/LessonCatalog.tsx",
  "src/components/LessonPlayer.tsx",
  "src/components/MaiaPanel.tsx",
  "src/components/MethodTraceDemo.tsx",
  "src/components/ProgressRing.tsx",
  "src/components/RecursionCodeLab.tsx",
  "src/components/ScientificMethodDiagram.tsx",
  "src/components/SiteShell.tsx",
  "src/components/SourceCreator.tsx",
  "src/components/SourceLearningDesign.tsx",
];

/**
 * grep exits 1 for "no matches" and >=2 for real errors. Collapsing both to
 * an empty result would make every assertion here pass vacuously, so only
 * status 1 is treated as "clean".
 */
function filesWithArbitrarySizes(): string[] {
  let output = "";
  try {
    output = execFileSync("grep", ["-rlE", "-e", String.raw`text-\[[0-9.]+rem\]`, "src"], {
      encoding: "utf8",
    });
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 1) return [];
    throw error;
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
