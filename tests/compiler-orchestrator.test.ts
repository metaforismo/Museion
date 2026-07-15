import { describe, expect, it } from "vitest";

import {
  CompilerFailure,
  compileCourse,
  type CompilerProvider,
  type ProviderStageResult,
} from "@/lib/compiler";
import { GoldenReplayCompilerProvider } from "@/lib/compiler/providers/replay";
import { SourceDocumentSchema } from "@/lib/source";
import goldenArtifact from "./fixtures/binary-search-course-artifact-v2.json";
import goldenDocument from "./fixtures/binary-search-source-document.json";

const document = SourceDocumentSchema.parse(goldenDocument);

describe("multi-stage compiler orchestrator", () => {
  it("publishes the validated keyless replay with stage hashes", async () => {
    const result = await compileCourse(document, new GoldenReplayCompilerProvider(), { now: "2026-07-15T00:00:00.000Z" });
    expect(result.mode).toBe("replay");
    expect(result.repaired).toBe(false);
    expect(result.artifact.id).toBe("binary_search_golden");
    expect(result.telemetry.map((item) => item.stage)).toEqual([
      "source_graph",
      "blueprint",
      "course_artifact",
      "critic",
    ]);
    expect(result.telemetry.every((item) => /^[a-f0-9]{64}$/.test(item.outputSha256))).toBe(true);
    expect(result.artifact.validation).toMatchObject({ validatorVersion: "museion-artifact-validator-v2", status: "accepted", blockingIssueCount: 0 });
    expect(result.artifact.provenance).toMatchObject({ compilerVersion: "museion-compiler-v2", model: "deterministic-replay" });
  });

  it("does not publish an artifact whose interactive runtime is invalid", async () => {
    const replay = new GoldenReplayCompilerProvider();
    const provider: CompilerProvider = {
      id: "invalid-runtime",
      mode: "replay",
      async run(stage, input, signal) {
        const result = await replay.run(stage, input, signal);
        if (stage === "course_artifact") {
          const output = structuredClone(result.output) as { blocks: Record<string, { correctOrder?: string[] }> };
          output.blocks.sequence_reasoning.correctOrder = ["compare_mid", "compare_mid", "move_past_mid", "check_shrink"];
          return { ...result, output };
        }
        return result;
      },
    };
    await expect(compileCourse(document, provider)).rejects.toMatchObject({ name: "CompilerFailure", stage: "repair" });
  });

  it("fails closed before publish when a provider forges graph evidence", async () => {
    const replay = new GoldenReplayCompilerProvider();
    const provider: CompilerProvider = {
      id: "forged-graph",
      mode: "replay",
      async run(stage, input, signal) {
        const result = await replay.run(stage, input, signal);
        if (stage === "source_graph") {
          const output = structuredClone(result.output) as { spans: Record<string, { exactText: string }> };
          output.spans.span_invariant.exactText = "forged";
          return { ...result, output };
        }
        return result;
      },
    };
    await expect(compileCourse(document, provider)).rejects.toMatchObject({
      name: "CompilerFailure",
      stage: "source_graph",
    });
  });

  it("times out a provider that never settles", async () => {
    const provider: CompilerProvider = {
      id: "stalled",
      mode: "live",
      run: (): Promise<ProviderStageResult> => new Promise(() => undefined),
    };
    try {
      await compileCourse(document, provider, { timeoutMs: 10 });
      throw new Error("Expected compilation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(CompilerFailure);
      expect((error as CompilerFailure).issues[0].code).toBe("stage_timeout");
    }
  });

  it("applies one typed repair and reruns validators plus critic", async () => {
    const replay = new GoldenReplayCompilerProvider();
    let criticRuns = 0;
    let repairRuns = 0;
    const provider: CompilerProvider = {
      id: "repairing-provider",
      mode: "replay",
      async run(stage, input, signal) {
        if (stage === "course_artifact") {
          const result = await replay.run(stage, input, signal);
          const output = structuredClone(result.output) as typeof goldenArtifact;
          output.blocks.guided_next_low.answerSpecId = "answer_missing";
          return { ...result, output };
        }
        if (stage === "critic") {
          criticRuns += 1;
          return {
            output: {
              schemaVersion: "1.0",
              accepted: criticRuns > 1,
              issues: criticRuns === 1 ? [{ code: "invalid_answer_spec", path: "blocks.guided_next_low.answerSpecId", message: "Unknown answer spec", severity: "blocking" }] : [],
            },
            requestedModel: "fixture",
            resolvedModel: "fixture",
            usage: null,
          };
        }
        if (stage === "repair") {
          repairRuns += 1;
          return {
            output: { schemaVersion: "1.0", operations: [{ kind: "replace_block", id: "guided_next_low", value: goldenArtifact.blocks.guided_next_low }] },
            requestedModel: "fixture",
            resolvedModel: "fixture",
            usage: null,
          };
        }
        return replay.run(stage, input, signal);
      },
    };
    const result = await compileCourse(document, provider);
    expect(result.repaired).toBe(true);
    expect(result.artifact.blocks.guided_next_low).toEqual(goldenArtifact.blocks.guided_next_low);
    expect(criticRuns).toBe(2);
    expect(repairRuns).toBe(1);
    expect(result.telemetry.at(-1)?.stage).toBe("critic_after_repair");
  });
});
