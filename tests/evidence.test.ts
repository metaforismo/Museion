import { describe, expect, it } from "vitest";

import { CourseArtifactV2Schema } from "@/lib/compiler";
import {
  buildEvidenceObservation,
  reconcileEvidence,
  startTransfer,
  submitTransferAnswer,
} from "@/lib/evidence";
import goldenArtifactJson from "./fixtures/binary-search-course-artifact-v2.json";

const artifact = CourseArtifactV2Schema.parse(goldenArtifactJson);
const recordedAt = "2026-07-15T00:00:00.000Z";

describe("locked transfer and evidence ledger", () => {
  it("records one correct unassisted observation without storing the raw answer", async () => {
    const started = await startTransfer(artifact, "transfer_unseen", recordedAt);
    const scored = await submitTransferAnswer({ state: started, artifact, attemptId: "attempt_1", answer: "4", recordedAt });
    expect(scored.correct).toBe(true);
    expect(scored.events).toHaveLength(3);
    expect(JSON.stringify(scored)).not.toContain('"answer":"4"');
    expect(scored.events.every((event) => event.assistance.maiaTurns === 0 && event.assistance.hints === 0 && event.assistance.solutions === 0)).toBe(true);
    const observation = await buildEvidenceObservation(scored, artifact);
    expect(observation.statement).toContain("one immediate near-transfer task");
    expect(observation.statement).not.toMatch(/mastery|proved understanding/i);
    expect(reconcileEvidence(observation, scored.events)).toEqual([]);
  });

  it("is idempotent for the same attempt id and rejects a second attempt", async () => {
    const started = await startTransfer(artifact, "transfer_unseen", recordedAt);
    const scored = await submitTransferAnswer({ state: started, artifact, attemptId: "attempt_1", answer: "3", recordedAt });
    expect(await submitTransferAnswer({ state: scored, artifact, attemptId: "attempt_1", answer: "999", recordedAt })).toEqual(scored);
    await expect(submitTransferAnswer({ state: scored, artifact, attemptId: "attempt_2", answer: "4", recordedAt })).rejects.toThrow("exactly one");
  });

  it("rejects evidence that points to a forged event", async () => {
    const started = await startTransfer(artifact, "transfer_unseen", recordedAt);
    const scored = await submitTransferAnswer({ state: started, artifact, attemptId: "attempt_1", answer: "4", recordedAt });
    const observation = await buildEvidenceObservation(scored, artifact);
    const forged = { ...observation, eventIds: [...observation.eventIds.slice(0, -1), `evt_${"0".repeat(24)}`] };
    expect(reconcileEvidence(forged, scored.events)).toContain("unknown_event");
  });
});
