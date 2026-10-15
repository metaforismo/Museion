import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createAccount } from "@/lib/server/auth";
import { closeLocalDatabase, localDatabase } from "@/lib/server/local-database";
import { persistSession, ownedSession, courseEvidenceSessionFor } from "@/lib/server/session-repository";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SourceDocumentSchema } from "@/lib/source";
import { createCompilerRun, resetCompilerRunsForTests } from "@/lib/compiler/runs";
import { openLessonSession } from "@/lib/client/open-lesson-session";
import { generatedArtifactLesson, generatedLessonId, ownedGeneratedLesson } from "@/lib/compiler/lesson-adapter";
import { CourseArtifactV2Schema } from "@/lib/compiler/schemas/course-artifact";
import { SourceGraphSchema } from "@/lib/compiler/schemas/source-graph";
import { LearnerSession } from "@/lib/engine/session";
import { toPublicLesson } from "@/lib/content";
import { buildSessionState } from "@/lib/api-types";
import { describeActivity } from "@/lib/maia/activity";
import { revealsAnswer } from "@/lib/maia/leak";
import { maiaRespond } from "@/lib/maia/tutor";
import { allowedAuthoredUiTargets } from "@/lib/maia/ui-targets";
import { resetAiSettingsForTests } from "@/lib/ai/settings";
import { GET as discover, POST as createSession } from "@/app/api/sessions/route";
import goldenDocument from "./fixtures/binary-search-source-document.json";
import goldenArtifact from "./fixtures/binary-search-course-artifact-v2.json";
import goldenGraph from "./fixtures/binary-search-source-graph.json";

const identity = vi.hoisted(() => ({ ownerId: "creator-a" as string | null }));
vi.mock("@/lib/server/actor", () => ({
  currentActor: async () => identity.ownerId ? { kind: "account", ownerId: identity.ownerId, displayName: "QA" } : { kind: "guest", ownerId: "guest", displayName: null },
  requireAccountActor: async () => { if (!identity.ownerId) throw new Error("SIGN_IN_REQUIRED"); return { kind: "account", ownerId: identity.ownerId, displayName: "QA" }; },
}));
const audience = { level: "novice" as const, language: "en", targetMinutes: 12, learnerGoal: "Trace inclusive binary search and justify every boundary update." };
const lesson = () => generatedArtifactLesson("synthetic-run", CourseArtifactV2Schema.parse(goldenArtifact), SourceGraphSchema.parse(goldenGraph), "Synthetic source", "replay");
const command = (session: LearnerSession) => ({ expectedStepId: session.currentStep.id, expectedVersion: session.version, idempotencyKey: crypto.randomUUID() });

beforeEach(() => { resetAiSettingsForTests(); resetCompilerRunsForTests(); identity.ownerId = "creator-a"; });
afterEach(() => { resetAiSettingsForTests(); resetCompilerRunsForTests(); vi.unstubAllEnvs(); });

describe("generated courses in the shared lesson engine", () => {
  it("projects provenance, explanations, evidence and all labs without private answer data", () => {
    const adapted = lesson();
    const publicLesson = toPublicLesson(adapted);
    expect(publicLesson.generatedFrom).toEqual({ runId: "synthetic-run", sourceTitle: "Synthetic source", mode: "replay" });
    expect(publicLesson.steps.some((step) => step.explanation?.length)).toBe(true);
    expect(publicLesson.steps.every((step) => step.citations?.length)).toBe(true);
    expect(publicLesson.steps.some((step) => step.runtime?.kind === "range-explorer")).toBe(true);
    const serialized = JSON.stringify(publicLesson);
    for (const key of ["correctIndex", "correctOrder", "expectedStates", "acceptedForms", "misconceptionRules", "answerSpecs"]) expect(serialized).not.toContain(key);
    expect(adapted.concepts.every((id) => id.startsWith("generated:synthetic-run:"))).toBe(true);
  });

  it("rejects launch of unaccepted artifacts and requires account ownership for standard session creation", async () => {
    const rejected = CourseArtifactV2Schema.parse(goldenArtifact);
    rejected.validation.status = "needs-review";
    expect(() => generatedArtifactLesson("x", rejected, SourceGraphSchema.parse(goldenGraph), "Synthetic", "replay")).toThrow("GENERATED_COURSE_NOT_ACCEPTED");
    const run = await createCompilerRun("creator-a", SourceDocumentSchema.parse(goldenDocument), audience);
    const lessonId = generatedLessonId(run.runId);
    expect((await ownedGeneratedLesson(lessonId, "creator-a"))?.id).toBe(lessonId);
    await expect(ownedGeneratedLesson(lessonId, "creator-b")).rejects.toThrow("COMPILER_RUN_NOT_FOUND");
    const request = () => new Request("http://localhost/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId, mode: "lesson" }) });
    const created = await createSession(request());
    expect(created.status).toBe(200);
    const state = await created.json();
    expect(state.lesson.id).toBe(lessonId);
    expect(state.mode).toBe("lesson");
    const resumed = await discover(new Request(`http://localhost/api/sessions?lessonId=${lessonId}&mode=lesson`));
    expect((await resumed.json()).session.sessionId).toBe(state.sessionId);
    identity.ownerId = "creator-b";
    expect((await createSession(request())).status).toBe(404);
    identity.ownerId = null;
    expect((await createSession(request())).status).toBe(401);
  });

  it("persists checked intermediate reducer state without solving or awarding mastery and replays commands once", () => {
    const adapted = lesson();
    const rangeStep = adapted.steps.find((step) => step.runtimeBlock?.kind === "range-explorer")!;
    const range = rangeStep.runtimeBlock!;
    expect(range.kind).toBe("range-explorer");
    if (range.kind !== "range-explorer") return;
    const session = new LearnerSession({ ...adapted, steps: [rangeStep] });
    const state = buildSessionState(session, toPublicLesson(session.lesson)).runtimeState!;
    if (state.kind !== "range-explorer" || state.mid === null) throw new Error("Unexpected fixture");
    const tooSmall = range.values[state.mid] < range.target;
    const action = { kind: "range_update", low: tooSmall ? state.mid + 1 : state.low, high: tooSmall ? state.high : state.mid - 1 };
    const guard = command(session);
    const outcome = session.submitAnswer(JSON.stringify(action), guard);
    expect(outcome.intermediate).toBe(true);
    expect(session.awaitingAdvance).toBe(false);
    expect(session.stats().totalAttempts).toBe(0);
    expect(session.mastery.mastery(rangeStep.concept)).toBe(0);
    expect(session.submitAnswer(JSON.stringify(action), guard)).toEqual(outcome);
    const restored = LearnerSession.fromState(JSON.parse(JSON.stringify(session.toState())));
    const publicState = buildSessionState(restored, toPublicLesson(restored.lesson));
    expect(publicState.runtimeState).toEqual(outcome.runtimeState);
    expect(publicState.runtimeLastAction).toEqual(action);
    expect(publicState.sessionVersion).toBe(1);
    expect(() => restored.submitAnswer(JSON.stringify(action), { ...command(restored), expectedVersion: 0 })).toThrow("version conflict");
    expect(() => restored.submitAnswer("runtime-complete", command(restored))).toThrow("Invalid activity action");
  });

  it("keeps a completed course and its first transfer result after reload, empty accidental runs and explicit restarts", async () => {
    const directory = mkdtempSync(join(tmpdir(), "museion-generated-completed-"));
    vi.stubEnv("MUSEION_DATABASE_PATH", join(directory, "state.sqlite"));
    vi.stubEnv("MUSEION_UPLOADS_PATH", join(directory, "uploads"));
    try {
      const account = await createAccount({ email: "completed-generated@example.com", password: "synthetic completion testing phrase", displayName: "Synthetic QA" });
      identity.ownerId = account.id;
      const run = await createCompilerRun(account.id, SourceDocumentSchema.parse(goldenDocument), audience);
      const adapted = (await ownedGeneratedLesson(generatedLessonId(run.runId), account.id))!;
      const completed = new LearnerSession(adapted);
      while (!completed.complete) {
        const step = completed.activeStep;
        if (step.assistancePolicy === "none") completed.submitAnswer("wrong-first-independent-response", command(completed));
        while (!completed.awaitingAdvance) {
          const block = step.runtimeBlock;
          let answer: string;
          if (!block) answer = step.answer.kind === "multipleChoice" ? String(step.answer.correctIndex) : step.answer.kind === "numeric" ? String(step.answer.value) : step.answer.kind === "expression" ? step.answer.acceptedForms[0] : "";
          else if (block.kind === "sequence-builder") answer = JSON.stringify({ kind: "sequence_submit", order: block.correctOrder });
          else {
            const state = buildSessionState(completed, toPublicLesson(adapted)).runtimeState!;
            if (block.kind === "state-trace" && state.kind === "state-trace") {
              const next = block.expectedStates[state.cursor + 1];
              answer = JSON.stringify({ kind: "trace_submit", low: next.low, high: next.high, mid: next.mid });
            } else if (block.kind === "range-explorer" && state.kind === "range-explorer" && state.mid !== null) {
              answer = JSON.stringify(block.values[state.mid] === block.target ? { kind: "range_confirm_found", index: state.mid } : { kind: "range_update", low: block.values[state.mid] < block.target ? state.mid + 1 : state.low, high: block.values[state.mid] < block.target ? state.high : state.mid - 1 });
            } else throw new Error("Unexpected fixture");
          }
          completed.submitAnswer(answer, command(completed));
        }
        completed.advance(command(completed));
      }
      await persistSession(completed, account.id);
      const accidentalEmpty = new LearnerSession(adapted);
      await persistSession(accidentalEmpty, account.id);
      closeLocalDatabase();
      expect((await courseEvidenceSessionFor(account.id, adapted.id))?.sessionId).toBe(completed.sessionId);
      expect(await courseEvidenceSessionFor("unrelated-account", adapted.id)).toBeUndefined();
      let creates = 0;
      const request = async (path: string, init?: RequestInit) => {
        if (path === "/api/sessions" && init?.method === "POST") { creates++; return createSession(new Request(`http://localhost${path}`, init)); }
        if (path.startsWith("/api/sessions?")) return discover(new Request(`http://localhost${path}`));
        const owned = await ownedSession(decodeURIComponent(path.split("/").at(-1)!), account.id);
        return owned ? Response.json(buildSessionState(owned, toPublicLesson(owned.lesson))) : new Response(null, { status: 404 });
      };
      const resumed = await openLessonSession(adapted.id, "lesson", { savedSessionId: accidentalEmpty.sessionId }, request);
      expect(resumed.sessionId).toBe(completed.sessionId);
      expect(resumed.complete).toBe(true);
      expect(resumed.stats.independentTransfer?.[0].firstResponseCorrect).toBe(false);
      const withoutPointer = await openLessonSession(adapted.id, "lesson", { savedSessionId: null }, request);
      expect(withoutPointer.sessionId).toBe(completed.sessionId);
      expect(creates).toBe(0);
      const restarted = await openLessonSession(adapted.id, "lesson", { savedSessionId: completed.sessionId, forceNew: true }, request);
      expect(restarted.sessionId).not.toBe(completed.sessionId);
      expect(restarted.openedAsRestart).toBe(true);
      expect((await openLessonSession(adapted.id, "lesson", { savedSessionId: restarted.sessionId }, request)).sessionId).toBe(restarted.sessionId);
      expect(creates).toBe(1);
      await localDatabase().prepare("UPDATE lesson_sessions SET expires_at='2000-01-01T00:00:00.000Z' WHERE owner_id=?").bind(account.id).run();
      closeLocalDatabase();
      expect((await ownedSession(completed.sessionId, account.id))?.complete).toBe(true);
      expect(await ownedSession(accidentalEmpty.sessionId, account.id)).toBeUndefined();
      const retained = await openLessonSession(adapted.id, "lesson", { savedSessionId: null }, request);
      expect(retained.sessionId).toBe(completed.sessionId);
      expect(retained.stats.independentTransfer?.[0].firstResponseCorrect).toBe(false);
      expect(creates).toBe(1);
      // A deliberate new attempt also leaves the recorded completion intact.
      expect((await courseEvidenceSessionFor(account.id, adapted.id))?.sessionId).toBe(completed.sessionId);
    } finally {
      closeLocalDatabase();
      vi.unstubAllEnvs();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("restores a generated lab from isolated SQLite after reopening and keeps other accounts out", async () => {
    const directory = mkdtempSync(join(tmpdir(), "museion-generated-durable-"));
    vi.stubEnv("MUSEION_DATABASE_PATH", join(directory, "state.sqlite"));
    vi.stubEnv("MUSEION_UPLOADS_PATH", join(directory, "uploads"));
    try {
      const account = await createAccount({ email: "generated-qa@example.com", password: "synthetic durable testing phrase", displayName: "Synthetic QA" });
      const run = await createCompilerRun(account.id, SourceDocumentSchema.parse(goldenDocument), audience);
      const adapted = (await ownedGeneratedLesson(generatedLessonId(run.runId), account.id))!;
      const rangeStep = adapted.steps.find((step) => step.runtimeBlock?.kind === "range-explorer")!;
      const block = rangeStep.runtimeBlock!;
      if (block.kind !== "range-explorer") throw new Error("Unexpected fixture");
      const session = new LearnerSession({ ...adapted, steps: [rangeStep] });
      const state = buildSessionState(session, toPublicLesson(session.lesson)).runtimeState!;
      if (state.kind !== "range-explorer" || state.mid === null) throw new Error("Unexpected fixture");
      const action = { kind: "range_update", low: block.values[state.mid] < block.target ? state.mid + 1 : state.low, high: block.values[state.mid] < block.target ? state.high : state.mid - 1 };
      const checked = session.submitAnswer(JSON.stringify(action), command(session));
      await persistSession(session, account.id);
      closeLocalDatabase();
      const resumed = (await ownedSession(session.sessionId, account.id))!;
      expect(buildSessionState(resumed, toPublicLesson(resumed.lesson)).runtimeState).toEqual(checked.runtimeState);
      expect(resumed.recordFor(rangeStep).lastRuntimeAction).toEqual(action);
      expect(await ownedSession(session.sessionId, "unrelated-account")).toBeUndefined();
      expect((await ownedGeneratedLesson(generatedLessonId(run.runId), account.id))?.id).toBe(adapted.id);
      await expect(ownedGeneratedLesson(generatedLessonId(run.runId), "unrelated-account")).rejects.toThrow("COMPILER_RUN_NOT_FOUND");
    } finally {
      closeLocalDatabase();
      vi.unstubAllEnvs();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("keeps live draft activity scoped to rendered controls and rejects private boundary disclosures", () => {
    const step = lesson().steps.find((step) => step.runtimeBlock?.kind === "range-explorer")!;
    const blockId = step.runtimeBlock!.id;
    const draft = { kind: "runtime" as const, blockId, action: { kind: "range_update" as const, low: 0, high: 3 } };
    expect(describeActivity(step, draft)).toContain("unchecked");
    expect(describeActivity(step, { ...draft, blockId: "other" })).toBeNull();
    expect(allowedAuthoredUiTargets(step)).toContain(`control:${blockId}:low`);
    expect(allowedAuthoredUiTargets(step)).not.toContain("answer");
    expect(revealsAnswer(step, "Set low to 3.")).toBe(true);
    expect(revealsAnswer(step, "Which interval still contains possible candidates?")).toBe(false);
  });

  it("locks transfer assistance and keeps the first independent response immutable when later practice succeeds", async () => {
    const adapted = lesson();
    const transfer = adapted.steps.find((step) => step.assistancePolicy === "none")!;
    const session = new LearnerSession({ ...adapted, steps: [transfer] });
    session.submitAnswer("definitely-wrong", command(session));
    expect(session.requestHint()).toBeNull();
    const first = structuredClone(session.recordFor(transfer).independentObservation);
    const spec = transfer.answer;
    const correct = spec.kind === "numeric" ? String(spec.value) : spec.kind === "multipleChoice" ? String(spec.correctIndex) : spec.kind === "expression" ? spec.acceptedForms[0] : "";
    session.submitAnswer(correct, command(session));
    expect(session.recordFor(transfer).independentObservation).toEqual(first);
    expect(session.stats().independentTransfer).toEqual([{ stepId: transfer.id, firstResponseCorrect: false }]);
    expect(session.events.filter((event) => event.kind === "independent_transfer_scored")).toHaveLength(1);
    const provider = { id: "synthetic", available: () => true, generate: vi.fn() };
    await expect(maiaRespond(session, "Give me the answer", provider)).rejects.toThrow();
    expect(provider.generate).not.toHaveBeenCalled();
  });
});
