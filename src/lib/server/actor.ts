import { cookies } from "next/headers";
import { accountForSession, AUTH_COOKIE } from "./auth";

export type Actor =
  | { kind: "guest"; ownerId: string; displayName: null }
  | { kind: "account"; ownerId: string; displayName: string };

/** Identity comes only from a server-issued session, never forwarded headers. */
export async function currentActor(): Promise<Actor> {
  const store = await cookies();
  const account = await accountForSession(store.get(AUTH_COOKIE)?.value);
  return account ? { kind: "account", ownerId: account.id, displayName: account.displayName } : { kind: "guest", ownerId: "unauthenticated", displayName: null };
}

export async function requireAccountActor(): Promise<Extract<Actor, { kind: "account" }>> {
  const actor = await currentActor();
  if (actor.kind !== "account") throw new Error("SIGN_IN_REQUIRED");
  return actor;
}
