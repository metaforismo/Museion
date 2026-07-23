import { createHmac } from "node:crypto";
import { headers } from "next/headers";

import { readLearnerId } from "./learner";
import { runtimeValue } from "@/lib/sites/runtime";
import { sitesDatabase } from "@/lib/sites/database";

export type Actor =
  | { kind: "guest"; ownerId: string; displayName: null }
  | { kind: "account"; ownerId: string; displayName: string | null };

function decodedName(value: string | null, encoding: string | null): string | null {
  if (!value || encoding !== "percent-encoded-utf-8") return null;
  try { return decodeURIComponent(value).slice(0, 120); } catch { return null; }
}

async function accountOwnerId(email: string): Promise<string> {
  const pepper = runtimeValue("IDENTITY_PEPPER");
  if (!pepper) throw new Error("IDENTITY_PEPPER_NOT_CONFIGURED");
  return `account_${createHmac("sha256", pepper).update(email.trim().toLowerCase()).digest("hex")}`;
}

async function claimGuest(guestId: string, accountId: string): Promise<void> {
  const db = sitesDatabase();
  if (!db) return;
  const now = new Date().toISOString();
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO accounts(id,status,created_at,updated_at) VALUES(?,?,?,?)").bind(accountId, "active", now, now),
    db.prepare("INSERT OR IGNORE INTO guest_claims(guest_id,account_id,claimed_at) VALUES(?,?,?)").bind(guestId, accountId, now),
    db.prepare("UPDATE lesson_sessions SET owner_id=?,updated_at=? WHERE owner_id=? AND EXISTS(SELECT 1 FROM guest_claims WHERE guest_id=? AND account_id=?)").bind(accountId, now, guestId, guestId, accountId),
    db.prepare("UPDATE session_events SET owner_id=? WHERE owner_id=? AND EXISTS(SELECT 1 FROM guest_claims WHERE guest_id=? AND account_id=?)").bind(accountId, guestId, guestId, accountId),
    db.prepare("INSERT INTO concept_evidence(owner_id,concept_id,score_micros,completed,practice_runs,updated_at) SELECT ?,concept_id,score_micros,completed,practice_runs,? FROM concept_evidence WHERE owner_id=? ON CONFLICT(owner_id,concept_id) DO UPDATE SET score_micros=MAX(score_micros,excluded.score_micros),completed=MAX(completed,excluded.completed),practice_runs=MAX(practice_runs,excluded.practice_runs),updated_at=excluded.updated_at").bind(accountId, now, guestId),
    db.prepare("DELETE FROM concept_evidence WHERE owner_id=? AND EXISTS(SELECT 1 FROM guest_claims WHERE guest_id=? AND account_id=?)").bind(guestId, guestId, accountId),
    db.prepare("UPDATE museion_state SET owner_id=?,updated_at=? WHERE owner_id=? AND EXISTS(SELECT 1 FROM guest_claims WHERE guest_id=? AND account_id=?)").bind(accountId, now, guestId, guestId, accountId),
    db.prepare("UPDATE compiler_runs SET owner_id=?,updated_at=? WHERE owner_id=? AND EXISTS(SELECT 1 FROM guest_claims WHERE guest_id=? AND account_id=?)").bind(accountId, now, guestId, guestId, accountId),
    db.prepare("UPDATE generated_courses SET owner_id=?,updated_at=? WHERE owner_id=? AND EXISTS(SELECT 1 FROM guest_claims WHERE guest_id=? AND account_id=?)").bind(accountId, now, guestId, guestId, accountId),
  ]);
}

export async function currentActor(): Promise<Actor> {
  const incoming = await headers();
  const email = incoming.get("oai-authenticated-user-email")?.trim();
  const guestId = await readLearnerId();
  if (!email) return { kind: "guest", ownerId: guestId ?? `guest_${crypto.randomUUID()}`, displayName: null };
  const ownerId = await accountOwnerId(email);
  if (guestId) await claimGuest(guestId, ownerId);
  return { kind: "account", ownerId, displayName: decodedName(incoming.get("oai-authenticated-user-full-name"), incoming.get("oai-authenticated-user-full-name-encoding")) };
}

export async function requireAccountActor(): Promise<Extract<Actor, { kind: "account" }>> {
  const actor = await currentActor();
  if (actor.kind !== "account") throw new Error("CHATGPT_SIGN_IN_REQUIRED");
  return actor;
}
