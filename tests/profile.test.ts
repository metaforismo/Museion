import { describe, expect, it } from "vitest";

import { getLesson } from "@/lib/content";
import { LearnerSession } from "@/lib/engine/session";
import {
  getOrCreateProfile,
  getSession,
  getSessionLearner,
  recordCompletion,
  saveSession,
  MAX_SESSIONS_PER_LEARNER,
} from "@/lib/store";

describe("learner profiles", () => {
  it("shares one mastery model across a learner's sessions", () => {
    const profile = getOrCreateProfile("learner-a");
    const lesson = getLesson("linear-equations-intro")!;

    const first = new LearnerSession(lesson, "lesson", profile.mastery);
    first.submitAnswer("6");
    const masteryAfterFirst = profile.mastery.mastery("balance-principle");
    expect(masteryAfterFirst).toBeGreaterThan(0);

    // A later session for the same learner starts from earned mastery.
    const second = new LearnerSession(lesson, "lesson", profile.mastery);
    expect(second.mastery.mastery("balance-principle")).toBe(masteryAfterFirst);
  });

  it("keeps different learners isolated", () => {
    const a = getOrCreateProfile("learner-iso-a");
    const b = getOrCreateProfile("learner-iso-b");
    a.mastery.recordAttempt("c", true, true, 0);
    expect(b.mastery.mastery("c")).toBe(0);
  });

  it("records lesson completions and practice runs separately", () => {
    recordCompletion("learner-c", "linear-equations-intro", "lesson");
    recordCompletion("learner-c", "linear-equations-intro", "practice");
    recordCompletion("learner-c", "linear-equations-intro", "practice");
    const profile = getOrCreateProfile("learner-c");
    expect(profile.completedLessons.has("linear-equations-intro")).toBe(true);
    expect(profile.practiceRuns.get("linear-equations-intro")).toBe(2);
  });

  it("links sessions to their learner", () => {
    const session = new LearnerSession(getLesson("binary-numbers")!);
    saveSession(session, "learner-d");
    expect(getSession(session.sessionId)).toBe(session);
    expect(getSessionLearner(session.sessionId)).toBe("learner-d");
  });

  it("bounds retained lesson sessions per learner", () => {
    const created: LearnerSession[] = [];
    for (let index = 0; index <= MAX_SESSIONS_PER_LEARNER; index += 1) {
      const session = new LearnerSession(getLesson("binary-numbers")!);
      created.push(session);
      saveSession(session, "learner-quota");
    }
    expect(getSession(created[0].sessionId)).toBeUndefined();
    expect(getSession(created.at(-1)!.sessionId)).toBe(created.at(-1));
  });
});
