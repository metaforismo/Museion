import { afterEach, describe, expect, it } from "vitest";

import {
  BALANCED_COMPILER_ROUTING,
  BALANCED_TUTOR_MODEL,
  familyFallbacks,
  GPT56_MODELS,
  isGpt56Model,
} from "@/lib/ai/model-routing";
import { localAiRequestAllowed } from "@/lib/ai/request-guard";
import { COURSE_TEMPLATES, CourseTemplateIdSchema } from "@/lib/compiler/templates";

describe("Build Week GPT-5.6 routing", () => {
  const originalLocalAi = process.env.MUSEION_LOCAL_AI;

  afterEach(() => {
    if (originalLocalAi === undefined) delete process.env.MUSEION_LOCAL_AI;
    else process.env.MUSEION_LOCAL_AI = originalLocalAi;
  });

  it("routes extraction to Luna, pedagogy to Terra, and publication gates to Sol", () => {
    expect(BALANCED_COMPILER_ROUTING).toEqual({
      source_graph: GPT56_MODELS.luna,
      blueprint: GPT56_MODELS.terra,
      course_artifact: GPT56_MODELS.terra,
      critic: GPT56_MODELS.sol,
      repair: GPT56_MODELS.sol,
    });
    expect(BALANCED_TUTOR_MODEL).toBe(GPT56_MODELS.terra);
  });

  it("falls forward only inside the GPT-5.6 family", () => {
    expect(familyFallbacks(GPT56_MODELS.luna)).toEqual([GPT56_MODELS.terra, GPT56_MODELS.sol]);
    expect(familyFallbacks(GPT56_MODELS.terra)).toEqual([GPT56_MODELS.sol]);
    expect(familyFallbacks(GPT56_MODELS.sol)).toEqual([]);
    expect(Object.values(GPT56_MODELS).every(isGpt56Model)).toBe(true);
    expect(isGpt56Model("gpt-4o")).toBe(false);
  });

  it("ships three valid server-owned pedagogy templates", () => {
    expect(Object.keys(COURSE_TEMPLATES)).toHaveLength(3);
    Object.entries(COURSE_TEMPLATES).forEach(([id, template]) => {
      expect(CourseTemplateIdSchema.parse(id)).toBe(id);
      expect(template.requiredKinds.length).toBeGreaterThan(0);
      expect(template.instructions.length).toBeGreaterThan(20);
    });
  });

  it("allows local AI mutations only when explicitly enabled on loopback", () => {
    process.env.MUSEION_LOCAL_AI = "1";
    expect(localAiRequestAllowed(new Request("http://localhost:3000/api/ai/status", { headers: { origin: "http://localhost:3000" } }))).toBe(true);
    expect(localAiRequestAllowed(new Request("https://museion.example/api/ai/status", { headers: { origin: "https://museion.example" } }))).toBe(false);
    process.env.MUSEION_LOCAL_AI = "0";
    expect(localAiRequestAllowed(new Request("http://localhost:3000/api/ai/status"))).toBe(false);
  });
});
