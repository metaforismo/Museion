import Link from "next/link";

import type { CoursePath } from "@/lib/curriculum";

export default function CoursePathCatalog({ courses }: { courses: readonly CoursePath[] }) {
  return (
    <section aria-labelledby="museion-courses-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-lapis-dark">Museion courses</p>
          <h2 id="museion-courses-title" className="mt-2 font-display text-3xl font-semibold tracking-[-0.035em]">Follow a designed reasoning path.</h2>
          <p className="mt-3 leading-7 text-ink-soft">These are source-informed, Museion-authored sequences. Each lesson exposes reasoning, diagnoses specific misconceptions, and keeps evaluator truth private.</p>
        </div>
        <Link href="/create" className="min-h-11 rounded-xl border border-ink/15 bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-lapis/35 hover:text-lapis-dark">Create from your sources</Link>
      </div>
      <div className="mt-7 divide-y divide-ink/10 border-y border-ink/15">
        {courses.map((course, courseIndex) => (
          <article key={course.id}>
            <Link href={`/courses/${course.id}`} className="group grid min-h-48 gap-5 px-1 py-7 transition hover:bg-surface/70 sm:px-4 lg:grid-cols-[4.5rem_minmax(0,1.2fr)_minmax(15rem,.8fr)_auto] lg:items-center lg:gap-7">
              <span className="font-mono text-2xl font-semibold tabular-nums text-ink/50 transition group-hover:text-lapis-dark">{String(courseIndex + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-lapis-dark">{course.subject} · {course.level}</span>
                <span className="mt-2 block font-display text-3xl font-semibold tracking-[-0.04em] text-ink transition group-hover:text-lapis-dark">{course.title}</span>
                <span className="mt-2 block max-w-xl text-sm leading-6 text-ink-soft">{course.tagline}</span>
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap gap-x-2 text-[0.68rem] text-ink-soft"><span>{course.lessonIds.length} lessons</span><span aria-hidden="true">·</span><span>{course.estimatedMinutes} min</span><span aria-hidden="true">·</span><span>{course.learnerBand}</span></span>
                <span className="mt-4 flex items-center gap-1.5" aria-label={`${course.lessonIds.length} connected lessons`}>{course.lessonIds.map((lessonId, lessonIndex) => <span key={lessonId} className="flex min-w-0 flex-1 items-center gap-1.5"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${lessonIndex === 0 ? "bg-lapis" : "border border-ink/20 bg-surface group-hover:border-lapis/35"}`} />{lessonIndex < course.lessonIds.length - 1 && <span className="h-px flex-1 bg-ink/10 group-hover:bg-lapis/20" />}</span>)}</span>
                <span className="mt-3 block text-xs text-ink-soft">Deterministic checks · authored sequence</span>
              </span>
              <span className="inline-flex min-h-11 items-center justify-self-start text-sm font-semibold text-lapis-dark lg:justify-self-end">Open <span className="ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true">→</span></span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
