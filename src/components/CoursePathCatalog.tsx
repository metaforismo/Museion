import Link from "next/link";

import CoursePathCard from "@/components/CoursePathCard";
import type { CoursePath } from "@/lib/curriculum";

export default function CoursePathCatalog({ courses }: { courses: readonly CoursePath[] }) {
  return (
    <section aria-labelledby="museion-courses-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-label font-semibold uppercase tracking-[0.08em] text-lapis-dark">Museion Originals</p>
          <h2 id="museion-courses-title" className="mt-1.5 text-xl font-semibold tracking-title">Follow a designed reasoning path.</h2>
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
      {/* No progress is passed: the library is a static route, so these cards
          report the catalog rather than implying an empty learner record. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CoursePathCard key={course.id} course={course} band />
        ))}
      </div>
    </section>
  );
}
