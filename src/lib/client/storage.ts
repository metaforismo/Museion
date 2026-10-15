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
  familiarity?: "new" | "some" | "confident";
  dailyMinutes?: 10 | 20 | 30;
  subject?: "math" | "coding" | "science" | "reasoning";
  suggestedCourseId?: string;
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
  try { return localStorage.getItem(ONBOARDED_KEY) === "1"; } catch { return true; }
}

export function markOnboarded(): void {
  try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch { /* Browser storage is optional. */ }
}

export async function saveLearningPreferences(preferences: LearningPreferences): Promise<void> {
  const response = await fetch("/api/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(preferences) });
  if (!response.ok) throw new Error("We couldn't save your preference. Please try again.");
  restoreLearnerBrowserState(preferences);
}

export function restoreLearnerBrowserState(preferences: LearningPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    localStorage.setItem(ONBOARDED_KEY, "1");
  } catch { /* browser caching is optional; server persistence remains authoritative */ }
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

/** Discard cached lesson IDs and preferences when switching accounts. */
export function clearLearnerBrowserState(): void {
  if (typeof window === "undefined") return;
  try {
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of Object.keys(storage)) {
        if (key.startsWith("museion-session-") || key === ONBOARDED_KEY || key === PREFERENCES_KEY) storage.removeItem(key);
      }
    }
  } catch { /* blocked browser storage must never prevent sign-in or sign-out */ }
}
