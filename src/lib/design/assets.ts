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
