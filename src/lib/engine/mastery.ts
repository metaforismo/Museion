/**
 * Per-concept mastery model and the fading policy built on it.
 *
 * This implements the "assistance dilemma" resolution (Koedinger &
 * Aleven 2007): how much help, and when. Mastery is tracked per
 * concept; the scaffolding Maia is allowed to offer fades as mastery
 * grows (Wood, Bruner & Ross 1976), because guidance that helps novices
 * hurts experts (expertise reversal effect, Kalyuga & Sweller).
 */

export type ScaffoldingLevel = "novice" | "developing" | "proficient";

/** Hint-ladder depth allowed per scaffolding level. */
export const MAX_HINT_DEPTH: Record<ScaffoldingLevel, number> = {
  novice: 3, // full ladder, proactive coaching
  developing: 2, // ladder capped, hints on request
  proficient: 1, // Socratic prompts only; Maia asks, never tells
};

const LEARNING_RATE = 0.3;
const DEVELOPING_THRESHOLD = 0.4;
const PROFICIENT_THRESHOLD = 0.8;

/**
 * Exponential-moving-average mastery in [0, 1] per concept.
 *
 * First-attempt performance is the signal: solving with hints or after
 * failures is performance-with-a-crutch, so it moves mastery less
 * (Soderstrom & Bjork: performance is not learning).
 */
export class MasteryModel {
  private scores = new Map<string, number>();

  mastery(concept: string): number {
    return this.scores.get(concept) ?? 0;
  }

  recordAttempt(
    concept: string,
    correct: boolean,
    firstAttempt: boolean,
    hintsUsed: number,
  ): number {
    // Unassisted first-attempt success is full evidence of mastery;
    // assisted success is discounted.
    const evidence = correct ? (firstAttempt && hintsUsed === 0 ? 1.0 : 0.5) : 0.0;
    const current = this.mastery(concept);
    const updated = current + LEARNING_RATE * (evidence - current);
    this.scores.set(concept, updated);
    return updated;
  }

  scaffoldingLevel(concept: string): ScaffoldingLevel {
    const score = this.mastery(concept);
    if (score >= PROFICIENT_THRESHOLD) return "proficient";
    if (score >= DEVELOPING_THRESHOLD) return "developing";
    return "novice";
  }

  maxHintDepth(concept: string): number {
    return MAX_HINT_DEPTH[this.scaffoldingLevel(concept)];
  }
}
