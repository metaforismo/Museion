/**
 * Which of the ten authored paths a surface shows, and in what order.
 *
 * Two policies, deliberately together: they must agree on what "started" means,
 * and a second copy of that rule somewhere else is how the app ends up telling
 * a learner two different things about the same course. Both are deterministic
 * — a rail or a grid that reshuffles between renders is not navigable.
 *
 * - `orderSidebarPaths` — navigation. Catalogue order, with the learner's own
 *   work floated to the top so the rail leads with what they are doing.
 * - `spreadPathsBySubject` — suggestion. Same promotion, but the unstarted
 *   remainder is dealt one subject at a time, so a grid of six spans the
 *   curriculum instead of showing Algebra twice and Physics never.
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

/**
 * The learner's own courses first, then one path per subject, round by round.
 *
 * The dashboard used to render the whole catalogue — ten cards, eight of them
 * saying the same three things — which is the library's job and is the shape a
 * home page takes when nobody has chosen anything on the learner's behalf.
 * Dealing by subject is what makes the shorter grid read as a selection rather
 * than as a truncation: at six, every subject is represented exactly once.
 */
export function spreadPathsBySubject<T extends { id: string; subject: string }>(
  courses: readonly T[],
  progress: CourseProgress,
  limit: number,
): T[] {
  // In-progress before completed before the deal, exactly as the rail orders
  // them — the two surfaces must not disagree about which course is "yours".
  const promoted = courses
    .map((course, index) => ({ course, index, bucket: bucket(progress[course.id]) }))
    .filter((entry) => entry.bucket !== UNSTARTED)
    .sort((left, right) => left.bucket - right.bucket || left.index - right.index)
    .map((entry) => entry.course);
  const promotedIds = new Set(promoted.map((course) => course.id));

  const bySubject = new Map<string, T[]>();
  for (const course of courses) {
    if (promotedIds.has(course.id)) continue;
    const dealt = bySubject.get(course.subject);
    if (dealt) dealt.push(course);
    else bySubject.set(course.subject, [course]);
  }

  const remainder: T[] = [];
  const deepest = Math.max(0, ...[...bySubject.values()].map((dealt) => dealt.length));
  for (let round = 0; round < deepest; round += 1) {
    for (const dealt of bySubject.values()) {
      if (dealt[round]) remainder.push(dealt[round]);
    }
  }

  return [...promoted, ...remainder].slice(0, limit);
}
