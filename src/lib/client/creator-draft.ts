import type { CourseTemplateId } from "@/lib/compiler/templates";

const MAX_NORMALIZED_CHARACTERS = 140_000;

export type CreatorDraft = {
  version?: 2 | 3;
  title: string;
  text: string;
  mediaType: "text/plain" | "text/markdown";
  sourceMode?: "paste" | "files" | "reference";
  sourceUrl?: string;
  sourceKind?: "webpage" | "youtube_video" | "youtube_playlist" | "book";
  templateId: CourseTemplateId;
  learnerGoal: string;
  level: "novice" | "intermediate" | "advanced";
  language: string;
  targetMinutes: number;
  savedAt?: string;
};

const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === "string" && allowed.includes(value as T);

export function parseCreatorDraft(value: string | null): CreatorDraft | null {
  if (!value) return null;
  try {
    const draft: unknown = JSON.parse(value);
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) return null;
    const input = draft as Record<string, unknown>;
    if (typeof input.title !== "string" || input.title.length > 200) return null;
    if (typeof input.text !== "string" || input.text.length > MAX_NORMALIZED_CHARACTERS) return null;
    if (!oneOf(input.mediaType, ["text/plain", "text/markdown"] as const)) return null;
    if (input.sourceMode !== undefined && !oneOf(input.sourceMode, ["paste", "files", "reference"] as const)) return null;
    if (input.sourceUrl !== undefined && (typeof input.sourceUrl !== "string" || input.sourceUrl.length > 2_048)) return null;
    if (input.sourceKind !== undefined && !oneOf(input.sourceKind, ["webpage", "youtube_video", "youtube_playlist", "book"] as const)) return null;
    if (!oneOf(input.templateId, ["socratic-foundations", "exam-practice", "teach-it-back"] as const)) return null;
    if (typeof input.learnerGoal !== "string" || input.learnerGoal.length > 600) return null;
    if (!oneOf(input.level, ["novice", "intermediate", "advanced"] as const)) return null;
    if (typeof input.language !== "string" || input.language.length > 35) return null;
    if (!Number.isInteger(input.targetMinutes) || (input.targetMinutes as number) < 3 || (input.targetMinutes as number) > 60) return null;
    if (input.version !== undefined && input.version !== 2 && input.version !== 3) return null;
    if (input.savedAt !== undefined && (typeof input.savedAt !== "string" || !Number.isFinite(Date.parse(input.savedAt)))) return null;
    return {
      title: input.title,
      text: input.text,
      mediaType: input.mediaType,
      templateId: input.templateId,
      learnerGoal: input.learnerGoal,
      level: input.level,
      language: input.language,
      targetMinutes: input.targetMinutes as number,
      ...(input.version === undefined ? {} : { version: input.version }),
      ...(input.sourceMode === undefined ? {} : { sourceMode: input.sourceMode }),
      ...(input.sourceUrl === undefined ? {} : { sourceUrl: input.sourceUrl as string }),
      ...(input.sourceKind === undefined ? {} : { sourceKind: input.sourceKind }),
      ...(input.savedAt === undefined ? {} : { savedAt: input.savedAt as string }),
    };
  } catch {
    return null;
  }
}

export function serializeCreatorDraft(draft: Omit<CreatorDraft, "version" | "savedAt">): string {
  return JSON.stringify({ ...draft, version: 3, savedAt: new Date().toISOString() });
}
