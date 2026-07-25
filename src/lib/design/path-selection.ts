/**
 * Sidebar path ordering. Ten identical rows is a wall; six ordered by what
 * the learner is actually doing is navigation. Ordering is deterministic so
 * the rail never reshuffles between renders.
 */

export type SidebarCourse = { id: string; title: string; subject: string; lessonCount: number };
export type CourseProgress = Record<string, { completed: number; total: number }>;

const IN_PROGRESS = 0;
const COMPLETED = 1;
const UNSTARTED = 2;

function bucket(entry: { completed: number; total: number } | undefined): number {
  if (!entry || entry.completed <= 0) return UNSTARTED;
  if (entry.total > 0 && entry.completed >= entry.total) return COMPLETED;
  return IN_PROGRESS;
}

export function orderSidebarPaths(
  courses: SidebarCourse[],
  progress: CourseProgress,
  limit = 6,
): { visible: SidebarCourse[]; hiddenCount: number } {
  const ordered = courses
    .map((course, index) => ({ course, index, bucket: bucket(progress[course.id]) }))
    .sort((left, right) => left.bucket - right.bucket || left.index - right.index)
    .map((item) => item.course);

  return {
    visible: ordered.slice(0, limit),
    hiddenCount: Math.max(0, ordered.length - limit),
  };
}
