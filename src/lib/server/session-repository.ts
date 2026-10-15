import { LearnerSession, type SessionMode, type LearnerSessionState } from "@/lib/engine/session";
import { MasteryModel } from "@/lib/engine/mastery";
import { sitesDatabase } from "@/lib/sites/database";
import {
  getOrCreateProfile as memoryProfile,
  getProfile as memoryGetProfile,
  getSessionForLearner as memoryGetSession,
  getSessionLearner as memoryGetOwner,
  listSessionsForLearner as memoryListSessions,
  recordCompletion as memoryRecordCompletion,
  saveSession as memorySaveSession,
  type LearnerProfile,
} from "@/lib/store";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1_000;

interface SessionRow { state_json: string; owner_id: string }

export async function learnerProfile(ownerId: string, create = true): Promise<LearnerProfile | undefined> {
  const db = sitesDatabase();
  if (!db) return create ? memoryProfile(ownerId) : memoryGetProfile(ownerId);
  const rows = await db.prepare("SELECT concept_id,score_micros,completed,practice_runs FROM concept_evidence WHERE owner_id=?").bind(ownerId).all<{ concept_id: string; score_micros: number; completed: number; practice_runs: number }>();
  if (!create && !rows.results?.length) return undefined;
  const masteryEntries: [string, number][] = [];
  const completedLessons = new Set<string>();
  const practiceRuns = new Map<string, number>();
  for (const row of rows.results ?? []) {
    if (row.concept_id.startsWith("lesson:")) {
      const lessonId = row.concept_id.slice(7);
      if (row.completed) completedLessons.add(lessonId);
      if (row.practice_runs > 0) practiceRuns.set(lessonId, row.practice_runs);
    } else masteryEntries.push([row.concept_id, row.score_micros / 1_000_000]);
  }
  return { learnerId: ownerId, mastery: MasteryModel.fromEntries(masteryEntries), completedLessons, practiceRuns, createdAt: Date.now() };
}

export async function persistSession(session: LearnerSession, ownerId: string, expectedRevision?: number): Promise<void> {
  const db = sitesDatabase();
  if (!db) { memorySaveSession(session, ownerId); return; }
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const write = await db.prepare("INSERT INTO lesson_sessions(id,owner_id,lesson_id,mode,revision,state_json,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET state_json=excluded.state_json,revision=excluded.revision,expires_at=excluded.expires_at,updated_at=excluded.updated_at WHERE lesson_sessions.owner_id=excluded.owner_id AND lesson_sessions.revision=?")
    .bind(session.sessionId, ownerId, session.lesson.id, session.mode, session.version, JSON.stringify(session.toState()), expiresAt, now, now, expectedRevision ?? session.version).run();
  if (Number(write.meta?.changes ?? 0) === 0) throw new Error("SESSION_VERSION_CONFLICT");
  const statements = session.events.map((event, index) => db.prepare("INSERT OR IGNORE INTO session_events(id,session_id,owner_id,kind,payload_json,created_at) VALUES(?,?,?,?,?,?)").bind(`${session.sessionId}:${index}`, session.sessionId, ownerId, event.kind, JSON.stringify(event), new Date(event.ts).toISOString()));
  for (const [concept, score] of session.mastery.entries()) statements.push(db.prepare("INSERT INTO concept_evidence(owner_id,concept_id,score_micros,completed,practice_runs,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(owner_id,concept_id) DO UPDATE SET score_micros=MAX(score_micros,excluded.score_micros),updated_at=excluded.updated_at").bind(ownerId, concept, Math.round(score * 1_000_000), 0, 0, now));
  await db.batch(statements);
}

export async function ownedSession(sessionId: string, ownerId: string): Promise<LearnerSession | undefined> {
  const db = sitesDatabase();
  if (!db) return memoryGetSession(sessionId, ownerId);
  const row = await db.prepare("SELECT state_json,owner_id FROM lesson_sessions WHERE id=? AND owner_id=? AND (expires_at>? OR (lesson_id LIKE 'generated:%' AND mode='lesson' AND json_extract(state_json,'$.stepIndex') >= json_array_length(state_json,'$.lesson.steps'))) LIMIT 1").bind(sessionId, ownerId, new Date().toISOString()).first<SessionRow>();
  if (!row) return undefined;
  return LearnerSession.fromState(JSON.parse(row.state_json) as LearnerSessionState);
}

export async function sessionOwner(sessionId: string): Promise<string | undefined> {
  const db = sitesDatabase();
  if (!db) return memoryGetOwner(sessionId);
  const row = await db.prepare("SELECT owner_id FROM lesson_sessions WHERE id=? LIMIT 1").bind(sessionId).first<{ owner_id: string }>();
  return row?.owner_id;
}

export async function sessionsFor(ownerId: string): Promise<LearnerSession[]> {
  const db = sitesDatabase();
  if (!db) return memoryListSessions(ownerId);
  const rows = await db.prepare("SELECT state_json FROM lesson_sessions WHERE owner_id=? AND expires_at>? ORDER BY updated_at DESC LIMIT 20").bind(ownerId, new Date().toISOString()).all<{ state_json: string }>();
  return (rows.results ?? []).map((row) => LearnerSession.fromState(JSON.parse(row.state_json) as LearnerSessionState));
}

/** Resume only this account's unfinished run of the exact lesson and mode.
 * Practice retains its server-shuffled lesson, never an authored lesson run. */
export async function unfinishedSessionFor(ownerId: string, lessonId: string, mode: SessionMode): Promise<LearnerSession | undefined> {
  const storedLessonId = mode === "practice" ? `${lessonId}::practice` : lessonId;
  const db = sitesDatabase();
  if (!db) return memoryListSessions(ownerId).find((session) => session.lesson.id === storedLessonId && session.mode === mode && !session.complete);
  const row = await db.prepare("SELECT state_json FROM lesson_sessions WHERE owner_id=? AND lesson_id=? AND mode=? AND expires_at>? AND json_extract(state_json,'$.stepIndex') < json_array_length(state_json,'$.lesson.steps') ORDER BY updated_at DESC,created_at DESC,rowid DESC LIMIT 1").bind(ownerId, storedLessonId, mode, new Date().toISOString()).first<{ state_json: string }>();
  return row ? LearnerSession.fromState(JSON.parse(row.state_json) as LearnerSessionState) : undefined;
}

/** A new empty attempt must not erase observed course progress or a completed
 * result. Completed generated-course observations remain until account/course
 * removal; the expiry still applies to unfinished work. Exact account/lesson/
 * mode lookup also avoids the recent-list limit. */
export async function courseEvidenceSessionFor(ownerId: string, lessonId: string, mode: SessionMode = "lesson"): Promise<LearnerSession | undefined> {
  const storedLessonId = mode === "practice" ? `${lessonId}::practice` : lessonId;
  const db = sitesDatabase();
  if (!db) return memoryListSessions(ownerId)
    .filter((session) => session.lesson.id === storedLessonId && session.mode === mode)
    .sort((left, right) => right.stepIndex - left.stepIndex || (right.events.at(-1)?.ts ?? 0) - (left.events.at(-1)?.ts ?? 0))[0];
  const row = await db.prepare("SELECT state_json FROM lesson_sessions WHERE owner_id=? AND lesson_id=? AND mode=? AND (expires_at>? OR (lesson_id LIKE 'generated:%' AND mode='lesson' AND json_extract(state_json,'$.stepIndex') >= json_array_length(state_json,'$.lesson.steps'))) ORDER BY json_extract(state_json,'$.stepIndex') DESC,updated_at DESC,created_at DESC,rowid DESC LIMIT 1")
    .bind(ownerId, storedLessonId, mode, new Date().toISOString()).first<{ state_json: string }>();
  return row ? LearnerSession.fromState(JSON.parse(row.state_json) as LearnerSessionState) : undefined;
}

export async function persistCompletion(ownerId: string, lessonId: string, mode: SessionMode): Promise<void> {
  const db = sitesDatabase();
  if (!db) { memoryRecordCompletion(ownerId, lessonId, mode); return; }
  const now = new Date().toISOString();
  const completed = mode === "lesson" ? 1 : 0;
  const practices = mode === "practice" ? 1 : 0;
  await db.prepare("INSERT INTO concept_evidence(owner_id,concept_id,score_micros,completed,practice_runs,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(owner_id,concept_id) DO UPDATE SET completed=MAX(completed,excluded.completed),practice_runs=practice_runs+excluded.practice_runs,updated_at=excluded.updated_at").bind(ownerId, `lesson:${lessonId}`, 0, completed, practices, now).run();
}
