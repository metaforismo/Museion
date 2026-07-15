import { z } from "zod";

import type { TutorUiAction } from "@/lib/maia/contracts";
import { TutorUiActionSchema } from "@/lib/maia/contracts";

import { RuntimeActionSchema, RuntimeStateSchema, type RuntimeAction, type RuntimeOutcome, type RuntimeState } from "./contracts";
import type { InteractiveBlock } from "./registry";

export const RuntimeTutorSnapshotSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    artifactId: z.string().min(1).max(160),
    blockId: z.string().min(1).max(160),
    blockKind: z.enum(["prediction-choice", "range-explorer", "state-trace", "sequence-builder"]),
    state: RuntimeStateSchema,
    lastAction: RuntimeActionSchema.nullable(),
    lastOutcome: z
      .object({
        accepted: z.boolean(),
        correct: z.boolean(),
        misconceptionId: z.string().min(1).max(160).nullable(),
      })
      .strict()
      .nullable(),
    allowedTargetIds: z.array(z.string().min(1).max(160)).min(1).max(64),
  })
  .strict();
export type RuntimeTutorSnapshot = z.infer<typeof RuntimeTutorSnapshotSchema>;

export function allowedRuntimeTargets(block: InteractiveBlock): string[] {
  const base = [`block:${block.id}`, `prompt:${block.id}`, `status:${block.id}`];
  if (block.kind === "prediction-choice") return [...base, ...block.options.map((_, index) => `option:${block.id}:${index}`)];
  if (block.kind === "sequence-builder") return [...base, ...block.items.map((item) => `item:${block.id}:${item.id}`)];
  if (block.kind === "range-explorer") return [...base, `control:${block.id}:low`, `control:${block.id}:high`, ...block.values.map((_, index) => `value:${block.id}:${index}`)];
  return [...base, `control:${block.id}:low`, `control:${block.id}:high`, `control:${block.id}:mid`];
}

export function buildRuntimeTutorSnapshot(input: {
  artifactId: string;
  block: InteractiveBlock;
  state: RuntimeState;
  lastAction?: RuntimeAction | null;
  lastOutcome?: RuntimeOutcome | null;
}): RuntimeTutorSnapshot {
  return RuntimeTutorSnapshotSchema.parse({
    schemaVersion: "1.0",
    artifactId: input.artifactId,
    blockId: input.block.id,
    blockKind: input.block.kind,
    state: input.state,
    lastAction: input.lastAction ?? null,
    lastOutcome: input.lastOutcome
      ? {
          accepted: input.lastOutcome.accepted,
          correct: input.lastOutcome.correct,
          misconceptionId: input.lastOutcome.misconceptionId,
        }
      : null,
    allowedTargetIds: allowedRuntimeTargets(input.block),
  });
}

export function gateRuntimeTutorActions(
  snapshot: RuntimeTutorSnapshot,
  candidates: unknown[],
): { accepted: TutorUiAction[]; dropped: number } {
  const targets = new Set(snapshot.allowedTargetIds);
  const accepted: TutorUiAction[] = [];
  let dropped = 0;
  for (const candidate of candidates) {
    const parsed = TutorUiActionSchema.safeParse(candidate);
    if (!parsed.success || !targets.has(parsed.data.targetId)) {
      dropped += 1;
      continue;
    }
    accepted.push(parsed.data);
  }
  return { accepted, dropped };
}

export function offByOneCounterexample(
  block: Extract<InteractiveBlock, { kind: "range-explorer" }>,
  state: Extract<RuntimeState, { kind: "range-explorer" }>,
  action: RuntimeAction,
): { before: { low: number; high: number; mid: number }; proposed: { low: number; high: number }; explanation: string } | null {
  if (state.mid === null || action.kind !== "range_update") return null;
  const value = block.values[state.mid];
  const reusesMid = (value < block.target && action.low === state.mid) || (value > block.target && action.high === state.mid);
  if (!reusesMid) return null;
  return {
    before: { low: state.low, high: state.high, mid: state.mid },
    proposed: { low: action.low, high: action.high },
    explanation: `Index ${state.mid} has already been disproved. Reusing it can select the same midpoint again; move the boundary past mid to guarantee progress.`,
  };
}
