/**
 * Content types: the deterministic ground truth of Museion.
 *
 * Lessons are authored as TypeScript data. Correct answers, worked
 * solutions, and known misconceptions live here, in verified content —
 * never in LLM output. Maia receives this data as context and coaches
 * against it; she is architecturally unable to be the source of truth.
 */

export interface Misconception {
  id: string;
  /** Normalized answers that indicate this misconception. */
  triggerAnswers: string[];
  /** What the learner likely did wrong, written for Maia. */
  description: string;
  /** The idea Maia should guide the learner to rediscover. */
  remediationFocus: string;
}

export interface NumericAnswer {
  kind: "numeric";
  value: number;
  tolerance: number;
}

export interface MultipleChoiceAnswer {
  kind: "multipleChoice";
  options: string[];
  correctIndex: number;
}

export interface ExpressionAnswer {
  kind: "expression";
  /** Equivalent accepted answers; matched after normalization. */
  acceptedForms: string[];
}

export type AnswerSpec = NumericAnswer | MultipleChoiceAnswer | ExpressionAnswer;

/**
 * One reasoning step. Tutoring is step-based, not answer-based: every
 * step has its own verified answer, solution and misconceptions, so
 * feedback lands exactly where the reasoning breaks (VanLehn 2011).
 */
export interface Step {
  id: string;
  /** Concept this step exercises; drives mastery and fading. */
  concept: string;
  prompt: string;
  answer: AnswerSpec;
  /**
   * Author-verified worked solution. Injected into Maia's context as
   * ground truth; never shown to the learner verbatim.
   */
  solution: string;
  misconceptions: Misconception[];
  /**
   * Deterministic hint ladder, least to most revealing. Offline
   * fallback and scaffolding material for Maia. The final answer must
   * never appear here.
   */
  hints: string[];
}

export type Track = "Algebra" | "Arithmetic" | "Computer Science" | "Research Methods";

export interface Lesson {
  id: string;
  title: string;
  track: Track;
  description: string;
  concepts: string[];
  steps: Step[];
  /**
   * Optional exercise bank for practice mode: extra steps served in
   * random order with no hint ladder (retrieval practice — the testing
   * effect). Same authoring standard as lesson steps.
   */
  practice?: Step[];
}

/** What the browser is allowed to see: prompts only, never answers. */
export interface PublicStep {
  id: string;
  prompt: string;
  kind: AnswerSpec["kind"];
  options?: string[];
}

export interface PublicLesson {
  id: string;
  title: string;
  track: Track;
  description: string;
  concepts: string[];
  steps: PublicStep[];
  practiceAvailable: boolean;
}

export function toPublicLesson(lesson: Lesson): PublicLesson {
  return {
    id: lesson.id,
    title: lesson.title,
    track: lesson.track,
    description: lesson.description,
    concepts: lesson.concepts,
    practiceAvailable: (lesson.practice?.length ?? 0) > 0,
    steps: lesson.steps.map((step) => ({
      id: step.id,
      prompt: step.prompt,
      kind: step.answer.kind,
      options:
        step.answer.kind === "multipleChoice" ? step.answer.options : undefined,
    })),
  };
}
