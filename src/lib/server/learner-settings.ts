import { z } from "zod";
import { sitesDatabase } from "@/lib/sites/database";

export const LearningPreferencesSchema = z.object({
  schemaVersion: z.literal("1.0"),
  role: z.enum(["student", "educator", "independent"]),
  ageBand: z.enum(["13-15", "16-18", "adult", "prefer-not-to-say"]),
  goal: z.enum(["build-foundations", "prepare-exam", "teach-it-back"]),
  familiarity: z.enum(["new", "some", "confident"]).optional(),
  dailyMinutes: z.union([z.literal(10), z.literal(20), z.literal(30)]).optional(),
  subject: z.enum(["math", "coding", "science", "reasoning"]).optional(),
  suggestedCourseId: z.string().min(1).max(160).optional(),
}).strict();
export type SavedLearningPreferences = z.infer<typeof LearningPreferencesSchema>;

export async function savedLearningPreferences(ownerId: string): Promise<SavedLearningPreferences | null> {
  const db = sitesDatabase();
  if (!db) return null;
  const row = await db.prepare("SELECT payload FROM museion_state WHERE namespace='learner_profile' AND id=? AND owner_id=?").bind(`preferences:${ownerId}`, ownerId).first<{ payload: string }>();
  if (!row) return null;
  const parsed = LearningPreferencesSchema.safeParse(JSON.parse(row.payload));
  return parsed.success ? parsed.data : null;
}

export async function persistLearningPreferences(ownerId: string, preferences: SavedLearningPreferences): Promise<void> {
  const db = sitesDatabase();
  if (!db) throw new Error("DURABLE_STORAGE_UNAVAILABLE");
  const now = new Date().toISOString();
  await db.prepare("INSERT INTO museion_state(namespace,id,owner_id,payload,expires_at,created_at,updated_at) VALUES('learner_profile',?,?,?,?,?,?) ON CONFLICT(namespace,id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at WHERE museion_state.owner_id=excluded.owner_id").bind(`preferences:${ownerId}`, ownerId, JSON.stringify(preferences), "9999-01-01T00:00:00.000Z", now, now).run();
}
