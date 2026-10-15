export interface PublicAccountView {
  actor: { kind: "guest" | "account"; displayName: string | null };
}

/** Public navigation must remain usable even if the session endpoint stalls. */
export async function readPublicAccount(signal: AbortSignal): Promise<PublicAccountView> {
  const response = await fetch("/api/auth/session", { cache: "no-store", signal });
  if (!response.ok) throw new Error("Account status unavailable");
  const value: unknown = await response.json();
  if (!value || typeof value !== "object" || !("actor" in value)) throw new Error("Invalid account status");
  const actor = value.actor;
  if (!actor || typeof actor !== "object" || !("kind" in actor) || !("displayName" in actor)
    || (actor.kind !== "guest" && actor.kind !== "account")
    || (actor.displayName !== null && typeof actor.displayName !== "string")) throw new Error("Invalid account status");
  return { actor: { kind: actor.kind, displayName: actor.displayName } };
}
