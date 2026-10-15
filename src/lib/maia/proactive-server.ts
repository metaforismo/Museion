import type { LearnerSession } from "@/lib/engine/session";
import { maiaOpeningNudge } from "./opening";
import { tutorSafetyIssues } from "./safety";
import type { MaiaGuidance } from "./proactive";
import type { TutorTurn } from "./contracts";
import { allowedAuthoredUiTargets } from "./ui-targets";
import { conceptLabel } from "@/lib/learning/concept-label";

const CONCEPT_LABELS: Readonly<Record<string, string>> = {
  "spot-non-termination": "when a recursive call stops",
  "complete-a-recursion": "building a recursive function",
  "watch-the-stack": "following the call stack",
};

/** Read-only authored teaching cues. Opening never spends a hint, updates
 * mastery, calls a model, or manufactures a previous conversation. */
export function buildProactiveGuidance(session: LearnerSession): MaiaGuidance | null {
  if (session.complete || session.mode === "practice") return null;
  const step = session.activeStep;
  if (step.assistancePolicy === "none") return null;
  // Successful intermediate moves deliberately do not enter answer attempts
  // or award mastery. Read the latest persisted activity check so an older
  // wrong diagnosis cannot survive that progress, including after reload.
  if (step.runtimeBlock && !session.awaitingAdvance) {
    const latestCheck = session.events.findLast((event) => event.stepId === step.id && (event.kind === "activity_action_checked" || event.kind === "answer_submitted"));
    if (latestCheck?.kind === "activity_action_checked" && latestCheck.correct === true) return null;
  }
  const record = session.recordFor(step);
  const last = record.attempts.at(-1);
  const wrong = record.attempts.filter((attempt) => !attempt.correct).length;
  const variantIndex = session.activeVariantIndex();
  const previousVariant = Math.floor((wrong - (last && !last.correct ? 1 : 0)) / 2) % ((session.currentStep.variants?.length ?? 0) + 1);
  // A wrong check may rotate the exercise. A diagnosis from the previous
  // variation must not be applied to the newly displayed prompt.
  const sameCheckedSurface = Boolean(last && previousVariant === variantIndex);
  const outcome = session.awaitingAdvance ? "correct" : last && sameCheckedSurface ? "incorrect" : "untried";
  const surface = step.lab ? "recursion" : step.runtimeBlock?.kind === "sequence-builder" ? "sequence" : step.runtimeBlock?.kind === "range-explorer" ? "range" : step.runtimeBlock?.kind === "state-trace" ? "trace" : undefined;
  const opening = maiaOpeningNudge({ kind: step.answer.kind, surface, outcome, attempts: record.attempts.length });
  if (!opening) return null;
  const allowedTargets = allowedAuthoredUiTargets(step);
  const highlight = outcome === "incorrect" ? last?.misconception?.highlight ?? null : null;
  const safeHighlight = highlight?.kind === "term" ? (step.prompt.includes(highlight.text) ? highlight : null) : highlight?.kind === "graph-region" ? (step.answer.kind === "graph" ? highlight : null) : null;
  const attentionTarget = outcome === "incorrect" && last?.misconception?.attentionTargetId && allowedTargets.includes(last.misconception.attentionTargetId) ? last.misconception.attentionTargetId : null;
  const actions: TutorTurn["uiActions"] = attentionTarget ? [{ kind: "highlight", targetId: attentionTarget, text: null }] : safeHighlight ? [{ kind: "highlight", targetId: safeHighlight.kind === "term" ? "prompt" : `graph:${safeHighlight.param}`, text: null }] : outcome === "correct" ? [] : [{ kind: "pulse", targetId: step.answer.kind === "graph" ? "graph:canvas" : step.lab ? "recursion:code" : "prompt", text: null }];
  const turn: TutorTurn = { message: opening.message, pedagogicalMove: outcome === "correct" ? "request-self-explanation" : "ask-probing-question", uiActions: actions };
  if (outcome === "untried") {
    const conceptKey = step.concept.startsWith("generated:") ? step.concept.slice(step.concept.lastIndexOf(":") + 1) : step.concept;
    const concept = CONCEPT_LABELS[conceptKey] ?? conceptLabel(step.concept);
    const message = `${record.attempts.length ? "Same idea, a fresh example. " : ""}We’re exploring ${concept}. ${opening.message}`;
    if (!tutorSafetyIssues(step, { ...turn, message }, allowedTargets).length) turn.message = message;
  } else if (outcome === "incorrect" && session.mastery.scaffoldingLevel(step.concept) !== "proficient") {
    // A checked wrong attempt already discounts subsequent mastery evidence.
    // Prefer its exact authored focus; otherwise offer only the first
    // conceptual rung, never advance the learner's requested hint ladder.
    const candidates = [last?.misconception?.remediationFocus, step.hints[0]].filter((text): text is string => Boolean(text));
    for (const candidate of candidates) {
      const message = candidate;
      if (!tutorSafetyIssues(step, { ...turn, message, pedagogicalMove: "address-misconception" }, allowedTargets).length) { turn.message = message; break; }
    }
  }
  if (tutorSafetyIssues(step, turn, allowedTargets).length) return null;
  return {
    id: `${session.sessionId}:${step.id}:${variantIndex}:${record.attempts.length}:${outcome}`,
    sessionId: session.sessionId, stepId: step.id, variantIndex, sessionVersion: session.version,
    trigger: outcome === "untried" ? "step-open" : "checked-attempt", source: "lesson-authored",
    invitation: opening.invitation, message: turn.message, uiActions: turn.uiActions, highlight: safeHighlight,
  };
}
