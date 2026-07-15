import { z } from "zod";

import { EvidenceObservationSchema } from "@/lib/evidence";
import { PublicCourseArtifactV2Schema } from "@/lib/compiler";
import { RuntimeActionSchema, RuntimeStateSchema } from "@/lib/runtime";

export const JudgeCreateRequestSchema = z.object({
  clientRunId: z.string().regex(/^[a-zA-Z0-9_-]{1,120}$/),
}).strict();

export const JudgeActionRequestSchema = z.object({
  blockId: z.string().regex(/^[a-z][a-z0-9_-]{0,159}$/),
  action: RuntimeActionSchema,
}).strict();

export const JudgeTransferRequestSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("start") }).strict(),
  z.object({
    kind: z.literal("submit"),
    attemptId: z.string().regex(/^[a-zA-Z0-9_-]{1,120}$/),
    answer: z.string().min(1).max(500),
  }).strict(),
]);

export const JudgeSessionViewSchema = z.object({
  schemaVersion: z.literal("1.0"),
  sessionId: z.string().uuid(),
  mode: z.literal("verified-replay"),
  artifact: PublicCourseArtifactV2Schema,
  blockStates: z.record(z.string(), RuntimeStateSchema),
  completedBlockIds: z.array(z.string()),
  transfer: z.object({
    status: z.enum(["locked", "active", "scored"]),
    correct: z.boolean().nullable(),
    observation: EvidenceObservationSchema.nullable(),
  }).strict(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

export type JudgeSessionView = z.infer<typeof JudgeSessionViewSchema>;
