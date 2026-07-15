import { z } from "zod";

export const CourseTemplateIdSchema = z.enum([
  "socratic-foundations",
  "exam-practice",
  "teach-it-back",
]);
export type CourseTemplateId = z.infer<typeof CourseTemplateIdSchema>;

export const COURSE_TEMPLATES = {
  "socratic-foundations": {
    name: "Socratic Foundations",
    description: "Prediction, misconception diagnosis, scaffolded explanation, then guided transfer.",
    requiredKinds: ["explanation", "prediction-choice"],
    instructions: "Begin with a prediction, surface a plausible misconception, then scaffold the core idea before transfer.",
  },
  "exam-practice": {
    name: "Exam Practice",
    description: "Worked reasoning, retrieval checks, common errors, and an unassisted challenge.",
    requiredKinds: ["prediction-choice", "state-trace"],
    instructions: "Prioritize retrieval, common-error discrimination, and a precise exam-style transfer challenge.",
  },
  "teach-it-back": {
    name: "Teach It Back",
    description: "Concept explanation, compare and contrast, self-explanation, and application.",
    requiredKinds: ["explanation", "sequence-builder"],
    instructions: "Require the learner to reconstruct and explain the idea before applying it in a new case.",
  },
} as const satisfies Record<CourseTemplateId, {
  name: string;
  description: string;
  requiredKinds: readonly string[];
  instructions: string;
}>;

export function courseTemplate(id: CourseTemplateId) {
  return COURSE_TEMPLATES[id];
}

