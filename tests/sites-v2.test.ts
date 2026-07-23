import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";

import { getLesson } from "@/lib/content";
import { LearnerSession } from "@/lib/engine/session";
import { compilerFailurePayload } from "@/lib/compiler";
import { consumeUsage, DAILY_COMPILER_LIMIT, DAILY_MAIA_LIMIT, quotaView, resetUsageForTests } from "@/lib/server/usage";
import { resetSitesRuntimeForTests } from "@/lib/sites/runtime";

afterEach(() => { resetUsageForTests(); resetSitesRuntimeForTests(); });

describe("Sites v2 persistence contracts", () => {
  it("ships every account-scoped table and lease/revision field in the D1 migration", async () => {
    const sql = await readFile(new URL("../drizzle/0000_narrow_kulan_gath.sql", import.meta.url), "utf8");
    for (const table of ["accounts", "guest_claims", "lesson_sessions", "session_events", "concept_evidence", "generated_courses", "compiler_runs", "uploads", "daily_usage", "audit_events"]) {
      expect(sql).toContain(`CREATE TABLE \`${table}\``);
    }
    expect(sql).toContain("`owner_id` text NOT NULL");
    expect(sql).toContain("`revision` integer DEFAULT 0 NOT NULL");
    expect(sql).toContain("`lease_until` text");
    expect(sql).toContain("ON DELETE cascade");
  });

  it("enforces the 20-turn Maia allowance without over-consuming", async () => {
    for (let index = 0; index < DAILY_MAIA_LIMIT; index += 1) expect(await consumeUsage("account-a", "maia")).toBe(true);
    expect(await consumeUsage("account-a", "maia")).toBe(false);
    expect((await quotaView("account-a")).maia).toEqual({ used: 20, limit: 20, remaining: 0 });
    expect((await quotaView("account-b")).maia.remaining).toBe(20);
  });

  it("enforces two compiler builds independently per owner", async () => {
    for (let index = 0; index < DAILY_COMPILER_LIMIT; index += 1) expect(await consumeUsage("account-a", "compiler")).toBe(true);
    expect(await consumeUsage("account-a", "compiler")).toBe(false);
    expect(await consumeUsage("account-b", "compiler")).toBe(true);
  });

  it("round-trips a lesson session without losing its optimistic revision", () => {
    const lesson = getLesson("binary-numbers");
    expect(lesson).toBeDefined();
    const session = new LearnerSession(lesson!);
    const restored = LearnerSession.fromState(JSON.parse(JSON.stringify(session.toState())));
    expect(restored.sessionId).toBe(session.sessionId);
    expect(restored.version).toBe(session.version);
    expect(restored.lesson.id).toBe(session.lesson.id);
  });

  it("marks hosted AI blocks as explicit retryable compiler codes", () => {
    expect(compilerFailurePayload(new Error("LIVE_AI_DISABLED"))).toEqual({ error: "LIVE_AI_DISABLED" });
    expect(compilerFailurePayload(new Error("LIVE_COMPILER_NOT_CONFIGURED"))).toEqual({ error: "LIVE_COMPILER_NOT_CONFIGURED" });
  });

  it("declares raw upload expiry and account deletion cascades", async () => {
    const sql = await readFile(new URL("../drizzle/0000_narrow_kulan_gath.sql", import.meta.url), "utf8");
    expect(sql).toContain("`expires_at` text NOT NULL");
    expect(sql.match(/ON DELETE cascade/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
