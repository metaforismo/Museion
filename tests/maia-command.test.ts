import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LearnerSession } from "@/lib/engine/session";
import { getLesson } from "@/lib/content";

const dependencies = vi.hoisted(() => ({
  owned: vi.fn(), actor: vi.fn(), persist: vi.fn(), respond: vi.fn(),
}));
vi.mock("@/lib/server/session-access", () => ({ getOwnedSession: dependencies.owned }));
vi.mock("@/lib/server/actor", () => ({ currentActor: dependencies.actor }));
vi.mock("@/lib/server/session-repository", () => ({ persistSession: dependencies.persist }));
vi.mock("@/lib/server/rate-limit", () => ({ checkRateLimit: () => ({ allowed: true }) }));
vi.mock("@/lib/server/usage", () => ({ consumeUsage: async () => true }));
vi.mock("@/lib/maia/tutor", () => ({ maiaRespond: dependencies.respond, maiaAvailable: () => false }));
import { POST } from "@/app/api/sessions/[sessionId]/maia/route";

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.actor.mockResolvedValue({ kind: "account", ownerId: "synthetic-learner" });
  dependencies.persist.mockResolvedValue(undefined);
  dependencies.respond.mockImplementation(async () => ({ source: "deterministic", repaired: false, turn: { message: "Which part of your explanation could you test?", pedagogicalMove: "ask-probing-question", uiActions: [] } }));
});
afterEach(() => { vi.unstubAllEnvs(); });

function request(session: LearnerSession, message: string, key = randomUUID()) {
  return new Request("http://localhost:3000/api/sessions/synthetic/maia", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, expectedStepId: session.activeStep.id, expectedVersion: session.version, idempotencyKey: key }) });
}

describe("Maia learner-message delivery", () => {
  it("keeps a lesson conversation open after thirty learner turns", async () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    for (let index = 0; index < 31; index += 1) session.chatHistory.push({ role: "user", content: "Which relationship should I check?" });
    dependencies.owned.mockResolvedValue(session);
    const response = await POST(request(session, "I have a new question about my attempt."), { params: Promise.resolve({ sessionId: session.sessionId }) });
    expect(response.status).toBe(200);
    expect(dependencies.respond).toHaveBeenCalledTimes(1);
  });

  it("accepts a long explanation intact and persists only once on an idempotent replay", async () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    dependencies.owned.mockResolvedValue(session);
    const explanation = `${"I compared both sides of the equation. ".repeat(400)}My final question is about equality.`;
    const key = randomUUID();
    const options = { params: Promise.resolve({ sessionId: session.sessionId }) };
    expect((await POST(request(session, explanation, key), options)).status).toBe(200);
    expect(dependencies.respond.mock.calls[0][1]).toBe(explanation);
    expect((await POST(request(session, explanation, key), options)).status).toBe(200);
    expect(dependencies.respond).toHaveBeenCalledTimes(1);
    expect(dependencies.persist).toHaveBeenCalledTimes(1);
  });

  it("still rejects blank messages and inaccessible sessions before model work", async () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    const options = { params: Promise.resolve({ sessionId: session.sessionId }) };
    dependencies.owned.mockResolvedValue(session);
    expect((await POST(request(session, "  "), options)).status).toBe(400);
    dependencies.owned.mockResolvedValue(null);
    expect((await POST(request(session, "A question"), options)).status).toBe(404);
    expect(dependencies.respond).not.toHaveBeenCalled();
    expect(dependencies.persist).not.toHaveBeenCalled();
  });

  it("does not spend a model turn or persist chat during an independent challenge", async () => {
    const lesson = getLesson("linear-equations-intro")!;
    const session = new LearnerSession({ ...lesson, steps: lesson.steps.map((step) => ({ ...step, assistancePolicy: "none" })) });
    dependencies.owned.mockResolvedValue(session);
    const result = await POST(request(session, "Can you solve this for me?"), { params: Promise.resolve({ sessionId: session.sessionId }) });
    expect(result.status).toBe(409);
    expect(dependencies.respond).not.toHaveBeenCalled();
    expect(dependencies.persist).not.toHaveBeenCalled();
  });
});
