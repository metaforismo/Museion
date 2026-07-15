import { z } from "zod";

import {
  AnswerSpecSchema,
  ArtifactIdSchema,
  ArtifactMisconceptionSchema,
  LearningBlockSchema,
} from "./schemas/course-artifact";

export const CompilerStageSchema = z.enum([
  "source_graph",
  "blueprint",
  "course_artifact",
  "critic",
  "repair",
]);
export type CompilerStage = z.infer<typeof CompilerStageSchema>;

export const CompilerIssueSchema = z
  .object({
    code: z.string().min(1).max(120),
    path: z.string().min(1).max(500),
    message: z.string().min(1).max(1_000),
    severity: z.enum(["blocking", "warning"]),
  })
  .strict();
export type CompilerIssue = z.infer<typeof CompilerIssueSchema>;

export const CriticReportSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    accepted: z.boolean(),
    issues: z.array(CompilerIssueSchema).max(100),
  })
  .strict();

export const ArtifactPatchSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    operations: z
      .array(
        z.discriminatedUnion("kind", [
          z.object({ kind: z.literal("replace_block"), id: ArtifactIdSchema, value: LearningBlockSchema }).strict(),
          z.object({ kind: z.literal("replace_answer_spec"), id: ArtifactIdSchema, value: AnswerSpecSchema }).strict(),
          z.object({ kind: z.literal("replace_misconception"), id: ArtifactIdSchema, value: ArtifactMisconceptionSchema }).strict(),
        ]),
      )
      .min(1)
      .max(20),
  })
  .strict();
export type ArtifactPatch = z.infer<typeof ArtifactPatchSchema>;

export interface ProviderStageResult {
  output: unknown;
  requestedModel: string;
  resolvedModel: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
  } | null;
}

export interface CompilerProvider {
  readonly id: string;
  readonly mode: "live" | "replay";
  run(stage: CompilerStage, input: unknown, signal: AbortSignal): Promise<ProviderStageResult>;
}

export interface CompilerStageTelemetry {
  stage: CompilerStage | "critic_after_repair";
  provider: string;
  requestedModel: string;
  resolvedModel: string;
  inputSha256: string;
  outputSha256: string;
  durationMs: number;
  usage: ProviderStageResult["usage"];
}
