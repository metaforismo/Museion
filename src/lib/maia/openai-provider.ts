import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import type { TutorProvider, TutorProviderResult, TutorTurnInput } from "./contracts";
import { TutorTurnSchema } from "./contracts";
import { buildTutorInstructions } from "./prompt";

export const DEFAULT_OPENAI_MODEL = "gpt-5.6";
const MAX_OUTPUT_TOKENS = 1_024;
const REQUEST_TIMEOUT_MS = 25_000;

let client: OpenAI | null = null;

function getClient(): OpenAI {
  client ??= new OpenAI({ maxRetries: 1, timeout: REQUEST_TIMEOUT_MS });
  return client;
}

export class OpenAITutorProvider implements TutorProvider {
  readonly id = "openai";

  available(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async generate(
    input: TutorTurnInput,
    options: { signal?: AbortSignal; repairIssues?: string[] } = {},
  ): Promise<TutorProviderResult> {
    const requestedModel = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
    const response = await getClient().responses.parse(
      {
        model: requestedModel,
        store: false,
        reasoning: { effort: "medium" },
        max_output_tokens: MAX_OUTPUT_TOKENS,
        instructions: buildTutorInstructions(
          input.snapshot,
          input.allowedUiTargetIds,
          options.repairIssues,
          input.liveActivity,
        ),
        input: [
          ...input.history.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          { role: "user" as const, content: input.learnerMessage },
        ],
        text: {
          format: zodTextFormat(TutorTurnSchema, "museion_tutor_turn"),
        },
      },
      { signal: options.signal },
    );

    if (!response.output_parsed) {
      throw new Error("OpenAI returned no parsed tutor turn");
    }

    return {
      turn: TutorTurnSchema.parse(response.output_parsed),
      requestedModel,
      resolvedModel: response.model,
      responseId: response.id,
      usage: {
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        cachedInputTokens: response.usage?.input_tokens_details.cached_tokens ?? 0,
      },
    };
  }
}
