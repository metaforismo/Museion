import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accountForSession, AUTH_COOKIE, authenticateAccount, createAccount, verifyPassword } from "@/lib/server/auth";
import { beginSignupVerification, resendSignupCode, verifySignupCode, VERIFICATION_MAX_ATTEMPTS, VERIFICATION_MAX_RESENDS } from "@/lib/server/auth-verification";
import type { AuthDeliveryTransport, VerificationMessage } from "@/lib/server/auth-delivery";
import { closeLocalDatabase, localDatabase } from "@/lib/server/local-database";
import { LearningPreferencesSchema, persistLearningPreferences, savedLearningPreferences } from "@/lib/server/learner-settings";
import { POST as verify } from "@/app/api/auth/verify/route";
import { POST as resend } from "@/app/api/auth/resend/route";

let directory: string;
const credentials = { email: "verified@example.com", password: "words to remember safely", displayName: "Nora" };
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "museion-verification-"));
  process.env.MUSEION_DATABASE_PATH = join(directory, "state.sqlite");
  process.env.MUSEION_AUTH_OUTBOX_PATH = join(directory, "outbox");
});
afterEach(() => {
  closeLocalDatabase();
  delete process.env.MUSEION_DATABASE_PATH;
  delete process.env.MUSEION_AUTH_OUTBOX_PATH;
  rmSync(directory, { recursive: true, force: true });
});
function message(id: string): VerificationMessage {
  return JSON.parse(readFileSync(join(directory, "outbox", `${id}.json`), "utf8"));
}
function request(path: string, body: unknown, origin = "http://localhost:3000") {
  return new NextRequest(`http://localhost:3000${path}`, { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
async function countAccounts() { return (await localDatabase().prepare("SELECT count(*) AS n FROM accounts").first<{ n: number }>())!.n; }
const failedTransport: AuthDeliveryTransport = { mode: "local-outbox", async sendVerification() { throw new Error("DELIVERY_UNAVAILABLE"); } };

describe("private local signup verification", () => {
  it("stores only password/code hashes, creates no account before verification and survives restart", async () => {
    const challenge = await beginSignupVerification(credentials);
    expect(await countAccounts()).toBe(0);
    expect("code" in challenge).toBe(false);
    expect(challenge.deliveryMode).toBe("local-outbox");
    const delivered = message(challenge.challengeId);
    const pending = await localDatabase().prepare("SELECT password_hash,code_hash FROM pending_signups WHERE id=?").bind(challenge.challengeId).first<{ password_hash: string; code_hash: string }>();
    expect(await verifyPassword(credentials.password, pending!.password_hash)).toBe(true);
    expect(await verifyPassword(delivered.code, pending!.code_hash)).toBe(true);
    expect(pending!.code_hash.startsWith("scrypt-v1$")).toBe(true);
    expect(statSync(join(directory, "outbox")).mode & 0o777).toBe(0o700);
    expect(statSync(join(directory, "outbox", `${challenge.challengeId}.json`)).mode & 0o777).toBe(0o600);
    closeLocalDatabase();
    const response = await verify(request("/api/auth/verify", { challengeId: challenge.challengeId, code: delivered.code }));
    expect(response.status).toBe(200);
    expect((await response.json()).next).toBe("/welcome");
    expect((await accountForSession(response.cookies.get(AUTH_COOKIE)!.value))?.displayName).toBe("Nora");
    expect(await countAccounts()).toBe(1);
    expect(await verifySignupCode(challenge.challengeId, delivered.code)).toBeNull();
  });

  it("expires codes and caps guesses durably without creating an account", async () => {
    const challenge = await beginSignupVerification(credentials);
    const delivered = message(challenge.challengeId);
    const wrong = delivered.code === "000000" ? "000001" : "000000";
    for (let n = 0; n < VERIFICATION_MAX_ATTEMPTS; n++) expect(await verifySignupCode(challenge.challengeId, wrong)).toBeNull();
    closeLocalDatabase();
    expect(await verifySignupCode(challenge.challengeId, delivered.code)).toBeNull();
    expect(await resendSignupCode(challenge.challengeId)).toBeNull();
    const fresh = await beginSignupVerification(credentials);
    await localDatabase().prepare("UPDATE pending_signups SET expires_at=0 WHERE id=?").bind(fresh.challengeId).run();
    expect(await verifySignupCode(fresh.challengeId, message(fresh.challengeId).code)).toBeNull();
    expect(await countAccounts()).toBe(0);
  });

  it("permits only one account when the same valid code is submitted concurrently", async () => {
    const challenge = await beginSignupVerification(credentials);
    const delivered = message(challenge.challengeId);
    const results = await Promise.all([verifySignupCode(challenge.challengeId, delivered.code), verifySignupCode(challenge.challengeId, delivered.code)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await countAccounts()).toBe(1);
  });

  it("invalidates superseded challenges and never replaces existing account credentials", async () => {
    const existing = await createAccount(credentials);
    const first = await beginSignupVerification({ ...credentials, password: "a replacement password", displayName: "Different" });
    const oldMessage = message(first.challengeId);
    const second = await beginSignupVerification({ ...credentials, password: "a replacement password" });
    expect(second.verificationRequired).toBe(true);
    expect(await verifySignupCode(first.challengeId, oldMessage.code)).toBeNull();
    expect(await verifySignupCode(second.challengeId, message(second.challengeId).code)).toBeNull();
    expect(await authenticateAccount(credentials.email, credentials.password)).toEqual(existing);
    expect(await authenticateAccount(credentials.email, "a replacement password")).toBeNull();
    expect(await countAccounts()).toBe(1);
  });

  it("enforces resend cooldown/count and keeps the delivered code usable on transport failure", async () => {
    const challenge = await beginSignupVerification(credentials);
    const original = message(challenge.challengeId);
    expect((await resend(request("/api/auth/resend", { challengeId: challenge.challengeId }))).status).toBe(429);
    await localDatabase().prepare("UPDATE pending_signups SET last_sent_at=0 WHERE id=?").bind(challenge.challengeId).run();
    await expect(resendSignupCode(challenge.challengeId, failedTransport)).rejects.toThrow("DELIVERY_UNAVAILABLE");
    const pending = await localDatabase().prepare("SELECT code_hash,resend_count FROM pending_signups WHERE id=?").bind(challenge.challengeId).first<{ code_hash: string; resend_count: number }>();
    expect(await verifyPassword(original.code, pending!.code_hash)).toBe(true);
    expect(pending!.resend_count).toBe(0);
    for (let n = 0; n < VERIFICATION_MAX_RESENDS; n++) {
      await localDatabase().prepare("UPDATE pending_signups SET last_sent_at=0 WHERE id=?").bind(challenge.challengeId).run();
      expect((await resendSignupCode(challenge.challengeId))?.deliveryMode).toBe("local-outbox");
    }
    await localDatabase().prepare("UPDATE pending_signups SET last_sent_at=0 WHERE id=?").bind(challenge.challengeId).run();
    expect(await resendSignupCode(challenge.challengeId)).toBeNull();
    expect(await verifySignupCode(challenge.challengeId, message(challenge.challengeId).code)).not.toBeNull();
  });

  it("does not leave a usable pending signup when initial delivery fails and guards verification origins", async () => {
    await expect(beginSignupVerification(credentials, failedTransport)).rejects.toThrow("DELIVERY_UNAVAILABLE");
    expect((await localDatabase().prepare("SELECT count(*) AS n FROM pending_signups").first<{ n: number }>())!.n).toBe(0);
    const challenge = await beginSignupVerification(credentials);
    const body = { challengeId: challenge.challengeId, code: message(challenge.challengeId).code };
    expect((await verify(request("/api/auth/verify", body, "https://foreign.example"))).status).toBe(403);
    expect((await verify(request("/api/auth/verify", { ...body, code: "123" }))).status).toBe(400);
    expect(await countAccounts()).toBe(0);
  });

  it("upgrades a version-one database without deleting accounts or preferences", async () => {
    const account = await createAccount(credentials);
    const preferences = LearningPreferencesSchema.parse({ schemaVersion: "1.0", role: "student", ageBand: "16-18", goal: "prepare-exam", familiarity: "some", subject: "coding", dailyMinutes: 20, suggestedCourseId: "search-by-halving" });
    await persistLearningPreferences(account.id, preferences);
    await localDatabase().prepare("DROP TABLE pending_signups").run();
    await localDatabase().prepare("DELETE FROM local_migrations WHERE version=2").run();
    await localDatabase().prepare("INSERT OR IGNORE INTO local_migrations(version,applied_at) VALUES(1,'2026-01-01')").run();
    closeLocalDatabase();
    expect(await authenticateAccount(credentials.email, credentials.password)).toEqual(account);
    expect(await savedLearningPreferences(account.id)).toEqual(preferences);
    expect(await savedLearningPreferences("someone-else")).toBeNull();
    expect((await beginSignupVerification({ ...credentials, email: "new@example.com" })).verificationRequired).toBe(true);
  });
});
