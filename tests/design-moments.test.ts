import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MOMENT_KINDS, momentCopy, verifiedMomentFor } from "@/lib/design/moments";

describe("momentCopy", () => {
  it.each(MOMENT_KINDS)("gives %s a title and a justifying evidence line", (kind) => {
    const copy = momentCopy(kind);
    expect(copy.title.length).toBeGreaterThan(0);
    expect(copy.evidence.length).toBeGreaterThan(0);
  });

  it("states the unaided condition for a transfer", () => {
    expect(momentCopy("transfer").evidence).toContain("no hints");
  });

  it("keeps the transfer line in step with the observation the engine writes", () => {
    // src/lib/evidence/transfer.ts is the only place that decides what an
    // unaided transfer means. If that statement changes, this copy is a lie.
    const engine = readFileSync("src/lib/evidence/transfer.ts", "utf8");
    expect(engine).toContain("without Maia, hints, or a solution reveal");
  });

  it("never claims durable mastery", () => {
    for (const kind of MOMENT_KINDS) {
      const combined = `${momentCopy(kind).title} ${momentCopy(kind).evidence}`.toLowerCase();
      expect(combined).not.toContain("mastered");
      expect(combined).not.toContain("mastery");
    }
  });

  it("does not overclaim an in-session correction as a resolved concept", () => {
    // The snapshot's "corrected-in-session" only means a later answer on the
    // same step was correct within the same session; the dashboard's own chip
    // calls it "worth rechecking".
    const copy = momentCopy("misconception-resolved");
    expect(`${copy.title} ${copy.evidence}`).toContain("session");
    expect(copy.evidence).toContain("recheck");
  });

  it("introduces no streaks, points, badges or counters", () => {
    const banned = ["streak", " xp", "points", "badge", "level up", "in a row"];
    for (const kind of MOMENT_KINDS) {
      const combined = `${momentCopy(kind).title} ${momentCopy(kind).evidence}`.toLowerCase();
      for (const word of banned) expect(combined).not.toContain(word);
    }
  });
});

describe("verifiedMomentFor", () => {
  const empty = {
    journey: { lessonsCompleted: 0, coursesCompleted: 0, unassistedTransfers: 0, conceptsObserved: 0 },
    misconceptions: [],
  };
  const corrected = [
    {
      id: "m1",
      concept: "Balance",
      label: "Subtracts from one side only",
      status: "corrected-in-session" as const,
      observedAt: new Date().toISOString(),
      href: "/lessons/a",
    },
  ];

  it("fires for nothing when the record holds nothing", () => {
    expect(verifiedMomentFor(empty)).toBeNull();
  });

  it("does not fire on completed lessons alone — completion is not a verified moment", () => {
    expect(verifiedMomentFor({ ...empty, journey: { ...empty.journey, lessonsCompleted: 9 } })).toBeNull();
  });

  it("does not fire on an unresolved misconception", () => {
    expect(
      verifiedMomentFor({ ...empty, misconceptions: [{ ...corrected[0], status: "observed" as const }] }),
    ).toBeNull();
  });

  it("fires for an unaided transfer", () => {
    expect(verifiedMomentFor({ ...empty, journey: { ...empty.journey, unassistedTransfers: 1 } })).toBe("transfer");
  });

  it("fires for a completed course path", () => {
    expect(verifiedMomentFor({ ...empty, journey: { ...empty.journey, coursesCompleted: 1 } })).toBe("course-complete");
  });

  it("fires for an in-session correction", () => {
    expect(verifiedMomentFor({ ...empty, misconceptions: corrected })).toBe("misconception-resolved");
  });

  it("reports the strongest moment when several apply", () => {
    expect(
      verifiedMomentFor({
        journey: { lessonsCompleted: 9, coursesCompleted: 2, unassistedTransfers: 1, conceptsObserved: 5 },
        misconceptions: corrected,
      }),
    ).toBe("transfer");
  });
});

describe("bloom animation", () => {
  const globals = readFileSync("src/app/globals.css", "utf8");

  it("defines the bloom keyframes", () => {
    expect(globals).toContain("@keyframes verified-bloom");
  });

  it("disables the bloom under reduced motion", () => {
    const reducedMotionBlock = globals.slice(globals.indexOf("prefers-reduced-motion"));
    expect(reducedMotionBlock).toContain("animate-verified-bloom");
  });

  it("never loops — a repeating celebration stops being about the thing it marks", () => {
    const rule = globals.slice(globals.indexOf(".animate-verified-bloom"));
    expect(rule.slice(0, rule.indexOf("}"))).not.toContain("infinite");
  });
});
