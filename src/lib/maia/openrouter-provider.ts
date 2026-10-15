import { z } from "zod";
import type { TutorProvider, TutorProviderResult, TutorTurnInput } from "./contracts";
import { TutorTurnSchema } from "./contracts";
import { boundedTutorInput } from "./context";
import { buildTutorInstructions } from "./prompt";
import { TutorProviderError } from "./provider-error";
import { openRouterConfigured, requestFreeStructuredCompletion } from "@/lib/ai/openrouter-free";
export { OPENROUTER_FREE_MODEL, OPENROUTER_TIMEOUT_MS, openRouterConfigured } from "@/lib/ai/openrouter-free";

/** Shared free-only transport: no retries, paid fallback, tools or reasoning. */
export class OpenRouterTutorProvider implements TutorProvider {
  readonly id = "openrouter-free";
  constructor(private readonly request: typeof fetch = fetch) {}
  available(): boolean { return openRouterConfigured(); }
  async generate(input: TutorTurnInput, options: { signal?: AbortSignal; repairIssues?: string[] } = {}): Promise<TutorProviderResult> {
    const context = boundedTutorInput(input);
    const result = await requestFreeStructuredCompletion({
      request: this.request, signal: options.signal, maxTokens: 1024, maxResponseBytes: 32768,
      schemaName: "museion_tutor_turn", schema: z.toJSONSchema(TutorTurnSchema),
      messages: [
        { role: "system", content: buildTutorInstructions(context.snapshot, context.allowedUiTargetIds, options.repairIssues, context.liveActivity) },
        ...context.history, { role: "user", content: context.learnerMessage },
      ],
    });
    const parsed = TutorTurnSchema.safeParse(result.output);
    if (!parsed.success) throw new TutorProviderError("provider_invalid_response");
    return { turn: parsed.data, requestedModel: result.requestedModel, resolvedModel: result.resolvedModel, responseId: result.responseId, usage: result.usage };
  }
}
