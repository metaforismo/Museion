/**
 * Authoring validation for lesson content.
 *
 * The ground truth is only as good as its authoring, so every lesson is
 * checked structurally — and, crucially, every misconception trigger is
 * run through the real verifier to prove it does NOT count as correct.
 * A trigger that verifies as correct would teach Maia to "remediate"
 * right answers.
 */

import type { Lesson } from "./types";
import { verify } from "../engine/verifier";

export function validateLesson(lesson: Lesson): string[] {
  const issues: string[] = [];
  const where = (stepId: string) => `${lesson.id}/${stepId}`;

  if (lesson.steps.length === 0) {
    issues.push(`${lesson.id}: lesson has no steps`);
  }

  const stepIds = new Set<string>();
  const allSteps = [...lesson.steps, ...(lesson.practice ?? [])];
  for (const step of allSteps) {
    if (stepIds.has(step.id)) {
      issues.push(`${where(step.id)}: duplicate step id`);
    }
    stepIds.add(step.id);

    if (!lesson.concepts.includes(step.concept)) {
      issues.push(
        `${where(step.id)}: concept "${step.concept}" is not declared on the lesson`,
      );
    }

    if (step.solution.trim() === "") {
      issues.push(`${where(step.id)}: missing verified solution`);
    }

    switch (step.answer.kind) {
      case "numeric":
        if (step.answer.tolerance < 0) {
          issues.push(`${where(step.id)}: negative tolerance`);
        }
        break;
      case "multipleChoice":
        if (
          step.answer.correctIndex < 0 ||
          step.answer.correctIndex >= step.answer.options.length
        ) {
          issues.push(`${where(step.id)}: correctIndex out of range`);
        }
        break;
      case "expression":
        if (step.answer.acceptedForms.length === 0) {
          issues.push(`${where(step.id)}: no accepted forms`);
        }
        break;
    }

    for (const misconception of step.misconceptions) {
      for (const trigger of misconception.triggerAnswers) {
        if (verify(step, trigger).correct) {
          issues.push(
            `${where(step.id)}: misconception "${misconception.id}" trigger ` +
              `"${trigger}" verifies as a CORRECT answer`,
          );
        }
      }
    }
  }

  return issues;
}
