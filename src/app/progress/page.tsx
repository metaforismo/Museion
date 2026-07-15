import type { Metadata } from "next";
import Link from "next/link";

import { allLessons } from "@/lib/content";
import type { ScaffoldingLevel } from "@/lib/engine/mastery";
import { readLearnerId } from "@/lib/server/learner";
import { getProfile } from "@/lib/store";

export const metadata: Metadata = {
  title: "My progress",
  description: "Your concept mastery across every lesson, and what's next.",
};

// The page reads the learner cookie — always render per-request.
export const dynamic = "force-dynamic";

const LEVEL_LABEL: Record<ScaffoldingLevel, string> = {
  novice: "building",
  developing: "developing",
  proficient: "proficient",
};

export default async function ProgressPage() {
  const learnerId = await readLearnerId();
  const profile = learnerId ? getProfile(learnerId) : undefined;

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-24 text-center animate-fade-up">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lapis-soft font-display text-2xl text-lapis" aria-hidden="true">∅</span>
        <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">Nothing here yet</h1>
        <p className="mt-3 text-ink-soft">
          Your mastery map appears as soon as you start your first lesson.
          Every concept you work on is tracked — and the help you get fades as
          it grows.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-lapis px-5 py-2.5 font-medium text-white transition hover:bg-lapis-dark"
        >
          Start a lesson
        </Link>
      </div>
    );
  }

  const lessons = allLessons();
  const touched = lessons.filter((lesson) =>
    lesson.concepts.some((c) => profile.mastery.mastery(c) > 0),
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:py-24 animate-fade-up">
      <p className="eyebrow">Anonymous learner record</p>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.04em]">
        My progress
      </h1>
      <p className="mt-2 text-ink-soft">
        {profile.completedLessons.size} lesson
        {profile.completedLessons.size === 1 ? "" : "s"} completed · mastery is
        per concept and persists across lessons.
      </p>

      {touched.length === 0 ? (
        <p className="mt-10 text-ink-soft">
          No concepts touched yet —{" "}
          <Link href="/" className="font-medium text-lapis hover:underline">
            pick a lesson
          </Link>{" "}
          to begin.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {touched.map((lesson) => {
            const completed = profile.completedLessons.has(lesson.id);
            const practiceRuns = profile.practiceRuns.get(lesson.id) ?? 0;
            return (
              <div
                key={lesson.id}
                className="premium-surface rounded-[1.4rem] border border-white/80 p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold">
                    <Link
                      href={`/lessons/${lesson.id}`}
                      className="hover:text-lapis-dark"
                    >
                      {lesson.title}
                    </Link>
                  </h2>
                  <div className="flex gap-2 text-xs">
                    {completed && (
                      <span className="rounded-full bg-correct-soft px-2.5 py-0.5 font-medium text-correct">
                        completed
                      </span>
                    )}
                    {practiceRuns > 0 && (
                      <span className="rounded-full bg-gold-soft px-2.5 py-0.5 font-medium text-ink">
                        practice ×{practiceRuns}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {lesson.concepts.map((concept) => {
                    const mastery = profile.mastery.mastery(concept);
                    const level = profile.mastery.scaffoldingLevel(concept);
                    return (
                      <div key={concept}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{concept}</span>
                          <span className="text-ink-soft">
                            {(mastery * 100).toFixed(0)}% · {LEVEL_LABEL[level]}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-ink/10">
                          <div
                            className="h-2 rounded-full bg-gold animate-grow-bar"
                            style={{ width: `${Math.max(mastery * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
