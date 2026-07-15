import { z } from "zod";

import { SourceDocumentSchema, type SourceDocument } from "@/lib/source";
import { resetMemoryStateForTests, stateBackend } from "@/lib/server/durable-state";

import { CompilerFailure, compileCourse, type CompileAudience, type CompileResult } from "./orchestrator";
import { OpenAICompilerProvider } from "./providers/openai";
import { GoldenReplayCompilerProvider } from "./providers/replay";
import { toPublicCourseArtifact } from "./public-artifact";

const GOLDEN_SOURCE_SHA256 = "637c098ea73b6c2d4cde1dea3accb77e8059589a11d0d2cd996b363d6b326ed0";
export const COMPILER_RUN_TTL_MS = 60 * 60 * 1_000;
export const MAX_COMPILER_RUNS_PER_OWNER = 5;

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
  const backend = stateBackend();
  await backend.prune("compiler_run");
  if ((await backend.list<CompilerRunRecord>("compiler_run", ownerId)).length >= MAX_COMPILER_RUNS_PER_OWNER) {
    throw new Error("COMPILER_RUN_QUOTA_EXCEEDED");
  }
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
  await backend.put({
    namespace: "compiler_run",
    id: record.id,
    ownerId,
    payload: record,
    expiresAt: new Date(Date.parse(record.createdAt) + COMPILER_RUN_TTL_MS).toISOString(),
    createdAt: record.createdAt,
    updatedAt: record.createdAt,
  });
  return compilerRunView(record);
}

export async function getCompilerRun(runId: string, ownerId: string): Promise<CompilerRunView> {
  return compilerRunView(await getPrivateCompilerRun(runId, ownerId));
}

export async function getPrivateCompilerRun(runId: string, ownerId: string): Promise<CompilerRunRecord> {
  const stored = await stateBackend().get<CompilerRunRecord>("compiler_run", runId, ownerId);
  if (!stored) throw new Error("COMPILER_RUN_NOT_FOUND");
  return stored.payload;
}

export function compilerFailurePayload(error: unknown) {
  if (error instanceof CompilerFailure) {
    return { error: "COMPILATION_REJECTED", stage: error.stage, issues: error.issues, telemetry: error.telemetry };
  }
  const code = error instanceof Error ? error.message : "COMPILATION_FAILED";
  return { error: ["LIVE_COMPILER_NOT_CONFIGURED", "COMPILER_RUN_QUOTA_EXCEEDED"].includes(code) ? code : "COMPILATION_FAILED" };
}

export async function pruneCompilerRuns(now = Date.now()): Promise<void> {
  await stateBackend().prune("compiler_run", new Date(now));
}

export function resetCompilerRunsForTests(): void {
  resetMemoryStateForTests();
}
