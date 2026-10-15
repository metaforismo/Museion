import { randomInt, randomUUID } from "node:crypto";
import { sitesDatabase } from "@/lib/sites/database";
import { localDatabase } from "./local-database";
import { hashPassword, safeReturnTo, verifyPassword, type AuthAccount } from "./auth";
import { localOutboxTransport, type AuthDeliveryTransport } from "./auth-delivery";

export const VERIFICATION_TTL_MS = 10 * 60 * 1000;
export const VERIFICATION_MAX_ATTEMPTS = 6;
export const VERIFICATION_RESEND_MS = 60 * 1000;
export const VERIFICATION_MAX_RESENDS = 3;
interface PendingSignup { id: string; email: string; display_name: string; password_hash: string; code_hash: string; next_path: string; expires_at: number; attempts: number; resend_count: number; last_sent_at: number }
function db() { return sitesDatabase() ?? localDatabase(); }
function code() { return String(randomInt(0, 1_000_000)).padStart(6, "0"); }

export async function beginSignupVerification(input: { email: string; password: string; displayName: string; next?: string }, transport: AuthDeliveryTransport = localOutboxTransport) {
  const id = randomUUID();
  const otp = code();
  const now = Date.now();
  const email = input.email.trim().toLowerCase();
  const [passwordHash, codeHash] = await Promise.all([hashPassword(input.password), hashPassword(otp)]);
  await db().prepare("DELETE FROM pending_signups WHERE expires_at<=?").bind(now).run();
  await db().prepare("INSERT INTO pending_signups(id,email,display_name,password_hash,code_hash,next_path,expires_at,attempts,resend_count,last_sent_at,created_at) VALUES(?,?,?,?,?,?,?,0,0,?,?) ON CONFLICT(email) DO UPDATE SET id=excluded.id,display_name=excluded.display_name,password_hash=excluded.password_hash,code_hash=excluded.code_hash,next_path=excluded.next_path,expires_at=excluded.expires_at,attempts=0,resend_count=0,last_sent_at=excluded.last_sent_at,created_at=excluded.created_at").bind(id, email, input.displayName.trim(), passwordHash, codeHash, safeReturnTo(input.next), now + VERIFICATION_TTL_MS, now, now).run();
  try { await transport.sendVerification({ challengeId: id, recipient: email, code: otp, expiresAt: now + VERIFICATION_TTL_MS }); }
  catch (error) { await db().prepare("DELETE FROM pending_signups WHERE id=?").bind(id).run(); throw error; }
  // Existing account emails receive the same challenge response. Verification
  // cannot replace credentials or create a session for an existing account.
  return { verificationRequired: true, challengeId: id, expiresAt: now + VERIFICATION_TTL_MS, resendAfter: 60, deliveryMode: transport.mode };
}

export async function verifySignupCode(challengeId: string, otp: string): Promise<{ account: AuthAccount; next: string } | null> {
  const now = Date.now();
  const row = await db().prepare("UPDATE pending_signups SET attempts=attempts+1 WHERE id=? AND expires_at>? AND attempts<? RETURNING *").bind(challengeId, now, VERIFICATION_MAX_ATTEMPTS).first<PendingSignup>();
  if (!row || !await verifyPassword(otp, row.code_hash)) return null;
  const accountId = randomUUID();
  const timestamp = new Date(now).toISOString();
  try {
    const result = await db().batch([
      db().prepare("INSERT INTO accounts(id,status,created_at,updated_at) SELECT ?,'active',?,? FROM pending_signups WHERE id=? AND code_hash=? AND expires_at>? AND attempts<=?").bind(accountId, timestamp, timestamp, challengeId, row.code_hash, now, VERIFICATION_MAX_ATTEMPTS),
      db().prepare("INSERT INTO local_credentials(account_id,email,display_name,password_hash,created_at) SELECT ?,email,display_name,password_hash,? FROM pending_signups WHERE id=? AND EXISTS(SELECT 1 FROM accounts WHERE id=?)").bind(accountId, timestamp, challengeId, accountId),
      db().prepare("DELETE FROM pending_signups WHERE id=? AND EXISTS(SELECT 1 FROM accounts WHERE id=?)").bind(challengeId, accountId),
    ]);
    if (Number(result[0]?.meta?.changes ?? 0) !== 1) return null;
  } catch (error) {
    if (String(error).includes("UNIQUE constraint failed: local_credentials.email")) return null;
    throw error;
  }
  return { account: { id: accountId, email: row.email, displayName: row.display_name }, next: row.next_path };
}

export async function resendSignupCode(challengeId: string, transport: AuthDeliveryTransport = localOutboxTransport) {
  const row = await db().prepare("SELECT * FROM pending_signups WHERE id=? AND expires_at>? AND attempts<? AND resend_count<?").bind(challengeId, Date.now(), VERIFICATION_MAX_ATTEMPTS, VERIFICATION_MAX_RESENDS).first<PendingSignup>();
  if (!row) return null;
  const now = Date.now();
  if (now - row.last_sent_at < VERIFICATION_RESEND_MS) throw new Error("VERIFICATION_RESEND_WAIT");
  const otp = code();
  const codeHash = await hashPassword(otp);
  const result = await db().prepare("UPDATE pending_signups SET code_hash=?,expires_at=?,attempts=0,resend_count=resend_count+1,last_sent_at=? WHERE id=? AND last_sent_at=? AND resend_count<?").bind(codeHash, now + VERIFICATION_TTL_MS, now, challengeId, row.last_sent_at, VERIFICATION_MAX_RESENDS).run();
  if (Number(result.meta?.changes ?? 0) !== 1) return null;
  try { await transport.sendVerification({ challengeId, recipient: row.email, code: otp, expiresAt: now + VERIFICATION_TTL_MS }); }
  catch (error) {
    // Keep the previous delivered code usable when the replacement delivery fails.
    await db().prepare("UPDATE pending_signups SET code_hash=?,expires_at=?,attempts=?,resend_count=?,last_sent_at=? WHERE id=? AND code_hash=?").bind(row.code_hash, row.expires_at, row.attempts, row.resend_count, row.last_sent_at, challengeId, codeHash).run();
    throw error;
  }
  return { expiresAt: now + VERIFICATION_TTL_MS, resendAfter: 60, deliveryMode: transport.mode };
}
