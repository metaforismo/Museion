import { TutorProviderError } from "@/lib/maia/provider-error";
import { z } from "zod";
import { openRouterConfigured, requestFreeStructuredCompletion } from "@/lib/ai/openrouter-free";
import type { CompilerProvider, CompilerStage, ProviderStageResult } from "../contracts";
import { buildCompilerInstructions, compilerStageSchema, parseCompilerStageOutput } from "./openai";

/** Explicit free-only compilation uses the same transport as Maia. Each
 * stage must pass the existing schema, source binding and publication gates. */
export class OpenRouterCompilerProvider implements CompilerProvider {
  readonly id = "openrouter-free-compiler-v1";
  readonly mode = "live" as const;
  constructor(private readonly request: typeof fetch = fetch) {}
  available(): boolean { return openRouterConfigured(); }
  async run(stage: CompilerStage, input: unknown, signal: AbortSignal): Promise<ProviderStageResult> {
    const result = await requestFreeStructuredCompletion({
      request: this.request, signal,
      maxTokens: stage === "course_artifact" ? 16000 : stage === "critic" ? 4000 : 10000,
      maxResponseBytes: 262144, maxInputCharacters: 250000,
      schemaName: `museion_compiler_${stage}`, schema: z.toJSONSchema(compilerStageSchema(stage)),
      messages: [
        { role: "system", content: buildCompilerInstructions(stage) },
        { role: "user", content: `COMPILER_INPUT_JSON\n${JSON.stringify(input)}\nEND_COMPILER_INPUT_JSON` },
      ],
    });
    try { return { ...result, output: await parseCompilerStageOutput(stage, result.output, input) }; }
    catch { throw new TutorProviderError("provider_invalid_response"); }
  }
}
