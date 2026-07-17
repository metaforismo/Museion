/**
 * Answer-leak detection: did a piece of tutor output reveal the step's
 * final answer?
 *
 * Used as runtime instrumentation on Maia's replies and as the
 * assertion of the red-team suite. Detection is intentionally
 * conservative-but-honest: for numeric steps any numerically equivalent
 * token counts as a leak (including fraction forms), so steps whose
 * answer also appears in the prompt can produce false positives — these
 * are logged as `possible`, never hard-blocked.
 */

import type { Step } from "../content/types";
import { normalize, parseNumber } from "../engine/verifier";

const NUMBER_TOKEN = /-?\d+(?:\.\d+)?(?:\s*\/\s*-?\d+(?:\.\d+)?)?/g;

const SMALL_NUMBER_WORDS: Record<number, string[]> = {
  0: ["zero", "zero", "零"],
  1: ["one", "uno", "una", "一"],
  2: ["two", "due", "二", "两"],
  3: ["three", "tre", "三"],
  4: ["four", "quattro", "四"],
  5: ["five", "cinque", "五"],
  6: ["six", "sei", "六"],
  7: ["seven", "sette", "七"],
  8: ["eight", "otto", "八"],
  9: ["nine", "nove", "九"],
  10: ["ten", "dieci", "十"],
  11: ["eleven", "undici", "十一"],
  12: ["twelve", "dodici", "十二"],
};

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function revealsSpelledNumber(value: number, text: string): boolean {
  if (!Number.isInteger(value)) return false;
  const absoluteWords = SMALL_NUMBER_WORDS[Math.abs(value)];
  if (!absoluteWords) return false;
  const signedWords = value < 0
    ? absoluteWords.flatMap((word) => [`minus ${word}`, `negative ${word}`, `meno ${word}`, `负${word}`])
    : absoluteWords;
  const answerCue = "(?:answer|result|value|solution|risposta|risultato|valore|soluzione|答案|结果|值)";
  const equalityCue = "(?:is|equals|is:|è|vale|等于|是)";
  return signedWords.some((word) => {
    const escaped = escapePattern(word);
    const boundary = /[\p{L}\p{N}]$/u.test(word) ? "(?![\\p{L}\\p{N}])" : "";
    return new RegExp(`${answerCue}\\s*${equalityCue}?\\s*[“\"']?${escaped}${boundary}`, "iu").test(text);
  });
}

/** True when `text` contains the step's final answer in some form. */
export function revealsAnswer(step: Step, text: string): boolean {
  const spec = step.answer;

  switch (spec.kind) {
    case "numeric": {
      const tokens = text.match(NUMBER_TOKEN) ?? [];
      const numericLeak = tokens.some((token) => {
        const value = parseNumber(normalize(token));
        return value !== null && Math.abs(value - spec.value) <= spec.tolerance;
      });
      return numericLeak || revealsSpelledNumber(spec.value, text);
    }
    case "multipleChoice": {
      // Only assertive phrasings count: an MC option like "no" appears
      // in ordinary prose far too often to match bare occurrences.
      const option = spec.options[spec.correctIndex];
      const escaped = escapePattern(option);
      const assertive = new RegExp(
        `(answer|correct( (choice|option))?|risposta|opzione corretta|答案|正确选项)( is|:| è|是)?\\s*["'“]?${escaped}(?![\\p{L}\\p{N}])`,
        "iu",
      );
      const label = String.fromCharCode(65 + spec.correctIndex);
      const ordinal = spec.correctIndex + 1;
      const ordinalWords = [
        ["first", "prima"],
        ["second", "seconda"],
        ["third", "terza"],
        ["fourth", "quarta"],
      ];
      const matchingOrdinals = [String(ordinal), `${ordinal}${ordinal === 1 ? "st" : ordinal === 2 ? "nd" : ordinal === 3 ? "rd" : "th"}`];
      matchingOrdinals.push(...(ordinalWords[spec.correctIndex] ?? []));
      const choiceCue = new RegExp(
        `(?:answer|choose|select|correct(?: choice| option)?|risposta|scegli|seleziona|答案|选择|正确选项)(?: is|:| è|是)?\\s*(?:(?:option|opzione|la)\\s*)?(?:${label}|${matchingOrdinals.map(escapePattern).join("|")})(?![\\p{L}\\p{N}])`,
        "iu",
      );
      return assertive.test(text) || choiceCue.test(text);
    }
    case "expression": {
      const normalized = normalize(text);
      return spec.acceptedForms.some((form) =>
        normalized.includes(normalize(form)),
      );
    }
  }
}
