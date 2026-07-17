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
  __museionSessionTouched?: Map<string, number>;
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

const sessionTouched = globalStore.__museionSessionTouched ?? new Map<string, number>();
globalStore.__museionSessionTouched = sessionTouched;
export const LEARNER_SESSION_TTL_MS = 24 * 60 * 60 * 1_000;
export const MAX_SESSIONS_PER_LEARNER = 20;

function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
  sessionLearners.delete(sessionId);
  sessionTouched.delete(sessionId);
}

function pruneSessions(now = Date.now()): void {
  for (const [id, touchedAt] of sessionTouched) {
    if (now - touchedAt > LEARNER_SESSION_TTL_MS) deleteSession(id);
  }
}

// -- sessions ------------------------------------------------------------

export function saveSession(session: LearnerSession, learnerId: string): void {
  pruneSessions();
  const owned = [...sessionLearners.entries()]
    .filter(([, owner]) => owner === learnerId)
    .sort(([a], [b]) => (sessionTouched.get(a) ?? 0) - (sessionTouched.get(b) ?? 0));
  while (owned.length >= MAX_SESSIONS_PER_LEARNER) deleteSession(owned.shift()![0]);
  sessions.set(session.sessionId, session);
  sessionLearners.set(session.sessionId, learnerId);
  sessionTouched.set(session.sessionId, Date.now());
}

export function getSession(sessionId: string): LearnerSession | undefined {
  pruneSessions();
  const session = sessions.get(sessionId);
  if (session) sessionTouched.set(sessionId, Date.now());
  return session;
}

export function getSessionLearner(sessionId: string): string | undefined {
  pruneSessions();
  return sessionLearners.get(sessionId);
}

/** Resolve a session only when it belongs to the supplied learner id. */
export function getSessionForLearner(
  sessionId: string,
  learnerId: string,
): LearnerSession | undefined {
  pruneSessions();
  if (sessionLearners.get(sessionId) !== learnerId) return undefined;
  const session = sessions.get(sessionId);
  if (session) sessionTouched.set(sessionId, Date.now());
  return session;
}

/**
 * Return a learner's recent sessions without touching their TTL timestamps.
 *
 * Dashboard reads must not accidentally keep abandoned sessions alive. The
 * returned array is newest-first and remains server-only: answers and private
 * verifier results must never be serialized wholesale to the browser.
 */
export function listSessionsForLearner(learnerId: string): LearnerSession[] {
  pruneSessions();
  return [...sessionLearners.entries()]
    .filter(([, owner]) => owner === learnerId)
    .sort(([left], [right]) => (sessionTouched.get(right) ?? 0) - (sessionTouched.get(left) ?? 0))
    .map(([sessionId]) => sessions.get(sessionId))
    .filter((session): session is LearnerSession => Boolean(session));
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
