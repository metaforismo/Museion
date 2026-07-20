/**
 * Step-based learning session: the state Maia can see.
 *
 * A session walks a lesson one step at a time, records every attempt
 * and hint, updates mastery, and exposes a structured snapshot of "what
 * the learner is doing right now". That snapshot is what makes Maia a
 * tutor with eyes on the lesson instead of a chatbot with an empty
 * prompt box.
 *
 * Every interaction is appended to an event log, because the metric
 * that matters is not in-session performance but what remains later,
 * without help (Bastani et al. 2025: measure the learning, not the
 * crutch).
 */

import type { Lesson, MisconceptionHighlight, Step } from "../content/types";
import { MasteryModel, type ScaffoldingLevel } from "./mastery";
import { verify, type VerificationResult } from "./verifier";

export interface StepOutcome {
  stepId: string;
  correct: boolean;
  attemptsOnStep: number;
  lessonComplete: boolean;
  misconceptionId: string | null;
  mastery: number;
  scaffolding: ScaffoldingLevel;
  awaitingAdvance: boolean;
  sessionVersion: number;
  finalStepSolved: boolean;
  /** Variant of this step now active after the attempt (0 = base). */
  activeVariantIndex: number;
  /**
   * Bounded environment action for the diagnosed misconception, captured
   * against the surface the learner actually answered — so idempotent
   * replays return the same mark even after the active variant moves on.
   */
  misconceptionHighlight: MisconceptionHighlight | null;
}

export interface MutationGuard {
  expectedStepId: string;
  expectedVersion: number;
  idempotencyKey: string;
}

export interface AdvanceOutcome {
  lessonComplete: boolean;
  stepIndex: number;
  sessionVersion: number;
  replayed: boolean;
}

export interface HintOutcome {
  hint: string | null;
  sessionVersion: number;
}

export interface StepRecord {
  attempts: VerificationResult[];
  hintsUsed: number;
  completed: boolean;
}

export interface SessionEvent {
  kind: string;
  ts: number;
  [key: string]: unknown;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SessionStats {
  steps: number;
  totalAttempts: number;
  firstTryCorrect: number;
  hintsUsed: number;
  conceptMastery: Record<string, number>;
}

export interface SessionSnapshot {
  lessonTitle: string;
  stepPrompt: string;
  options: string[] | null;
  verifiedSolution: string;
  attempts: string[];
  lastMisconception: { description: string; remediationFocus: string } | null;
  hintsUsed: number;
  mastery: number;
  scaffolding: ScaffoldingLevel;
}

export type SessionMode = "lesson" | "practice";

export class LearnerSession {
  readonly sessionId: string;
  readonly lesson: Lesson;
  readonly mode: SessionMode;
  /** Shared with the learner's profile so mastery persists across sessions. */
  readonly mastery: MasteryModel;
  readonly events: SessionEvent[] = [];
  readonly chatHistory: ChatMessage[] = [];
  stepIndex = 0;
  awaitingAdvance = false;
  version = 0;
  private records = new Map<string, StepRecord>();
  private answerResults = new Map<string, StepOutcome>();
  private advanceResults = new Map<string, AdvanceOutcome>();
  private hintResults = new Map<string, HintOutcome>();

  constructor(
    lesson: Lesson,
    mode: SessionMode = "lesson",
    mastery: MasteryModel = new MasteryModel(),
  ) {
    this.sessionId = crypto.randomUUID();
    this.lesson = lesson;
    this.mode = mode;
    this.mastery = mastery;
  }

  get complete(): boolean {
    return this.stepIndex >= this.lesson.steps.length;
  }

  get currentStep(): Step {
    if (this.complete) throw new Error("Lesson already complete");
    return this.lesson.steps[this.stepIndex];
  }

  /**
   * Which authored variant of the current step is active. A pure
   * function of the recorded wrong attempts, so replay and idempotent
   * retries always resolve the same surface: the base step for the
   * first two attempts, then a fresh variant after every second wrong
   * answer, cycling back to the base when the bank is exhausted.
   */
  activeVariantIndex(): number {
    if (this.complete) return 0;
    const step = this.currentStep;
    const variants = step.variants ?? [];
    if (variants.length === 0) return 0;
    const wrong = this.recordFor(step).attempts.filter((attempt) => !attempt.correct).length;
    return Math.floor(wrong / 2) % (variants.length + 1);
  }

  /**
   * The current step with its active variant applied. Identity fields
   * (id, concept) always come from the base step; prompt, answer,
   * solution, misconceptions — and hints when the variant authors its
   * own — come from the variant. Everything that judges or describes
   * the step (verifier, hints, Maia's snapshot, the revealed solution)
   * must go through this, never through `currentStep` directly.
   */
  get activeStep(): Step {
    const step = this.currentStep;
    const index = this.activeVariantIndex();
    if (index === 0) return step;
    const variant = (step.variants ?? [])[index - 1];
    return {
      ...step,
      prompt: variant.prompt,
      answer: variant.answer,
      solution: variant.solution,
      misconceptions: variant.misconceptions,
      hints: variant.hints ?? step.hints,
    };
  }

  recordFor(step: Step): StepRecord {
    let record = this.records.get(step.id);
    if (!record) {
      record = { attempts: [], hintsUsed: 0, completed: false };
      this.records.set(step.id, record);
    }
    return record;
  }

  private assertGuard(guard: MutationGuard | undefined): void {
    if (!guard) return;
    if (guard.expectedVersion !== this.version) throw new Error("Session version conflict");
    if (this.complete || guard.expectedStepId !== this.currentStep.id) throw new Error("Session step conflict");
  }

  assertCurrent(expectedStepId: string, expectedVersion: number): void {
    this.assertGuard({ expectedStepId, expectedVersion, idempotencyKey: "validation-only" });
  }

  submitAnswer(rawAnswer: string, guard?: MutationGuard): StepOutcome {
    if (guard && this.answerResults.has(guard.idempotencyKey)) return this.answerResults.get(guard.idempotencyKey)!;
    this.assertGuard(guard);
    if (this.awaitingAdvance) throw new Error("Advance the solved step before answering again");
    // Verify against the variant the learner was actually shown.
    const step = this.activeStep;
    const record = this.recordFor(step);
    const result = verify(step, rawAnswer);
    record.attempts.push(result);

    const firstAttempt = record.attempts.length === 1;
    const mastery = this.mastery.recordAttempt(
      step.concept,
      result.correct,
      firstAttempt,
      record.hintsUsed,
    );

    this.log("answer_submitted", {
      stepId: step.id,
      answer: result.normalizedAnswer,
      correct: result.correct,
      attempt: record.attempts.length,
      hintsUsed: record.hintsUsed,
      misconception: result.misconception?.id ?? null,
      mastery,
    });

    if (result.correct) {
      record.completed = true;
      this.awaitingAdvance = true;
    }
    this.version += 1;
    const outcome = {
      stepId: step.id,
      correct: result.correct,
      attemptsOnStep: record.attempts.length,
      lessonComplete: false,
      misconceptionId: result.misconception?.id ?? null,
      mastery,
      scaffolding: this.mastery.scaffoldingLevel(step.concept),
      awaitingAdvance: this.awaitingAdvance,
      sessionVersion: this.version,
      finalStepSolved: result.correct && this.stepIndex === this.lesson.steps.length - 1,
      activeVariantIndex: this.activeVariantIndex(),
      misconceptionHighlight: result.misconception?.highlight ?? null,
    };
    if (guard) this.answerResults.set(guard.idempotencyKey, outcome);
    return outcome;
  }

  advance(guard?: MutationGuard): AdvanceOutcome {
    if (guard && this.advanceResults.has(guard.idempotencyKey)) {
      return { ...this.advanceResults.get(guard.idempotencyKey)!, replayed: true };
    }
    this.assertGuard(guard);
    if (!this.awaitingAdvance) throw new Error("Current step is not solved");
    const stepId = this.currentStep.id;
    this.awaitingAdvance = false;
    this.stepIndex += 1;
    this.version += 1;
    this.log("step_advanced", { stepId, stepIndex: this.stepIndex, sessionVersion: this.version });
    const outcome = { lessonComplete: this.complete, stepIndex: this.stepIndex, sessionVersion: this.version, replayed: false };
    if (guard) this.advanceResults.set(guard.idempotencyKey, outcome);
    return outcome;
  }

  /**
   * Next rung of the deterministic hint ladder, capped by fading.
   *
   * Returns null when the policy says no more hints: either the ladder
   * is exhausted or mastery is high enough that the learner should push
   * through unassisted (expertise reversal).
   */
  requestHint(guard?: MutationGuard): string | null {
    return this.requestHintOutcome(guard).hint;
  }

  requestHintOutcome(guard?: MutationGuard): HintOutcome {
    if (guard && this.hintResults.has(guard.idempotencyKey)) {
      return this.hintResults.get(guard.idempotencyKey)!;
    }
    this.assertGuard(guard);
    if (this.awaitingAdvance) throw new Error("Hints are unavailable after the step is solved");
    const step = this.activeStep;
    const record = this.recordFor(step);
    const depthAllowed = Math.min(
      this.mastery.maxHintDepth(step.concept),
      step.hints.length,
    );
    if (record.hintsUsed >= depthAllowed) {
      this.log("hint_denied", { stepId: step.id, hintsUsed: record.hintsUsed });
      const outcome = { hint: null, sessionVersion: this.version };
      if (guard) this.hintResults.set(guard.idempotencyKey, outcome);
      return outcome;
    }
    const hint = step.hints[record.hintsUsed];
    record.hintsUsed += 1;
    this.log("hint_given", { stepId: step.id, hintLevel: record.hintsUsed });
    this.version += 1;
    const outcome = { hint, sessionVersion: this.version };
    if (guard) this.hintResults.set(guard.idempotencyKey, outcome);
    return outcome;
  }

  /** Structured lesson state injected into Maia's context. */
  snapshot(): SessionSnapshot {
    const step = this.activeStep;
    const record = this.recordFor(step);
    const last = record.attempts.at(-1);
    return {
      lessonTitle: this.lesson.title,
      stepPrompt: step.prompt,
      options: step.answer.kind === "multipleChoice" ? step.answer.options : null,
      verifiedSolution: step.solution,
      attempts: record.attempts.map((a) => a.normalizedAnswer),
      lastMisconception: last?.misconception
        ? {
            description: last.misconception.description,
            remediationFocus: last.misconception.remediationFocus,
          }
        : null,
      hintsUsed: record.hintsUsed,
      mastery: this.mastery.mastery(step.concept),
      scaffolding: this.mastery.scaffoldingLevel(step.concept),
    };
  }

  /** Hint texts already granted for the current step (for resume). */
  revealedHints(): string[] {
    if (this.complete) return [];
    const step = this.activeStep;
    return step.hints.slice(0, this.recordFor(step).hintsUsed);
  }

  /** Aggregate session statistics for the completion screen. */
  stats(): SessionStats {
    let totalAttempts = 0;
    let firstTryCorrect = 0;
    let hintsUsed = 0;
    for (const step of this.lesson.steps) {
      const record = this.records.get(step.id);
      if (!record) continue;
      totalAttempts += record.attempts.length;
      hintsUsed += record.hintsUsed;
      if (
        record.attempts.length === 1 &&
        record.attempts[0].correct &&
        record.hintsUsed === 0
      ) {
        firstTryCorrect += 1;
      }
    }
    const conceptMastery: Record<string, number> = {};
    for (const concept of this.lesson.concepts) {
      conceptMastery[concept] = this.mastery.mastery(concept);
    }
    return {
      steps: this.lesson.steps.length,
      totalAttempts,
      firstTryCorrect,
      hintsUsed,
      conceptMastery,
    };
  }

  log(kind: string, payload: Record<string, unknown> = {}): void {
    this.events.push({ kind, ts: Date.now(), ...payload });
  }
}
