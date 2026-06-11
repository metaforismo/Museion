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

import type { Lesson, Step } from "../content/types";
import { MasteryModel, type ScaffoldingLevel } from "./mastery";
import { verify, type VerificationResult } from "./verifier";

export interface StepOutcome {
  correct: boolean;
  attemptsOnStep: number;
  lessonComplete: boolean;
  misconceptionId: string | null;
  mastery: number;
  scaffolding: ScaffoldingLevel;
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

export class LearnerSession {
  readonly sessionId: string;
  readonly lesson: Lesson;
  readonly mastery = new MasteryModel();
  readonly events: SessionEvent[] = [];
  readonly chatHistory: ChatMessage[] = [];
  stepIndex = 0;
  private records = new Map<string, StepRecord>();

  constructor(lesson: Lesson) {
    this.sessionId = crypto.randomUUID();
    this.lesson = lesson;
  }

  get complete(): boolean {
    return this.stepIndex >= this.lesson.steps.length;
  }

  get currentStep(): Step {
    if (this.complete) throw new Error("Lesson already complete");
    return this.lesson.steps[this.stepIndex];
  }

  recordFor(step: Step): StepRecord {
    let record = this.records.get(step.id);
    if (!record) {
      record = { attempts: [], hintsUsed: 0, completed: false };
      this.records.set(step.id, record);
    }
    return record;
  }

  submitAnswer(rawAnswer: string): StepOutcome {
    const step = this.currentStep;
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
      this.stepIndex += 1;
    }

    return {
      correct: result.correct,
      attemptsOnStep: record.attempts.length,
      lessonComplete: this.complete,
      misconceptionId: result.misconception?.id ?? null,
      mastery,
      scaffolding: this.mastery.scaffoldingLevel(step.concept),
    };
  }

  /**
   * Next rung of the deterministic hint ladder, capped by fading.
   *
   * Returns null when the policy says no more hints: either the ladder
   * is exhausted or mastery is high enough that the learner should push
   * through unassisted (expertise reversal).
   */
  requestHint(): string | null {
    const step = this.currentStep;
    const record = this.recordFor(step);
    const depthAllowed = Math.min(
      this.mastery.maxHintDepth(step.concept),
      step.hints.length,
    );
    if (record.hintsUsed >= depthAllowed) {
      this.log("hint_denied", { stepId: step.id, hintsUsed: record.hintsUsed });
      return null;
    }
    const hint = step.hints[record.hintsUsed];
    record.hintsUsed += 1;
    this.log("hint_given", { stepId: step.id, hintLevel: record.hintsUsed });
    return hint;
  }

  /** Structured lesson state injected into Maia's context. */
  snapshot(): SessionSnapshot {
    const step = this.currentStep;
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
    const step = this.currentStep;
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
