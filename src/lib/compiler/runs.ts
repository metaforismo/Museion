import { z } from "zod";

import { SourceDocumentSchema, type SourceDocument } from "@/lib/source";

import { CompilerFailure, compileCourse, type CompileAudience, type CompileResult } from "./orchestrator";
import { OpenAICompilerProvider } from "./providers/openai";
import { GoldenReplayCompilerProvider } from "./providers/replay";
import { toPublicCourseArtifact } from "./public-artifact";

const GOLDEN_SOURCE_SHA256 = "637c098ea73b6c2d4cde1dea3accb77e8059589a11d0d2cd996b363d6b326ed0";

export const CompileAudienceSchema = z.object({
  level: z.enum(["novice", "intermediate", "advanced"]),
  language: z.string().min(2).max(35),
  targetMinutes: z.number().int().min(3).max(60),
  learnerGoal: z.string().trim().min(1).max(600),
}).strict();

export const CompilerRunRequestSchema = z.object({
  document: SourceDocumentSchema,
  audience: CompileAudienceSchema,
}).strict();

interface CompilerRunRecord {
  id: string;
  ownerId: string;
  document: SourceDocument;
  audience: CompileAudience;
  result: CompileResult;
  createdAt: string;
}

const globalRuns = globalThis as unknown as { __museionCompilerRuns?: Map<string, CompilerRunRecord> };
const runs = globalRuns.__museionCompilerRuns ?? new Map<string, CompilerRunRecord>();
globalRuns.__museionCompilerRuns = runs;

export type CompilerRunView = ReturnType<typeof compilerRunView>;

function compilerRunView(record: CompilerRunRecord) {
  return {
    runId: record.id,
    mode: record.result.mode,
    document: {
      id: record.document.id,
      title: record.document.title,
      sha256: record.document.sha256,
      pages: record.document.pages.length,
    },
    audience: record.audience,
    sourceGraph: record.result.sourceGraph,
    blueprint: record.result.blueprint,
    artifact: toPublicCourseArtifact(record.result.artifact),
    validation: record.result.artifact.validation,
    telemetry: record.result.telemetry,
    repaired: record.result.repaired,
    createdAt: record.createdAt,
  };
}

export async function createCompilerRun(
  ownerId: string,
  document: SourceDocument,
  audience: CompileAudience,
): Promise<CompilerRunView> {
  const provider = document.sha256 === GOLDEN_SOURCE_SHA256
    ? new GoldenReplayCompilerProvider()
    : new OpenAICompilerProvider();
  if (provider instanceof OpenAICompilerProvider && !provider.available()) {
    throw new Error("LIVE_COMPILER_NOT_CONFIGURED");
  }
  const result = await compileCourse(document, provider, { audience, timeoutMs: 60_000 });
  const record: CompilerRunRecord = {
    id: crypto.randomUUID(),
    ownerId,
    document,
    audience,
    result,
    createdAt: new Date().toISOString(),
  };
  runs.set(record.id, record);
  return compilerRunView(record);
}

export function getCompilerRun(runId: string, ownerId: string): CompilerRunView {
  const record = runs.get(runId);
  if (!record || record.ownerId !== ownerId) throw new Error("COMPILER_RUN_NOT_FOUND");
  return compilerRunView(record);
}

export function getPrivateCompilerRun(runId: string, ownerId: string): CompilerRunRecord {
  const record = runs.get(runId);
  if (!record || record.ownerId !== ownerId) throw new Error("COMPILER_RUN_NOT_FOUND");
  return record;
}

export function compilerFailurePayload(error: unknown) {
  if (error instanceof CompilerFailure) {
    return { error: "COMPILATION_REJECTED", stage: error.stage, issues: error.issues, telemetry: error.telemetry };
  }
  const code = error instanceof Error ? error.message : "COMPILATION_FAILED";
  return { error: code === "LIVE_COMPILER_NOT_CONFIGURED" ? code : "COMPILATION_FAILED" };
}

export function resetCompilerRunsForTests(): void {
  runs.clear();
}
