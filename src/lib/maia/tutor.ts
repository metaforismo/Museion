import type { Step } from "../content/types";
import type { LearnerSession } from "../engine/session";
import { log } from "../server/log";
import type {
  TutorDelivery,
  TutorProvider,
  TutorProviderResult,
  TutorTurn,
} from "./contracts";
import { TutorTurnSchema } from "./contracts";
import { revealsAnswer } from "./leak";
import { OpenAITutorProvider } from "./openai-provider";

const OFFLINE_NOTICE =
  "Maia is offline, so I’m using the lesson’s verified hint ladder.";

let defaultProvider: TutorProvider | null = null;

function provider(): TutorProvider {
  defaultProvider ??= new OpenAITutorProvider();
  return defaultProvider;
}

export function maiaAvailable(): boolean {
  return provider().available();
}

function safetyIssues(
  step: Step,
  turn: TutorTurn,
  allowedUiTargetIds: readonly string[],
): string[] {
  const issues: string[] = [];
  if (!TutorTurnSchema.safeParse(turn).success) issues.push("invalid_schema");
  if (revealsAnswer(step, turn.message)) issues.push("answer_leak_detected");
  const allowed = new Set(allowedUiTargetIds);
  if (turn.uiActions.some((action) => !allowed.has(action.targetId))) {
    issues.push("invalid_ui_target");
  }
  return issues;
}

function deterministicFallback(session: LearnerSession): TutorTurn {
  const hint = session.requestHint();
  return {
    message: hint
      ? `${OFFLINE_NOTICE} ${hint}`
      : `${OFFLINE_NOTICE} No more hints are available at this level. Explain what you know about the current step, then try one small move.`,
    pedagogicalMove: hint ? "give-conceptual-hint" : "request-self-explanation",
    uiActions: [],
  };
}

function recordSafeLiveTurn(
  session: LearnerSession,
  learnerMessage: string,
  result: TutorProviderResult,
  repaired: boolean,
): void {
  session.chatHistory.push(
    { role: "user", content: learnerMessage },
    { role: "assistant", content: result.turn.message },
  );
  session.log("maia_turn", { provider: "openai", repaired });
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
    provider: "openai",
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
): Promise<TutorDelivery> {
  const step = session.currentStep;
  const stepId = step.id;
  const allowedUiTargetIds: string[] = [];

  if (tutorProvider.available()) {
    const input = {
      snapshot: session.snapshot(),
      history: [...session.chatHistory],
      learnerMessage,
      allowedUiTargetIds,
    };
    try {
      let result = await tutorProvider.generate(input, { signal });
      let issues = safetyIssues(step, result.turn, allowedUiTargetIds);
      let repaired = false;

      if (issues.length > 0) {
        repaired = true;
        session.log("maia_turn_rejected", { stepId, issues, attempt: 1 });
        result = await tutorProvider.generate(input, {
          signal,
          repairIssues: issues,
        });
        issues = safetyIssues(step, result.turn, allowedUiTargetIds);
      }

      const sameStep = !session.complete && session.currentStep.id === stepId;
      if (issues.length === 0 && sameStep) {
        recordSafeLiveTurn(session, learnerMessage, result, repaired);
        return { turn: result.turn, source: "openai", repaired };
      }
      session.log("maia_turn_rejected", {
        stepId,
        issues: sameStep ? issues : ["stale_step"],
        attempt: repaired ? 2 : 1,
      });
    } catch (error) {
      session.log("maia_provider_error", {
        stepId,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      log.warn("maia_provider_error", {
        sessionId: session.sessionId,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  const turn = deterministicFallback(session);
  session.chatHistory.push(
    { role: "user", content: learnerMessage },
    { role: "assistant", content: turn.message },
  );
  session.log("maia_fallback", { stepId });
  return { turn, source: "deterministic", repaired: false };
}
