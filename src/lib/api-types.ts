/**
 * Wire contracts shared by the API routes (producers) and the client
 * components (consumers). Type-only: importing this file pulls no
 * server code into the browser bundle.
 */

import type { MisconceptionHighlight, PublicLesson } from "./content/types";
import type { ScaffoldingLevel } from "./engine/mastery";
import type {
  ChatMessage,
  LearnerSession,
  SessionMode,
  SessionStats,
} from "./engine/session";
import type { TutorDelivery } from "./maia/contracts";

export type { ChatMessage, SessionMode, SessionStats };

/** Returned by POST /api/sessions and GET /api/sessions/[id]. */
export interface SessionStateResponse {
  sessionId: string;
  mode: SessionMode;
  /** Authoritative sanitized lesson — for practice mode, the shuffled set. */
  lesson: PublicLesson;
  complete: boolean;
  stepIndex: number;
  currentStepId: string | null;
  /** Which authored variant of the current step is active (0 = base). */
  activeVariantIndex: number;
  awaitingAdvance: boolean;
  sessionVersion: number;
  /** Post-solve state needed to resume before the explicit advance. */
  solvedStep: { solution: string; mastery: number } | null;
  revealedHints: string[];
  chatHistory: ChatMessage[];
  stats: SessionStats;
}

/** Returned by POST /api/sessions/[id]/answer. */
export interface AnswerResponse {
  correct: boolean;
  attemptsOnStep: number;
  lessonComplete: boolean;
  misconceptionId: string | null;
  mastery: number;
  scaffolding: ScaffoldingLevel;
  stepIndex: number;
  awaitingAdvance: boolean;
  sessionVersion: number;
  finalStepSolved: boolean;
  /** Variant of the step now active after this attempt (0 = base). */
  activeVariantIndex: number;
  /** Attention mark for the diagnosed misconception, if one is authored. */
  misconceptionHighlight: MisconceptionHighlight | null;
  /** Verified worked solution — present only after a correct answer. */
  solution: string | null;
  /** Session aggregates — present only when the lesson just completed. */
  stats: SessionStats | null;
}

/** Returned by POST /api/sessions/[id]/hint. */
export interface HintResponse {
  hint: string | null;
  granted: boolean;
  sessionVersion: number;
}

export type MaiaResponse = TutorDelivery & { sessionVersion: number };

export function buildSessionState(
  session: LearnerSession,
  lesson: PublicLesson,
): SessionStateResponse {
  const solvedStep = session.awaitingAdvance
    ? {
        solution: session.activeStep.solution,
        mastery: session.mastery.mastery(session.currentStep.concept),
      }
    : null;
  return {
    sessionId: session.sessionId,
    mode: session.mode,
    lesson,
    complete: session.complete,
    stepIndex: session.stepIndex,
    currentStepId: session.complete ? null : session.currentStep.id,
    activeVariantIndex: session.complete ? 0 : session.activeVariantIndex(),
    awaitingAdvance: session.awaitingAdvance,
    sessionVersion: session.version,
    solvedStep,
    revealedHints: session.revealedHints(),
    chatHistory: session.chatHistory,
    stats: session.stats(),
  };
}
