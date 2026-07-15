import { compilerModelForStage, familyFallbacks, type Gpt56Model } from "@/lib/ai/model-routing";
import { modelUnavailable, runCodexStructured } from "@/lib/ai/codex-runtime";

import type { CompilerProvider, CompilerStage, ProviderStageResult } from "../contracts";
import {
  buildCompilerInstructions,
  compilerStageSchema,
  parseCompilerStageOutput,
} from "./openai";

function stagePrompt(stage: CompilerStage, input: unknown): string {
  return [
    buildCompilerInstructions(stage),
    "Do not use tools, inspect files, execute commands, or modify the environment.",
    "Your entire final response must match the supplied JSON Schema.",
    `COMPILER_INPUT_JSON\n${JSON.stringify(input)}\nEND_COMPILER_INPUT_JSON`,
  ].join("\n\n");
}

export class CodexCompilerProvider implements CompilerProvider {
  readonly id = "openai-codex-subscription-compiler-v1";
  readonly mode = "live" as const;

  constructor(private readonly allowFamilyFallback = true) {}

  async run(stage: CompilerStage, input: unknown, signal: AbortSignal): Promise<ProviderStageResult> {
    const requestedModel = compilerModelForStage(stage);
    const candidates: readonly Gpt56Model[] = this.allowFamilyFallback
      ? [requestedModel, ...familyFallbacks(requestedModel)]
      : [requestedModel];
    let lastError: unknown;
    for (const model of candidates) {
      try {
        const result = await runCodexStructured({
          model,
          schema: compilerStageSchema(stage),
          schemaName: `museion_${stage}`,
          prompt: stagePrompt(stage, input),
          signal,
          timeoutMs: stage === "course_artifact" ? 180_000 : 120_000,
        });
        return {
          output: await parseCompilerStageOutput(stage, result.output, input),
          requestedModel,
          resolvedModel: result.resolvedModel,
          usage: null,
        };
      } catch (error) {
        lastError = error;
        if (!modelUnavailable(error)) throw error;
      }
    }
    throw lastError;
  }
}

