import { z } from "zod";

export const RuntimeActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("prediction_select"), optionIndex: z.number().int().nonnegative() }).strict(),
  z.object({ kind: z.literal("sequence_submit"), order: z.array(z.string().min(1)).min(1).max(20) }).strict(),
  z.object({ kind: z.literal("range_update"), low: z.number().int().nonnegative(), high: z.number().int().nonnegative() }).strict(),
  z.object({ kind: z.literal("range_confirm_found"), index: z.number().int().nonnegative() }).strict(),
  z.object({ kind: z.literal("trace_submit"), low: z.number().int().nonnegative(), high: z.number().int().nonnegative(), mid: z.number().int().nonnegative() }).strict(),
]);
export type RuntimeAction = z.infer<typeof RuntimeActionSchema>;

export const RuntimeStateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("prediction-choice"), selectedIndex: z.number().int().nonnegative().nullable(), complete: z.boolean(), correct: z.boolean().nullable() }).strict(),
  z.object({ kind: z.literal("sequence-builder"), submittedOrder: z.array(z.string().min(1)), complete: z.boolean(), correct: z.boolean().nullable() }).strict(),
  z.object({ kind: z.literal("range-explorer"), low: z.number().int().nonnegative(), high: z.number().int().nonnegative(), mid: z.number().int().nonnegative().nullable(), step: z.number().int().nonnegative(), status: z.enum(["active", "found", "absent"]) }).strict(),
  z.object({ kind: z.literal("state-trace"), cursor: z.number().int().nonnegative(), complete: z.boolean(), attempts: z.number().int().nonnegative() }).strict(),
]);
export type RuntimeState = z.infer<typeof RuntimeStateSchema>;

export interface RuntimeOutcome {
  state: RuntimeState;
  accepted: boolean;
  correct: boolean;
  misconceptionId: string | null;
  message: string;
}

export interface RuntimeReplayEvent {
  schemaVersion: "1.0";
  sequence: number;
  action: RuntimeAction;
  stateSha256: string;
  accepted: boolean;
  correct: boolean;
  misconceptionId: string | null;
}
