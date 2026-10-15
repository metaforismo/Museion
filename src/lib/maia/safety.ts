import type { Step } from "../content/types";
import type { TutorTurn } from "./contracts";
import { TutorTurnSchema } from "./contracts";
import { revealsAnswer } from "./leak";

export function tutorSafetyIssues(
  step: Step,
  turn: TutorTurn,
  allowedUiTargetIds: readonly string[],
): string[] {
  const issues: string[] = [];
  if (!TutorTurnSchema.safeParse(turn).success) return ["invalid_schema"];
  const learnerVisibleText = [
    turn.message,
    ...turn.uiActions.flatMap((action) => action.text ? [action.text] : []),
  ].join("\n");
  if (revealsAnswer(step, learnerVisibleText)) issues.push("answer_leak_detected");
  if (/(?:untrusted_lesson_state|verifiedSolution|MAIA_PERSONA|reasoning_details|INSTRUCTION PRIORITY AND TRUST|TEACHING CONTRACT|BOUNDARIES AND PRIVACY|sk-(?:or-v1-)?[a-z0-9_-]{20,})/i.test(learnerVisibleText)) {
    issues.push("private_context_detected");
  }
  const allowed = new Set(allowedUiTargetIds);
  if (turn.uiActions.some((action) => !allowed.has(action.targetId))) {
    issues.push("invalid_ui_target");
  }
  return issues;
}
