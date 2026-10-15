import type { TutorTurnInput } from "./contracts";
import { TutorProviderError } from "./provider-error";

export const TUTOR_CONTEXT_LIMITS = {
  historyTurns: 8,
  historyCharacters: 6_000,
  stateCharacters: 4_000,
} as const;

/** A last-mile filter for recognizable credentials volunteered in chat.
 * This is not a general PII detector or an anonymization guarantee. */
export function redactTutorSecrets(value: string): string {
  return value
    .replace(/\bsk-(?:or-v1-)?[a-z0-9_-]{20,}\b/gi, "[credential removed]")
    .replace(/\bBearer\s+[a-z0-9._~-]{20,}\b/gi, "[credential removed]");
}

/** Only the active lesson and a bounded recent conversation leave the server.
 * Account names, IDs, saved sources and unrelated sessions are never included. */
export function boundedTutorInput(input: TutorTurnInput): TutorTurnInput {
  if (input.snapshot.verifiedSolution.length > TUTOR_CONTEXT_LIMITS.stateCharacters) {
    throw new TutorProviderError("provider_context_limit");
  }
  let remaining = TUTOR_CONTEXT_LIMITS.historyCharacters;
  const history = input.history.slice(-TUTOR_CONTEXT_LIMITS.historyTurns).reverse().map((entry) => {
    const content = redactTutorSecrets(entry.content).slice(0, remaining);
    remaining -= content.length;
    return { role: entry.role, content };
  }).filter((entry) => entry.content.length > 0).reverse();
  const snapshot = input.snapshot;
  return {
    snapshot: {
      ...snapshot,
      lessonTitle: snapshot.lessonTitle.slice(0, 200),
      stepPrompt: redactTutorSecrets(snapshot.stepPrompt).slice(0, TUTOR_CONTEXT_LIMITS.stateCharacters),
      options: snapshot.options?.slice(0, 12).map((option) => redactTutorSecrets(option).slice(0, 400)) ?? null,
      attempts: snapshot.attempts.slice(-4).map((attempt) => redactTutorSecrets(attempt).slice(0, 400)),
      lastMisconception: snapshot.lastMisconception ? {
        description: snapshot.lastMisconception.description.slice(0, 600),
        remediationFocus: snapshot.lastMisconception.remediationFocus.slice(0, 600),
      } : null,
    },
    history,
    // Keep the current question intact. Only previous conversation is budgeted;
    // silently cutting a learner's explanation can change its meaning.
    learnerMessage: redactTutorSecrets(input.learnerMessage),
    allowedUiTargetIds: input.allowedUiTargetIds.slice(0, 32),
    liveActivity: input.liveActivity ? redactTutorSecrets(input.liveActivity).slice(0, 1_000) : null,
  };
}
