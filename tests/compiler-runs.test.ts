import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createCompilerRun,
  enqueueCompilerRun,
  getCompilerRun,
  getCompilerRunStatus,
  resetCompilerRunsForTests,
} from "@/lib/compiler";
import { resetAiSettingsForTests, updateAiSettings } from "@/lib/ai/settings";
import { ingestTextSource, SourceDocumentSchema } from "@/lib/source";
import goldenDocumentJson from "./fixtures/binary-search-source-document.json";

const audience = {
  level: "novice" as const,
  language: "en",
  targetMinutes: 12,
  learnerGoal: "Trace inclusive binary search and justify every boundary update.",
};

describe("compiler run lifecycle", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    resetCompilerRunsForTests();
    resetAiSettingsForTests();
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });

  it("creates an owner-bound golden replay run with only public artifact truth", async () => {
    const view = await createCompilerRun(
      "creator-a",
      SourceDocumentSchema.parse(goldenDocumentJson),
      audience,
    );
    expect(view.mode).toBe("replay");
    expect(view.validation.status).toBe("accepted");
    expect((await getCompilerRun(view.runId, "creator-a")).runId).toBe(view.runId);
    await expect(getCompilerRun(view.runId, "creator-b")).rejects.toThrow("COMPILER_RUN_NOT_FOUND");
    const serialized = JSON.stringify(view);
    expect(serialized).not.toContain("answerSpecs");
    expect(serialized).not.toContain("correctOrder");
    expect(serialized).not.toContain("expectedStates");
  });

  it("fails closed for arbitrary sources when the live provider is absent", async () => {
    const document = await ingestTextSource({
      title: "A small source",
      text: "A triangle has three sides. The interior angles sum to 180 degrees.",
      mediaType: "text/plain",
    });
    await expect(createCompilerRun("creator-a", document, audience)).rejects.toThrow(
      "LIVE_COMPILER_NOT_CONFIGURED",
    );
  });

  it("never falls through to a configured API key while offline mode is selected", async () => {
    process.env.OPENAI_API_KEY = "must-not-be-used";
    updateAiSettings({ provider: "offline" });
    const document = await ingestTextSource({
      title: "Offline source",
      text: "Photosynthesis converts light energy into chemical energy in plants.",
      mediaType: "text/plain",
    });
    await expect(createCompilerRun("creator-a", document, audience)).rejects.toThrow("LIVE_COMPILER_NOT_CONFIGURED");
  });

  it("queues once, rejects duplicate clicks, and exposes the completed golden result", async () => {
    const document = SourceDocumentSchema.parse(goldenDocumentJson);
    const queued = await enqueueCompilerRun("creator-a", document, audience, "exam-practice");
    expect(queued.status).toBe("queued");
    await expect(enqueueCompilerRun("creator-a", document, audience, "exam-practice")).rejects.toThrow("COMPILER_JOB_ALREADY_RUNNING");
    let view = await getCompilerRunStatus(queued.runId, "creator-a");
    for (let attempt = 0; attempt < 20 && "status" in view && view.status !== "succeeded"; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      view = await getCompilerRunStatus(queued.runId, "creator-a");
    }
    expect(view.status).toBe("succeeded");
    expect("templateId" in view && view.templateId).toBe("exam-practice");
  });

  it("returns the same active job for an idempotent retry", async () => {
    const document = SourceDocumentSchema.parse(goldenDocumentJson);
    const requestId = "123e4567-e89b-42d3-a456-426614174000";
    const queued = await enqueueCompilerRun("creator-a", document, audience, "exam-practice", requestId);
    const retried = await enqueueCompilerRun("creator-a", document, audience, "exam-practice", requestId);

    expect(retried).toEqual(queued);
    expect(retried.runId).toBe(requestId);

    let view = await getCompilerRunStatus(requestId, "creator-a");
    for (let attempt = 0; attempt < 20 && "status" in view && view.status !== "succeeded"; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      view = await getCompilerRunStatus(requestId, "creator-a");
    }
    expect(view.status).toBe("succeeded");
  });

  it("caps retained compiler runs per owner", async () => {
    const document = SourceDocumentSchema.parse(goldenDocumentJson);
    for (let index = 0; index < 5; index += 1) {
      await createCompilerRun("creator-a", document, audience);
    }
    await expect(createCompilerRun("creator-a", document, audience)).rejects.toThrow(
      "COMPILER_RUN_QUOTA_EXCEEDED",
    );
  });
});
