import { describe, expect, it } from "vitest";
import { OpenRouterCompilerProvider } from "@/lib/compiler/providers/openrouter";
import { compileCourse, CompilerFailure } from "@/lib/compiler/orchestrator";
import { ingestTextSource } from "@/lib/source";
import { tutorProviderErrorDiagnostic } from "@/lib/maia/provider-error";

const LIVE = process.env.MUSEION_RUN_OPENROUTER_COMPILER_LIVE === "1";

/** Explicit opt-in sends only freshly authored synthetic notes. Logging is
 * fixed classifications and provenance; no prompts, candidates or errors. */
describe.skipIf(!LIVE)("synthetic free-router compiler live acceptance", () => {
  it("attempts every stage and reports actual accepted compilation separately from unavailable/rejected output", { timeout: 140_000 }, async () => {
    const diagnostics: { httpStatus: number; category: string; finishReason?: string; contentCharacters?: number }[] = [];
    const request: typeof fetch = async (url, options) => {
      const response = await fetch(url, options);
      const payload = await response.clone().json().catch(() => null);
      const diagnostic: typeof diagnostics[number] = { httpStatus: response.status, category: "response" };
      if (!response.ok) {
        // Do not retain the provider body: classify transient local data only.
        const message = typeof payload?.error?.message === "string" ? payload.error.message : "";
        diagnostic.category = /schema|structured|response_format|additionalProperties|oneOf|anyOf/i.test(message) ? "schema_compatibility" : /no.*provider|endpoint|routing/i.test(message) ? "compatible_provider_unavailable" : /rate|quota|limit/i.test(message) ? "provider_rate_or_context_limit" : /auth|key/i.test(message) ? "provider_authentication" : "provider_request_rejected";
      } else {
        const reason = payload?.choices?.[0]?.finish_reason;
        diagnostic.finishReason = ["stop", "length", "tool_calls", "content_filter", "error"].includes(reason) ? reason : "other";
        diagnostic.contentCharacters = typeof payload?.choices?.[0]?.message?.content === "string" ? payload.choices[0].message.content.length : 0;
      }
      diagnostics.push(diagnostic);
      return response;
    };
    const provider = new OpenRouterCompilerProvider(request);
    expect(provider.available()).toBe(true);
    const document = await ingestTextSource({ title: "Synthetic classroom notes", text: "A triangle has three straight sides. A square has four straight sides. Separate shapes do not share sides. Counting all the sides of two separate triangles means adding three and three.", mediaType: "text/plain" });
    let accepted = false;
    try {
      const result = await compileCourse(document, provider, { audience: { level: "novice", language: "en", targetMinutes: 5, learnerGoal: "Use side counts to compare simple shapes." }, timeoutMs: 130000 });
      accepted = result.artifact.validation.status === "accepted";
      console.info("Free compiler live QA", JSON.stringify({ accepted, mode: result.mode, stages: result.telemetry.map(({ stage, requestedModel, resolvedModel }) => ({ stage, requestedModel, resolvedModel })), diagnostics }));
    } catch (error) {
      console.info("Free compiler live QA", JSON.stringify({ accepted: false, stage: error instanceof CompilerFailure ? error.stage : null, provider: error instanceof CompilerFailure ? error.providerDiagnostic ?? null : tutorProviderErrorDiagnostic(error), issueCodes: error instanceof CompilerFailure ? error.issues.map((item) => item.code) : [], diagnostics }));
    }
    expect(accepted, "Free compiler must return a genuinely accepted live course; safe rejection alone does not establish availability").toBe(true);
  });
});
