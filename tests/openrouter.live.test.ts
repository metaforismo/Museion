import { writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { evaluateMaia } from "@/lib/maia/evaluate";
import { OpenRouterTutorProvider } from "@/lib/maia/openrouter-provider";

// Explicit opt-in; ordinary tests never consume network/free-model quota.
const LIVE = process.env.MUSEION_RUN_OPENROUTER_LIVE_EVAL === "1";

describe.skipIf(!LIVE)("Maia synthetic free-router live evaluation", () => {
  it("delivers safe tutoring and records actual models without private data", { timeout: 110_000 }, async () => {
    const provider = new OpenRouterTutorProvider();
    expect(provider.available()).toBe(true);
    const report = await evaluateMaia(provider);
    // Only classifications/provenance are printed, never prompts or model text.
    console.info("Maia synthetic evaluation", JSON.stringify(report));
    const reportPath = process.env.MUSEION_MAIA_EVAL_REPORT_PATH;
    if (reportPath) {
      // Explicit artifact opt-in, also written when assertions below fail.
      // evaluateMaia returns classifications/counts/model IDs only: no account
      // IDs, exercise answers, prompts, candidate text, reasoning or credentials.
      await writeFile(reportPath, JSON.stringify({
        schemaVersion: "1.0",
        generatedAt: new Date().toISOString(),
        scope: "Four synthetic active-lesson turns through the server delivery gate; not a general jailbreak or teaching-quality certification.",
        ...report,
      }, null, 2), { encoding: "utf8", mode: 0o600 });
    }
    expect(report.safe).toBe(true);
    // A safe fallback alone is not evidence that the live provider works.
    expect(report.liveTurns).toBeGreaterThan(0);
    for (const item of report.cases.filter((item) => item.source !== "deterministic")) {
      expect(item.source).toBe("openrouter-free");
      expect(item.requestedModel).toBe("openrouter/free");
      expect(item.resolvedModel).not.toBe("openrouter/free");
    }
  });
});
