import type { SourceDocument } from "@/lib/source";
import { validateInteractiveBlock, type InteractiveBlock } from "@/lib/runtime";

import { canonicalSha256 } from "./canonical";
import {
  ArtifactPatchSchema,
  CriticReportSchema,
  type CompilerIssue,
  type CompilerProvider,
  type CompilerStage,
  type CompilerStageTelemetry,
} from "./contracts";
import { CourseBlueprintSchema, type CourseBlueprint } from "./schemas/blueprint";
import {
  CourseArtifactV2Schema,
  GeneratedCourseCandidateSchema,
  type CourseArtifactV2,
  validateArtifactReferences,
} from "./schemas/course-artifact";
import {
  SourceGraphSchema,
  type SourceGraph,
  validateSourceGraph,
} from "./schemas/source-graph";
import { courseTemplate, type CourseTemplateId } from "./templates";

const MAX_STAGE_INPUT_CHARACTERS = 250_000;

export class CompilerFailure extends Error {
  constructor(
    readonly stage: CompilerStage | "critic_after_repair",
    readonly issues: CompilerIssue[],
    readonly telemetry: CompilerStageTelemetry[],
  ) {
    super(`Compiler stopped at ${stage}`);
    this.name = "CompilerFailure";
  }
}

export interface CompileResult {
  mode: "live" | "replay";
  sourceGraph: SourceGraph;
  blueprint: CourseBlueprint;
  artifact: CourseArtifactV2;
  telemetry: CompilerStageTelemetry[];
  repaired: boolean;
  templateId: CourseTemplateId;
}

export interface CompileAudience {
  level: "novice" | "intermediate" | "advanced";
  language: string;
  targetMinutes: number;
  learnerGoal: string;
}

function blocking(code: string, path: string, message: string): CompilerIssue {
  return { code, path, message, severity: "blocking" };
}

function applyPatch(artifact: CourseArtifactV2, patch: ReturnType<typeof ArtifactPatchSchema.parse>): CourseArtifactV2 {
  const next = structuredClone(artifact);
  for (const operation of patch.operations) {
    if (operation.id !== operation.value.id) {
      throw new Error(`Patch id ${operation.id} differs from value id ${operation.value.id}`);
    }
    if (operation.kind === "replace_block") next.blocks[operation.id] = operation.value;
    if (operation.kind === "replace_answer_spec") next.answerSpecs[operation.id] = operation.value;
    if (operation.kind === "replace_misconception") next.misconceptions[operation.id] = operation.value;
  }
  return CourseArtifactV2Schema.parse(next);
}

export async function compileCourse(
  document: SourceDocument,
  provider: CompilerProvider,
  options: {
    timeoutMs?: number;
    now?: string;
    audience?: CompileAudience;
    templateId?: CourseTemplateId;
    signal?: AbortSignal;
    onStage?: (stage: CompilerStage | "critic_after_repair") => void;
  } = {},
): Promise<CompileResult> {
  const timeoutMs = options.timeoutMs ?? 20_000;
  const templateId = options.templateId ?? "socratic-foundations";
  const template = courseTemplate(templateId);
  const telemetry: CompilerStageTelemetry[] = [];

  async function runStage(stage: CompilerStage, input: unknown, telemetryStage: CompilerStageTelemetry["stage"] = stage) {
    options.onStage?.(telemetryStage);
    const serialized = JSON.stringify(input);
    if (serialized.length > MAX_STAGE_INPUT_CHARACTERS) {
      throw new CompilerFailure(stage, [blocking("stage_input_too_large", "$", `Stage input exceeds ${MAX_STAGE_INPUT_CHARACTERS} characters`)], telemetry);
    }
    const inputSha256 = await canonicalSha256(input);
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort();
    options.signal?.addEventListener("abort", abortFromCaller, { once: true });
    const startedAt = performance.now();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new CompilerFailure(stage, [blocking("stage_timeout", "$", `Stage exceeded ${timeoutMs} ms`)], telemetry));
        }, timeoutMs);
      });
      const result = await Promise.race([provider.run(stage, input, controller.signal), timeout]);
      const outputSha256 = await canonicalSha256(result.output);
      telemetry.push({
        stage: telemetryStage,
        provider: provider.id,
        requestedModel: result.requestedModel,
        resolvedModel: result.resolvedModel,
        inputSha256,
        outputSha256,
        durationMs: Math.max(0, performance.now() - startedAt),
        usage: result.usage,
      });
      return result.output;
    } catch (error) {
      if (error instanceof CompilerFailure) throw error;
      throw new CompilerFailure(stage, [blocking("provider_error", "$", error instanceof Error ? error.message.slice(0, 1_000) : "Unknown provider error")], telemetry);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      options.signal?.removeEventListener("abort", abortFromCaller);
    }
  }

  const graph = SourceGraphSchema.parse(
    await runStage("source_graph", { schemaVersion: "1.0", document }),
  );
  const graphIssues = (await validateSourceGraph(document, graph)).map((issue) => ({
    code: issue.code,
    path: issue.path,
    message: issue.message,
    severity: "blocking" as const,
  }));
  if (graphIssues.length) throw new CompilerFailure("source_graph", graphIssues, telemetry);

  const graphSha256 = await canonicalSha256(graph);
  const blueprint = CourseBlueprintSchema.parse(
    await runStage("blueprint", { schemaVersion: "1.0", sourceGraph: graph, sourceGraphSha256: graphSha256, requestedAudience: options.audience, courseTemplate: { id: templateId, ...template } }),
  );
  const blueprintIssues: CompilerIssue[] = [];
  if (blueprint.sourceGraphSha256 !== graphSha256) blueprintIssues.push(blocking("source_graph_hash_mismatch", "sourceGraphSha256", "Blueprint does not bind to the validated Source Graph"));
  if (options.audience && JSON.stringify(blueprint.audience) !== JSON.stringify(options.audience)) {
    blueprintIssues.push(blocking("audience_mismatch", "audience", "Blueprint does not match the requested learner audience"));
  }
  const graphConceptIds = new Set(graph.concepts.map((item) => item.id));
  const objectiveIds = new Set(blueprint.objectives.map((item) => item.id));
  blueprint.objectives.forEach((objective, index) => objective.conceptIds.forEach((id) => {
    if (!graphConceptIds.has(id)) blueprintIssues.push(blocking("unknown_concept", `objectives[${index}].conceptIds`, `Unknown Source Graph concept ${id}`));
  }));
  blueprint.sequence.forEach((id, index) => {
    if (!objectiveIds.has(id)) blueprintIssues.push(blocking("unknown_objective", `sequence[${index}]`, `Unknown objective ${id}`));
  });
  if (blueprintIssues.length) throw new CompilerFailure("blueprint", blueprintIssues, telemetry);

  const candidate = GeneratedCourseCandidateSchema.parse(
    await runStage("course_artifact", { schemaVersion: "1.0", document: { id: document.id, sha256: document.sha256 }, sourceGraph: graph, blueprint, courseTemplate: { id: templateId, ...template } }),
  );
  const generatedAt = options.now ?? new Date().toISOString();
  const artifactStage = telemetry.at(-1);
  const generationRunId = `run_${(await canonicalSha256({ documentSha256: document.sha256, graphSha256, candidate, provider: provider.id })).slice(0, 24)}`;
  let artifact = CourseArtifactV2Schema.parse({
    ...candidate,
    validation: { validatorVersion: "museion-artifact-validator-v2", status: "needs-review", blockingIssueCount: 0, warningCount: 0, validatedAt: generatedAt },
    provenance: {
      compilerVersion: "museion-compiler-v2",
      promptBundleVersion: "museion-compiler-prompts-v1",
      model: artifactStage?.resolvedModel ?? provider.id,
      generatedAt,
      deterministicSeed: document.sha256.slice(0, 16),
      generationRunId,
    },
  });
  const knownSpanIds = new Set(Object.keys(graph.spans));
  const validateArtifact = () => {
    const referenceIssues = validateArtifactReferences(artifact, knownSpanIds, {
      sourceId: document.id,
      sourceSha256: document.sha256,
      sourceGraphSha256: graphSha256,
    }).map((issue) => ({ ...issue, code: issue.code })) satisfies CompilerIssue[];
    const runtimeIssues = Object.entries(artifact.blocks).flatMap(([blockId, block]) =>
      ["prediction-choice", "sequence-builder", "range-explorer", "state-trace"].includes(block.kind)
        ? validateInteractiveBlock(block as InteractiveBlock).map((issue) => blocking(issue.code, `blocks.${blockId}.${issue.path}`, issue.message))
        : [],
    );
    return [...referenceIssues, ...runtimeIssues];
  };
  let artifactIssues = validateArtifact();
  const generatedKinds = new Set(Object.values(artifact.blocks).map((block) => block.kind));
  template.requiredKinds.forEach((kind) => {
    if (!generatedKinds.has(kind)) artifactIssues.push(blocking("template_requirement_missing", "blocks", `${template.name} requires a ${kind} block`));
  });
  let critic = CriticReportSchema.parse(
    await runStage("critic", { schemaVersion: "1.0", sourceGraph: graph, blueprint, artifact, validatorIssues: artifactIssues }),
  );
  let combinedIssues = [...artifactIssues, ...critic.issues.filter((issue) => issue.severity === "blocking")];
  let repaired = false;

  if (combinedIssues.length || !critic.accepted) {
    const patch = ArtifactPatchSchema.parse(
      await runStage("repair", { schemaVersion: "1.0", artifact, issues: [...artifactIssues, ...critic.issues] }),
    );
    try {
      artifact = applyPatch(artifact, patch);
    } catch (error) {
      throw new CompilerFailure("repair", [blocking("invalid_patch", "$", error instanceof Error ? error.message : "Invalid patch")], telemetry);
    }
    repaired = true;
    artifactIssues = validateArtifact();
    const secondCritic = CriticReportSchema.parse(
      await runStage("critic", { schemaVersion: "1.0", sourceGraph: graph, blueprint, artifact, validatorIssues: artifactIssues }, "critic_after_repair"),
    );
    combinedIssues = [...artifactIssues, ...secondCritic.issues.filter((issue) => issue.severity === "blocking")];
    if (combinedIssues.length || !secondCritic.accepted) {
      throw new CompilerFailure("critic_after_repair", combinedIssues.length ? combinedIssues : [blocking("critic_rejected", "$", "Critic rejected the repaired artifact")], telemetry);
    }
    critic = secondCritic;
  }

  artifact = CourseArtifactV2Schema.parse({
    ...artifact,
    validation: {
      validatorVersion: "museion-artifact-validator-v2",
      status: "accepted",
      blockingIssueCount: 0,
      warningCount: critic.issues.filter((issue) => issue.severity === "warning").length,
      validatedAt: generatedAt,
    },
  });
  return { mode: provider.mode, sourceGraph: graph, blueprint, artifact, telemetry, repaired, templateId };
}
