import type { MisconceptionHighlight } from "@/lib/content/types";
import type { TutorUiAction } from "./contracts";

/** A bounded authored cue, separate from actual tutor conversation history. */
export interface MaiaGuidance {
  id: string;
  sessionId: string;
  stepId: string;
  variantIndex: number;
  sessionVersion: number;
  trigger: "step-open" | "checked-attempt";
  source: "lesson-authored";
  invitation: string;
  message: string;
  uiActions: TutorUiAction[];
  highlight: MisconceptionHighlight | null;
}
export interface MaiaGuidanceScope { sessionId: string; stepId: string; variantIndex: number; sessionVersion: number; independent?: boolean }
export interface MaiaGuidanceState { current: MaiaGuidance | null; dismissedIds: readonly string[]; seenIds: readonly string[]; scopeKey: string | null; lastVersion: number }
export const emptyMaiaGuidanceState = (): MaiaGuidanceState => ({ current: null, dismissedIds: [], seenIds: [], scopeKey: null, lastVersion: -1 });

export function guidanceMatchesScope(scope: MaiaGuidanceScope, guidance: MaiaGuidance | null | undefined): guidance is MaiaGuidance {
  return Boolean(guidance && !scope.independent && guidance.sessionId === scope.sessionId && guidance.stepId === scope.stepId && guidance.variantIndex === scope.variantIndex && guidance.sessionVersion <= scope.sessionVersion);
}

/** Stable event IDs deduplicate repeated renders, request retries, and chat-only
 * version changes. Late old-step/old-variant events are never displayed. */
export function receiveMaiaGuidance(state: MaiaGuidanceState, scope: MaiaGuidanceScope, incoming: MaiaGuidance | null | undefined): MaiaGuidanceState {
  const scopeKey = `${scope.sessionId}:${scope.stepId}:${scope.variantIndex}`;
  const scoped = state.scopeKey === scopeKey ? state : { ...emptyMaiaGuidanceState(), scopeKey };
  const current = guidanceMatchesScope(scope, scoped.current) ? scoped.current : null;
  const base = current === scoped.current ? scoped : { ...scoped, current };
  // Explicit null means the server checked the new state and intentionally
  // offers no cue (e.g. a safety-gated delivery). Keep its version watermark.
  if (incoming === null) return current === null && scoped.lastVersion >= scope.sessionVersion ? base : { ...base, current: null, lastVersion: Math.max(scoped.lastVersion, scope.sessionVersion) };
  if (!guidanceMatchesScope(scope, incoming) || scoped.dismissedIds.includes(incoming.id) || scoped.seenIds.includes(incoming.id) || incoming.sessionVersion < scoped.lastVersion) return base;
  return { ...base, current: incoming, lastVersion: incoming.sessionVersion, seenIds: [...scoped.seenIds, incoming.id].slice(-128) };
}
export function dismissMaiaGuidance(state: MaiaGuidanceState): MaiaGuidanceState {
  return state.current ? { ...state, dismissedIds: [...state.dismissedIds, state.current.id].slice(-128), current: null } : state;
}

/** A live reply may update this very scope, but cannot redraw an older checked
 * state or a different variation. Explicit practice chat remains permitted. */
export function tutorDeliveryMatchesScope(sent: MaiaGuidanceScope, current: MaiaGuidanceScope, deliveredVersion: number): boolean {
  return sent.sessionId === current.sessionId && sent.stepId === current.stepId && sent.variantIndex === current.variantIndex && Number.isInteger(deliveredVersion) && deliveredVersion > sent.sessionVersion && deliveredVersion >= current.sessionVersion;
}
