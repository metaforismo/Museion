import type { DashboardSnapshot } from "@/lib/dashboard/contracts";

/**
 * Maia is state, never furniture. Every appearance derives from real data,
 * and she animates only where she is live — the lesson canvas and verified
 * moments. A mascot idling on a page where she cannot be spoken to is the
 * clearest tell that a product is decorated rather than designed.
 */

export type MaiaState = "attentive" | "curious" | "thinking" | "celebrating" | "redirecting";

/**
 * One meaning per pose. This is the whole contract: a pose picked for looks
 * rather than for the meaning listed here teaches people to stop reading her.
 */
export const MAIA_STATE_MEANING: Record<MaiaState, string> = {
  attentive: "idle — nothing is waiting",
  curious: "a move is available",
  thinking: "something needs review",
  celebrating: "a verified moment fired",
  redirecting: "a misconception was detected",
};

/**
 * The accessible name for each pose. The alt text has to say what the drawing
 * says: a hero named "ready for the next learning move" while she is drawn
 * thinking tells a screen-reader user the opposite of what a sighted learner
 * is looking at, which breaks the same contract a pose picked for looks does.
 * Anywhere the pose is derived, the name is derived from the same state.
 */
export const MAIA_STATE_TITLE: Record<MaiaState, string> = {
  attentive: "Maia, waiting — nothing needs attention",
  curious: "Maia, ready for the next learning move",
  thinking: "Maia, something in the record needs review",
  celebrating: "Maia, marking a verified moment",
  redirecting: "Maia, pointing at a detected misconception",
};

/**
 * 28px inline avatar, 128px page figure, 144px verified moment. Nothing else.
 * The hero rung was 96 through the unification pass; the energy pass raised
 * it so her hero placements read as presence rather than ornament — one rung
 * for every hero, not a bespoke size per page.
 */
export const MAIA_SIZES = { inline: 28, hero: 128, moment: 144 } as const;
export type MaiaSize = keyof typeof MAIA_SIZES;

/**
 * The recommendation kinds the dashboard can actually produce. Taken from the
 * snapshot contract rather than restated, so adding a seventh kind is a
 * compile error here instead of a pose that silently falls through.
 */
export type MaiaActionKind = DashboardSnapshot["nextAction"]["kind"];

/** Pose derived from the dashboard's real recommendation, never chosen for looks. */
export function maiaStateForAction(kind: MaiaActionKind): MaiaState {
  switch (kind) {
    case "review":
      // Something in the record needs a second look.
      return "thinking";
    case "resume":
    case "launch":
    case "practice":
      // A specific learning move is queued and ready.
      return "curious";
    case "create":
      // Nothing is unfinished and nothing needs review: she is idle, and the
      // invitation to bring a source is not a learning move to be curious about.
      return "attentive";
  }
}
