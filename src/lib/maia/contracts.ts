import { z } from "zod";

export const pedagogicalMoves = [
  "ask-probing-question",
  "give-conceptual-hint",
  "give-procedural-hint",
  "address-misconception",
  "request-self-explanation",
  "decline-answer-request",
] as const;

export const uiActionKinds = ["highlight", "focus", "pulse", "annotate"] as const;

export const TutorUiActionSchema = z
  .object({
    kind: z.enum(uiActionKinds),
    targetId: z.string().min(1).max(120),
    text: z.string().max(240).nullable(),
  })
  .strict();
export type TutorUiAction = z.infer<typeof TutorUiActionSchema>;

export const TutorTurnSchema = z
  .object({
    message: z.string().min(1).max(1_200),
    pedagogicalMove: z.enum(pedagogicalMoves),
    uiActions: z.array(TutorUiActionSchema).max(4),
  })
  .strict();

export type TutorTurn = z.infer<typeof TutorTurnSchema>;

export interface TutorTurnInput {
  snapshot: import("../engine/session").SessionSnapshot;
  history: import("../engine/session").ChatMessage[];
  learnerMessage: string;
  allowedUiTargetIds: string[];
}

export interface TutorUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
}

export interface TutorProviderResult {
  turn: TutorTurn;
  requestedModel: string;
  resolvedModel: string;
  responseId: string;
  usage: TutorUsage;
}

export interface TutorProvider {
  readonly id: string;
  available(): boolean;
  generate(
    input: TutorTurnInput,
    options?: { signal?: AbortSignal; repairIssues?: string[] },
  ): Promise<TutorProviderResult>;
}

export interface TutorDelivery {
  turn: TutorTurn;
  source: "openai" | "deterministic";
  repaired: boolean;
}
