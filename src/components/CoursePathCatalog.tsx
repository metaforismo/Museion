import Link from "next/link";

import type { CoursePath } from "@/lib/curriculum";

const ACCENTS = {
  Algebra: { wash: "bg-gold-soft", ink: "text-ink" },
  "Computer Science": { wash: "bg-lapis-soft", ink: "text-lapis-dark" },
  Arithmetic: { wash: "bg-correct-soft", ink: "text-correct" },
} as const;

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
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        {courses.map((course, courseIndex) => {
          const accent = ACCENTS[course.subject];
          return (
            <article key={course.id} className="group overflow-hidden rounded-[1.6rem] border border-ink/10 bg-surface shadow-[var(--shadow-tight)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(19,28,49,.1)]">
              <div className={`${accent.wash} relative min-h-40 overflow-hidden p-6`}>
                <div aria-hidden="true" className="absolute -right-8 -top-12 h-44 w-44 rounded-full border-[28px] border-white/45" />
                <div aria-hidden="true" className="absolute bottom-5 right-8 grid h-20 w-20 place-items-center rounded-[1.4rem] border border-white/70 bg-surface/70 font-display text-3xl font-semibold shadow-sm">{courseIndex + 1}</div>
                <div className="relative max-w-[75%]">
                  <p className={`text-xs font-semibold uppercase tracking-[0.1em] ${accent.ink}`}>{course.subject} · {course.level}</p>
                  <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">{course.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-ink/75">{course.tagline}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 text-xs font-medium text-ink-soft"><span>{course.lessonIds.length} lessons</span><span aria-hidden="true">·</span><span>{course.estimatedMinutes} min</span><span aria-hidden="true">·</span><span>{course.learnerBand}</span></div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-ink-soft">{course.description}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-ink/8 pt-4">
                  <span className="text-xs text-ink-soft">Deterministic checks · authored sequence</span>
                  <Link href={`/courses/${course.id}`} className={`min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold ${accent.wash} ${accent.ink} transition group-hover:brightness-95`}>Explore course <span aria-hidden="true">→</span></Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
