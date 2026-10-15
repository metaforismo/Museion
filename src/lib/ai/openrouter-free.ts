import { z } from "zod";
import { runtimeValue } from "@/lib/sites/runtime";
import { TutorProviderError } from "@/lib/maia/provider-error";

export const OPENROUTER_FREE_MODEL = "openrouter/free";
export const OPENROUTER_TIMEOUT_MS = 20_000;
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export function openRouterConfigured(): boolean {
  return runtimeValue("MUSEION_LIVE_AI_ENABLED") === "1" && Boolean(runtimeValue("OPENROUTER_API_KEY"));
}

// Parse only the public completion. Reasoning and provider diagnostics are
// intentionally absent from this schema and cannot enter telemetry or delivery.
const ResponseSchema = z.object({
  id: z.string().min(1).max(200),
  model: z.string().min(1).max(200).regex(/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._:+-]+$/).refine((model) => model !== OPENROUTER_FREE_MODEL, "Missing resolved model"),
  choices: z.array(z.object({
    finish_reason: z.literal("stop"),
    message: z.object({ content: z.string().min(1).max(200_000) }),
  })).min(1).max(1),
  usage: z.object({
    prompt_tokens: z.number().int().nonnegative().optional(),
    completion_tokens: z.number().int().nonnegative().optional(),
    prompt_tokens_details: z.object({ cached_tokens: z.number().int().nonnegative().optional() }).optional(),
  }).optional(),
});

async function readBoundedResponse(response: Response, maxResponseBytes: number): Promise<unknown> {
  if (!response.body) throw new TutorProviderError("provider_invalid_response");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxResponseBytes) throw new TutorProviderError("provider_response_too_large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function requestFreeStructuredCompletion(options: {
  messages: { role: string; content: string }[];
  schema: unknown;
  schemaName: string;
  maxTokens: number;
  maxResponseBytes: number;
  maxInputCharacters?: number;
  signal?: AbortSignal;
  request?: typeof fetch;
}) {
  if (!openRouterConfigured()) throw new TutorProviderError("provider_not_configured");
  if (options.maxInputCharacters !== undefined && JSON.stringify(options.messages).length > options.maxInputCharacters) throw new TutorProviderError("provider_context_limit");
  const timeout = AbortSignal.timeout(OPENROUTER_TIMEOUT_MS);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  const response = await (options.request ?? fetch)(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${runtimeValue("OPENROUTER_API_KEY")}`, "Content-Type": "application/json", "X-OpenRouter-Title": "Museion" },
    signal, redirect: "error",
    body: JSON.stringify({
      model: OPENROUTER_FREE_MODEL, stream: false, max_tokens: options.maxTokens,
      reasoning: { exclude: true },
      provider: { require_parameters: true, data_collection: "deny", allow_fallbacks: false, max_price: { prompt: 0, completion: 0, request: 0 } },
      messages: options.messages,
      response_format: { type: "json_schema", json_schema: { name: options.schemaName, strict: true, schema: options.schema } },
    }),
  });
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new TutorProviderError("provider_http_error", response.status);
  }
  try {
    const parsed = ResponseSchema.parse(await readBoundedResponse(response, options.maxResponseBytes));
    return {
      output: JSON.parse(parsed.choices[0].message.content) as unknown,
      requestedModel: OPENROUTER_FREE_MODEL, resolvedModel: parsed.model, responseId: parsed.id,
      usage: { inputTokens: parsed.usage?.prompt_tokens ?? 0, outputTokens: parsed.usage?.completion_tokens ?? 0, cachedInputTokens: parsed.usage?.prompt_tokens_details?.cached_tokens ?? 0 },
    };
  } catch (error) {
    if (signal.aborted) signal.throwIfAborted();
    if (error instanceof TutorProviderError) throw error;
    throw new TutorProviderError("provider_invalid_response");
  }
}
