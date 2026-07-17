/**
 * Browser storage keys and helpers (client-only).
 * Centralized so keys never drift between components.
 */

import type { SessionMode } from "@/lib/api-types";

const ONBOARDED_KEY = "museion-onboarded";
const PREFERENCES_KEY = "museion-learning-preferences-v1";

export interface LearningPreferences {
  schemaVersion: "1.0";
  role: "student" | "educator" | "independent";
  ageBand: "13-15" | "16-18" | "adult" | "prefer-not-to-say";
  goal: "build-foundations" | "prepare-exam" | "teach-it-back";
}

const DEFAULT_PREFERENCES: LearningPreferences = {
  schemaVersion: "1.0",
  role: "independent",
  ageBand: "prefer-not-to-say",
  goal: "build-foundations",
};

export function sessionStorageKey(lessonId: string, mode: SessionMode): string {
  return `museion-session-${mode}-${lessonId}`;
}

export function hasOnboarded(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDED_KEY) === "1";
}

export function markOnboarded(): void {
  localStorage.setItem(ONBOARDED_KEY, "1");
}

export function saveLearningPreferences(preferences: LearningPreferences): void {
  try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); } catch { /* preferences are optional */ }
}

export function readLearningPreferences(): LearningPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? "null") as Partial<LearningPreferences> | null;
    const roles = new Set(["student", "educator", "independent"]);
    const ages = new Set(["13-15", "16-18", "adult", "prefer-not-to-say"]);
    const goals = new Set(["build-foundations", "prepare-exam", "teach-it-back"]);
    if (!parsed || parsed.schemaVersion !== "1.0" || !roles.has(parsed.role ?? "") || !ages.has(parsed.ageBand ?? "") || !goals.has(parsed.goal ?? "")) return DEFAULT_PREFERENCES;
    return parsed as LearningPreferences;
  } catch { return DEFAULT_PREFERENCES; }
}
