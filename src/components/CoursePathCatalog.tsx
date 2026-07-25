import Link from "next/link";

import CoursePathCard from "@/components/CoursePathCard";
import type { CoursePath } from "@/lib/curriculum";

export default function CoursePathCatalog({
  courses,
  progress,
}: {
  courses: readonly CoursePath[];
  /** Real per-course progress from the learner record, keyed by course id. */
  progress?: Record<string, { completed: number; total: number }>;
}) {
  return (
    <section aria-labelledby="museion-courses-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Museion Originals</p>
          <h2 id="museion-courses-title" className="title-panel mt-1.5">Follow a designed reasoning path.</h2>
          <p className="mt-2 text-body-sm leading-6 text-ink-soft">
            Museion-authored sequences across math, physics, biology, and computer science — every lesson
            diagnoses specific misconceptions, and the checker&apos;s truth stays private.
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex min-h-11 items-center rounded-xl border border-ink/15 bg-surface px-4 text-body-sm font-semibold transition hover:border-lapis/35 hover:text-lapis-dark"
        >
          Create from your sources
        </Link>
      </div>
      {/* Progress comes from the real record when the caller consulted one; a
          card whose course is underway warms to its subject tint so the door
          the learner already opened is unmistakable in the grid. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CoursePathCard key={course.id} course={course} progress={progress?.[course.id]} band />
        ))}
      </div>
    </section>
  );
}
