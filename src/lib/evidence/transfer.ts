import {
  CourseArtifactV2Schema,
  canonicalSha256,
  type CourseArtifactV2,
} from "@/lib/compiler";

import {
  EvidenceObservationSchema,
  TransferEventSchema,
  TransferStateSchema,
  type EvidenceObservation,
  type TransferEvent,
  type TransferState,
} from "./contracts";

const noAssistance = { maiaTurns: 0, hints: 0, solutions: 0 } as const;

async function eventId(payload: unknown): Promise<string> {
  return `evt_${(await canonicalSha256(payload)).slice(0, 24)}`;
}

async function makeEvent(
  state: Pick<TransferState, "artifactId" | "artifactSha256" | "blockId" | "events">,
  input: Pick<TransferEvent, "type" | "attemptId" | "answerSha256" | "correct" | "recordedAt">,
): Promise<TransferEvent> {
  const sequence = state.events.length + 1;
  const base = {
    schemaVersion: "1.0" as const,
    sequence,
    type: input.type,
    artifactId: state.artifactId,
    artifactSha256: state.artifactSha256,
    blockId: state.blockId,
    attemptId: input.attemptId,
    answerSha256: input.answerSha256,
    correct: input.correct,
    assistance: noAssistance,
    recordedAt: input.recordedAt,
  };
  return TransferEventSchema.parse({ ...base, id: await eventId(base) });
}

export async function startTransfer(
  artifactInput: CourseArtifactV2,
  blockId: string,
  recordedAt: string,
): Promise<TransferState> {
  const artifact = CourseArtifactV2Schema.parse(artifactInput);
  const block = artifact.blocks[blockId];
  if (!block || block.kind !== "transfer-challenge" || !artifact.transferBlockIds.includes(blockId)) {
    throw new Error("Block is not a registered transfer challenge");
  }
  const artifactSha256 = await canonicalSha256(artifact);
  const shell = { artifactId: artifact.id, artifactSha256, blockId, events: [] as TransferEvent[] };
  const started = await makeEvent(shell, {
    type: "transfer_started",
    attemptId: null,
    answerSha256: null,
    correct: null,
    recordedAt,
  });
  return TransferStateSchema.parse({
    schemaVersion: "1.0",
    artifactId: artifact.id,
    artifactSha256,
    blockId,
    locked: true,
    status: "active",
    correct: null,
    processedAttemptIds: [],
    events: [started],
  });
}

function evaluateAnswer(artifact: CourseArtifactV2, blockId: string, answer: string): boolean {
  const block = artifact.blocks[blockId];
  if (!block || block.kind !== "transfer-challenge") throw new Error("Transfer block is unavailable");
  const spec = artifact.answerSpecs[block.answerSpecId];
  if (!spec) throw new Error("Transfer answer specification is unavailable");
  const normalized = answer.trim();
  if (spec.kind === "numeric") {
    const value = Number(normalized);
    return Number.isFinite(value) && Math.abs(value - spec.value) <= spec.tolerance;
  }
  if (spec.kind === "multiple-choice") return Number(normalized) === spec.correctIndex;
  if (spec.kind === "expression") {
    const compact = normalized.toLowerCase().replace(/\s+/g, "");
    return spec.acceptedForms.some((form) => form.toLowerCase().replace(/\s+/g, "") === compact);
  }
  return false;
}

export async function submitTransferAnswer(input: {
  state: TransferState;
  artifact: CourseArtifactV2;
  attemptId: string;
  answer: string;
  recordedAt: string;
}): Promise<TransferState> {
  const state = TransferStateSchema.parse(input.state);
  const artifact = CourseArtifactV2Schema.parse(input.artifact);
  if (input.answer.length > 500 || !input.answer.trim()) throw new Error("Transfer answer is empty or too large");
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(input.attemptId)) throw new Error("Invalid transfer attempt id");
  if (state.processedAttemptIds.includes(input.attemptId)) return state;
  if (state.status !== "active" || state.processedAttemptIds.length > 0) throw new Error("Transfer permits exactly one scored attempt");
  if (state.artifactId !== artifact.id || state.artifactSha256 !== await canonicalSha256(artifact)) throw new Error("Transfer state is bound to a different artifact version");

  const answerSha256 = await canonicalSha256(input.answer.trim());
  const correct = evaluateAnswer(artifact, state.blockId, input.answer);
  const submitted = await makeEvent(state, {
    type: "answer_submitted",
    attemptId: input.attemptId,
    answerSha256,
    correct: null,
    recordedAt: input.recordedAt,
  });
  const scored = await makeEvent({ ...state, events: [...state.events, submitted] }, {
    type: "transfer_scored",
    attemptId: input.attemptId,
    answerSha256,
    correct,
    recordedAt: input.recordedAt,
  });
  return TransferStateSchema.parse({
    ...state,
    status: "scored",
    correct,
    processedAttemptIds: [input.attemptId],
    events: [...state.events, submitted, scored],
  });
}

export async function buildEvidenceObservation(
  stateInput: TransferState,
  artifactInput: CourseArtifactV2,
): Promise<EvidenceObservation> {
  const state = TransferStateSchema.parse(stateInput);
  const artifact = CourseArtifactV2Schema.parse(artifactInput);
  if (state.status !== "scored" || state.correct === null) throw new Error("Transfer has not been scored");
  const block = artifact.blocks[state.blockId];
  if (!block || block.kind !== "transfer-challenge") throw new Error("Transfer block is unavailable");
  const base = {
    schemaVersion: "1.0" as const,
    kind: "immediate_near_transfer" as const,
    statement: state.correct
      ? "The learner answered one immediate near-transfer task correctly without Maia, hints, or a solution reveal."
      : "The learner did not answer one immediate near-transfer task correctly; Maia, hints, and solution reveal were unavailable.",
    correct: state.correct,
    assistance: noAssistance,
    eventIds: state.events.map((event) => event.id),
    citations: block.citations,
    limitations: [
      "This is one immediate near-transfer observation, not evidence of durable mastery.",
      "No delayed retention or far-transfer task was measured.",
    ],
  };
  return EvidenceObservationSchema.parse({ ...base, id: `obs_${(await canonicalSha256(base)).slice(0, 24)}` });
}

export function reconcileEvidence(
  observationInput: EvidenceObservation,
  eventsInput: TransferEvent[],
): string[] {
  const observation = EvidenceObservationSchema.parse(observationInput);
  const events = eventsInput.map((event) => TransferEventSchema.parse(event));
  const issues: string[] = [];
  const byId = new Map(events.map((event) => [event.id, event]));
  if (observation.eventIds.some((id) => !byId.has(id))) issues.push("unknown_event");
  const scored = events.find((event) => event.type === "transfer_scored");
  if (!scored || scored.correct !== observation.correct) issues.push("score_mismatch");
  if (events.some((event) => event.assistance.maiaTurns !== 0 || event.assistance.hints !== 0 || event.assistance.solutions !== 0)) issues.push("assistance_mismatch");
  return issues;
}
