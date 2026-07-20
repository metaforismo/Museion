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
    case "graph": {
      const params = parseGraphParams(norm);
      correct =
        params !== null &&
        Math.abs(params.a - spec.target.a) <= spec.tolerance &&
        Math.abs(params.h - spec.target.h) <= spec.tolerance &&
        Math.abs(params.k - spec.target.k) <= spec.tolerance;
      break;
    }
  }

  return {
    correct,
    normalizedAnswer: norm,
    misconception: correct ? null : matchMisconception(step, norm),
  };
}

/** Parse "a=1,h=-3,k=2" (normalized form) into parameters; null if malformed. */
export function parseGraphParams(normalized: string): { a: number; h: number; k: number } | null {
  const match = normalized.match(/^a=(-?\d+(?:\.\d+)?),h=(-?\d+(?:\.\d+)?),k=(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  return { a: Number(match[1]), h: Number(match[2]), k: Number(match[3]) };
}

export function matchMisconception(
  step: Step,
  normalizedAnswer: string,
): Misconception | null {
  const candidateValue = parseNumber(normalizedAnswer);
  // Graph triggers match numerically per component, within the step tolerance.
  if (step.answer.kind === "graph") {
    const params = parseGraphParams(normalizedAnswer);
    if (!params) return null;
    const tolerance = step.answer.tolerance;
    for (const misconception of step.misconceptions) {
      for (const trigger of misconception.triggerAnswers) {
        const triggerParams = parseGraphParams(normalize(trigger));
        if (
          triggerParams &&
          Math.abs(params.a - triggerParams.a) <= tolerance &&
          Math.abs(params.h - triggerParams.h) <= tolerance &&
          Math.abs(params.k - triggerParams.k) <= tolerance
        ) {
          return misconception;
        }
      }
    }
    return null;
  }
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
