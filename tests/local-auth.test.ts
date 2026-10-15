import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createAccount, authenticateAccount, createAuthSession, accountForSession, revokeAuthSession, authAttemptAllowed, hashPassword, verifyPassword, safeReturnTo, AUTH_COOKIE } from "@/lib/server/auth";
import { closeLocalDatabase, localDatabase } from "@/lib/server/local-database";
import { localUploads } from "@/lib/server/local-uploads";
import { getLesson } from "@/lib/content";
import { createCompilerRun, getPrivateCompilerRun, listCompilerRuns } from "@/lib/compiler";
import { SourceDocumentSchema } from "@/lib/source";
import { createJudgeSession, getJudgeSession, dispatchJudgeAction } from "@/lib/judge";
import goldenDocument from "./fixtures/binary-search-source-document.json";
import { LearnerSession } from "@/lib/engine/session";
import { ownedSession, persistSession, persistCompletion, learnerProfile } from "@/lib/server/session-repository";
import { consumeUsage, usageFor } from "@/lib/server/usage";
import { stateBackend } from "@/lib/server/durable-state";
import { persistLearningPreferences, savedLearningPreferences } from "@/lib/server/learner-settings";
import { sameOriginRequest } from "@/lib/server/request-origin";
import { proxy } from "@/proxy";
import { POST as signup } from "@/app/api/auth/signup/route";
import { POST as verifySignup } from "@/app/api/auth/verify/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as authSession } from "@/app/api/auth/session/route";

let directory: string;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "museion-auth-"));
  process.env.MUSEION_DATABASE_PATH = join(directory, "museion.sqlite");
  process.env.MUSEION_UPLOADS_PATH = join(directory, "uploads");
  process.env.MUSEION_AUTH_OUTBOX_PATH = join(directory, "outbox");
});
afterEach(() => {
  closeLocalDatabase();
  delete process.env.MUSEION_DATABASE_PATH;
  delete process.env.MUSEION_UPLOADS_PATH;
  delete process.env.MUSEION_AUTH_OUTBOX_PATH;
  rmSync(directory, { recursive: true, force: true });
});

const credentials = { email: "learner@example.com", password: "several memorable words", displayName: "Ada" };
function request(path: string, body?: unknown, token?: string, origin = "http://localhost:3000") {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { origin, ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { cookie: `${AUTH_COOKIE}=${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("local accounts and SQLite durability", () => {
  it("salts scrypt hashes and rejects incorrect or malformed credentials", async () => {
    const first = await hashPassword(credentials.password);
    const second = await hashPassword(credentials.password);
    expect(first).not.toEqual(second);
    expect(await verifyPassword(credentials.password, first)).toBe(true);
    expect(await verifyPassword("wrong password", first)).toBe(false);
    expect(await verifyPassword(credentials.password, "bad hash")).toBe(false);
  });

  it("persists accounts, hashed sessions, ownership, progress, quotas and compiler state across reopening", async () => {
    const account = await createAccount(credentials);
    expect(stateBackend().kind).toBe("sqlite");
    const token = await createAuthSession(account.id);
    expect(await authenticateAccount(" LEARNER@example.com ", credentials.password)).toEqual(account);
    expect(await authenticateAccount(credentials.email, "wrong password")).toBeNull();
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    await persistSession(session, account.id);
    const originalVersion = session.version;
    expect(session.submitAnswer("6").correct).toBe(true);
    await persistSession(session, account.id, originalVersion);
    await persistCompletion(account.id, session.lesson.id, "lesson");
    await consumeUsage(account.id, "maia");
    const preferences = { schemaVersion: "1.0" as const, role: "independent" as const, ageBand: "adult" as const, goal: "prepare-exam" as const };
    await persistLearningPreferences(account.id, preferences);
    const record = { namespace: "compiler_run" as const, id: "course-a", ownerId: account.id, payload: { blocks: ["first"] }, expiresAt: "2099-01-01T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
    await stateBackend().put(record);
    await localUploads.put(`artifacts/${account.id}/course-a.json`, JSON.stringify(record));
    const persistedToken = await localDatabase().prepare("SELECT token_hash FROM auth_sessions").first<{ token_hash: string }>();
    expect(persistedToken?.token_hash).not.toEqual(token);
    expect(persistedToken?.token_hash).toMatch(/^[a-f0-9]{64}$/);
    closeLocalDatabase();
    expect(await accountForSession(token)).toEqual(account);
    expect((await ownedSession(session.sessionId, account.id))?.version).toBe(session.version);
    expect((await ownedSession(session.sessionId, account.id))?.awaitingAdvance).toBe(true);
    expect(await ownedSession(session.sessionId, "another-account")).toBeUndefined();
    expect((await learnerProfile(account.id))?.completedLessons.has(session.lesson.id)).toBe(true);
    expect((await usageFor(account.id)).maiaTurns).toBe(1);
    expect(await savedLearningPreferences(account.id)).toEqual(preferences);
    expect(await savedLearningPreferences("another-account")).toBeNull();
    expect((await stateBackend().get("compiler_run", record.id, account.id))?.payload).toEqual(record.payload);
    expect(await stateBackend().get("compiler_run", record.id, "another-account")).toBeUndefined();
    const object = await localUploads.get(`artifacts/${account.id}/course-a.json`);
    expect(await new Response(object!.body).json()).toEqual(record);
    await expect(localUploads.get("../../outside")).rejects.toThrow("INVALID_OBJECT_KEY");
    await revokeAuthSession(token);
    expect(await accountForSession(token)).toBeNull();
  });

  it("rolls back duplicate-email signups and rejects expired or deleted-account sessions", async () => {
    const account = await createAccount(credentials);
    await expect(createAccount({ ...credentials, email: "LEARNER@example.com" })).rejects.toThrow("ACCOUNT_EXISTS");
    expect((await localDatabase().prepare("SELECT COUNT(*) AS count FROM accounts").first<{ count: number }>())?.count).toBe(1);
    const expired = await createAuthSession(account.id);
    await localDatabase().prepare("UPDATE auth_sessions SET expires_at=0").run();
    expect(await accountForSession(expired)).toBeNull();
    const token = await createAuthSession(account.id);
    await localDatabase().prepare("DELETE FROM accounts WHERE id=?").bind(account.id).run();
    expect(await accountForSession(token)).toBeNull();
    expect((await localDatabase().prepare("SELECT COUNT(*) AS count FROM local_credentials").first<{ count: number }>())?.count).toBe(0);
  });

  it("keeps attempt limits across a restart and resets their window", async () => {
    const now = Date.now();
    for (let attempt = 0; attempt < 8; attempt++) expect(await authAttemptAllowed(credentials.email, now)).toBe(true);
    closeLocalDatabase();
    expect(await authAttemptAllowed(credentials.email, now)).toBe(false);
    expect(await authAttemptAllowed(credentials.email, now + 15 * 60 * 1000 + 1)).toBe(true);
  });

  it("keeps personal courses after temporary compiler state expires and resumes their interactive learner state", async () => {
    const account = await createAccount(credentials);
    const run = await createCompilerRun(account.id, SourceDocumentSchema.parse(goldenDocument), { level: "novice", language: "en", targetMinutes: 12, learnerGoal: "Trace inclusive binary search and justify every boundary update." });
    const privateRun = await getPrivateCompilerRun(run.runId, account.id);
    const created = await createJudgeSession(account.id, "personal-course", privateRun.result.artifact);
    const action = await dispatchJudgeAction({ sessionId: created.sessionId, ownerId: account.id, blockId: "prediction_discard", action: { kind: "prediction_select", optionIndex: 0 }, expectedRevision: created.revision, commandId: "first-prediction" });
    await localDatabase().prepare("UPDATE museion_state SET expires_at='2000-01-01T00:00:00.000Z' WHERE namespace='compiler_run'").run();
    closeLocalDatabase();
    expect((await listCompilerRuns(account.id))[0].runId).toBe(run.runId);
    expect((await getPrivateCompilerRun(run.runId, account.id)).result.artifact.id).toBe(run.artifact.id);
    await expect(getPrivateCompilerRun(run.runId, "another-account")).rejects.toThrow("COMPILER_RUN_NOT_FOUND");
    const resumed = await getJudgeSession(created.sessionId, account.id);
    expect(resumed.revision).toBe(action.session.revision);
    expect(resumed.completedBlockIds).toEqual(action.session.completedBlockIds);
    const serialized = JSON.stringify(resumed);
    for (const privateField of ["answerSpecs", "correctOrder", "expectedStates", "misconceptionRules"]) expect(serialized).not.toContain(privateField);
  });
});

describe("account request flows and route boundaries", () => {
  it("creates a real account cookie, rotates on login, then revokes on logout", async () => {
    const pending = await signup(request("/api/auth/signup", credentials));
    expect(pending.status).toBe(202);
    expect(pending.cookies.get(AUTH_COOKIE)).toBeUndefined();
    const challenge = await pending.json();
    const message = JSON.parse(readFileSync(join(directory, "outbox", `${challenge.challengeId}.json`), "utf8"));
    const created = await verifySignup(request("/api/auth/verify", { challengeId: challenge.challengeId, code: message.code }));
    expect(created.status).toBe(200);
    expect((await created.json()).next).toBe("/welcome");
    const cookie = created.cookies.get(AUTH_COOKIE)!;
    expect(created.headers.get("set-cookie")).toContain("HttpOnly");
    expect(created.headers.get("set-cookie")).toContain("SameSite=lax");
    expect((await (await authSession(request("/api/auth/session", undefined, cookie.value))).json()).actor.displayName).toBe("Ada");
    const signedIn = await login(request("/api/auth/login", { email: credentials.email, password: credentials.password, next: "/library" }, cookie.value));
    expect(signedIn.status).toBe(200);
    expect((await signedIn.json()).next).toBe("/library");
    const newCookie = signedIn.cookies.get(AUTH_COOKIE)!;
    expect(newCookie.value).not.toBe(cookie.value);
    expect(await accountForSession(cookie.value)).toBeNull();
    const signedOut = await logout(request("/api/auth/logout", {}, newCookie.value));
    expect(signedOut.status).toBe(200);
    expect(signedOut.cookies.get(AUTH_COOKIE)?.value).toBe("");
    expect(await accountForSession(newCookie.value)).toBeNull();
  });

  it("checks auth forms, rejects foreign origins and gives generic invalid-login feedback", async () => {
    expect((await signup(request("/api/auth/signup", { ...credentials, password: "short" }))).status).toBe(400);
    expect((await signup(request("/api/auth/signup", credentials, undefined, "https://elsewhere.example"))).status).toBe(403);
    await signup(request("/api/auth/signup", credentials));
    expect((await signup(request("/api/auth/signup", credentials))).status).toBe(202);
    const wrong = await login(request("/api/auth/login", { email: credentials.email, password: "a wrong password" }));
    const missing = await login(request("/api/auth/login", { email: "missing@example.com", password: "a wrong password" }));
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual(await missing.json());
  });

  it("keeps landing assets public, protects every product surface and retires judge access", async () => {
    for (const path of ["/", "/privacy", "/terms", "/login", "/signup", "/landing/learning-world.webp", "/brand/maia/maia.webp"]) expect((await proxy(request(path))).headers.get("x-middleware-next")).toBe("1");
    for (const path of ["/dashboard", "/welcome", "/library", "/courses/algebra", "/lessons/linear-equations-intro", "/learn/course-a", "/create", "/account", "/settings", "/progress", "/review"]) {
      const response = await proxy(request(path));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login?next=");
    }
    for (const path of ["/api/progress", "/api/account", "/api/learning/session-a", "/api/ai/status", "/api/mcp"]) expect((await proxy(request(path))).status).toBe(401);
    expect((await proxy(request("/api/sessions", {}))).status).toBe(401);
    expect((await proxy(request("/api/sessions", {}, undefined, "https://elsewhere.example"))).status).toBe(403);
    const spoofed = new NextRequest("http://localhost:3000/api/account", { headers: { "oai-authenticated-user-email": "learner@example.com", cookie: "museion-learner=old-public-identity" } });
    expect((await proxy(spoofed)).status).toBe(401);
    for (const path of ["/judge", "/api/judge", "/api/judge/session-a/action"]) expect((await proxy(request(path))).status).toBe(404);
    const account = await createAccount(credentials);
    const token = await createAuthSession(account.id);
    expect((await proxy(request("/dashboard", undefined, token))).headers.get("x-middleware-next")).toBe("1");
  });

  it("only accepts safe internal return destinations", () => {
    for (const path of ["https://elsewhere.example", "//elsewhere.example", "/\\elsewhere.example", "/login", "/api/account", "/judge"]) expect(safeReturnTo(path)).toBe("/dashboard");
    expect(safeReturnTo("/library?subject=math")).toBe("/library?subject=math");
  });

  it("matches the actual host when Next normalizes dev origins and ignores forwarded host claims", async () => {
    for (const host of ["localhost:3000", "127.0.0.1:3000"]) {
      const normalized = new NextRequest("http://localhost:3000/api/auth/signup", { method: "POST", headers: { host, origin: `http://${host}`, "Content-Type": "application/json" }, body: JSON.stringify({ ...credentials, email: host.startsWith("127") ? "second@example.com" : credentials.email }) });
      expect(sameOriginRequest(normalized)).toBe(true);
      expect((await signup(normalized)).status).toBe(202);
    }
    const invalidHeaders: Record<string, string>[] = [{ host: "localhost:3000", origin: "http://elsewhere.example", "x-forwarded-host": "elsewhere.example" }, { host: "localhost:3000", origin: "https://localhost:3000" }, { host: "localhost:3000", origin: "http://localhost:3000", "sec-fetch-site": "cross-site" }];
    for (const headers of invalidHeaders) {
      expect(sameOriginRequest(new Request("http://localhost:3000/api/auth/login", { headers }))).toBe(false);
    }
  });
});
