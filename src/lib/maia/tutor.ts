import { describeActivity, describeActivityInline, type LabActivity } from "./activity";
import type { LearnerSession } from "../engine/session";
import { log } from "../server/log";
import type {
  TutorDelivery,
  TutorProvider,
  TutorProviderResult,
  TutorTurn,
} from "./contracts";
import { tutorSafetyIssues } from "./safety";
import { allowedAuthoredUiTargets } from "./ui-targets";
import { OpenAITutorProvider } from "./openai-provider";
import { CodexTutorProvider } from "./codex-provider";
import { getAiSettings } from "../ai/settings";
import { OpenRouterTutorProvider } from "./openrouter-provider";
import { boundedTutorInput } from "./context";
import { tutorProviderErrorDiagnostic } from "./provider-error";

const OFFLINE_NOTICE =
  "Live tutoring isn't available right now. We can still work through this with lesson hints.";

function provider(): TutorProvider {
  const settings = getAiSettings();
  if (settings.provider === "codex") return new CodexTutorProvider(settings.familyFallback);
  if (settings.provider === "openai-api") return new OpenAITutorProvider();
  if (settings.provider === "openrouter-free") return new OpenRouterTutorProvider();
  return {
    id: "deterministic",
    available: () => false,
    generate: async () => { throw new Error("Deterministic tutoring does not call a model"); },
  };
}

export function maiaAvailable(): boolean {
  return provider().available();
}

export { tutorSafetyIssues } from "./safety";

function deterministicFallback(session: LearnerSession, activityInline: string | null): TutorTurn {
  if (session.awaitingAdvance) {
    return {
      message: "You solved this step. Explain the key move in your own words, then continue when you are ready.",
      pedagogicalMove: "request-self-explanation",
      uiActions: [],
    };
  }
  const hint = session.requestHint();
  // Even offline, Maia has eyes: acknowledge the learner's live widget
  // state (their own values only) before the authored hint.
  const firstFallback = !session.events.some((event) => event.kind === "maia_fallback");
  const prefix = [firstFallback ? OFFLINE_NOTICE : null, activityInline].filter(Boolean).join(" ");
  const guidance = hint ?? "We've used the hints for this step. What do you know so far? Try one small move and see what happens.";
  return {
    message: prefix ? `${prefix} ${guidance}` : guidance,
    pedagogicalMove: hint ? "give-conceptual-hint" : "request-self-explanation",
    uiActions: [],
  };
}

function recordSafeLiveTurn(
  session: LearnerSession,
  learnerMessage: string,
  result: TutorProviderResult,
  repaired: boolean,
  providerId: string,
): void {
  session.chatHistory.push(
    { role: "user", content: learnerMessage },
    { role: "assistant", content: result.turn.message },
  );
  session.log("maia_turn", { provider: providerId, repaired });
  session.log("maia_usage", {
    requestedModel: result.requestedModel,
    resolvedModel: result.resolvedModel,
    responseId: result.responseId,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    cacheReadTokens: result.usage.cachedInputTokens,
  });
  log.info("maia_turn_completed", {
    sessionId: session.sessionId,
    provider: providerId,
    requestedModel: result.requestedModel,
    resolvedModel: result.resolvedModel,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    cacheReadTokens: result.usage.cachedInputTokens,
    repaired,
  });
}

/**
 * Produce one complete, validated tutoring turn. No model bytes are exposed to
 * the caller until schema, UI-target and answer-leak checks have all passed.
 */
export async function maiaRespond(
  session: LearnerSession,
  learnerMessage: string,
  tutorProvider: TutorProvider = provider(),
  signal?: AbortSignal,
  activity: LabActivity | null = null,
): Promise<TutorDelivery> {
  // The active variant decides the answer the leak gate must protect.
  const step = session.activeStep;
  if (step.assistancePolicy === "none") throw new Error("INDEPENDENT_CHALLENGE");
  const stepId = step.id;
  const startVersion = session.version;
  const allowedUiTargetIds = allowedAuthoredUiTargets(step);
  // Rendered only when the report matches the active step's widget —
  // a stale or malformed report is dropped, never trusted.
  const liveActivity = activity ? describeActivity(step, activity) : null;
  if (liveActivity) session.log("maia_activity_observed", { stepId });

  if (tutorProvider.available()) {
    const requestTimeout = AbortSignal.timeout(25_000);
    const requestSignal = signal ? AbortSignal.any([signal, requestTimeout]) : requestTimeout;
    const rawInput = {
      snapshot: session.snapshot(),
      history: [...session.chatHistory],
      learnerMessage,
      allowedUiTargetIds,
      liveActivity,
    };
    try {
      const input = boundedTutorInput(rawInput);
      let result = await tutorProvider.generate(input, { signal: requestSignal });
      requestSignal.throwIfAborted();
      let issues = tutorSafetyIssues(step, result.turn, allowedUiTargetIds);
      let repaired = false;

      if (issues.length > 0) {
        repaired = true;
        session.log("maia_turn_rejected", { stepId, issues, attempt: 1 });
        result = await tutorProvider.generate(input, {
          signal: requestSignal,
          repairIssues: issues,
        });
        requestSignal.throwIfAborted();
        issues = tutorSafetyIssues(step, result.turn, allowedUiTargetIds);
      }

      const sameStep =
        !session.complete &&
        session.currentStep.id === stepId &&
        session.version === startVersion;
      if (issues.length === 0 && sameStep) {
        recordSafeLiveTurn(session, learnerMessage, result, repaired, tutorProvider.id);
        session.version += 1;
        return {
          turn: result.turn,
          source: tutorProvider.id === "openai-codex" ? "openai-codex" : tutorProvider.id === "openrouter-free" ? "openrouter-free" : "openai-api",
          repaired,
          requestedModel: result.requestedModel,
          resolvedModel: result.resolvedModel,
        };
      }
      session.log("maia_turn_rejected", {
        stepId,
        issues: sameStep ? issues : ["stale_step"],
        attempt: repaired ? 2 : 1,
      });
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      const diagnostic = tutorProviderErrorDiagnostic(error);
      session.log("maia_provider_error", {
        stepId,
        ...diagnostic,
      });
      log.warn("maia_provider_error", {
        sessionId: session.sessionId,
        ...diagnostic,
      });
    }
  }

  if (session.complete || session.currentStep.id !== stepId || session.version !== startVersion) {
    throw new Error("Session changed while Maia was responding");
  }

  const turn = deterministicFallback(session, liveActivity && activity ? describeActivityInline(step, activity) : null);
  session.chatHistory.push(
    { role: "user", content: learnerMessage },
    { role: "assistant", content: turn.message },
  );
  session.log("maia_fallback", { stepId });
  session.version += 1;
  return { turn, source: "deterministic", repaired: false };
}
