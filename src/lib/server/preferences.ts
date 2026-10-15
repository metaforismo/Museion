import { currentActor } from "./actor";
import { savedLearningPreferences, type SavedLearningPreferences } from "./learner-settings";

/**
 * Account-owned onboarding preferences are saved in the durable database.
 * Optional by design: lessons also work without personalization.
 */

export type LearnerPreferences = SavedLearningPreferences;

const GOAL_LABELS: Record<LearnerPreferences["goal"], string> = {
  "build-foundations": "building durable foundations",
  "prepare-exam": "preparing for an exam",
  "teach-it-back": "understanding it well enough to teach it",
};

export async function readLearnerPreferences(): Promise<(Omit<LearnerPreferences, "goal"> & { goal: string }) | null> {
  const actor = await currentActor();
  if (actor.kind !== "account") return null;
  const preferences = await savedLearningPreferences(actor.ownerId);
  return preferences ? { ...preferences, goal: GOAL_LABELS[preferences.goal] } : null;
}
