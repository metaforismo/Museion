import Link from "next/link";

import { allLessons } from "@/lib/content";

export default function HomePage() {
  const lessons = allLessons();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <section className="mb-12 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
          Learn by reasoning,
          <br />
          not by being told.
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          Every lesson is solved one verified step at a time. When you get
          stuck, <strong className="text-ink">Maia</strong> sees exactly where
          your reasoning broke — and guides you back with questions, never
          with the answer.
        </p>
      </section>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-soft">
        Lessons
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={`/lessons/${lesson.id}`}
            className="group rounded-xl border border-ink/10 bg-surface p-6 shadow-sm transition hover:border-lapis hover:shadow-md"
          >
            <h3 className="font-display text-xl font-semibold text-ink group-hover:text-lapis-dark">
              {lesson.title}
            </h3>
            <p className="mt-2 text-sm text-ink-soft">{lesson.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {lesson.concepts.map((concept) => (
                <span
                  key={concept}
                  className="rounded-full bg-lapis-soft px-2.5 py-0.5 text-xs text-lapis-dark"
                >
                  {concept}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm font-medium text-lapis">
              {lesson.steps.length} steps →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
