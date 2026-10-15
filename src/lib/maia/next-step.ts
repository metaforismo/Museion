import type { DashboardSnapshot } from "@/lib/dashboard/contracts";

const FRIENDLY_REASONS: Record<string, string> = {
  "An independent check is already active.": "You’ve started an independent check. Finish it to see what you can work out on your own.",
  "This is your most recent incomplete generated course.": "Your course is already underway. We can pick up at the next unfinished activity.",
  "This is your most recent incomplete authored lesson.": "You have a lesson in progress. Let’s keep that thread and try one more step.",
  "The latest immediate transfer observation was not correct.": "The last independent check was tricky. Revisiting the idea can help you approach a different example.",
  "A recorded learning signal makes this the highest-priority review.": "Your recent work put this concept in your review list. A fresh attempt can help you see it more clearly.",
  "This validated course has not been launched yet.": "The course from your source is ready. Start with its first activity and tell me what you notice.",
  "There is no learning record yet.": "Let’s start with a small, guided discovery. You don’t need to know the answer before you begin.",
  "Your onboarding preference selected this starting course.": "This starting course follows the interest you chose. Try its first question; we’ll work from what you actually do.",
  "There is no unfinished or high-priority review item.": "Your current activities are finished. Bring a question or source you’d like to explore next.",
};

/** Explains the engine's selected action; never ranks, generates or changes it. */
export function maiaNextStepReason(action: DashboardSnapshot["nextAction"]): string {
  return FRIENDLY_REASONS[action.reason] ?? action.reason;
}
