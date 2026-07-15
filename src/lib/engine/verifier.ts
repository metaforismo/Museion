/**
 * Deterministic answer verification.
 *
 * Correctness is decided here, by code, against author-verified content.
 * The LLM never grades anything — this is the architectural guarantee
 * that model output cannot override authored correctness.
 */

import type { Misconception, Step } from "../content/types";

export interface VerificationResult {
  correct: boolean;
  normalizedAnswer: string;
  misconception: Misconception | null;
}

/** Canonical form used for matching answers and misconception triggers. */
export function normalize(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}

/** Parse "4", "4.0", "8/2", "-1/3" into a number; null if not numeric. */
export function parseNumber(text: string): number | null {
  const fraction = text.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return null;
    return Number(fraction[1]) / denominator;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(text)) {
    return Number(text);
  }
  return null;
}

export function verify(step: Step, rawAnswer: string): VerificationResult {
  const norm = normalize(rawAnswer);
  const spec = step.answer;
  let correct: boolean;

  switch (spec.kind) {
    case "numeric": {
      const value = parseNumber(norm);
      correct = value !== null && Math.abs(value - spec.value) <= spec.tolerance;
      break;
    }
    case "multipleChoice": {
      const options = spec.options.map(normalize);
      const asIndex = /^\d+$/.test(norm) ? Number(norm) : null;
      // Accept the option index as well as the option text.
      correct =
        asIndex !== null && asIndex < options.length
          ? asIndex === spec.correctIndex
          : norm === options[spec.correctIndex];
      break;
    }
    case "expression": {
      correct = spec.acceptedForms.map(normalize).includes(norm);
      break;
    }
  }

  return {
    correct,
    normalizedAnswer: norm,
    misconception: correct ? null : matchMisconception(step, norm),
  };
}

export function matchMisconception(
  step: Step,
  normalizedAnswer: string,
): Misconception | null {
  const candidateValue = parseNumber(normalizedAnswer);
  for (const misconception of step.misconceptions) {
    for (const trigger of misconception.triggerAnswers) {
      const triggerNorm = normalize(trigger);
      if (normalizedAnswer === triggerNorm) return misconception;
      // Numeric triggers also match equivalent forms ("2.2" vs "11/5").
      const triggerValue = parseNumber(triggerNorm);
      if (
        triggerValue !== null &&
        candidateValue !== null &&
        triggerValue === candidateValue
      ) {
        return misconception;
      }
    }
  }
  return null;
}
