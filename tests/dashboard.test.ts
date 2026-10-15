import { describe, expect, it } from "vitest";

import { DashboardSnapshotSchema, buildDashboardSnapshot } from "@/lib/dashboard";
import { getLesson } from "@/lib/content";
import { createJudgeSession } from "@/lib/judge";
import { LearnerSession } from "@/lib/engine/session";
import { buildPracticeLesson } from "@/lib/engine/practice";
import { getOrCreateProfile, saveSession } from "@/lib/store";

describe("dashboard snapshot", () => {
  it("returns a strict, truthful empty-state snapshot", async () => {
    const snapshot = await buildDashboardSnapshot("dashboard-empty-owner");
    expect(() => DashboardSnapshotSchema.parse(snapshot)).not.toThrow();
    expect(snapshot.nextAction.reason).toContain("no learning record");
    expect(snapshot.nextAction.title).toBe("Start Algebra as Balance");
    expect(snapshot.nextAction.href).toBe("/lessons/algebra-balance-equality-as-invariant?course=algebra-as-balance");
    expect(snapshot.evidence).toEqual([]);
    expect(snapshot.limitations.join(" ")).toMatch(/Retention is not measured/);
  });

  it("does not surface retired public hackathon sessions as personal courses", async () => {
    const owner = "dashboard-retired-fixture-owner";
    await createJudgeSession(owner, "retired-fixture-browser-run");

    const snapshot = await buildDashboardSnapshot(owner);

    expect(snapshot.activeLearning).toEqual([]);
    expect(snapshot.nextAction.href).toMatch(/^\/lessons\//);
    expect(JSON.stringify(snapshot)).not.toContain('"/judge"');
  });

  it("uses the saved starting interest for a new learner, without claiming assessed mastery", async () => {
    const snapshot = await buildDashboardSnapshot("dashboard-personalized-new-owner", { suggestedCourseId: "search-by-halving" });
    expect(snapshot.nextAction.href).toContain("?course=search-by-halving");
    expect(snapshot.nextAction.reason).toBe("Your onboarding preference selected this starting course.");
    expect(snapshot.evidence).toEqual([]);
    expect(snapshot.journey.lessonsCompleted).toBe(0);
  });

  it("ignores an invalid stored starter and preserves an unfinished lesson over a preference", async () => {
    const invalid = await buildDashboardSnapshot("dashboard-invalid-start-owner", { suggestedCourseId: "unknown-course" });
    expect(invalid.nextAction.title).toBe("Start Algebra as Balance");
    const owner = "dashboard-personalized-existing-owner";
    const lesson = getLesson("linear-equations-intro")!;
    const profile = getOrCreateProfile(owner);
    saveSession(new LearnerSession(lesson, "lesson", profile.mastery), owner);
    const snapshot = await buildDashboardSnapshot(owner, { suggestedCourseId: "search-by-halving" });
    expect(snapshot.nextAction.kind).toBe("resume");
    expect(snapshot.nextAction.href).toBe(`/lessons/${lesson.id}`);
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

  it("resumes an authored course lesson with its unique trail context", async () => {
    const owner = "dashboard-course-context-owner";
    const lesson = getLesson("algebra-balance-equality-as-invariant")!;
    const profile = getOrCreateProfile(owner);
    saveSession(new LearnerSession(lesson, "lesson", profile.mastery), owner);

    const snapshot = await buildDashboardSnapshot(owner);

    expect(snapshot.nextAction.href).toBe(`/lessons/${lesson.id}?course=algebra-as-balance`);
    expect(snapshot.activeLearning[0].href).toBe(snapshot.nextAction.href);
  });

  it("resumes practice at the practice route rather than its synthetic lesson id", async () => {
    const owner = "dashboard-practice-context-owner";
    const lesson = getLesson("algebra-balance-equality-as-invariant")!;
    const profile = getOrCreateProfile(owner);
    saveSession(new LearnerSession(buildPracticeLesson(lesson), "practice", profile.mastery), owner);

    const snapshot = await buildDashboardSnapshot(owner);

    expect(snapshot.nextAction.href).toBe(`/lessons/${lesson.id}/practice?course=algebra-as-balance`);
    expect(snapshot.activeLearning[0].href).not.toContain("::practice");
  });

  it("does not invent evidence when a lesson has only been opened", async () => {
    const owner = "dashboard-opened-only-owner";
    const lesson = getLesson("linear-equations-intro")!;
    const profile = getOrCreateProfile(owner);
    saveSession(new LearnerSession(lesson, "lesson", profile.mastery), owner);

    const snapshot = await buildDashboardSnapshot(owner);

    expect(snapshot.activeLearning).toHaveLength(1);
    expect(snapshot.evidence).toEqual([]);
  });

  it("creates guided evidence only after a checked response", async () => {
    const owner = "dashboard-answered-owner";
    const lesson = getLesson("linear-equations-intro")!;
    const profile = getOrCreateProfile(owner);
    const session = new LearnerSession(lesson, "lesson", profile.mastery);
    const concept = session.currentStep.concept;
    session.submitAnswer("2");
    saveSession(session, owner);

    const snapshot = await buildDashboardSnapshot(owner);

    expect(snapshot.evidence).toContainEqual(expect.objectContaining({
      concept: concept.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      state: "observed-guided",
    }));
  });
});
