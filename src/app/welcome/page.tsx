import type { Metadata } from "next";
import OnboardingTour from "@/components/OnboardingTour";
import { currentActor } from "@/lib/server/actor";
import { savedLearningPreferences } from "@/lib/server/learner-settings";
import { coursePaths } from "@/lib/curriculum";
import { redirect } from "next/navigation";
export const metadata: Metadata = { title: "Find your starting point", description: "A few useful choices to make your learning space yours.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function WelcomePage() {
  const actor = await currentActor();
  if (actor.kind !== "account") redirect("/login?next=/welcome");
  const initial = await savedLearningPreferences(actor.ownerId);
  return <OnboardingTour name={actor.displayName} initial={initial} courses={coursePaths.map(({ id, title, tagline, estimatedMinutes }) => ({ id, title, tagline, estimatedMinutes }))} />;
}
