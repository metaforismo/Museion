import { describe, expect, it } from "vitest";

import { DashboardSnapshotSchema, buildDashboardSnapshot } from "@/lib/dashboard";
import { getLesson } from "@/lib/content";
import { LearnerSession } from "@/lib/engine/session";
import { getOrCreateProfile, saveSession } from "@/lib/store";

describe("dashboard snapshot", () => {
  it("returns a strict, truthful empty-state snapshot", async () => {
    const snapshot = await buildDashboardSnapshot("dashboard-empty-owner");
    expect(() => DashboardSnapshotSchema.parse(snapshot)).not.toThrow();
    expect(snapshot.nextAction.reason).toContain("no learning record");
    expect(snapshot.evidence).toEqual([]);
    expect(snapshot.limitations.join(" ")).toMatch(/Retention is not measured/);
  });

  it("prioritizes a real incomplete session and projects registered misconceptions", async () => {
    const owner = "dashboard-active-owner";
    const lesson = getLesson("linear-equations-intro")!;
    const profile = getOrCreateProfile(owner);
    const session = new LearnerSession(lesson, "lesson", profile.mastery);
    session.submitAnswer("2");
    saveSession(session, owner);

    const snapshot = await buildDashboardSnapshot(owner);
    expect(snapshot.nextAction.href).toBe(`/lessons/${lesson.id}`);
    expect(snapshot.activeLearning[0]).toMatchObject({ title: lesson.title, kind: "authored" });
    expect(snapshot.misconceptions.length).toBeGreaterThan(0);
    expect(snapshot.reviewQueue[0].priority).toBe("high");
  });
});
