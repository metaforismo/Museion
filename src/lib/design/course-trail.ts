/**
 * The course trail — the snaking path that makes a course a place you are
 * standing rather than a list you are reading. Every state here derives from
 * the real learner record (`completedLessons`); nothing is invented and
 * nothing is locked. Museion recommends order, it does not enforce it, so an
 * "ahead" node is a quieter link, never a padlock.
 */

export type TrailNodeState = "done" | "current" | "ahead";

export interface TrailNode {
  lessonId: string;
  state: TrailNodeState;
  /**
   * Whether the rail segment arriving from the previous node is walked
   * ground. A segment is traversed when the lesson it leaves has a completed
   * record — the learner has stood there — independent of what lies ahead.
   */
  traversedFrom: boolean;
}

/**
 * "Current" is the first lesson without a completed record — the recommended
 * next step — even when later lessons were finished out of order: the path
 * points at the earliest gap rather than pretending the record is linear.
 * When every lesson is complete there is no current node at all.
 */
export function buildTrail(
  lessonIds: readonly string[],
  completed: ReadonlySet<string>,
): TrailNode[] {
  const currentIndex = lessonIds.findIndex((id) => !completed.has(id));
  return lessonIds.map((lessonId, index) => ({
    lessonId,
    state: completed.has(lessonId) ? "done" : index === currentIndex ? "current" : "ahead",
    traversedFrom: index > 0 && completed.has(lessonIds[index - 1]),
  }));
}

/** True when every lesson on the path has a completed record. */
export function trailComplete(lessonIds: readonly string[], completed: ReadonlySet<string>): boolean {
  return lessonIds.length > 0 && lessonIds.every((id) => completed.has(id));
}
