import { z } from "zod";

import { CourseTemplateIdSchema } from "@/lib/compiler/templates";
import { MAX_NORMALIZED_CHARACTERS } from "@/lib/source";

const CreatorDraftSchema = z.object({
  version: z.union([z.literal(2), z.literal(3)]).optional(),
  title: z.string().max(200),
  text: z.string().max(MAX_NORMALIZED_CHARACTERS),
  mediaType: z.enum(["text/plain", "text/markdown"]),
  sourceMode: z.enum(["paste", "files", "reference"]).optional(),
  sourceUrl: z.string().max(2_048).optional(),
  sourceKind: z.enum(["webpage", "youtube_video", "youtube_playlist", "book"]).optional(),
  templateId: CourseTemplateIdSchema,
  learnerGoal: z.string().max(600),
  level: z.enum(["novice", "intermediate", "advanced"]),
  language: z.string().max(35),
  targetMinutes: z.number().int().min(3).max(60),
  savedAt: z.string().datetime().optional(),
}).strip();

export type CreatorDraft = z.infer<typeof CreatorDraftSchema>;

export function parseCreatorDraft(value: string | null): CreatorDraft | null {
  if (!value) return null;
  try {
    const parsed = CreatorDraftSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function serializeCreatorDraft(draft: Omit<CreatorDraft, "version" | "savedAt">): string {
  return JSON.stringify({ ...draft, version: 3, savedAt: new Date().toISOString() });
}
