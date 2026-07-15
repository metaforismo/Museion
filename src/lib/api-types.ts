/**
 * Wire contracts shared by the API routes (producers) and the client
 * components (consumers). Type-only: importing this file pulls no
 * server code into the browser bundle.
 */

import type { PublicLesson } from "./content/types";
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
        solution: session.currentStep.solution,
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
    awaitingAdvance: session.awaitingAdvance,
    sessionVersion: session.version,
    solvedStep,
    revealedHints: session.revealedHints(),
    chatHistory: session.chatHistory,
    stats: session.stats(),
  };
}
