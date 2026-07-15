/**
 * In-memory stores for sessions and learner profiles.
 *
 * Kept on globalThis so state survives dev-server hot reloads. The
 * shapes here are deliberately database-ready: a learner profile is a
 * row keyed by learner id, a session is a row keyed by session id.
 * Swapping in Postgres/Supabase is a persistence change, not a redesign
 * (see TODO.md, v0.3).
 */

import { MasteryModel } from "./engine/mastery";
import type { LearnerSession, SessionMode } from "./engine/session";

/** Cross-session learner state, keyed by the anonymous learner cookie. */
export interface LearnerProfile {
  learnerId: string;
  /** One mastery model per learner: lessons and practice share it. */
  mastery: MasteryModel;
  completedLessons: Set<string>;
  practiceRuns: Map<string, number>;
  createdAt: number;
}

const globalStore = globalThis as unknown as {
  __museionSessions?: Map<string, LearnerSession>;
  __museionProfiles?: Map<string, LearnerProfile>;
  __museionSessionLearners?: Map<string, string>;
};

const sessions =
  globalStore.__museionSessions ?? new Map<string, LearnerSession>();
globalStore.__museionSessions = sessions;

const profiles =
  globalStore.__museionProfiles ?? new Map<string, LearnerProfile>();
globalStore.__museionProfiles = profiles;

const sessionLearners =
  globalStore.__museionSessionLearners ?? new Map<string, string>();
globalStore.__museionSessionLearners = sessionLearners;

// -- sessions ------------------------------------------------------------

export function saveSession(session: LearnerSession, learnerId: string): void {
  sessions.set(session.sessionId, session);
  sessionLearners.set(session.sessionId, learnerId);
}

export function getSession(sessionId: string): LearnerSession | undefined {
  return sessions.get(sessionId);
}

export function getSessionLearner(sessionId: string): string | undefined {
  return sessionLearners.get(sessionId);
}

// -- learner profiles ----------------------------------------------------

export function getOrCreateProfile(learnerId: string): LearnerProfile {
  let profile = profiles.get(learnerId);
  if (!profile) {
    profile = {
      learnerId,
      mastery: new MasteryModel(),
      completedLessons: new Set(),
      practiceRuns: new Map(),
      createdAt: Date.now(),
    };
    profiles.set(learnerId, profile);
  }
  return profile;
}

export function getProfile(learnerId: string): LearnerProfile | undefined {
  return profiles.get(learnerId);
}

/** Record a finished run on the learner's profile. */
export function recordCompletion(
  learnerId: string,
  lessonId: string,
  mode: SessionMode,
): void {
  const profile = getOrCreateProfile(learnerId);
  if (mode === "lesson") {
    profile.completedLessons.add(lessonId);
  } else {
    profile.practiceRuns.set(
      lessonId,
      (profile.practiceRuns.get(lessonId) ?? 0) + 1,
    );
  }
}
