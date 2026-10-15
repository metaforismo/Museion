import { z } from "zod";

import {
  SourceDocumentSchema,
  SourcePackSchema,
  SourcePackManifestSchema,
  SourceRightsBasisSchema,
  createSingleDocumentSourcePackManifest,
  verifySourceDocumentIntegrity,
  verifySourcePackManifestBinding,
  type SourceDocument,
  type SourcePackManifest,
} from "@/lib/source";
import { resetMemoryStateForTests, stateBackend } from "@/lib/server/durable-state";

import { CompilerFailure, compileCourse, type CompileAudience, type CompileResult } from "./orchestrator";
import { OpenRouterCompilerProvider } from "./providers/openrouter";
import { OpenAICompilerProvider } from "./providers/openai";
import { GoldenReplayCompilerProvider } from "./providers/replay";
import { CodexCompilerProvider } from "./providers/codex";
import { toPublicCourseArtifact } from "./public-artifact";
import { CourseTemplateIdSchema, type CourseTemplateId } from "./templates";
import { codexSelected, getAiSettings } from "@/lib/ai/settings";
import type { CompilerStage } from "./contracts";
import { computeMaterialCitationCoverage } from "./source-pack-coverage";
import { sitesDatabase, sitesUploads } from "@/lib/sites/database";
import { deleteRawUploadsForOwner } from "@/lib/server/upload-lifecycle";
import { runtimeValue } from "@/lib/sites/runtime";

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
  sourcePack: SourcePackSchema.optional(),
  rights: z.object({
    confirmed: z.literal(true),
    basis: SourceRightsBasisSchema,
    notes: z.string().trim().max(600).default(""),
  }).strict(),
  audience: CompileAudienceSchema,
  templateId: CourseTemplateIdSchema.default("socratic-foundations"),
}).strict().superRefine((request, context) => {
  if (!request.sourcePack) return;
  if (request.sourcePack.rights.basis !== request.rights.basis || request.sourcePack.rights.notes !== request.rights.notes) {
    context.addIssue({ code: "custom", path: ["rights"], message: "Compiler rights must match the Source Pack declaration" });
  }
});

interface CompilerRunRecord {
  id: string;
  ownerId: string;
  document: SourceDocument;
  audience: CompileAudience;
  templateId: CourseTemplateId;
  sourcePackManifest?: SourcePackManifest;
  result: CompileResult;
  createdAt: string;
}

export type CompilerRunView = ReturnType<typeof compilerRunView>;

function compilerRunView(record: CompilerRunRecord) {
  const sourcePack = record.sourcePackManifest ? SourcePackManifestSchema.parse(record.sourcePackManifest) : null;
  const materialCoverage = sourcePack
    ? computeMaterialCitationCoverage(sourcePack, record.result.sourceGraph.spans, record.result.artifact.blocks)
    : null;
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
    sourcePack,
    materialCoverage,
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
    sourcePackManifest?: SourcePackManifest;
  } = {},
): Promise<CompilerRunView> {
  await verifySourceDocumentIntegrity(document);
  const sourcePackManifest = execution.sourcePackManifest ?? await createSingleDocumentSourcePackManifest(document, {
    confirmed: true,
    basis: "personal-notes",
    notes: "Internal compiler invocation.",
  });
  verifySourcePackManifestBinding(sourcePackManifest, document);
  const backend = stateBackend();
  await backend.prune("compiler_run");
  if ((await backend.list<CompilerRunRecord>("compiler_run", ownerId)).length >= MAX_COMPILER_RUNS_PER_OWNER) {
    throw new Error("COMPILER_RUN_QUOTA_EXCEEDED");
  }
  const settings = getAiSettings();
  if (document.sha256 !== GOLDEN_SOURCE_SHA256 && runtimeValue("MUSEION_LIVE_AI_ENABLED") === "0") {
    throw new Error("LIVE_AI_DISABLED");
  }
  if (document.sha256 !== GOLDEN_SOURCE_SHA256 && settings.provider === "offline") {
    throw new Error("LIVE_COMPILER_NOT_CONFIGURED");
  }
  const provider = document.sha256 === GOLDEN_SOURCE_SHA256
    ? new GoldenReplayCompilerProvider()
    : settings.provider === "openrouter-free"
      ? new OpenRouterCompilerProvider()
      : codexSelected()
      ? new CodexCompilerProvider(settings.familyFallback)
      : new OpenAICompilerProvider();
  if ((provider instanceof OpenAICompilerProvider || provider instanceof OpenRouterCompilerProvider) && !provider.available()) {
    throw new Error("LIVE_COMPILER_NOT_CONFIGURED");
  }
  const result = await compileCourse(document, provider, {
    audience,
    templateId,
    timeoutMs: provider instanceof CodexCompilerProvider ? 190_000 : provider instanceof OpenRouterCompilerProvider ? 130_000 : 60_000,
    signal: execution.signal,
    onStage: execution.onStage,
  });
  const record: CompilerRunRecord = {
    id: execution.runId ?? crypto.randomUUID(),
    ownerId,
    document: { ...document, pages: document.pages.map((page) => ({ ...page, text: "[raw source deleted after compilation]" })) },
    audience,
    templateId,
    sourcePackManifest,
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
  const db = sitesDatabase();
  if (db) {
    const artifactKey = `artifacts/${ownerId}/${record.id}.json`;
    await sitesUploads().put(artifactKey, JSON.stringify(record), { httpMetadata: { contentType: "application/json" }, customMetadata: { ownerId, kind: "generated-course" } });
    await db.prepare("INSERT INTO generated_courses(id,owner_id,title,artifact_key,revision,deleted_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,artifact_key=excluded.artifact_key,revision=generated_courses.revision+1,updated_at=excluded.updated_at WHERE generated_courses.owner_id=excluded.owner_id")
      .bind(record.id, ownerId, result.artifact.title, artifactKey, 0, null, record.createdAt, record.createdAt).run();
  }
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

interface DurableCompilerPayload {
  document: SourceDocument;
  audience: CompileAudience;
  templateId: CourseTemplateId;
  sourcePackManifest?: SourcePackManifest;
}

interface DurableCompilerRow {
  id: string;
  owner_id: string;
  status: CompilerJobStatus;
  stage: CompilerStage | "critic_after_repair" | null;
  revision: number;
  payload_json: string;
  error_code: string | null;
  created_at: string;
  updated_at: string;
}

const jobsGlobal = globalThis as unknown as { __museionCompilerJobs?: Map<string, CompilerJob> };
const compilerJobs = jobsGlobal.__museionCompilerJobs ?? new Map<string, CompilerJob>();
jobsGlobal.__museionCompilerJobs = compilerJobs;

export const COMPILER_JOB_TTL_MS = 30 * 60 * 1_000;
export const MAX_COMPILER_JOBS = 200;
const TERMINAL_JOB_STATUSES: CompilerJobStatus[] = ["succeeded", "failed", "cancelled"];

function pruneCompilerJobs(now = Date.now()): void {
  for (const [id, job] of compilerJobs) {
    if (TERMINAL_JOB_STATUSES.includes(job.status) && now - Date.parse(job.updatedAt) > COMPILER_JOB_TTL_MS) {
      compilerJobs.delete(id);
    }
  }
  if (compilerJobs.size <= MAX_COMPILER_JOBS) return;
  const oldestTerminalFirst = [...compilerJobs.entries()]
    .filter(([, job]) => TERMINAL_JOB_STATUSES.includes(job.status))
    .sort(([, a], [, b]) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt));
  for (const [id] of oldestTerminalFirst) {
    if (compilerJobs.size <= MAX_COMPILER_JOBS) break;
    compilerJobs.delete(id);
  }
}

export function compilerJobCountForTests(): number {
  return compilerJobs.size;
}

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
  sourcePackManifest?: SourcePackManifest,
): Promise<CompilerJobView> {
  const db = sitesDatabase();
  if (db) {
    const runId = requestId ?? crypto.randomUUID();
    const existing = await db.prepare("SELECT id,owner_id,status,stage,revision,payload_json,error_code,created_at,updated_at FROM compiler_runs WHERE id=? LIMIT 1").bind(runId).first<DurableCompilerRow>();
    if (existing) {
      if (existing.owner_id !== ownerId) throw new Error("COMPILER_JOB_ALREADY_RUNNING");
      return durableJobView(existing);
    }
    const active = await db.prepare("SELECT id FROM compiler_runs WHERE owner_id=? AND status IN ('queued','running') AND expires_at>? LIMIT 1").bind(ownerId, new Date().toISOString()).first<{ id: string }>();
    if (active) throw new Error("COMPILER_JOB_ALREADY_RUNNING");
    const now = new Date().toISOString();
    const payload: DurableCompilerPayload = { document, audience, templateId, sourcePackManifest };
    await db.prepare("INSERT INTO compiler_runs(id,owner_id,status,stage,revision,lease_until,payload_json,error_code,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
      .bind(runId, ownerId, "queued", null, 0, null, JSON.stringify(payload), null, new Date(Date.now() + COMPILER_JOB_TTL_MS).toISOString(), now, now).run();
    return { runId, status: "queued", stage: null, completedStages: 0, totalStages: 5, error: null, retryable: false, createdAt: now, updatedAt: now };
  }
  pruneCompilerJobs();
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
    sourcePackManifest,
  }).then(() => {
    if (job.status === "cancelled") return;
    job.status = "succeeded";
    job.completedStages = job.totalStages;
    job.updatedAt = new Date().toISOString();
    pruneCompilerJobs();
  }).catch((error) => {
    if (job.status === "cancelled") return;
    job.status = "failed";
    job.error = compilerFailurePayload(error).error;
    job.retryable = true;
    job.updatedAt = new Date().toISOString();
    pruneCompilerJobs();
  });
  return jobView(job);
}

function durableJobView(row: DurableCompilerRow): CompilerJobView {
  const completedStages = row.status === "succeeded" ? 5 : Math.min(4, Math.max(0, row.revision));
  return {
    runId: row.id,
    status: row.status,
    stage: row.stage,
    completedStages,
    totalStages: 5,
    error: row.error_code,
    retryable: row.status === "failed" || row.status === "cancelled",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Acquire a short D1 lease and advance the persisted compiler to a terminal state. */
export async function advanceCompilerRun(runId: string, ownerId: string): Promise<CompilerJobView> {
  const db = sitesDatabase();
  if (!db) return getCompilerRunStatus(runId, ownerId) as Promise<CompilerJobView>;
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + 70_000).toISOString();
  const leased = await db.prepare("UPDATE compiler_runs SET status='running',lease_until=?,error_code=NULL,updated_at=? WHERE id=? AND owner_id=? AND status IN ('queued','failed') AND (lease_until IS NULL OR lease_until<?) RETURNING id,owner_id,status,stage,revision,payload_json,error_code,created_at,updated_at")
    .bind(leaseUntil, now.toISOString(), runId, ownerId, now.toISOString()).first<DurableCompilerRow>();
  if (!leased) {
    const existing = await db.prepare("SELECT id,owner_id,status,stage,revision,payload_json,error_code,created_at,updated_at FROM compiler_runs WHERE id=? AND owner_id=? LIMIT 1").bind(runId, ownerId).first<DurableCompilerRow>();
    if (!existing) throw new Error("COMPILER_RUN_NOT_FOUND");
    return durableJobView(existing);
  }
  const input = JSON.parse(leased.payload_json) as DurableCompilerPayload;
  const stageWrites: Promise<unknown>[] = [];
  try {
    await createCompilerRun(ownerId, input.document, input.audience, input.templateId, {
      runId,
      sourcePackManifest: input.sourcePackManifest,
      onStage: (stage) => {
        stageWrites.push(db.prepare("UPDATE compiler_runs SET stage=?,revision=revision+1,updated_at=? WHERE id=? AND owner_id=? AND status='running'")
          .bind(stage, new Date().toISOString(), runId, ownerId).run());
      },
    });
    await Promise.all(stageWrites);
    const finished = new Date().toISOString();
    await db.prepare("UPDATE compiler_runs SET status='succeeded',stage=NULL,revision=5,lease_until=NULL,payload_json='{}',error_code=NULL,updated_at=? WHERE id=? AND owner_id=?").bind(finished, runId, ownerId).run();
    await deleteRawUploadsForOwner(ownerId);
    return { runId, status: "succeeded", stage: null, completedStages: 5, totalStages: 5, error: null, retryable: false, createdAt: leased.created_at, updatedAt: finished };
  } catch (error) {
    await Promise.allSettled(stageWrites);
    const code = compilerFailurePayload(error).error;
    const failed = new Date().toISOString();
    await db.prepare("UPDATE compiler_runs SET status='failed',lease_until=NULL,payload_json='{}',error_code=?,updated_at=? WHERE id=? AND owner_id=?").bind(code, failed, runId, ownerId).run();
    await deleteRawUploadsForOwner(ownerId);
    return { runId, status: "failed", stage: null, completedStages: leased.revision, totalStages: 5, error: code, retryable: true, createdAt: leased.created_at, updatedAt: failed };
  }
}

export async function getCompilerRunStatus(runId: string, ownerId: string) {
  const db = sitesDatabase();
  if (db) {
    const row = await db.prepare("SELECT id,owner_id,status,stage,revision,payload_json,error_code,created_at,updated_at FROM compiler_runs WHERE id=? AND owner_id=? LIMIT 1").bind(runId, ownerId).first<DurableCompilerRow>();
    if (!row) throw new Error("COMPILER_RUN_NOT_FOUND");
    if (row.status !== "succeeded") return durableJobView(row);
    return getCompilerRun(runId, ownerId);
  }
  const job = compilerJobs.get(runId);
  if (job) {
    if (job.ownerId !== ownerId) throw new Error("COMPILER_RUN_NOT_FOUND");
    if (job.status !== "succeeded") return jobView(job);
  }
  return getCompilerRun(runId, ownerId);
}

export async function cancelCompilerRun(runId: string, ownerId: string): Promise<boolean> {
  const db = sitesDatabase();
  if (db) {
    const result = await db.prepare("UPDATE compiler_runs SET status='cancelled',lease_until=NULL,payload_json='{}',error_code='COMPILATION_CANCELLED',updated_at=? WHERE id=? AND owner_id=? AND status IN ('queued','running')")
      .bind(new Date().toISOString(), runId, ownerId).run();
    const cancelled = Number(result.meta?.changes ?? 0) > 0;
    if (cancelled) await deleteRawUploadsForOwner(ownerId);
    return cancelled;
  }
  const job = compilerJobs.get(runId);
  if (!job || job.ownerId !== ownerId || !["queued", "running"].includes(job.status)) return false;
  job.status = "cancelled";
  job.retryable = true;
  job.updatedAt = new Date().toISOString();
  job.controller.abort();
  pruneCompilerJobs();
  return true;
}

export async function getCompilerRun(runId: string, ownerId: string): Promise<CompilerRunView> {
  return compilerRunView(await getPrivateCompilerRun(runId, ownerId));
}

/** Recent validated courses for an owner. Private source bytes stay omitted. */
export async function listCompilerRuns(ownerId: string): Promise<CompilerRunView[]> {
  const db = sitesDatabase();
  if (db) {
    const rows = await db.prepare("SELECT artifact_key FROM generated_courses WHERE owner_id=? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 20").bind(ownerId).all<{ artifact_key: string }>();
    const records = await Promise.all((rows.results ?? []).map(async ({ artifact_key }) => {
      const object = await sitesUploads().get(artifact_key);
      return object ? await new Response(object.body).json() as CompilerRunRecord : null;
    }));
    return records.filter((record): record is CompilerRunRecord => record !== null).map(compilerRunView);
  }
  const records = await stateBackend().list<CompilerRunRecord>("compiler_run", ownerId);
  return records
    .map(({ payload }) => payload)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .map(compilerRunView);
}

export async function getPrivateCompilerRun(runId: string, ownerId: string): Promise<CompilerRunRecord> {
  const stored = await stateBackend().get<CompilerRunRecord>("compiler_run", runId, ownerId);
  if (stored) return stored.payload;
  const db = sitesDatabase();
  if (db) {
    const row = await db.prepare("SELECT artifact_key FROM generated_courses WHERE id=? AND owner_id=? AND deleted_at IS NULL LIMIT 1").bind(runId, ownerId).first<{ artifact_key: string }>();
    if (row) {
      const object = await sitesUploads().get(row.artifact_key);
      if (object) return await new Response(object.body).json() as CompilerRunRecord;
    }
  }
  throw new Error("COMPILER_RUN_NOT_FOUND");
}

export function compilerFailurePayload(error: unknown) {
  if (error instanceof CompilerFailure) {
    if (error.providerDiagnostic) return { error: error.providerDiagnostic.errorCode === "provider_invalid_response" ? "COMPILER_PROVIDER_INVALID_RESPONSE" : "COMPILER_PROVIDER_UNAVAILABLE", stage: error.stage, provider: error.providerDiagnostic, telemetry: error.telemetry };
    return { error: "COMPILATION_REJECTED", stage: error.stage, issues: error.issues, telemetry: error.telemetry };
  }
  const code = error instanceof Error ? error.message : "COMPILATION_FAILED";
  return { error: ["LIVE_COMPILER_NOT_CONFIGURED", "LIVE_AI_DISABLED", "COMPILER_RUN_QUOTA_EXCEEDED", "COMPILER_JOB_ALREADY_RUNNING"].includes(code) ? code : "COMPILATION_FAILED" };
}

export async function pruneCompilerRuns(now = Date.now()): Promise<void> {
  await stateBackend().prune("compiler_run", new Date(now));
}

export function resetCompilerRunsForTests(): void {
  for (const job of compilerJobs.values()) job.controller.abort();
  resetMemoryStateForTests();
  compilerJobs.clear();
}
