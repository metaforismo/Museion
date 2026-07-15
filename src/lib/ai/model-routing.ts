import { z } from "zod";

import type { CompilerStage } from "@/lib/compiler/contracts";

export const GPT56_MODELS = {
  luna: "gpt-5.6-luna",
  terra: "gpt-5.6-terra",
  sol: "gpt-5.6-sol",
} as const;

export const Gpt56ModelSchema = z.enum([
  GPT56_MODELS.luna,
  GPT56_MODELS.terra,
  GPT56_MODELS.sol,
]);
export type Gpt56Model = z.infer<typeof Gpt56ModelSchema>;

export const ModelRoutingPolicySchema = z.enum(["balanced"]);
export type ModelRoutingPolicy = z.infer<typeof ModelRoutingPolicySchema>;

export const BALANCED_COMPILER_ROUTING: Readonly<Record<CompilerStage, Gpt56Model>> = {
  source_graph: GPT56_MODELS.luna,
  blueprint: GPT56_MODELS.terra,
  course_artifact: GPT56_MODELS.terra,
  critic: GPT56_MODELS.sol,
  repair: GPT56_MODELS.sol,
};

export const BALANCED_TUTOR_MODEL = GPT56_MODELS.terra;

export function compilerModelForStage(
  stage: CompilerStage,
  policy: ModelRoutingPolicy = "balanced",
): Gpt56Model {
  ModelRoutingPolicySchema.parse(policy);
  return BALANCED_COMPILER_ROUTING[stage];
}

export function familyFallbacks(model: Gpt56Model): readonly Gpt56Model[] {
  if (model === GPT56_MODELS.luna) return [GPT56_MODELS.terra, GPT56_MODELS.sol];
  if (model === GPT56_MODELS.terra) return [GPT56_MODELS.sol];
  return [];
}

export function isGpt56Model(model: string): model is Gpt56Model {
  return Gpt56ModelSchema.safeParse(model).success;
}

