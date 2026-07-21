import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

import ProgressRing from "@/components/ProgressRing";
import SubjectIcon from "@/components/SubjectIcon";
import { getLesson } from "@/lib/content";
import { coursePaths, getCoursePath } from "@/lib/curriculum";
import { subjectColor } from "@/lib/curriculum/subjects";
import { readLearnerId } from "@/lib/server/learner";
import { getProfile } from "@/lib/store";

type Props = { params: Promise<{ courseId: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return coursePaths.map(({ id }) => ({ courseId: id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = getCoursePath((await params).courseId);
  return course ? { title: course.title, description: course.tagline } : { title: "Course not found" };
}

function countWord(n: number): string {
  return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"][n] ?? String(n);
}

export default async function CoursePage({ params }: Props) {
  const course = getCoursePath((await params).courseId);
  if (!course) notFound();
  const lessons = course.lessonIds.map((lessonId) => getLesson(lessonId));
  if (lessons.some((lesson) => !lesson)) notFound();

  const learnerId = await readLearnerId();
  const completed = (learnerId ? getProfile(learnerId)?.completedLessons : undefined) ?? new Set<string>();
  const doneCount = course.lessonIds.filter((id) => completed.has(id)).length;
  const accent = subjectColor(course.subject);
  const firstUnfinished = course.lessonIds.find((id) => !completed.has(id)) ?? course.lessonIds[0];
  const started = doneCount > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-soft"><Link href="/library" className="hover:text-lapis-dark">Library</Link><span aria-hidden="true"> / </span><span aria-current="page">{course.title}</span></nav>

      {/* Colored hero band */}
      <header
        className="mt-5 overflow-hidden rounded-[var(--radius-card)] border border-ink/10 p-6 sm:p-8"
        style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 10%, white), color-mix(in srgb, ${accent} 4%, white))` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <SubjectIcon subject={course.subject} size={44} iconSize={22} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: accent }}>Museion Original · {course.subject}</p>
                <p className="text-[0.7rem] capitalize text-ink-soft">{course.level} · {course.learnerBand}</p>
              </div>
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{course.title}</h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-ink-soft">{course.tagline}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={`/lessons/${firstUnfinished}?course=${course.id}`}
                className="inline-flex min-h-12 items-center rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-1)] transition hover:-translate-y-0.5 hover:bg-lapis-dark"
              >
                {started ? "Continue the path" : "Start the path"} <span className="ml-2" aria-hidden="true">→</span>
              </Link>
              <span className="text-sm text-ink-soft">{course.lessonIds.length} lessons · about {course.estimatedMinutes} minutes</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ProgressRing completed={doneCount} total={course.lessonIds.length} color={accent} size={64} stroke={6} />
            <span className="text-[0.7rem] text-ink-soft">{doneCount === course.lessonIds.length ? "Complete" : "Your progress"}</span>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div>
          <section aria-labelledby="sequence-title">
            <h2 id="sequence-title" className="font-display text-2xl font-semibold tracking-[-0.02em]">{countWord(course.lessonIds.length).replace(/^\w/, (c) => c.toUpperCase())} connected investigations</h2>
            <ol className="mt-5 space-y-3">
              {lessons.map((lesson, index) => {
                if (!lesson) return null;
                const isDone = completed.has(lesson.id);
                return (
                  <li key={lesson.id}>
                    <Link href={`/lessons/${lesson.id}?course=${course.id}`} className="group grid gap-4 rounded-2xl border border-ink/10 bg-surface p-5 shadow-[var(--shadow-tight)] transition hover:-translate-y-0.5 hover:border-lapis/30 sm:grid-cols-[3.2rem_minmax(0,1fr)_auto] sm:items-center">
                      <span
                        className="grid h-12 w-12 place-items-center rounded-xl font-mono text-sm font-semibold"
                        style={isDone ? { backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent } : { backgroundColor: "color-mix(in srgb, var(--color-ink) 5%, transparent)", color: "var(--color-ink-soft)" }}
                      >
                        {isDone ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} strokeWidth={2} /> : String(index + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <span className="block text-lg font-semibold group-hover:text-lapis-dark">{lesson.title}</span>
                        <span className="mt-1 block text-sm leading-6 text-ink-soft">{lesson.description}</span>
                      </span>
                      <span className="text-sm font-semibold" style={{ color: accent }}>{isDone ? "Review" : "Open"} <span aria-hidden="true">→</span></span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
          <section aria-labelledby="outcomes-title" className="mt-8 rounded-[var(--radius-card)] border border-ink/10 bg-surface p-6"><h2 id="outcomes-title" className="text-xl font-semibold">What this path asks you to reason about</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{course.outcomes.map((outcome) => <li key={outcome} className="flex gap-3 text-sm leading-6 text-ink-soft"><span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} />{outcome}</li>)}</ul></section>
        </div>
        <aside className="space-y-4">
          <section className="rounded-2xl border border-ink/10 bg-surface p-5"><h2 className="font-semibold">Before you begin</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-ink-soft">{course.prerequisites.map((item) => <li key={item}>• {item}</li>)}</ul></section>
          <section className="rounded-2xl border border-ink/10 bg-surface p-5"><h2 className="font-semibold">Source basis</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-ink-soft">{course.sourceLabels.map((source) => <li key={source}>{source}</li>)}</ul><p className="mt-4 border-t border-ink/8 pt-4 text-xs leading-5 text-ink-soft">Sources inform the facts. The pedagogy, examples, answers, and sequence are authored by Museion; source publishers do not endorse this course.</p></section>
          <section className="rounded-2xl border border-gold/25 bg-gold-soft p-5"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">Evidence boundary</p><p className="mt-2 text-sm leading-6 text-ink-soft">{course.evidenceBoundary}</p></section>
        </aside>
      </div>
    </div>
  );
}
