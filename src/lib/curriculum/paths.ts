import { CoursePathSchema } from "./contracts";

export const coursePaths = [
  CoursePathSchema.parse({
    id: "algebra-as-balance",
    title: "Algebra as Balance",
    tagline: "Understand why equation moves work before memorizing how.",
    description: "A three-lesson path from equality as a relationship to reversible two-step equation solving. Learners predict, diagnose common shortcuts, verify by substitution, and finish with a nearby application.",
    subject: "Algebra",
    level: "developing",
    learnerBand: "Ages 12–15 · early secondary",
    lessonIds: [
      "algebra-balance-equality-as-invariant",
      "algebra-balance-inverse-operations-and-isolation",
      "algebra-balance-two-step-equations-and-transfer",
    ],
    prerequisites: ["Signed-number arithmetic", "Multiplication and division facts", "Operation precedence"],
    outcomes: [
      "Distinguish an expression from an equation and read equality relationally.",
      "Choose equality-preserving inverse operations and explain each move.",
      "Plan and verify a two-step solution in a nearby context.",
    ],
    estimatedMinutes: 50,
    sourceLabels: ["Illustrative Mathematics 6–8", "OpenStax Elementary Algebra 2e"],
    evidenceBoundary: "Completion records performance on these authored items and one immediate near-transfer observation; it does not prove durable mastery.",
  }),
  CoursePathSchema.parse({
    id: "search-by-halving",
    title: "Search by Halving",
    tagline: "Build binary search from its invariant, not from copied code.",
    description: "A language-neutral path through sorted-input contracts, inclusive candidate intervals, strict boundary updates, repeated halving, and careful asymptotic claims.",
    subject: "Computer Science",
    level: "extension",
    learnerBand: "Ages 14+ · basic arrays",
    lessonIds: ["sorted-search-space", "binary-search-invariant", "logarithmic-reasoning-and-transfer"],
    prerequisites: ["Read a one-dimensional array", "Compare whole numbers", "Use zero-based indices"],
    outcomes: [
      "Audit whether binary-search discard rules are valid for an input.",
      "Trace inclusive low, high, and midpoint updates without off-by-one loss.",
      "Explain logarithmic comparison growth without inventing timing evidence.",
    ],
    estimatedMinutes: 55,
    sourceLabels: ["NIST Dictionary of Algorithms and Data Structures", "Python Software Foundation bisect documentation"],
    evidenceBoundary: "The path checks the declared convention and one immediate near-transfer response; it makes no retention, standards-alignment, or speedup claim.",
  }),
] as const;

export function getCoursePath(courseId: string) {
  return coursePaths.find((course) => course.id === courseId);
}
