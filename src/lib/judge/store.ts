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
import { resetMemoryStateForTests, stateBackend, type StateRecord } from "@/lib/server/durable-state";

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
  revision: number;
  recentCommands: Record<string, JudgeCommandReceipt>;
  commandOrder: string[];
  createdAt: string;
  updatedAt: string;
}

interface JudgeCommandReceipt {
  fingerprint: string;
  outcome: RuntimeOutcome | null;
  tutor: RuntimeTutorIntervention | null;
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

async function stableSessionId(ownerId: string, clientRunId: string, artifactId: string): Promise<string> {
  const input = new TextEncoder().encode(`museion:judge:${ownerId}:${clientRunId}:${artifactId}`);
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", input)).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function requireOwnedSession(sessionId: string, ownerId: string): Promise<StateRecord<JudgeSessionRecord>> {
  const stored = await stateBackend().get<JudgeSessionRecord>("judge_session", sessionId, ownerId);
  if (!stored) throw new Error("JUDGE_SESSION_NOT_FOUND");
  return stored;
}

function persistedRecord(record: JudgeSessionRecord): StateRecord<JudgeSessionRecord> {
  return {
    namespace: "judge_session",
    id: record.id,
    ownerId: record.ownerId,
    payload: record,
    expiresAt: new Date(Date.parse(record.updatedAt) + JUDGE_SESSION_TTL_MS).toISOString(),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function saveNewRecord(record: JudgeSessionRecord): Promise<void> {
  await stateBackend().put(persistedRecord(record));
}

function monotonicTimestamp(previous: string): string {
  return new Date(Math.max(Date.now(), Date.parse(previous) + 1)).toISOString();
}

async function commandFingerprint(value: unknown): Promise<string> {
  const input = new TextEncoder().encode(JSON.stringify(value));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function receipt(record: JudgeSessionRecord, commandId: string, fingerprint: string): JudgeCommandReceipt | null {
  const existing = record.recentCommands?.[commandId];
  if (!existing) return null;
  if (existing.fingerprint !== fingerprint) throw new Error("JUDGE_COMMAND_ID_REUSED");
  return existing;
}

function rememberCommand(record: JudgeSessionRecord, commandId: string, value: JudgeCommandReceipt): void {
  record.recentCommands ??= {};
  record.commandOrder ??= [];
  record.recentCommands[commandId] = value;
  record.commandOrder.push(commandId);
  while (record.commandOrder.length > 32) {
    const expired = record.commandOrder.shift();
    if (expired) delete record.recentCommands[expired];
  }
}

async function saveMutation(record: JudgeSessionRecord, storedUpdatedAt: string): Promise<void> {
  record.revision = (record.revision ?? 0) + 1;
  record.updatedAt = monotonicTimestamp(storedUpdatedAt);
  if (!await stateBackend().compareAndPut(persistedRecord(record), storedUpdatedAt)) {
    throw new Error("JUDGE_VERSION_CONFLICT");
  }
}

function view(record: JudgeSessionRecord): JudgeSessionView {
  const completedBlockIds = Object.entries(record.states)
    .filter(([, state]) => isComplete(state))
    .map(([id]) => id);
  return JudgeSessionViewSchema.parse({
    schemaVersion: "1.0",
    sessionId: record.id,
    revision: record.revision ?? 0,
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
    id: await stableSessionId(ownerId, clientRunId, artifact.id),
    ownerId,
    clientRunId,
    artifact: structuredClone(artifact),
    mode: artifact.id === goldenArtifact.id ? "verified-replay" : "generated-course",
    states,
    transfer: null,
    observation: null,
    revision: 0,
    recentCommands: {},
    commandOrder: [],
    createdAt: now,
    updatedAt: now,
  };
  await saveNewRecord(record);
  return view(record);
}

export async function getJudgeSession(sessionId: string, ownerId: string): Promise<JudgeSessionView> {
  await pruneJudgeSessions();
  return view((await requireOwnedSession(sessionId, ownerId)).payload);
}

/** Owner-scoped, public-safe generated learning history. */
export async function listJudgeSessions(ownerId: string): Promise<JudgeSessionView[]> {
  await pruneJudgeSessions();
  const records = await stateBackend().list<JudgeSessionRecord>("judge_session", ownerId);
  return records
    .map(({ payload }) => payload)
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .map(view);
}

export async function dispatchJudgeAction(input: {
  sessionId: string;
  ownerId: string;
  blockId: string;
  action: RuntimeAction;
  expectedRevision: number;
  commandId: string;
}): Promise<{ session: JudgeSessionView; outcome: RuntimeOutcome; tutor: RuntimeTutorIntervention | null }> {
  await pruneJudgeSessions();
  const stored = await requireOwnedSession(input.sessionId, input.ownerId);
  const record = stored.payload;
  const fingerprint = await commandFingerprint({ blockId: input.blockId, action: input.action });
  const replay = receipt(record, input.commandId, fingerprint);
  if (replay?.outcome) return { session: view(record), outcome: replay.outcome, tutor: replay.tutor };
  if ((record.revision ?? 0) !== input.expectedRevision) throw new Error("JUDGE_VERSION_CONFLICT");
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
  rememberCommand(record, input.commandId, { fingerprint, outcome, tutor });
  await saveMutation(record, stored.updatedAt);
  return { session: view(record), outcome, tutor };
}

export async function updateJudgeTransfer(input: {
  sessionId: string;
  ownerId: string;
  kind: "start" | "submit";
  attemptId?: string;
  answer?: string;
  expectedRevision: number;
  commandId: string;
}): Promise<JudgeSessionView> {
  await pruneJudgeSessions();
  const stored = await requireOwnedSession(input.sessionId, input.ownerId);
  const record = stored.payload;
  const fingerprint = await commandFingerprint({ kind: input.kind, attemptId: input.attemptId, answer: input.answer });
  if (receipt(record, input.commandId, fingerprint)) return view(record);
  if ((record.revision ?? 0) !== input.expectedRevision) throw new Error("JUDGE_VERSION_CONFLICT");
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
  rememberCommand(record, input.commandId, { fingerprint, outcome: null, tutor: null });
  await saveMutation(record, stored.updatedAt);
  return view(record);
}

export async function deleteJudgeSession(sessionId: string, ownerId: string): Promise<boolean> {
  await requireOwnedSession(sessionId, ownerId);
  return stateBackend().delete("judge_session", sessionId, ownerId);
}

export function resetJudgeStoreForTests(): void {
  resetMemoryStateForTests();
}
