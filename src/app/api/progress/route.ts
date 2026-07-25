import { NextResponse } from "next/server";

import { buildDashboardSnapshot } from "@/lib/dashboard";
import { currentActor } from "@/lib/server/actor";

export const dynamic = "force-dynamic";

/**
 * Course progress for the navigation rail. Deliberately narrow: the sidebar
 * needs ordering, progress rails and the guidance mode it reports — not the
 * full dashboard snapshot. The provider rides along here rather than in a
 * second request because the rail would otherwise have to guess, and a nav
 * indicator that guesses is worse than no indicator.
 */
export async function GET() {
  const actor = await currentActor();
  const snapshot = await buildDashboardSnapshot(actor.ownerId);
  return NextResponse.json(
    {
      courseProgress: snapshot.courseProgress,
      runtime: { provider: snapshot.runtime.provider },
    },
    // Per-learner data: never cacheable. Matches every other actor-scoped route.
    { headers: { "Cache-Control": "no-store" } },
  );
}
