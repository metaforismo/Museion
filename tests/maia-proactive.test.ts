import { generatedArtifactLesson } from "@/lib/compiler/lesson-adapter";
import { CourseArtifactV2Schema } from "@/lib/compiler/schemas/course-artifact";
import { SourceGraphSchema } from "@/lib/compiler/schemas/source-graph";
import goldenArtifact from "./fixtures/binary-search-course-artifact-v2.json";
import goldenGraph from "./fixtures/binary-search-source-graph.json";
import { describe, expect, it } from "vitest";
import { allLessons, getLesson, validateLesson, type Lesson, type Step } from "@/lib/content";
import { LearnerSession } from "@/lib/engine/session";
import { MasteryModel } from "@/lib/engine/mastery";
import { buildProactiveGuidance } from "@/lib/maia/proactive-server";
import { guidanceMatchesScope, tutorDeliveryMatchesScope, receiveMaiaGuidance, dismissMaiaGuidance, emptyMaiaGuidanceState, type MaiaGuidanceScope } from "@/lib/maia/proactive";
import { tutorSafetyIssues } from "@/lib/maia/safety";
import { allowedAuthoredUiTargets } from "@/lib/maia/ui-targets";
import { buildSessionState } from "@/lib/api-types";
import { toPublicLesson } from "@/lib/content";

function scope(session: LearnerSession): MaiaGuidanceScope {
  return { sessionId: session.sessionId, stepId: session.activeStep.id, variantIndex: session.activeVariantIndex(), sessionVersion: session.version };
}
function singleStep(step: Step): Lesson { return { id: "test-cue", title: "A safe idea", track: "Algebra", description: "Try a reasoning move.", concepts: [step.concept], steps: [step] }; }
const customStep: Step = { id: "safe-step", concept: "balance-principle", prompt: "Find x in an equation.", answer: { kind: "numeric", value: 847, tolerance: 0 }, solution: "847", hints: ["Think about keeping both sides balanced."], misconceptions: [] };

describe("authored proactive Maia guidance", () => {
  it("uses a readable generated concept without exposing its storage namespace", () => {
    const session = new LearnerSession(singleStep({ ...customStep, concept: "generated:215b1913-9363-48cc-8c27-ee26115a133c:active-interval" }));
    const guidance = buildProactiveGuidance(session)!;
    expect(guidance.message).toContain("active interval");
    expect(guidance.message).not.toContain("generated:");
    expect(guidance.message).not.toContain("215b1913");
  });
  it("clears an obsolete generated diagnosis after a valid intermediate move and rehydration, then diagnoses a later mistake", () => {
    const generated = generatedArtifactLesson("synthetic", CourseArtifactV2Schema.parse(goldenArtifact), SourceGraphSchema.parse(goldenGraph), "Synthetic source", "replay");
    const step = generated.steps.find((candidate) => candidate.runtimeBlock?.kind === "range-explorer")!;
    const block = step.runtimeBlock!;
    if (block.kind !== "range-explorer") throw new Error("Unexpected test fixture");
    const session = new LearnerSession({ ...generated, steps: [step] });
    const initial = buildSessionState(session, toPublicLesson(session.lesson)).runtimeState!;
    if (initial.kind !== "range-explorer" || initial.mid === null) throw new Error("Unexpected test fixture");
    const tooSmall = block.values[initial.mid] < block.target;
    session.submitAnswer(JSON.stringify({ kind: "range_update", low: tooSmall ? initial.mid : initial.low, high: tooSmall ? initial.high : initial.mid }));
    const wrong = buildProactiveGuidance(session)!;
    expect(wrong.trigger).toBe("checked-attempt");
    const firstAttempt = structuredClone(session.recordFor(step).attempts[0]);
    const outcome = session.submitAnswer(JSON.stringify({ kind: "range_update", low: tooSmall ? initial.mid + 1 : initial.low, high: tooSmall ? initial.high : initial.mid - 1 }));
    expect(outcome.intermediate).toBe(true);
    expect(session.recordFor(step).attempts).toEqual([firstAttempt]);
    expect(buildProactiveGuidance(session)).toBeNull();
    const resumed = LearnerSession.fromState(JSON.parse(JSON.stringify(session.toState())));
    expect(buildSessionState(resumed, toPublicLesson(resumed.lesson)).proactiveGuidance).toBeNull();
    expect(resumed.awaitingAdvance).toBe(false);
    // Chat-only changes cannot revive a diagnosis superseded by real work.
    resumed.version += 1;
    expect(buildProactiveGuidance(resumed)).toBeNull();
    const current = buildSessionState(resumed, toPublicLesson(resumed.lesson)).runtimeState!;
    if (current.kind !== "range-explorer") throw new Error("Unexpected test fixture");
    resumed.submitAnswer(JSON.stringify({ kind: "range_update", low: current.low, high: current.high }));
    const laterWrong = buildProactiveGuidance(resumed)!;
    expect(laterWrong.trigger).toBe("checked-attempt");
    expect(laterWrong.id).not.toBe(wrong.id);
    expect(laterWrong.sessionVersion).toBe(resumed.version);
  });

  it("opens with an actual concept and reasoning question without consuming hints, grading or inventing chat", () => {
    const session = new LearnerSession(singleStep(customStep));
    const before = { version: session.version, stats: session.stats(), history: structuredClone(session.chatHistory), mastery: session.mastery.entries(), events: structuredClone(session.events) };
    const guidance = buildProactiveGuidance(session)!;
    expect(guidance.source).toBe("lesson-authored");
    expect(guidance.trigger).toBe("step-open");
    expect(guidance.message).toContain("balance principle");
    expect(guidance.message).not.toContain(customStep.hints[0]);
    expect(guidance.uiActions).toEqual([{ kind: "pulse", targetId: "prompt", text: null }]);
    expect({ version: session.version, stats: session.stats(), history: session.chatHistory, mastery: session.mastery.entries(), events: session.events }).toEqual(before);
    expect(buildSessionState(session, toPublicLesson(session.lesson)).proactiveGuidance?.id).toBe(guidance.id);
  });

  it("uses diagnosed current-surface focus only after an actually checked wrong attempt", () => {
    const lesson = getLesson("linear-equations-intro")!;
    const session = new LearnerSession(lesson);
    const opening = buildProactiveGuidance(session)!;
    expect(opening.highlight).toBeNull();
    expect(opening.trigger).toBe("step-open");
    session.submitAnswer("2");
    const guidance = buildProactiveGuidance(session)!;
    expect(guidance.trigger).toBe("checked-attempt");
    expect(guidance.message).toContain("coefficient");
    expect(guidance.highlight).toEqual({ kind: "term", text: "+ 6" });
    expect(guidance.uiActions[0]).toEqual({ kind: "highlight", targetId: "prompt", text: null });
    expect(session.chatHistory).toHaveLength(0);
    expect(session.recordFor(session.activeStep).hintsUsed).toBe(0);
    const checked = session.submitAnswer("6");
    expect(checked.mastery).toBeLessThan(0.3); // A coached retry is never first-try evidence.
    expect(buildProactiveGuidance(session)!.message).toContain("explain your key move");
  });

  it("never carries a diagnosis/term mark into an engine-selected new variation", () => {
    const session = new LearnerSession(getLesson("linear-equations-intro")!);
    session.submitAnswer("2");
    const previous = buildProactiveGuidance(session)!;
    session.submitAnswer("2");
    expect(session.activeVariantIndex()).toBe(1);
    const next = buildProactiveGuidance(session)!;
    expect(next.trigger).toBe("step-open");
    expect(next.message).toContain("a fresh example");
    expect(next.highlight).toBeNull();
    expect(next.message).not.toContain("Your last attempt");
    expect(guidanceMatchesScope(scope(session), previous)).toBe(false);
    expect(guidanceMatchesScope(scope(session), next)).toBe(true);
  });

  it("rejects unsafe authored hint/diagnosis content and silences practice and proficient hint delivery", () => {
    const session = new LearnerSession(singleStep({ ...customStep, hints: ["The answer is 847."] }));
    session.submitAnswer("3");
    expect(buildProactiveGuidance(session)?.message).not.toContain("847");
    expect(buildProactiveGuidance(new LearnerSession(singleStep(customStep), "practice"))).toBeNull();
    const proficient = new LearnerSession(singleStep(customStep), "lesson", MasteryModel.fromEntries([[customStep.concept, 1]]));
    expect(buildProactiveGuidance(proficient)?.message).not.toContain(customStep.hints[0]);
    proficient.submitAnswer("3");
    expect(proficient.mastery.scaffoldingLevel(customStep.concept)).toBe("developing"); // Actual wrong evidence can increase support again.
  });

  it("deduplicates retries/chat-only changes and respects dismissal, independent mode and newer-step boundaries", () => {
    const session = new LearnerSession(singleStep(customStep));
    const initial = buildProactiveGuidance(session)!;
    const first = receiveMaiaGuidance(emptyMaiaGuidanceState(), scope(session), initial);
    expect(receiveMaiaGuidance(first, scope(session), initial)).toBe(first);
    session.version += 1; // A chat version update is not another learning event.
    expect(buildProactiveGuidance(session)!.id).toBe(initial.id);
    expect(receiveMaiaGuidance(first, scope(session), buildProactiveGuidance(session))).toBe(first);
    const dismissed = dismissMaiaGuidance(first);
    expect(receiveMaiaGuidance(dismissed, scope(session), initial).current).toBeNull();
    session.submitAnswer("3");
    const checked = buildProactiveGuidance(session)!;
    const updated = receiveMaiaGuidance(dismissed, scope(session), checked);
    expect(updated.current?.id).toBe(checked.id);
    expect(receiveMaiaGuidance(updated, scope(session), initial)).toBe(updated);
    expect(receiveMaiaGuidance(updated, { ...scope(session), independent: true }, checked).current).toBeNull();
    for (const changed of [{ sessionId: "other" }, { stepId: "other" }, { variantIndex: 4 }, { sessionVersion: 0 }]) expect(guidanceMatchesScope({ ...scope(session), ...changed }, checked)).toBe(false);
  });

  it("clears explicit absent guidance and rejects late checked cues after that version", () => {
    const session = new LearnerSession(singleStep(customStep));
    session.submitAnswer("3");
    const wrong = buildProactiveGuidance(session)!;
    const state = receiveMaiaGuidance(emptyMaiaGuidanceState(), scope(session), wrong);
    session.submitAnswer("847");
    const cleared = receiveMaiaGuidance(state, scope(session), null);
    expect(cleared.current).toBeNull();
    expect(receiveMaiaGuidance(cleared, scope(session), wrong).current).toBeNull();
    expect(receiveMaiaGuidance(state, scope(session), undefined).current?.id).toBe(wrong.id); // Missing optional field is not a server clear.
    const correct = buildProactiveGuidance(session)!;
    const next = receiveMaiaGuidance(cleared, scope(session), correct);
    expect(next.current?.id).toBe(correct.id);
    expect(receiveMaiaGuidance(next, scope(session), wrong).current?.id).toBe(correct.id);
  });

  it("blocks late live annotations after newer checked state while allowing explicit practice chat", () => {
    const sent: MaiaGuidanceScope = { sessionId: "run-a", stepId: "move-a", variantIndex: 0, sessionVersion: 1, independent: true };
    expect(tutorDeliveryMatchesScope(sent, sent, 2)).toBe(true);
    expect(tutorDeliveryMatchesScope(sent, sent, 3)).toBe(true); // A deterministic hint delivery can advance two versions.
    expect(tutorDeliveryMatchesScope(sent, { ...sent, sessionVersion: 4 }, 3)).toBe(false);
    expect(tutorDeliveryMatchesScope(sent, { ...sent, stepId: "move-b" }, 3)).toBe(false);
    expect(tutorDeliveryMatchesScope(sent, { ...sent, variantIndex: 1 }, 3)).toBe(false);
    expect(tutorDeliveryMatchesScope(sent, { ...sent, sessionId: "run-b" }, 3)).toBe(false);
    expect(tutorDeliveryMatchesScope(sent, sent, 1)).toBe(false);
  });

  it("marks only the authored diagnosed recursion slot after a checked attempt", () => {
    const lesson = getLesson("recursion-code-lab")!;
    expect(JSON.stringify(toPublicLesson(lesson))).not.toContain("attentionTargetId");
    for (const step of lesson.steps.filter((candidate) => candidate.lab)) {
      for (const misconception of step.misconceptions) {
        const session = new LearnerSession(singleStep(step));
        expect(buildProactiveGuidance(session)!.uiActions[0].targetId).toBe("recursion:code");
        session.submitAnswer(misconception.triggerAnswers[0]);
        const checked = buildProactiveGuidance(session)!;
        expect(checked.trigger).toBe("checked-attempt");
        expect(checked.uiActions).toEqual([{ kind: "highlight", targetId: misconception.attentionTargetId, text: null }]);
      }
    }
    const invalid = singleStep({ ...customStep, misconceptions: [{ id: "bad-marker", triggerAnswers: ["3"], description: "Wrong move", remediationFocus: "Think it through", attentionTargetId: "check" }] });
    expect(validateLesson(invalid)).toContain('test-cue/safe-step: misconception "bad-marker" attention target is not rendered by this activity');
    const session = new LearnerSession(invalid);
    session.submitAnswer("3");
    expect(buildProactiveGuidance(session)!.uiActions.some(({ targetId }) => targetId === "check")).toBe(false);
  });

  it("passes the same output and UI-target leak gates for every authored opening and diagnosed mistake", () => {
    let checked = 0;
    for (const lesson of allLessons()) for (const step of lesson.steps) {
      for (const surface of [step, ...(step.variants ?? []).map((variant) => ({ ...step, ...variant, variants: undefined }))]) {
        const session = new LearnerSession(singleStep(surface));
        const guidance = buildProactiveGuidance(session);
        if (guidance) {
          expect(tutorSafetyIssues(surface, { message: guidance.message, pedagogicalMove: "ask-probing-question", uiActions: guidance.uiActions }, allowedAuthoredUiTargets(surface))).toEqual([]);
          checked++;
        }
        const trigger = surface.misconceptions[0]?.triggerAnswers[0];
        if (trigger) {
          session.submitAnswer(trigger);
          const after = buildProactiveGuidance(session);
          if (after) expect(tutorSafetyIssues(surface, { message: after.message, pedagogicalMove: "address-misconception", uiActions: after.uiActions }, allowedAuthoredUiTargets(surface))).toEqual([]);
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  });
});
