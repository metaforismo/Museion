import { describe, expect, it } from "vitest";
import type { DashboardSnapshot } from "@/lib/dashboard";
import { maiaNextStepReason } from "@/lib/maia/next-step";

const action = (reason: string, kind: DashboardSnapshot["nextAction"]["kind"] = "launch"): DashboardSnapshot["nextAction"] => ({ kind, reason, title: "Synthetic course", description: "Synthetic next step", href: "/library" });

describe("Maia explains the engine's recommendation", () => {
  it("explains a first step without inventing learning history", () => {
    expect(maiaNextStepReason(action("There is no learning record yet."))).toContain("start with a small, guided discovery");
  });
  it("explains saved preferences as choices, not an assessment", () => {
    expect(maiaNextStepReason(action("Your onboarding preference selected this starting course."))).toContain("interest you chose");
  });
  it("explains the actual incomplete lesson and leaves its destination unchanged", () => {
    const original = action("This is your most recent incomplete authored lesson.", "resume");
    const before = structuredClone(original);
    expect(maiaNextStepReason(original)).toContain("lesson in progress");
    expect(original).toEqual(before);
  });
  it("preserves new factual engine reasons rather than guessing", () => {
    expect(maiaNextStepReason(action("A new recorded signal."))).toBe("A new recorded signal.");
  });
});
