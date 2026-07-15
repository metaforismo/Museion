import { describe, expect, it } from "vitest";

import { getLesson } from "@/lib/content";
import { LearnerSession } from "@/lib/engine/session";
import { getSessionForLearner, saveSession } from "@/lib/store";

describe("session ownership", () => {
  it("returns a session only to the learner that created it", () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    saveSession(session, "learner-owner");

    expect(getSessionForLearner(session.sessionId, "learner-owner")).toBe(session);
    expect(getSessionForLearner(session.sessionId, "learner-other")).toBeUndefined();
  });
});
