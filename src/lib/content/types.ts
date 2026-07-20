/**
 * Content types: the deterministic ground truth of Museion.
 *
 * Lessons are authored as TypeScript data. Correct answers, worked
 * solutions, and known misconceptions live here, in verified content —
 * never in LLM output. Maia receives this data as context and coaches
 * against it; she is architecturally unable to be the source of truth.
 */

/**
 * A bounded environment action attached to a misconception: after the
 * engine diagnoses the wrong path, it can mark WHERE to look. A term
 * highlight marks text that is already visible in the step prompt; a
 * graph highlight names one lab parameter control. Both are
 * structurally leak-free — they direct attention, they add no
 * information the learner cannot already see.
 */
export type MisconceptionHighlight =
  | { kind: "term"; text: string }
  | { kind: "graph-region"; param: "a" | "h" | "k" };

export interface Misconception {
  id: string;
  /** Normalized answers that indicate this misconception. */
  triggerAnswers: string[];
  /** What the learner likely did wrong, written for Maia. */
  description: string;
  /** The idea Maia should guide the learner to rediscover. */
  remediationFocus: string;
  /** Where the environment points attention after this misconception. */
  highlight?: MisconceptionHighlight;
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

/**
 * Graph transformation answer: the learner manipulates parameters
 * (a, h, k) of a function family until their curve matches a target.
 * Submitted as "a=…,h=…,k=…" and verified numerically per component.
 * The client receives sampled target points, never the parameters.
 */
export interface GraphAnswer {
  kind: "graph";
  /** y = a(x−h)² + k for "quadratic-vertex"; y = a(x−h) + k for "linear". */
  family: "quadratic-vertex" | "linear";
  target: { a: number; h: number; k: number };
  /** Per-component absolute tolerance. */
  tolerance: number;
  /** Inclusive axis ranges shown by the lab. */
  xRange: [number, number];
  yRange: [number, number];
}

export type AnswerSpec = NumericAnswer | MultipleChoiceAnswer | ExpressionAnswer | GraphAnswer;

/**
 * Recursion code lab: the learner completes a recursive function by
 * choosing from enumerated slot options — never free code. The client
 * simulates the chosen definition with hard depth caps and shows the
 * call trace and visible tests; the submitted answer is the canonical
 * "slot=value,…" string, verified server-side as an expression. All of
 * this config is public by design: the reasoning happens in the trace,
 * and no option is marked correct.
 */
export interface RecursionLab {
  kind: "recursion-code";
  functionName: string;
  paramName: string;
  /** Code lines; `{slotId}` marks a fill-in slot. */
  lines: string[];
  slots: { id: string; options: string[] }[];
  /** Visible tests, Koji/Brilliant-style: expected outputs are shown. */
  tests: { input: number; expected: number }[];
  /** Semantics: base check `param == base`, else `combine(op, head, recurse(next))`. */
  op: "+" | "*";
}

export function graphValue(family: GraphAnswer["family"], params: { a: number; h: number; k: number }, x: number): number {
  const shifted = x - params.h;
  return family === "quadratic-vertex" ? params.a * shifted * shifted + params.k : params.a * shifted + params.k;
}

/** Deterministic target-curve samples for the client (33 points). */
export function sampleGraphTarget(spec: GraphAnswer): [number, number][] {
  const [minX, maxX] = spec.xRange;
  const points: [number, number][] = [];
  for (let index = 0; index <= 32; index += 1) {
    const x = minX + ((maxX - minX) * index) / 32;
    points.push([Number(x.toFixed(4)), Number(graphValue(spec.family, spec.target, x).toFixed(4))]);
  }
  return points;
}

/**
 * An authored micro-variation of a step: the same concept and the same
 * misconception structure with a fresh surface (different numbers), so
 * a retry re-exercises the reasoning instead of recall. Served
 * deterministically by the session engine after repeated wrong
 * attempts — Brilliant's "calibrated ditches", with authored answers.
 */
export interface StepVariant {
  prompt: string;
  answer: AnswerSpec;
  solution: string;
  misconceptions: Misconception[];
  /** Optional variant-specific hint ladder; omit to inherit the base hints. */
  hints?: string[];
}

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
  /** Optional rich interactive control for this step (public-safe config). */
  lab?: RecursionLab;
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
  /** Authored micro-variations served after repeated wrong attempts. */
  variants?: StepVariant[];
}

export type Track = "Algebra" | "Arithmetic" | "Computer Science" | "Research Methods" | "Physics" | "Biology";

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
  /** Graph lab display config: sampled target curve, never parameters. */
  graph?: {
    family: GraphAnswer["family"];
    xRange: [number, number];
    yRange: [number, number];
    targetPoints: [number, number][];
  };
  /** Recursion lab config (public by design; no option marked correct). */
  lab?: RecursionLab;
  /** Public surface of authored variants (prompts and options, never answers). */
  variants?: {
    prompt: string;
    kind: AnswerSpec["kind"];
    options?: string[];
    graph?: PublicStep["graph"];
  }[];
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
      graph:
        step.answer.kind === "graph"
          ? {
              family: step.answer.family,
              xRange: step.answer.xRange,
              yRange: step.answer.yRange,
              targetPoints: sampleGraphTarget(step.answer),
            }
          : undefined,
      lab: step.lab,
      variants: step.variants?.map((variant) => ({
        prompt: variant.prompt,
        kind: variant.answer.kind,
        options: variant.answer.kind === "multipleChoice" ? variant.answer.options : undefined,
        graph:
          variant.answer.kind === "graph"
            ? {
                family: variant.answer.family,
                xRange: variant.answer.xRange,
                yRange: variant.answer.yRange,
                targetPoints: sampleGraphTarget(variant.answer),
              }
            : undefined,
      })),
    })),
  };
}
