import type { CSSProperties } from "react";

import { TINTS } from "./palette";

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
  { zone: "learn", prefixes: ["/dashboard", "/library", "/review", "/courses"] },
];

const ZONE_TINT: Record<Zone, string | null> = {
  learn: TINTS.sky,
  evidence: TINTS.mint,
  studio: TINTS.peach,
  account: null,
};

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
  const tint = subjectTint ?? ZONE_TINT[zone];
  if (!tint) return {};
  return {
    backgroundImage: `radial-gradient(58rem 34rem at 12% -6%, ${tint}, transparent), radial-gradient(46rem 30rem at 92% 4%, ${tint}, transparent)`,
  };
}
