import type { Metadata } from "next";
import Link from "next/link";

import { allLessons } from "@/lib/content";
import type { Lesson } from "@/lib/content/types";
import { hasPractice } from "@/lib/engine/practice";
import type { ScaffoldingLevel } from "@/lib/engine/mastery";
import { readLearnerId } from "@/lib/server/learner";
import { getProfile } from "@/lib/store";

export const metadata: Metadata = {
  title: "My progress",
  description: "Your learning activity, adaptive support estimates, and next step.",
};

// The page reads the learner cookie — always render per-request.
export const dynamic = "force-dynamic";

const LEVEL_LABEL: Record<ScaffoldingLevel, string> = {
  novice: "more support",
  developing: "some support",
  proficient: "lighter support",
};

interface LessonProgress {
  lesson: Lesson;
  completed: boolean;
  practiceRuns: number;
}

function activityHref({ lesson, completed }: LessonProgress) {
  return completed && hasPractice(lesson)
    ? `/lessons/${lesson.id}/practice`
    : `/lessons/${lesson.id}`;
}

function activityLabel({ lesson, completed }: LessonProgress) {
  if (!completed) return "Continue lesson";
  return hasPractice(lesson) ? "Practice without hints" : "Review lesson";
}

function SupportEstimate({ concept, value, level }: {
  concept: string;
  value: number;
  level: ScaffoldingLevel;
}) {
  const percent = Math.round(value * 100);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium">{concept}</span>
        <span className="shrink-0 text-xs text-ink-soft">
          {percent}% · {LEVEL_LABEL[level]}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${concept} adaptive support estimate`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 overflow-hidden rounded-full bg-ink/10"
      >
        <div
          className="h-full origin-left rounded-full bg-gold transition-transform duration-500 motion-reduce:transition-none"
          style={{ transform: `scaleX(${Math.max(value, 0.02)})` }}
        />
      </div>
    </div>
  );
}

function LessonProgressRow({ record, profile }: {
  record: LessonProgress;
  profile: NonNullable<ReturnType<typeof getProfile>>;
}) {
  const { lesson, completed, practiceRuns } = record;

  return (
    <article className="grid gap-6 border-t border-ink/10 py-7 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(16rem,.8fr)]">
      <div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-md bg-lapis-soft px-2.5 py-1 text-lapis-dark">
            {lesson.track}
          </span>
          <span className={`rounded-md px-2.5 py-1 ${completed ? "bg-correct-soft text-correct" : "bg-gold-soft text-ink"}`}>
            {completed ? "Completed" : "In progress"}
          </span>
          {practiceRuns > 0 && (
            <span className="rounded-md bg-surface px-2.5 py-1 text-ink-soft">
              {practiceRuns} practice {practiceRuns === 1 ? "run" : "runs"}
            </span>
          )}
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold">
          <Link href={`/lessons/${lesson.id}`} className="hover:text-lapis-dark">
            {lesson.title}
          </Link>
        </h2>
        <p className="mt-2 max-w-[55ch] text-sm leading-6 text-ink-soft">
          {lesson.description}
        </p>
        <Link
          href={activityHref(record)}
          className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-lapis-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
        >
          {activityLabel(record)}
        </Link>
      </div>
      <div className="space-y-4" aria-label={`${lesson.title} support estimates`}>
        {lesson.concepts.map((concept) => (
          <SupportEstimate
            key={concept}
            concept={concept}
            value={profile.mastery.mastery(concept)}
            level={profile.mastery.scaffoldingLevel(concept)}
          />
        ))}
      </div>
    </article>
  );
}

export default async function ProgressPage() {
  const learnerId = await readLearnerId();
  const profile = learnerId ? getProfile(learnerId) : undefined;

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="border-l-4 border-gold pl-6 sm:pl-9">
          <p className="eyebrow">Your learning record</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Begin with one question.
          </h1>
          <p className="mt-4 max-w-[58ch] text-lg leading-8 text-ink-soft">
            Progress appears after your first lesson interaction. Museion records
            completed activities and adjusts how much support to offer next.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-lapis px-5 py-2.5 font-semibold text-white transition hover:bg-lapis-dark"
          >
            Choose a lesson
          </Link>
        </div>
      </div>
    );
  }

  const records = allLessons()
    .filter((lesson) => lesson.concepts.some((concept) => profile.mastery.mastery(concept) > 0))
    .map((lesson): LessonProgress => ({
      lesson,
      completed: profile.completedLessons.has(lesson.id),
      practiceRuns: profile.practiceRuns.get(lesson.id) ?? 0,
    }));
  const totalPracticeRuns = records.reduce((total, record) => total + record.practiceRuns, 0);
  const conceptsTouched = new Set(records.flatMap(({ lesson }) => lesson.concepts)).size;
  const nextRecord = records.find(({ completed }) => !completed)
    ?? records.find(({ lesson }) => hasPractice(lesson));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
      <p className="eyebrow">Anonymous learner record</p>
      <div className="mt-4 grid gap-7 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
        <div>
          <h1 className="font-display text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
            My progress
          </h1>
          <p className="mt-4 max-w-[62ch] text-lg leading-8 text-ink-soft">
            A record of what you completed and the support Museion may offer next.
            These estimates are not proof of durable mastery or transfer.
          </p>
        </div>
        {nextRecord && (
          <aside className="border-l-2 border-gold pl-5" aria-labelledby="next-activity-title">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">Recommended next</p>
            <h2 id="next-activity-title" className="mt-2 font-display text-xl font-semibold">
              {nextRecord.lesson.title}
            </h2>
            <Link href={activityHref(nextRecord)} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-lapis-dark hover:underline">
              {activityLabel(nextRecord)}
            </Link>
          </aside>
        )}
      </div>

      <dl className="mt-10 grid border-y border-ink/15 sm:grid-cols-3">
        {[
          ["Lessons completed", profile.completedLessons.size],
          ["Practice runs", totalPracticeRuns],
          ["Concepts touched", conceptsTouched],
        ].map(([label, value], index) => (
          <div key={label} className={`py-5 sm:px-6 ${index > 0 ? "border-t border-ink/10 sm:border-l sm:border-t-0" : ""}`}>
            <dt className="text-sm text-ink-soft">{label}</dt>
            <dd className="mt-1 font-display text-3xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {records.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-ink/20 p-8 sm:p-10">
          <h2 className="font-display text-2xl font-semibold">No learning activity yet</h2>
          <p className="mt-2 max-w-xl leading-7 text-ink-soft">
            Open a lesson and answer its first question. This page will then show
            activity and adaptive support without overstating what one session proves.
          </p>
          <Link href="/" className="mt-5 inline-flex min-h-11 items-center font-semibold text-lapis-dark hover:underline">
            Browse lessons
          </Link>
        </div>
      ) : (
        <section className="mt-12" aria-labelledby="learning-activity-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Learning activity</p>
              <h2 id="learning-activity-title" className="mt-3 font-display text-3xl font-semibold">
                Lessons and support
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-ink-soft">
              Higher estimates reduce scaffolding. They do not grade you or certify learning.
            </p>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-ink/10 bg-paper p-5 sm:p-8">
            {records.map((record) => (
              <LessonProgressRow key={record.lesson.id} record={record} profile={profile} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
