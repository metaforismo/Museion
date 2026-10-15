import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenRouterCompilerProvider } from "@/lib/compiler/providers/openrouter";
import { CourseArtifactV2Schema } from "@/lib/compiler/schemas/course-artifact";
import { compileCourse } from "@/lib/compiler/orchestrator";
import { compilerFailurePayload } from "@/lib/compiler/runs";
import { SourceDocumentSchema } from "@/lib/source";
import graph from "./fixtures/binary-search-source-graph.json";
import blueprint from "./fixtures/binary-search-blueprint.json";
import artifact from "./fixtures/binary-search-course-artifact-v2.json";
import document from "./fixtures/binary-search-source-document.json";

beforeEach(() => { vi.stubEnv("MUSEION_LIVE_AI_ENABLED", "1"); vi.stubEnv("OPENROUTER_API_KEY", "synthetic-not-used-key"); });
afterEach(() => vi.unstubAllEnvs());
const completion = (output: unknown) => Response.json({ id: "synthetic-compiler", model: "synthetic/compiler:free", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(output), reasoning: "private-hidden-reasoning" } }], usage: { prompt_tokens: 10, completion_tokens: 20 } });
function candidate() {
  const parsed = CourseArtifactV2Schema.parse(artifact);
  const rest = { ...parsed } as Record<string, unknown>;
  delete rest.validation; delete rest.provenance;
  return { ...rest, blocks: Object.values(parsed.blocks).map((block) => block.kind === "prediction-choice" ? { ...block, misconceptionByIndex: Object.entries(block.misconceptionByIndex).map(([optionIndex, misconceptionId]) => ({ optionIndex: Number(optionIndex), misconceptionId })) } : block), answerSpecs: Object.values(parsed.answerSpecs), misconceptions: Object.values(parsed.misconceptions) };
}

describe("same bounded free-only compiler transport", () => {
  it("runs all mocked structured stages through source binding, deterministic validation and critic gates", async () => {
    const outputs = [{ ...graph, spans: Object.entries(graph.spans).map(([id, span]) => ({ id, pageNumber: span.pageNumber, exactText: span.exactText })) }, blueprint, candidate(), { schemaVersion: "1.0", accepted: true, issues: [] }];
    const request = vi.fn<typeof fetch>();
    for (const output of outputs) request.mockResolvedValueOnce(completion(output));
    const result = await compileCourse(SourceDocumentSchema.parse(document), new OpenRouterCompilerProvider(request), { audience: blueprint.audience as typeof blueprint.audience & { level: "novice" } });
    expect(result.mode).toBe("live"); // mocked provider classification, not real network evidence
    expect(result.artifact.validation.status).toBe("accepted");
    expect(result.telemetry).toHaveLength(4);
    expect(request).toHaveBeenCalledTimes(4);
    for (const [, init] of request.mock.calls) {
      const body = JSON.parse(init!.body as string);
      expect(body).toMatchObject({ model: "openrouter/free", reasoning: { exclude: true }, stream: false, provider: { allow_fallbacks: false, require_parameters: true, data_collection: "deny", max_price: { prompt: 0, completion: 0, request: 0 } }, response_format: { type: "json_schema", json_schema: { strict: true } } });
      expect(body.tools).toBeUndefined();
      expect(body.models).toBeUndefined();
      expect(body.messages[0].content).toContain("untrusted data");
    }
    expect(JSON.stringify(result)).not.toContain("private-hidden-reasoning");
  });

  it("requires explicit enablement and distinguishes provider unavailability from publication rejection", async () => {
    vi.stubEnv("MUSEION_LIVE_AI_ENABLED", "0");
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response("private-provider-message", { status: 404 }));
    const provider = new OpenRouterCompilerProvider(request);
    await expect(provider.run("source_graph", {}, new AbortController().signal)).rejects.toMatchObject({ code: "provider_not_configured" });
    expect(request).not.toHaveBeenCalled();
    vi.stubEnv("MUSEION_LIVE_AI_ENABLED", "1");
    try { await compileCourse(SourceDocumentSchema.parse(document), provider); throw new Error("Expected safe failure"); }
    catch (error) {
      const payload = compilerFailurePayload(error);
      expect(payload).toMatchObject({ error: "COMPILER_PROVIDER_UNAVAILABLE", stage: "source_graph", provider: { errorCode: "provider_http_error", httpStatus: 404 } });
      expect(JSON.stringify(payload)).not.toContain("private-provider-message");
    }
    expect(request).toHaveBeenCalledTimes(1);
  });
});
