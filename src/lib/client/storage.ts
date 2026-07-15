/**
 * Browser storage keys and helpers (client-only).
 * Centralized so keys never drift between components.
 */

import type { SessionMode } from "@/lib/api-types";

const ONBOARDED_KEY = "museion-onboarded";

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
