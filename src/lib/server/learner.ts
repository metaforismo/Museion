/**
 * Anonymous learner identity (server-only).
 *
 * A long-lived httpOnly cookie identifies the learner so mastery,
 * completions and practice runs persist across sessions without an
 * account. Accounts (v0.3) will upgrade this id, not replace the model.
 */

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const LEARNER_COOKIE = "museion_learner";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Read the learner id from the request cookies, if present. */
export async function readLearnerId(): Promise<string | null> {
  const store = await cookies();
  return store.get(LEARNER_COOKIE)?.value ?? null;
}

/** Read the learner id or mint a new one (caller must set the cookie). */
export async function resolveLearnerId(): Promise<{
  learnerId: string;
  isNew: boolean;
}> {
  const existing = await readLearnerId();
  if (existing) return { learnerId: existing, isNew: false };
  return { learnerId: crypto.randomUUID(), isNew: true };
}

export function setLearnerCookie(
  response: NextResponse,
  learnerId: string,
): void {
  response.cookies.set(LEARNER_COOKIE, learnerId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
}
