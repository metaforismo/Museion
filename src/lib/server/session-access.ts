import type { LearnerSession } from "../engine/session";
import { getSessionForLearner } from "../store";
import { readLearnerId } from "./learner";

/** Return a session only when the anonymous learner cookie owns it. */
export async function getOwnedSession(
  sessionId: string,
): Promise<LearnerSession | undefined> {
  const learnerId = await readLearnerId();
  if (!learnerId) return undefined;
  return getSessionForLearner(sessionId, learnerId);
}
