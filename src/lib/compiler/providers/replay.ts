import goldenArtifact from "../../../../tests/fixtures/binary-search-course-artifact-v2.json";
import goldenBlueprint from "../../../../tests/fixtures/binary-search-blueprint.json";
import goldenDocument from "../../../../tests/fixtures/binary-search-source-document.json";
import goldenGraph from "../../../../tests/fixtures/binary-search-source-graph.json";

import type {
  CompilerProvider,
  CompilerStage,
  ProviderStageResult,
} from "../contracts";

const clone = <T>(value: T): T => structuredClone(value);

export class GoldenReplayCompilerProvider implements CompilerProvider {
  readonly id = "golden-binary-search-replay-v1";
  readonly mode = "replay" as const;

  async run(stage: CompilerStage, input: unknown, signal: AbortSignal): Promise<ProviderStageResult> {
    if (signal.aborted) throw new DOMException("Compilation aborted", "AbortError");
    const serialized = JSON.stringify(input);
    if (!serialized.includes(goldenDocument.sha256) && !serialized.includes(goldenDocument.id)) {
      throw new Error("Golden replay is available only for the verified binary-search source");
    }
    let output: unknown;
    if (stage === "source_graph") output = clone(goldenGraph);
    else if (stage === "blueprint") output = clone(goldenBlueprint);
    else if (stage === "course_artifact") output = clone(goldenArtifact);
    else if (stage === "critic") output = { schemaVersion: "1.0", accepted: true, issues: [] };
    else throw new Error("The accepted golden replay does not require repair");
    return {
      output,
      requestedModel: "deterministic-replay",
      resolvedModel: "deterministic-replay",
      usage: null,
    };
  }
}
