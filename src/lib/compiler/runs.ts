import { z } from "zod";

import { SourceDocumentSchema, verifySourceDocumentIntegrity, type SourceDocument } from "@/lib/source";
import { resetMemoryStateForTests, stateBackend } from "@/lib/server/durable-state";

import { CompilerFailure, compileCourse, type CompileAudience, type CompileResult } from "./orchestrator";
import { OpenAICompilerProvider } from "./providers/openai";
import { GoldenReplayCompilerProvider } from "./providers/replay";
import { CodexCompilerProvider } from "./providers/codex";
import { toPublicCourseArtifact } from "./public-artifact";
import { CourseTemplateIdSchema, type CourseTemplateId } from "./templates";
import { codexSelected, getAiSettings } from "@/lib/ai/settings";
import type { CompilerStage } from "./contracts";

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
  requestId: z.string().uuid().optional(),
  document: SourceDocumentSchema,
  audience: CompileAudienceSchema,
  templateId: CourseTemplateIdSchema.default("socratic-foundations"),
}).strict();

interface CompilerRunRecord {
  id: string;
  ownerId: string;
  document: SourceDocument;
  audience: CompileAudience;
  templateId: CourseTemplateId;
  result: CompileResult;
  createdAt: string;
}

export type CompilerRunView = ReturnType<typeof compilerRunView>;

function compilerRunView(record: CompilerRunRecord) {
  return {
    status: "succeeded" as const,
    runId: record.id,
    mode: record.result.mode,
    document: {
      id: record.document.id,
      title: record.document.title,
      sha256: record.document.sha256,
      pages: record.document.pages.length,
      sourceReference: record.document.sourceReference ?? null,
    },
    audience: record.audience,
    templateId: record.templateId ?? record.result.templateId ?? "socratic-foundations",
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
  templateId: CourseTemplateId = "socratic-foundations",
  execution: {
    runId?: string;
    signal?: AbortSignal;
    onStage?: (stage: CompilerStage | "critic_after_repair") => void;
  } = {},
): Promise<CompilerRunView> {
  await verifySourceDocumentIntegrity(document);
  const backend = stateBackend();
  await backend.prune("compiler_run");
  if ((await backend.list<CompilerRunRecord>("compiler_run", ownerId)).length >= MAX_COMPILER_RUNS_PER_OWNER) {
    throw new Error("COMPILER_RUN_QUOTA_EXCEEDED");
  }
  const settings = getAiSettings();
  if (document.sha256 !== GOLDEN_SOURCE_SHA256 && settings.provider === "offline") {
    throw new Error("LIVE_COMPILER_NOT_CONFIGURED");
  }
  const provider = document.sha256 === GOLDEN_SOURCE_SHA256
    ? new GoldenReplayCompilerProvider()
    : codexSelected()
      ? new CodexCompilerProvider(settings.familyFallback)
      : new OpenAICompilerProvider();
  if (provider instanceof OpenAICompilerProvider && !provider.available()) {
    throw new Error("LIVE_COMPILER_NOT_CONFIGURED");
  }
  const result = await compileCourse(document, provider, {
    audience,
    templateId,
    timeoutMs: provider instanceof CodexCompilerProvider ? 190_000 : 60_000,
    signal: execution.signal,
    onStage: execution.onStage,
  });
  const record: CompilerRunRecord = {
    id: execution.runId ?? crypto.randomUUID(),
    ownerId,
    document,
    audience,
    templateId,
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

export type CompilerJobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

interface CompilerJobView {
  runId: string;
  status: CompilerJobStatus;
  stage: CompilerStage | "critic_after_repair" | null;
  completedStages: number;
  totalStages: number;
  error: string | null;
  retryable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CompilerJob extends CompilerJobView {
  ownerId: string;
  controller: AbortController;
}

const jobsGlobal = globalThis as unknown as { __museionCompilerJobs?: Map<string, CompilerJob> };
const compilerJobs = jobsGlobal.__museionCompilerJobs ?? new Map<string, CompilerJob>();
jobsGlobal.__museionCompilerJobs = compilerJobs;

function jobView(job: CompilerJob): CompilerJobView {
  return {
    runId: job.runId,
    status: job.status,
    stage: job.stage,
    completedStages: job.completedStages,
    totalStages: job.totalStages,
    error: job.error,
    retryable: job.retryable,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export async function enqueueCompilerRun(
  ownerId: string,
  document: SourceDocument,
  audience: CompileAudience,
  templateId: CourseTemplateId,
  requestId?: string,
): Promise<CompilerJobView> {
  if (requestId) {
    const existing = compilerJobs.get(requestId);
    if (existing) {
      if (existing.ownerId !== ownerId) throw new Error("COMPILER_JOB_ALREADY_RUNNING");
      return jobView(existing);
    }
  }
  const ownedActive = [...compilerJobs.values()].filter((job) => job.ownerId === ownerId && ["queued", "running"].includes(job.status));
  if (ownedActive.length >= 1) throw new Error("COMPILER_JOB_ALREADY_RUNNING");
  const runId = requestId ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const controller = new AbortController();
  const job: CompilerJob = {
    runId,
    ownerId,
    controller,
    status: "queued",
    stage: null,
    completedStages: 0,
    totalStages: 5,
    error: null,
    retryable: false,
    createdAt: now,
    updatedAt: now,
  };
  compilerJobs.set(runId, job);
  void createCompilerRun(ownerId, document, audience, templateId, {
    runId,
    signal: controller.signal,
    onStage: (stage) => {
      if (job.status === "cancelled") return;
      job.status = "running";
      if (job.stage && job.stage !== stage) job.completedStages = Math.min(job.totalStages - 1, job.completedStages + 1);
      job.stage = stage;
      job.updatedAt = new Date().toISOString();
    },
  }).then(() => {
    if (job.status === "cancelled") return;
    job.status = "succeeded";
    job.completedStages = job.totalStages;
    job.updatedAt = new Date().toISOString();
  }).catch((error) => {
    if (job.status === "cancelled") return;
    job.status = "failed";
    job.error = compilerFailurePayload(error).error;
    job.retryable = true;
    job.updatedAt = new Date().toISOString();
  });
  return jobView(job);
}

export async function getCompilerRunStatus(runId: string, ownerId: string) {
  const job = compilerJobs.get(runId);
  if (job) {
    if (job.ownerId !== ownerId) throw new Error("COMPILER_RUN_NOT_FOUND");
    if (job.status !== "succeeded") return jobView(job);
  }
  return getCompilerRun(runId, ownerId);
}

export function cancelCompilerRun(runId: string, ownerId: string): boolean {
  const job = compilerJobs.get(runId);
  if (!job || job.ownerId !== ownerId || !["queued", "running"].includes(job.status)) return false;
  job.status = "cancelled";
  job.retryable = true;
  job.updatedAt = new Date().toISOString();
  job.controller.abort();
  return true;
}

export async function getCompilerRun(runId: string, ownerId: string): Promise<CompilerRunView> {
  return compilerRunView(await getPrivateCompilerRun(runId, ownerId));
}

/** Recent validated courses for an owner. Private source bytes stay omitted. */
export async function listCompilerRuns(ownerId: string): Promise<CompilerRunView[]> {
  const records = await stateBackend().list<CompilerRunRecord>("compiler_run", ownerId);
  return records
    .map(({ payload }) => payload)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .map(compilerRunView);
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
  return { error: ["LIVE_COMPILER_NOT_CONFIGURED", "COMPILER_RUN_QUOTA_EXCEEDED", "COMPILER_JOB_ALREADY_RUNNING"].includes(code) ? code : "COMPILATION_FAILED" };
}

export async function pruneCompilerRuns(now = Date.now()): Promise<void> {
  await stateBackend().prune("compiler_run", new Date(now));
}

export function resetCompilerRunsForTests(): void {
  resetMemoryStateForTests();
  compilerJobs.clear();
}
