import { subjectKey } from "@/lib/curriculum/subjects";
import type { SubjectKey } from "@/lib/design/palette";

/**
 * The product artwork shares one daylight clay material, palette and scale.
 * Subject objects, course covers and landing previews use this same manifest.
 */

/**
 * Keyed by SubjectKey so adding a seventh subject is a compile error here,
 * not a silently wrong illustration at runtime.
 */
const SUBJECT_OBJECT: Record<SubjectKey, string> = {
  algebra: "/landing/product/course-algebra-as-balance.webp",
  arithmetic: "/landing/product/course-probability-as-evidence.webp",
  cs: "/landing/product/course-search-by-halving.webp",
  research: "/landing/product/course-claims-to-evidence.webp",
  physics: "/landing/product/course-forces-and-motion.webp",
  biology: "/landing/product/course-natural-selection.webp",
  default: "/landing/product/course-algebra-as-balance.webp",
};

/** Course artwork, shared across marketing and the learning workspace. */
export const COURSE_ART: Record<string, string> = {
  "algebra-as-balance": "/landing/product/course-algebra-as-balance.webp",
  "search-by-halving": "/landing/product/course-search-by-halving.webp",
  "probability-as-evidence": "/landing/product/course-probability-as-evidence.webp",
  "functions-as-change": "/landing/product/course-functions-as-change.webp",
  "claims-to-evidence": "/landing/product/course-claims-to-evidence.webp",
  "samples-to-conclusions": "/landing/product/course-samples-to-conclusions.webp",
  "natural-selection": "/landing/product/course-natural-selection.webp",
  "forces-and-motion": "/landing/product/course-forces-and-motion.webp",
  "recursion-foundations": "/landing/product/course-search-by-halving.webp",
  "proportional-reasoning": "/landing/product/course-algebra-as-balance.webp",
};

export function subjectObjectSrc(subject: string): string {
  // subjectKey() already collapses anything unrecognised to "default", and the
  // record is exhaustive over SubjectKey, so this lookup is always populated.
  return SUBJECT_OBJECT[subjectKey(subject)];
}

export function courseArtSrc(courseId: string): string | null {
  return COURSE_ART[courseId] ?? null;
}
