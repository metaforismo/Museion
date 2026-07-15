import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createCompilerRun,
  getCompilerRun,
  resetCompilerRunsForTests,
} from "@/lib/compiler";
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
