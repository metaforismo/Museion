/**
 * Authoring validation for lesson content.
 *
 * The ground truth is only as good as its authoring, so every lesson is
 * checked structurally — and, crucially, every misconception trigger is
 * run through the real verifier to prove it does NOT count as correct.
 * A trigger that verifies as correct would teach Maia to "remediate"
 * right answers.
 */

import type { Lesson, Step } from "./types";
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

    const checkAnswerAndTriggers = (candidate: Step, label: string) => {
      switch (candidate.answer.kind) {
        case "numeric":
          if (candidate.answer.tolerance < 0) {
            issues.push(`${label}: negative tolerance`);
          }
          break;
        case "multipleChoice":
          if (
            candidate.answer.correctIndex < 0 ||
            candidate.answer.correctIndex >= candidate.answer.options.length
          ) {
            issues.push(`${label}: correctIndex out of range`);
          }
          break;
        case "expression":
          if (candidate.answer.acceptedForms.length === 0) {
            issues.push(`${label}: no accepted forms`);
          }
          break;
      }

      for (const misconception of candidate.misconceptions) {
        for (const trigger of misconception.triggerAnswers) {
          if (verify(candidate, trigger).correct) {
            issues.push(
              `${label}: misconception "${misconception.id}" trigger ` +
                `"${trigger}" verifies as a CORRECT answer`,
            );
          }
        }

        // Highlights may only point at what is already on screen: a term
        // must literally occur in this surface's prompt, and a graph
        // region only exists on a graph step.
        const highlight = misconception.highlight;
        if (highlight?.kind === "term" && !candidate.prompt.includes(highlight.text)) {
          issues.push(
            `${label}: misconception "${misconception.id}" highlight ` +
              `"${highlight.text}" does not occur in the prompt`,
          );
        }
        if (highlight?.kind === "graph-region" && candidate.answer.kind !== "graph") {
          issues.push(
            `${label}: misconception "${misconception.id}" uses a graph-region ` +
              `highlight on a non-graph step`,
          );
        }
      }
    };

    checkAnswerAndTriggers(step, where(step.id));

    // Variants hold the same authoring bar: their triggers are proven
    // against the variant's own answer, exactly like base steps.
    for (const [index, variant] of (step.variants ?? []).entries()) {
      checkAnswerAndTriggers(
        {
          ...step,
          prompt: variant.prompt,
          answer: variant.answer,
          solution: variant.solution,
          misconceptions: variant.misconceptions,
          hints: variant.hints ?? step.hints,
        },
        `${where(step.id)}/variant-${index + 1}`,
      );
      if (variant.solution.trim() === "") {
        issues.push(`${where(step.id)}/variant-${index + 1}: missing verified solution`);
      }
    }
  }

  return issues;
}
