import type { SessionMode, SessionStateResponse } from "@/lib/api-types";
import { fetchWithTimeout } from "./fetch-with-timeout";

type SessionRequest = (input: string, init?: RequestInit) => Promise<Response>;
const pendingOpenings = new Map<string, Promise<SessionStateResponse>>();

function matchesLesson(state: SessionStateResponse, lessonId: string, mode: SessionMode): boolean {
  return Boolean(state?.sessionId && state.mode === mode && state.lesson?.id === (mode === "practice" ? `${lessonId}::practice` : lessonId));
}

/** Browser session IDs are an optional cache; the account's saved work wins. */
async function resolveLessonSession(
  lessonId: string,
  mode: SessionMode,
  options: { savedSessionId: string | null; forceNew?: boolean },
  request: SessionRequest = fetchWithTimeout,
): Promise<SessionStateResponse> {
  const generatedCourse = lessonId.startsWith("generated:") && mode === "lesson";
  if (!options.forceNew) {
    if (options.savedSessionId) {
      const cached = await request(`/api/sessions/${encodeURIComponent(options.savedSessionId)}`);
      if (cached.ok) {
        const state = await cached.json() as SessionStateResponse;
        if (matchesLesson(state, lessonId, mode) && (generatedCourse ? state.openedAsRestart || state.complete || state.sessionVersion > 0 : !state.complete)) return state;
      } else if (cached.status !== 404 && cached.status !== 410) throw new Error("SESSION_TEMPORARILY_UNAVAILABLE");
    }
    const query = new URLSearchParams({ lessonId, mode });
    const discovery = await request(`/api/sessions?${query}`);
    if (!discovery.ok) throw new Error("SESSION_TEMPORARILY_UNAVAILABLE");
    const { session } = await discovery.json() as { session: SessionStateResponse | null };
    if (session) {
      if (!matchesLesson(session, lessonId, mode)) throw new Error("INVALID_SESSION_RESPONSE");
      if (generatedCourse || !session.complete) return session;
    }
  }

  const response = await request("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId, mode, ...(generatedCourse && options.forceNew ? { restart: true } : {}) }) });
  if (!response.ok) throw new Error("SESSION_CREATION_FAILED");
  const state = await response.json() as SessionStateResponse;
  if (!matchesLesson(state, lessonId, mode)) throw new Error("INVALID_SESSION_RESPONSE");
  return state;
}

/** Strict Mode can mount twice while discovery is pending. Share the whole
 * open operation so a delayed empty lookup cannot create a second session. */
export function openLessonSession(
  lessonId: string,
  mode: SessionMode,
  options: { savedSessionId: string | null; forceNew?: boolean },
  request: SessionRequest = fetchWithTimeout,
): Promise<SessionStateResponse> {
  const key = `${lessonId}:${mode}:${options.forceNew ? "new" : options.savedSessionId ?? "discover"}`;
  const pending = pendingOpenings.get(key);
  if (pending) return pending;
  const opening = resolveLessonSession(lessonId, mode, options, request).finally(() => pendingOpenings.delete(key));
  pendingOpenings.set(key, opening);
  return opening;
}
