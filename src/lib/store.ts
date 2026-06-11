/**
 * In-memory session store, enough to drive the prototype.
 *
 * Kept on globalThis so sessions survive dev-server hot reloads.
 * Persistence (SQLite/Postgres) is on the roadmap — see TODO.md.
 */

import type { LearnerSession } from "./engine/session";

const globalStore = globalThis as unknown as {
  __museionSessions?: Map<string, LearnerSession>;
};

const sessions =
  globalStore.__museionSessions ?? new Map<string, LearnerSession>();
globalStore.__museionSessions = sessions;

export function saveSession(session: LearnerSession): void {
  sessions.set(session.sessionId, session);
}

export function getSession(sessionId: string): LearnerSession | undefined {
  return sessions.get(sessionId);
}
