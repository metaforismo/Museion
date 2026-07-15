import { z } from "zod";

import { CitationSchema } from "@/lib/compiler";

export const TransferEventSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    id: z.string().regex(/^evt_[a-f0-9]{24}$/),
    sequence: z.number().int().positive(),
    type: z.enum(["transfer_started", "answer_submitted", "transfer_scored"]),
    artifactId: z.string().min(1).max(160),
    artifactSha256: z.string().regex(/^[a-f0-9]{64}$/),
    blockId: z.string().min(1).max(160),
    attemptId: z.string().min(1).max(120).nullable(),
    answerSha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
    correct: z.boolean().nullable(),
    assistance: z.object({ maiaTurns: z.literal(0), hints: z.literal(0), solutions: z.literal(0) }).strict(),
    recordedAt: z.string().datetime(),
  })
  .strict();
export type TransferEvent = z.infer<typeof TransferEventSchema>;

export const TransferStateSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    artifactId: z.string().min(1).max(160),
    artifactSha256: z.string().regex(/^[a-f0-9]{64}$/),
    blockId: z.string().min(1).max(160),
    locked: z.literal(true),
    status: z.enum(["active", "scored"]),
    correct: z.boolean().nullable(),
    processedAttemptIds: z.array(z.string().min(1).max(120)).max(1),
    events: z.array(TransferEventSchema).min(1).max(3),
  })
  .strict();
export type TransferState = z.infer<typeof TransferStateSchema>;

export const EvidenceObservationSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    id: z.string().regex(/^obs_[a-f0-9]{24}$/),
    kind: z.literal("immediate_near_transfer"),
    statement: z.string().min(1).max(500),
    correct: z.boolean(),
    assistance: z.object({ maiaTurns: z.literal(0), hints: z.literal(0), solutions: z.literal(0) }).strict(),
    eventIds: z.array(z.string().regex(/^evt_[a-f0-9]{24}$/)).min(2).max(3),
    citations: z.array(CitationSchema).min(1).max(12),
    limitations: z.array(z.string().min(1).max(300)).min(1).max(8),
  })
  .strict();
export type EvidenceObservation = z.infer<typeof EvidenceObservationSchema>;
