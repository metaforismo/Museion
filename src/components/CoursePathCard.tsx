import Link from "next/link";

import ProgressRing from "@/components/ProgressRing";
import { Chip, SubjectBadge, cardClasses } from "@/components/ui";
import type { CoursePath } from "@/lib/curriculum";
import { subjectColor, subjectTint } from "@/lib/curriculum/subjects";

/**
 * One course card for every grid that lists courses. It used to live inline in
 * the dashboard, which is exactly how the library drifted into a second,
 * quieter card for the same object.
 *
 * `progress` is optional because the library is a static route with no learner
 * record: omitting it hides the ring rather than rendering a 0/n that would
 * imply the record was consulted and came back empty.
 */
export default function CoursePathCard({
  course,
  progress,
  band = false,
}: {
  course: CoursePath;
  progress?: { completed: number; total: number };
  /** Show the authored learner band — worth the line in a catalog, noise on the dashboard. */
  band?: boolean;
}) {
  const accent = subjectColor(course.subject);
  const tint = subjectTint(course.subject);
  const started = (progress?.completed ?? 0) > 0;
  // Without a record we cannot say "Start": a learner half-way through would be
  // told to begin. "Open" states only what the link does.
  const cta = progress === undefined ? "Open" : started ? "Continue" : "Start";
  return (
    <Link
      href={`/courses/${course.id}`}
      className={`${cardClasses("quiet", true)} group flex min-h-40 flex-col overflow-hidden`}
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-3 px-5 py-4" style={{ backgroundColor: tint }}>
        <SubjectBadge subject={course.subject} level={course.level} size={40} />
        {progress && (started
          ? <ProgressRing completed={progress.completed} total={progress.total} color={accent} />
          : <Chip tone="neutral">Not started</Chip>)}
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="text-xl font-semibold tracking-title">{course.title}</h3>
        <p className="mt-1.5 text-body-sm leading-6 text-ink-soft">{course.tagline}</p>
        <div className="mt-auto pt-4 text-label text-ink-soft">
          <div className="flex items-center justify-between gap-3">
            <span>{course.lessonIds.length} lessons · {course.estimatedMinutes} min</span>
            <span
              aria-hidden="true"
              className="font-semibold opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
              style={{ color: accent }}
            >
              {cta} →
            </span>
          </div>
          {band && <p className="mt-1 text-micro">{course.learnerBand}</p>}
        </div>
      </div>
    </Link>
  );
}
