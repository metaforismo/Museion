import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { sitesDatabase } from "@/lib/sites/database";
import { localDatabase } from "./local-database";

export const AUTH_COOKIE = "museion-session";
export const AUTH_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const AuthInputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(10, "Use at least 10 characters.").max(128),
  displayName: z.string().trim().min(1).max(80).optional(),
  next: z.string().max(500).optional(),
}).strict();

export interface AuthAccount { id: string; email: string; displayName: string }
interface AccountRow { id: string; email: string; display_name: string; password_hash: string }
function database() { return sitesDatabase() ?? localDatabase(); }
function sha256(value: string): string { return createHash("sha256").update(value).digest("hex"); }

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt);
  return `scrypt-v1$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [version, salt, expected] = encoded.split("$");
  if (version !== "scrypt-v1" || !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{64}$/.test(expected ?? "")) return false;
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, Buffer.from(expected, "hex"));
}

export async function createAccount(input: { email: string; password: string; displayName: string }): Promise<AuthAccount> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const email = input.email.trim().toLowerCase();
  const hash = await hashPassword(input.password);
  const db = database();
  try {
    await db.batch([
      db.prepare("INSERT INTO accounts(id,status,created_at,updated_at) VALUES(?,'active',?,?)").bind(id, now, now),
      db.prepare("INSERT INTO local_credentials(account_id,email,display_name,password_hash,created_at) VALUES(?,?,?,?,?)").bind(id, email, input.displayName.trim(), hash, now),
    ]);
  } catch (error) {
    if (String(error).includes("UNIQUE constraint failed: local_credentials.email")) throw new Error("ACCOUNT_EXISTS");
    throw error;
  }
  return { id, email, displayName: input.displayName.trim() };
}

export async function authenticateAccount(email: string, password: string): Promise<AuthAccount | null> {
  const row = await database().prepare("SELECT a.id,c.email,c.display_name,c.password_hash FROM accounts a JOIN local_credentials c ON c.account_id=a.id WHERE c.email=? AND a.status='active'").bind(email.trim().toLowerCase()).first<AccountRow>();
  // Missing accounts still pay the same scrypt cost as a wrong password.
  const valid = await verifyPassword(password, row?.password_hash ?? "scrypt-v1$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000");
  return row && valid ? { id: row.id, email: row.email, displayName: row.display_name } : null;
}

export async function createAuthSession(accountId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const db = database();
  await db.batch([
    db.prepare("DELETE FROM auth_sessions WHERE expires_at<=?").bind(now),
    db.prepare("INSERT INTO auth_sessions(token_hash,account_id,expires_at,created_at) VALUES(?,?,?,?)").bind(sha256(token), accountId, now + AUTH_SESSION_TTL_MS, now),
  ]);
  return token;
}

export async function accountForSession(token: string | undefined): Promise<AuthAccount | null> {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const row = await database().prepare("SELECT a.id,c.email,c.display_name FROM auth_sessions s JOIN accounts a ON a.id=s.account_id JOIN local_credentials c ON c.account_id=a.id WHERE s.token_hash=? AND s.expires_at>? AND a.status='active'").bind(sha256(token), Date.now()).first<AccountRow>();
  return row ? { id: row.id, email: row.email, displayName: row.display_name } : null;
}

export async function revokeAuthSession(token: string | undefined): Promise<void> {
  if (token) await database().prepare("DELETE FROM auth_sessions WHERE token_hash=?").bind(sha256(token)).run();
}

/** Durable attempt limits survive restarts and apply across app workers. */
export async function authAttemptAllowed(email: string, now = Date.now()): Promise<boolean> {
  const db = database();
  await db.prepare("DELETE FROM auth_attempts WHERE window_started_at<?").bind(now - 15 * 60 * 1000).run();
  for (const [key, limit] of [["all", 120], [sha256(email.trim().toLowerCase()), 8]] as const) {
    const row = await db.prepare("INSERT INTO auth_attempts(key,attempts,window_started_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 WHERE attempts<? RETURNING attempts").bind(key, now, limit).first();
    if (!row) return false;
  }
  return true;
}

export function safeReturnTo(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x20]/.test(value)) return fallback;
  const url = new URL(value, "http://museion.local");
  if (["/login", "/signup", "/judge"].some((path) => url.pathname === path || url.pathname.startsWith(path + "/")) || url.pathname.startsWith("/api/")) return fallback;
  return url.pathname + url.search + url.hash;
}

export function authCookieOptions() {
  return { httpOnly: true, secure: process.env.MUSEION_COOKIE_SECURE === "1" || (process.env.NODE_ENV === "production" && process.env.MUSEION_COOKIE_SECURE !== "0"), sameSite: "lax" as const, path: "/", maxAge: AUTH_SESSION_TTL_MS / 1000 };
}
