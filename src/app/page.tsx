import Link from "next/link";

import { lessonsByTrack } from "@/lib/content";

const TRACK_ICONS: Record<string, string> = {
  Algebra: "∑",
  Arithmetic: "÷",
  "Computer Science": "⌘",
};

const PILLARS = [
  {
    title: "Verified steps",
    body: "Every answer is checked by the lesson engine, not by an AI guessing — Museion cannot get the math wrong.",
  },
  {
    title: "A tutor who asks",
    body: "Maia sees the exact step you're on and what you tried. She guides with questions; the answer is the one thing she'll never say.",
  },
  {
    title: "Help that fades",
    body: "Hints and coaching shrink as your mastery grows, until the reasoning is fully yours.",
  },
];

export default function HomePage() {
  const tracks = lessonsByTrack();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <section className="mb-10 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Learn by reasoning,
          <br />
          not by being told.
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          Every lesson is solved one verified step at a time. When you get
          stuck, <strong className="text-ink">Maia</strong> sees exactly where
          your reasoning broke — and guides you back with questions, never with
          the answer.
        </p>
      </section>

      <section className="mb-14 grid gap-4 sm:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-xl border border-ink/10 bg-surface p-5"
          >
            <h3 className="font-display text-base font-semibold text-lapis-dark">
              {pillar.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {pillar.body}
            </p>
          </div>
        ))}
      </section>

      {[...tracks.entries()].map(([track, lessons]) => (
        <section key={track} className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-lapis-soft text-sm text-lapis-dark">
              {TRACK_ICONS[track] ?? "•"}
            </span>
            {track}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="group rounded-xl border border-ink/10 bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-lapis hover:shadow-md"
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
        </section>
      ))}
    </div>
  );
}
