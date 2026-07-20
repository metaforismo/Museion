import { cookies } from "next/headers";
import { z } from "zod";

/**
 * Learner preferences captured during onboarding. Stored in a cookie so
 * server components can personalize copy; the same values also live in
 * localStorage for the client tour. Optional by design — everything
 * works without them.
 */

export const PREFERENCES_COOKIE = "museion-preferences";

const PreferencesSchema = z.object({
  schemaVersion: z.literal("1.0"),
  role: z.enum(["student", "educator", "independent"]),
  ageBand: z.enum(["13-15", "16-18", "adult", "prefer-not-to-say"]),
  goal: z.enum(["build-foundations", "prepare-exam", "teach-it-back"]),
});

export type LearnerPreferences = z.infer<typeof PreferencesSchema>;

const GOAL_LABELS: Record<LearnerPreferences["goal"], string> = {
  "build-foundations": "building durable foundations",
  "prepare-exam": "preparing for an exam",
  "teach-it-back": "understanding it well enough to teach it",
};

export async function readLearnerPreferences(): Promise<{ role: LearnerPreferences["role"]; goal: string } | null> {
  const store = await cookies();
  const raw = store.get(PREFERENCES_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = PreferencesSchema.safeParse(JSON.parse(decodeURIComponent(raw)));
    if (!parsed.success) return null;
    return { role: parsed.data.role, goal: GOAL_LABELS[parsed.data.goal] };
  } catch {
    return null;
  }
}
