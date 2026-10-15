import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as discoverSession, POST as createSession } from "@/app/api/sessions/route";
import { GET as readSession } from "@/app/api/sessions/[sessionId]/route";
import { openLessonSession } from "@/lib/client/open-lesson-session";
import { ownedSession, persistSession, unfinishedSessionFor } from "@/lib/server/session-repository";
import { closeLocalDatabase, localDatabase } from "@/lib/server/local-database";
import { createAccount } from "@/lib/server/auth";

const identity = vi.hoisted(() => ({ ownerId: null as string | null }));
vi.mock("@/lib/server/actor", () => ({
  currentActor: async () => identity.ownerId ? { kind: "account", ownerId: identity.ownerId, displayName: "Learner" } : { kind: "guest", ownerId: "unauthenticated", displayName: null },
  requireAccountActor: async () => { if (!identity.ownerId) throw new Error("SIGN_IN_REQUIRED"); return { kind: "account", ownerId: identity.ownerId, displayName: "Learner" }; },
}));

let directory: string;
let ownerId: string;
let calls: { path: string; method: string }[];

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "museion-resume-"));
  process.env.MUSEION_DATABASE_PATH = join(directory, "museion.sqlite");
  const account = await createAccount({ email: "resume@example.com", password: "a memorable learning phrase", displayName: "Learner" });
  ownerId = account.id;
  identity.ownerId = ownerId;
  calls = [];
});
afterEach(() => {
  closeLocalDatabase();
  delete process.env.MUSEION_DATABASE_PATH;
  identity.ownerId = null;
  rmSync(directory, { recursive: true, force: true });
});

async function serverRequest(path: string, init?: RequestInit): Promise<Response> {
  const method = init?.method ?? "GET";
  calls.push({ path, method });
  const request = new Request(`http://localhost:3000${path}`, init);
  if (path === "/api/sessions" && method === "POST") return createSession(request);
  if (path.startsWith("/api/sessions?")) return discoverSession(request);
  if (path.startsWith("/api/sessions/")) return readSession(request, { params: Promise.resolve({ sessionId: path.split("/").at(-1)! }) });
  throw new Error("Unexpected request");
}

describe("account-owned lesson resume without browser pointers", () => {
  it("returns to the next move after the browser pointer is cleared and SQLite reopens", async () => {
    const initial = await openLessonSession("linear-equations-intro", "lesson", { savedSessionId: null }, serverRequest);
    const saved = (await ownedSession(initial.sessionId, ownerId))!;
    expect(saved.submitAnswer("6").correct).toBe(true);
    saved.advance();
    await persistSession(saved, ownerId, initial.sessionVersion);
    closeLocalDatabase();
    calls = [];
    const resumed = await openLessonSession("linear-equations-intro", "lesson", { savedSessionId: null }, serverRequest);
    expect(resumed.sessionId).toBe(initial.sessionId);
    expect(resumed.stepIndex).toBe(1);
    expect(resumed.sessionVersion).toBe(saved.version);
    expect(calls.filter((call) => call.method === "POST")).toEqual([]);
    expect(resumed.solvedStep).toBeNull();
    expect(JSON.stringify(resumed)).not.toContain("verifiedSolution");
    expect(JSON.stringify(resumed.lesson)).not.toContain('"answer":');
  });

  it("isolates owners, lesson identity and the shuffled practice run", async () => {
    const lesson = await openLessonSession("linear-equations-intro", "lesson", { savedSessionId: null }, serverRequest);
    const practice = await openLessonSession("linear-equations-intro", "practice", { savedSessionId: null }, serverRequest);
    closeLocalDatabase();
    const resumedPractice = await openLessonSession("linear-equations-intro", "practice", { savedSessionId: lesson.sessionId }, serverRequest);
    expect(resumedPractice.sessionId).toBe(practice.sessionId);
    expect(resumedPractice.lesson).toEqual(practice.lesson);
    const other = await openLessonSession("binary-numbers", "lesson", { savedSessionId: lesson.sessionId }, serverRequest);
    expect(other.lesson.id).toBe("binary-numbers");
    expect(other.sessionId).not.toBe(lesson.sessionId);
    const account = await createAccount({ email: "other@example.com", password: "another memorable phrase", displayName: "Other learner" });
    identity.ownerId = account.id;
    const secondOwner = await openLessonSession("linear-equations-intro", "lesson", { savedSessionId: lesson.sessionId }, serverRequest);
    expect(secondOwner.sessionId).not.toBe(lesson.sessionId);
    expect(secondOwner.stepIndex).toBe(0);
    expect(await unfinishedSessionFor(account.id, "linear-equations-intro", "lesson")).toMatchObject({ sessionId: secondOwner.sessionId });
  });

  it("starts fresh after completed runs and honors an explicit restart even with saved unfinished work", async () => {
    const initial = await openLessonSession("linear-equations-intro", "lesson", { savedSessionId: null }, serverRequest);
    const saved = (await ownedSession(initial.sessionId, ownerId))!;
    for (const answer of ["6", "4", "5", "3"]) { expect(saved.submitAnswer(answer).correct).toBe(true); saved.advance(); }
    await persistSession(saved, ownerId, initial.sessionVersion);
    expect(saved.complete).toBe(true);
    const fresh = await openLessonSession("linear-equations-intro", "lesson", { savedSessionId: initial.sessionId }, serverRequest);
    expect(fresh.sessionId).not.toBe(initial.sessionId);
    expect(fresh.complete).toBe(false);
    calls = [];
    const restarted = await openLessonSession("linear-equations-intro", "lesson", { savedSessionId: fresh.sessionId, forceNew: true }, serverRequest);
    expect(restarted.sessionId).not.toBe(fresh.sessionId);
    expect(calls).toEqual([{ path: "/api/sessions", method: "POST" }]);
    expect((await unfinishedSessionFor(ownerId, "linear-equations-intro", "lesson"))?.sessionId).toBe(restarted.sessionId);
  });

  it("ignores expired sessions, requires authentication and validates lookup parameters", async () => {
    const initial = await openLessonSession("linear-equations-intro", "lesson", { savedSessionId: null }, serverRequest);
    await localDatabase().prepare("UPDATE lesson_sessions SET expires_at='2000-01-01T00:00:00.000Z' WHERE id=?").bind(initial.sessionId).run();
    const fresh = await openLessonSession("linear-equations-intro", "lesson", { savedSessionId: initial.sessionId }, serverRequest);
    expect(fresh.sessionId).not.toBe(initial.sessionId);
    expect((await serverRequest("/api/sessions?lessonId=linear-equations-intro&mode=invalid")).status).toBe(400);
    expect((await serverRequest("/api/sessions?lessonId=unknown")).status).toBe(404);
    identity.ownerId = null;
    expect((await serverRequest("/api/sessions?lessonId=linear-equations-intro")).status).toBe(401);
  });

  it("shares discovery across concurrent mounts and does not create during a lookup outage", async () => {
    const options = { savedSessionId: null };
    const first = openLessonSession("linear-equations-intro", "lesson", options, serverRequest);
    const second = openLessonSession("linear-equations-intro", "lesson", options, serverRequest);
    const [one, two] = await Promise.all([first, second]);
    expect(two.sessionId).toBe(one.sessionId);
    expect(calls.filter((call) => call.method === "POST")).toHaveLength(1);
    calls = [];
    const unavailable = async (path: string, init?: RequestInit) => { calls.push({ path, method: init?.method ?? "GET" }); return new Response(null, { status: 503 }); };
    await expect(openLessonSession("binary-numbers", "lesson", options, unavailable)).rejects.toThrow("SESSION_TEMPORARILY_UNAVAILABLE");
    expect(calls.filter((call) => call.method === "POST")).toEqual([]);
  });
});
