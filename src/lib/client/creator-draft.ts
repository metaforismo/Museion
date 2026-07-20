import type { CourseTemplateId } from "@/lib/compiler/templates";
import type { SourcePackMaterialRole, SourceRightsBasis } from "@/lib/source/source-pack";

const MAX_NORMALIZED_CHARACTERS = 140_000;
const MAX_SOURCE_BYTES = 4 * 1024 * 1024;

export type CreatorMaterialDraft = {
  id: string;
  title: string;
  origin: "text" | "file";
  content: string;
  mediaType: "text/plain" | "text/markdown";
  role: SourcePackMaterialRole;
  sourceUrl: string;
  sourceKind: "webpage" | "youtube_video" | "youtube_playlist" | "book";
  fileName?: string;
  fileSize?: number;
  needsReattach?: boolean;
};

export type CreatorDraft = {
  version?: 2 | 3 | 4;
  title: string;
  text: string;
  mediaType: "text/plain" | "text/markdown";
  sourceMode?: "paste" | "files" | "reference";
  sourceUrl?: string;
  sourceKind?: "webpage" | "youtube_video" | "youtube_playlist" | "book";
  rightsBasis?: SourceRightsBasis;
  materials?: CreatorMaterialDraft[];
  templateId: CourseTemplateId;
  learnerGoal: string;
  level: "novice" | "intermediate" | "advanced";
  language: string;
  targetMinutes: number;
  savedAt?: string;
};

const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === "string" && allowed.includes(value as T);

function parseMaterial(value: unknown): CreatorMaterialDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (typeof input.id !== "string" || !/^draft_[a-z0-9-]{1,64}$/.test(input.id)) return null;
  if (typeof input.title !== "string" || input.title.length > 200) return null;
  if (!oneOf(input.origin, ["text", "file"] as const)) return null;
  if (typeof input.content !== "string" || input.content.length > MAX_NORMALIZED_CHARACTERS) return null;
  if (input.origin === "file" && input.content.length > 0) return null;
  if (!oneOf(input.mediaType, ["text/plain", "text/markdown"] as const)) return null;
  if (!oneOf(input.role, ["primary-source", "transcript", "excerpt", "notes"] as const)) return null;
  if (typeof input.sourceUrl !== "string" || input.sourceUrl.length > 2_048) return null;
  if (!oneOf(input.sourceKind, ["webpage", "youtube_video", "youtube_playlist", "book"] as const)) return null;
  if (input.fileName !== undefined && (typeof input.fileName !== "string" || input.fileName.length > 255)) return null;
  if (input.fileSize !== undefined && (!Number.isInteger(input.fileSize) || (input.fileSize as number) < 0 || (input.fileSize as number) > MAX_SOURCE_BYTES)) return null;
  if (input.needsReattach !== undefined && typeof input.needsReattach !== "boolean") return null;
  return {
    id: input.id,
    title: input.title,
    origin: input.origin,
    content: input.content,
    mediaType: input.mediaType,
    role: input.role,
    sourceUrl: input.sourceUrl,
    sourceKind: input.sourceKind,
    ...(input.fileName === undefined ? {} : { fileName: input.fileName as string }),
    ...(input.fileSize === undefined ? {} : { fileSize: input.fileSize as number }),
    ...(input.needsReattach === undefined ? {} : { needsReattach: input.needsReattach as boolean }),
  };
}

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
    if (input.rightsBasis !== undefined && !oneOf(input.rightsBasis, ["creator-owned", "licensed", "open-licensed", "public-domain", "authorized-excerpt", "personal-notes"] as const)) return null;
    if (!oneOf(input.templateId, ["socratic-foundations", "exam-practice", "teach-it-back"] as const)) return null;
    if (typeof input.learnerGoal !== "string" || input.learnerGoal.length > 600) return null;
    if (!oneOf(input.level, ["novice", "intermediate", "advanced"] as const)) return null;
    if (typeof input.language !== "string" || input.language.length > 35) return null;
    if (!Number.isInteger(input.targetMinutes) || (input.targetMinutes as number) < 3 || (input.targetMinutes as number) > 60) return null;
    if (input.version !== undefined && input.version !== 2 && input.version !== 3 && input.version !== 4) return null;
    if (input.savedAt !== undefined && (typeof input.savedAt !== "string" || !Number.isFinite(Date.parse(input.savedAt)))) return null;
    let materials: CreatorMaterialDraft[] | undefined;
    if (input.materials !== undefined) {
      if (!Array.isArray(input.materials) || input.materials.length < 1 || input.materials.length > 8) return null;
      materials = input.materials.map(parseMaterial).filter((material): material is CreatorMaterialDraft => material !== null);
      if (materials.length !== input.materials.length) return null;
      if (new Set(materials.map((material) => material.id)).size !== materials.length) return null;
      if (materials.reduce((total, material) => total + material.content.length, 0) > MAX_NORMALIZED_CHARACTERS) return null;
    }
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
      ...(input.rightsBasis === undefined ? {} : { rightsBasis: input.rightsBasis }),
      ...(materials === undefined ? {} : { materials }),
      ...(input.savedAt === undefined ? {} : { savedAt: input.savedAt as string }),
    };
  } catch {
    return null;
  }
}

export function serializeCreatorDraft(draft: Omit<CreatorDraft, "version" | "savedAt">): string {
  const materials = draft.materials?.map((material) => material.origin === "file"
    ? { ...material, content: "", needsReattach: true }
    : material);
  return JSON.stringify({ ...draft, ...(materials ? { materials } : {}), version: 4, savedAt: new Date().toISOString() });
}
