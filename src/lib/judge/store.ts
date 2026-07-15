import goldenArtifactInput from "../../../tests/fixtures/binary-search-course-artifact-v2.json";

import {
  CourseArtifactV2Schema,
  toPublicCourseArtifact,
  type CourseArtifactV2,
} from "@/lib/compiler";
import {
  buildEvidenceObservation,
  startTransfer,
  submitTransferAnswer,
  type EvidenceObservation,
  type TransferState,
} from "@/lib/evidence";
import {
  initializeBlock,
  buildRuntimeTutorIntervention,
  reduceBlock,
  type InteractiveBlock,
  type RuntimeAction,
  type RuntimeOutcome,
  type RuntimeState,
  type RuntimeTutorIntervention,
} from "@/lib/runtime";
import { resetMemoryStateForTests, stateBackend } from "@/lib/server/durable-state";

import { JudgeSessionViewSchema, type JudgeSessionView } from "./contracts";

interface JudgeSessionRecord {
  id: string;
  ownerId: string;
  clientRunId: string;
  artifact: CourseArtifactV2;
  mode: "verified-replay" | "generated-course";
  states: Record<string, RuntimeState>;
  transfer: TransferState | null;
  observation: EvidenceObservation | null;
  createdAt: string;
  updatedAt: string;
}

const goldenArtifact = CourseArtifactV2Schema.parse(goldenArtifactInput);
export const JUDGE_SESSION_TTL_MS = 24 * 60 * 60 * 1_000;
export const MAX_JUDGE_SESSIONS_PER_OWNER = 10;

async function pruneJudgeSessions(now = Date.now()): Promise<void> {
  await stateBackend().prune("judge_session", new Date(now));
}

function interactiveBlocks(artifact: CourseArtifactV2): InteractiveBlock[] {
  return artifact.lessons.flatMap((lesson) => lesson.blockIds)
    .map((id) => artifact.blocks[id])
    .filter((block): block is InteractiveBlock =>
      block?.kind === "prediction-choice" ||
      block?.kind === "sequence-builder" ||
      block?.kind === "range-explorer" ||
      block?.kind === "state-trace",
    );
}

function isComplete(state: RuntimeState): boolean {
  if (state.kind === "range-explorer") return state.status !== "active";
  if (state.kind === "state-trace") return state.complete;
  return state.complete && state.correct === true;
}

async function requireOwnedSession(sessionId: string, ownerId: string): Promise<JudgeSessionRecord> {
  const stored = await stateBackend().get<JudgeSessionRecord>("judge_session", sessionId, ownerId);
  if (!stored) throw new Error("JUDGE_SESSION_NOT_FOUND");
  return stored.payload;
}

async function saveRecord(record: JudgeSessionRecord): Promise<void> {
  await stateBackend().put({
    namespace: "judge_session",
    id: record.id,
    ownerId: record.ownerId,
    payload: record,
    expiresAt: new Date(Date.parse(record.updatedAt) + JUDGE_SESSION_TTL_MS).toISOString(),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

function view(record: JudgeSessionRecord): JudgeSessionView {
  const completedBlockIds = Object.entries(record.states)
    .filter(([, state]) => isComplete(state))
    .map(([id]) => id);
  return JudgeSessionViewSchema.parse({
    schemaVersion: "1.0",
    sessionId: record.id,
    mode: record.mode,
    artifact: toPublicCourseArtifact(record.artifact),
    blockStates: record.states,
    completedBlockIds,
    transfer: {
      status: record.transfer?.status ?? "locked",
      correct: record.transfer?.correct ?? null,
      observation: record.observation,
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export async function createJudgeSession(
  ownerId: string,
  clientRunId: string,
  artifact: CourseArtifactV2 = goldenArtifact,
): Promise<JudgeSessionView> {
  const backend = stateBackend();
  await pruneJudgeSessions();
  const owned = await backend.list<JudgeSessionRecord>("judge_session", ownerId);
  const existing = owned.find(({ payload }) => payload.artifact.id === artifact.id && payload.clientRunId === clientRunId);
  if (existing) return view(existing.payload);
  if (owned.length >= MAX_JUDGE_SESSIONS_PER_OWNER) {
    throw new Error("JUDGE_SESSION_QUOTA_EXCEEDED");
  }
  const now = new Date().toISOString();
  const states = Object.fromEntries(
    interactiveBlocks(artifact).map((block) => [block.id, initializeBlock(block)]),
  );
  const record: JudgeSessionRecord = {
    id: crypto.randomUUID(),
    ownerId,
    clientRunId,
    artifact: structuredClone(artifact),
    mode: artifact.id === goldenArtifact.id ? "verified-replay" : "generated-course",
    states,
    transfer: null,
    observation: null,
    createdAt: now,
    updatedAt: now,
  };
  await saveRecord(record);
  return view(record);
}

export async function getJudgeSession(sessionId: string, ownerId: string): Promise<JudgeSessionView> {
  await pruneJudgeSessions();
  return view(await requireOwnedSession(sessionId, ownerId));
}

export async function dispatchJudgeAction(input: {
  sessionId: string;
  ownerId: string;
  blockId: string;
  action: RuntimeAction;
}): Promise<{ session: JudgeSessionView; outcome: RuntimeOutcome; tutor: RuntimeTutorIntervention | null }> {
  await pruneJudgeSessions();
  const record = await requireOwnedSession(input.sessionId, input.ownerId);
  if (record.transfer) throw new Error("TRANSFER_ALREADY_STARTED");
  const block = record.artifact.blocks[input.blockId];
  const state = record.states[input.blockId];
  if (!block || !state || !interactiveBlocks(record.artifact).some((item) => item.id === block.id)) {
    throw new Error("UNKNOWN_INTERACTIVE_BLOCK");
  }
  const interactiveBlock = block as InteractiveBlock;
  const outcome = reduceBlock(interactiveBlock, state, input.action);
  const tutor = buildRuntimeTutorIntervention({
    artifactId: record.artifact.id,
    block: interactiveBlock,
    stateBefore: state,
    action: input.action,
    outcome,
  });
  record.states[input.blockId] = outcome.state;
  record.updatedAt = new Date().toISOString();
  await saveRecord(record);
  return { session: view(record), outcome, tutor };
}

export async function updateJudgeTransfer(input: {
  sessionId: string;
  ownerId: string;
  kind: "start" | "submit";
  attemptId?: string;
  answer?: string;
}): Promise<JudgeSessionView> {
  await pruneJudgeSessions();
  const record = await requireOwnedSession(input.sessionId, input.ownerId);
  if (!interactiveBlocks(record.artifact).every((block) => isComplete(record.states[block.id]))) {
    throw new Error("TRANSFER_LOCKED");
  }
  const blockId = record.artifact.transferBlockIds[0];
  if (input.kind === "start") {
    if (!record.transfer) record.transfer = await startTransfer(record.artifact, blockId, new Date().toISOString());
  } else {
    if (!record.transfer) throw new Error("TRANSFER_NOT_STARTED");
    record.transfer = await submitTransferAnswer({
      state: record.transfer,
      artifact: record.artifact,
      attemptId: input.attemptId ?? "",
      answer: input.answer ?? "",
      recordedAt: new Date().toISOString(),
    });
    record.observation = await buildEvidenceObservation(record.transfer, record.artifact);
  }
  record.updatedAt = new Date().toISOString();
  await saveRecord(record);
  return view(record);
}

export async function deleteJudgeSession(sessionId: string, ownerId: string): Promise<boolean> {
  await requireOwnedSession(sessionId, ownerId);
  return stateBackend().delete("judge_session", sessionId, ownerId);
}

export function resetJudgeStoreForTests(): void {
  resetMemoryStateForTests();
}
