import type { CSSProperties } from "react";

import { SUBJECT_PALETTE, TINTS } from "./palette";

/**
 * Zone washes give wayfinding you feel before you read. One soft radial at
 * roughly 4% strength over paper — the same technique already used on the
 * lesson focus route, not a new gradient language.
 */

export type Zone = "learn" | "evidence" | "studio" | "account";

const ZONE_ROUTES: { zone: Zone; prefixes: string[] }[] = [
  { zone: "evidence", prefixes: ["/progress"] },
  { zone: "studio", prefixes: ["/create"] },
  { zone: "account", prefixes: ["/settings", "/account"] },
  // `/judge` and `/learn` are the judge canvas — a lesson being learned, so
  // they belong to the learn zone deliberately rather than by fallthrough.
  { zone: "learn", prefixes: ["/dashboard", "/library", "/review", "/courses", "/judge", "/learn"] },
];

const ZONE_TINT: Record<Zone, string | null> = {
  learn: TINTS.sky,
  evidence: TINTS.mint,
  studio: TINTS.peach,
  account: null,
};

/**
 * The studio zone's accent pair. The studio wash is peach, and peach's
 * contrast-checked accent pair in the palette is the physics entry — the only
 * accent proven 4.5:1 against this tint (and 6.1:1 under white). Exposed here
 * so every studio surface shares one derivation instead of each re-deciding
 * which accent may sit on the zone's ground.
 */
export const STUDIO_ACCENT = SUBJECT_PALETTE.physics.accentVar;
export const STUDIO_DEEP = SUBJECT_PALETTE.physics.deepVar;
export const STUDIO_TINT = SUBJECT_PALETTE.physics.tintVar;

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function zoneForPath(pathname: string): Zone {
  for (const { zone, prefixes } of ZONE_ROUTES) {
    if (prefixes.some((prefix) => matches(pathname, prefix))) return zone;
  }
  return "learn";
}

export function washStyle(zone: Zone, subjectTint?: string): CSSProperties {
  // The account zone is deliberately unwashed. Checking it before resolving the
  // tint keeps that true even when a caller passes an explicit subject tint —
  // otherwise a subject-scoped settings page would silently acquire a wash.
  if (!ZONE_TINT[zone]) return {};
  const tint = subjectTint ?? ZONE_TINT[zone];
  if (!tint) return {};
  return {
    backgroundImage: `radial-gradient(58rem 34rem at 12% -6%, ${tint}, transparent), radial-gradient(46rem 30rem at 92% 4%, ${tint}, transparent)`,
  };
}
