import type { LearnerSession } from "../engine/session";
import { currentActor } from "./actor";
import { ownedSession } from "./session-repository";

/** Return a session only when the anonymous learner cookie owns it. */
export async function getOwnedSession(
  sessionId: string,
): Promise<LearnerSession | undefined> {
  const actor = await currentActor();
  return ownedSession(sessionId, actor.ownerId);
}
