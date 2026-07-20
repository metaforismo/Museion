import Link from "next/link";

import SubjectIcon from "@/components/SubjectIcon";
import type { CoursePath } from "@/lib/curriculum";
import { subjectColor } from "@/lib/curriculum/subjects";

export default function CoursePathCatalog({ courses }: { courses: readonly CoursePath[] }) {
  return (
    <section aria-labelledby="museion-courses-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-lapis-dark">Museion Originals</p>
          <h2 id="museion-courses-title" className="mt-1.5 text-xl font-semibold tracking-[-0.01em]">Follow a designed reasoning path.</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">Museion-authored sequences across math, physics, biology, and computer science — every lesson diagnoses specific misconceptions, and the checker&apos;s truth stays private.</p>
        </div>
        <Link href="/create" className="min-h-11 rounded-xl border border-ink/15 bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-lapis/35 hover:text-lapis-dark">Create from your sources</Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const accent = subjectColor(course.subject);
          return (
            <article key={course.id}>
              <Link
                href={`/courses/${course.id}`}
                className="surface-card-quiet group relative flex min-h-52 flex-col overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]"
                style={{ borderTop: `3px solid color-mix(in srgb, ${accent} 60%, white)` }}
              >
                <div className="flex items-center gap-2.5">
                  <SubjectIcon subject={course.subject} size={38} iconSize={19} />
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.09em] text-ink-soft">{course.subject}<span className="block text-[0.6rem] font-medium normal-case tracking-normal text-ink-soft">{course.level} · {course.learnerBand}</span></span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] text-ink transition group-hover:text-lapis-dark">{course.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{course.tagline}</p>
                <div className="mt-auto pt-5">
                  <div className="flex items-center gap-1" aria-label={`${course.lessonIds.length} connected lessons`}>
                    {course.lessonIds.map((lessonId, lessonIndex) => (
                      <span
                        key={lessonId}
                        className="h-1.5 min-w-0 flex-1 rounded-full transition group-hover:opacity-80"
                        style={{ backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)`, transitionDelay: `${lessonIndex * 30}ms` }}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[0.7rem] text-ink-soft">
                    <span>{course.lessonIds.length} lessons · {course.estimatedMinutes} min</span>
                    <span className="font-semibold opacity-0 transition group-hover:opacity-100" style={{ color: accent }} aria-hidden="true">Open →</span>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
