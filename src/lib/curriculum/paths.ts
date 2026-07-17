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
  CoursePathSchema.parse({
    id: "probability-as-evidence",
    title: "Probability as Evidence",
    tagline: "Name the reference group before trusting a probability claim.",
    description: "A count-based path through finite sample spaces, conditional evidence, and base rates. Learners keep denominators visible, diagnose reversed conditions, and finish by interpreting what a complete count table actually supports.",
    subject: "Arithmetic",
    level: "developing",
    learnerBand: "Ages 12+ · fraction foundations",
    lessonIds: [
      "probability-as-evidence-sample-spaces",
      "probability-as-evidence-conditional-evidence",
      "probability-as-evidence-base-rates",
    ],
    prerequisites: ["Whole-number counting", "Simple fractions", "Part-to-whole comparison"],
    outcomes: [
      "State the finite sample space before forming a probability.",
      "Use the supplied evidence subgroup without reversing the condition.",
      "Separate a base rate, a signal, and the conclusion supported after that signal.",
    ],
    estimatedMinutes: 55,
    sourceLabels: ["OpenStax Introductory Statistics 2e · Chapter 3"],
    evidenceBoundary: "The path records performance on finite stated scenarios and immediate near transfer; it does not measure real-world judgment, delayed retention, or durable probability mastery.",
  }),
  CoursePathSchema.parse({
    id: "functions-as-change",
    title: "Functions as Change",
    tagline: "Read a rule as a relationship, then ask where its model stops.",
    description: "A three-lesson path from input-output rules to rate, initial value, and bounded linear prediction. Learners evaluate, compare, diagnose rate-intercept confusion, and keep model claims inside their stated context.",
    subject: "Algebra",
    level: "developing",
    learnerBand: "Ages 13+ · early secondary",
    lessonIds: [
      "functions-as-change-input-output",
      "functions-as-change-rate-of-change",
      "functions-as-change-linear-models",
    ],
    prerequisites: ["Whole-number arithmetic", "Operation precedence", "Read paired values in a table"],
    outcomes: [
      "Evaluate a function and test whether each input has one output.",
      "Distinguish rate of change from an initial value.",
      "Build a simple linear prediction and state its range and assumptions.",
    ],
    estimatedMinutes: 55,
    sourceLabels: ["OpenStax Precalculus 2e · Functions and function notation"],
    evidenceBoundary: "Correct responses are observations on the registered rules and nearby contexts; they do not establish retention, calculus readiness, or real-world predictive validity.",
  }),
  CoursePathSchema.parse({
    id: "claims-to-evidence",
    title: "Claims to Evidence",
    tagline: "Turn a broad claim into a comparison that could prove it wrong.",
    description: "A research-literacy path through operational definitions, observation versus inference, and falsifiable comparisons. Learners specify what would be recorded, diagnose overclaiming, and design a fair test whose outcome could challenge the original claim.",
    subject: "Research Methods",
    level: "developing",
    learnerBand: "Ages 12–16 · early secondary",
    lessonIds: [
      "claims-to-evidence-operationalize",
      "claims-to-evidence-observation-inference",
      "claims-to-evidence-falsifiable-comparison",
    ],
    prerequisites: ["Read short scenarios", "Compare counts and simple fractions", "Distinguish a question from an answer"],
    outcomes: [
      "Define an observable outcome, population, and recording rule.",
      "Separate a recorded observation from an explanation or prediction.",
      "Design a fair comparison with a result that could count against the claim.",
    ],
    estimatedMinutes: 55,
    sourceLabels: ["NIST/SEMATECH e-Handbook · hypothesis tests", "NIST/SEMATECH e-Handbook · product and process comparisons"],
    evidenceBoundary: "The path records performance on finite fictional scenarios and one immediate near-transfer task; it does not establish durable mastery, research competence, or general learning gains.",
  }),
  CoursePathSchema.parse({
    id: "samples-to-conclusions",
    title: "Samples to Conclusions",
    tagline: "Ask who could enter the sample before trusting its estimate.",
    description: "A research-literacy path through sampling frames, repeated-sample variability, and bounded estimates. Learners calculate proportions, identify coverage gaps, and keep conclusions inside the population and collection process the evidence can support.",
    subject: "Research Methods",
    level: "developing",
    learnerBand: "Ages 12–16 · fraction foundations",
    lessonIds: [
      "samples-to-conclusions-sampling-frame",
      "samples-to-conclusions-variability",
      "samples-to-conclusions-bounded-estimates",
    ],
    prerequisites: ["Part–whole fractions", "Decimal or percent conversion", "Read and compare two counts"],
    outcomes: [
      "Separate the target population from the reachable sampling frame.",
      "Interpret different sample proportions as expected variability rather than automatic error.",
      "Report an estimate with its scope and collection limits visible.",
    ],
    estimatedMinutes: 55,
    sourceLabels: ["NIST/SEMATECH e-Handbook · sampling", "NIST/SEMATECH e-Handbook · random sampling"],
    evidenceBoundary: "The path observes reasoning on small stated samples and one immediate near-transfer task; it is not a retention test, survey qualification, or proof of statistical judgment.",
  }),
] as const;

export function getCoursePath(courseId: string) {
  return coursePaths.find((course) => course.id === courseId);
}

export interface CourseLessonContext {
  courseId: string;
  courseTitle: string;
  lessonIndex: number;
  totalLessons: number;
  previousLessonId: string | null;
  nextLessonId: string | null;
}

export function getCourseLessonContext(courseId: string, lessonId: string): CourseLessonContext | undefined {
  const course = getCoursePath(courseId);
  if (!course) return undefined;
  const lessonIndex = course.lessonIds.indexOf(lessonId);
  if (lessonIndex < 0) return undefined;
  return {
    courseId: course.id,
    courseTitle: course.title,
    lessonIndex,
    totalLessons: course.lessonIds.length,
    previousLessonId: course.lessonIds[lessonIndex - 1] ?? null,
    nextLessonId: course.lessonIds[lessonIndex + 1] ?? null,
  };
}
