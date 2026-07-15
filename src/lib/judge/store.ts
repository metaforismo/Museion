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

interface JudgeStore {
  sessions: Map<string, JudgeSessionRecord>;
  runKeys: Map<string, string>;
}

const globalJudgeStore = globalThis as typeof globalThis & {
  __museionJudgeStore?: JudgeStore;
};

const store = globalJudgeStore.__museionJudgeStore ?? {
  sessions: new Map<string, JudgeSessionRecord>(),
  runKeys: new Map<string, string>(),
};
globalJudgeStore.__museionJudgeStore = store;

const goldenArtifact = CourseArtifactV2Schema.parse(goldenArtifactInput);

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

function requireOwnedSession(sessionId: string, ownerId: string): JudgeSessionRecord {
  const record = store.sessions.get(sessionId);
  if (!record || record.ownerId !== ownerId) throw new Error("JUDGE_SESSION_NOT_FOUND");
  return record;
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

export function createJudgeSession(
  ownerId: string,
  clientRunId: string,
  artifact: CourseArtifactV2 = goldenArtifact,
): JudgeSessionView {
  const runKey = `${ownerId}:${artifact.id}:${clientRunId}`;
  const existingId = store.runKeys.get(runKey);
  if (existingId) {
    const existing = store.sessions.get(existingId);
    if (existing) return view(existing);
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
  store.sessions.set(record.id, record);
  store.runKeys.set(runKey, record.id);
  return view(record);
}

export function getJudgeSession(sessionId: string, ownerId: string): JudgeSessionView {
  return view(requireOwnedSession(sessionId, ownerId));
}

export function dispatchJudgeAction(input: {
  sessionId: string;
  ownerId: string;
  blockId: string;
  action: RuntimeAction;
}): { session: JudgeSessionView; outcome: RuntimeOutcome; tutor: RuntimeTutorIntervention | null } {
  const record = requireOwnedSession(input.sessionId, input.ownerId);
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
  return { session: view(record), outcome, tutor };
}

export async function updateJudgeTransfer(input: {
  sessionId: string;
  ownerId: string;
  kind: "start" | "submit";
  attemptId?: string;
  answer?: string;
}): Promise<JudgeSessionView> {
  const record = requireOwnedSession(input.sessionId, input.ownerId);
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
  return view(record);
}

export function deleteJudgeSession(sessionId: string, ownerId: string): boolean {
  const record = requireOwnedSession(sessionId, ownerId);
  store.runKeys.delete(`${record.ownerId}:${record.artifact.id}:${record.clientRunId}`);
  return store.sessions.delete(sessionId);
}

export function resetJudgeStoreForTests(): void {
  store.sessions.clear();
  store.runKeys.clear();
}
