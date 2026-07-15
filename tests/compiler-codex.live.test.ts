import { describe, expect, it } from "vitest";

import { CompilerFailure, compileCourse } from "@/lib/compiler/orchestrator";
import { CodexCompilerProvider } from "@/lib/compiler/providers/codex";
import { ingestTextSource } from "@/lib/source";

const LIVE = process.env.MUSEION_LIVE_CODEX === "1";

describe.skipIf(!LIVE)("live Codex subscription compiler", () => {
  it("compiles a non-golden source through Luna, Terra, and Sol", async () => {
    const document = await ingestTextSource({
      title: "The Water Cycle as a System",
      mediaType: "text/plain",
      text: "The water cycle moves water through evaporation, condensation, precipitation, and collection. Solar energy warms liquid water, causing some molecules to enter the atmosphere as water vapor. Plants release water vapor through transpiration. As moist air rises and cools, water vapor condenses into tiny liquid droplets or ice crystals that form clouds. When droplets become heavy enough, gravity carries them to the surface as precipitation. Water collects in rivers, lakes, oceans, soil, and underground aquifers. In a sealed container with warm water and a cool lid, water evaporates, condenses on the lid, and falls back as droplets. Lowering the lid temperature increases cooling at the lid and can increase condensation there.",
    });
    try {
      const result = await compileCourse(document, new CodexCompilerProvider(true), {
        audience: { level: "novice", language: "en", targetMinutes: 8, learnerGoal: "Explain the cycle and apply it to a sealed-container observation." },
        templateId: "teach-it-back",
        timeoutMs: 190_000,
      });
      expect(result.artifact.validation.status).toBe("accepted");
      expect(result.telemetry.map((stage) => stage.resolvedModel)).toContain("gpt-5.6-luna");
      expect(result.telemetry.map((stage) => stage.resolvedModel)).toContain("gpt-5.6-terra");
      expect(result.telemetry.map((stage) => stage.resolvedModel)).toContain("gpt-5.6-sol");
    } catch (error) {
      if (error instanceof CompilerFailure) {
        console.error(JSON.stringify({ stage: error.stage, issues: error.issues.map(({ code, path, message }) => ({ code, path, message })) }));
      }
      throw error;
    }
  }, 600_000);
});
