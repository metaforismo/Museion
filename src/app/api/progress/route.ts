import { NextResponse } from "next/server";

import { buildDashboardSnapshot } from "@/lib/dashboard";
import { currentActor } from "@/lib/server/actor";

export const dynamic = "force-dynamic";

/**
 * Course progress for the navigation rail. Deliberately narrow: the sidebar
 * needs ordering and progress rails, not the full dashboard snapshot.
 */
export async function GET() {
  const actor = await currentActor();
  const snapshot = await buildDashboardSnapshot(actor.ownerId);
  return NextResponse.json({ courseProgress: snapshot.courseProgress });
}
