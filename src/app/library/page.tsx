import type { Metadata } from "next";
import Link from "next/link";

import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";

import CoursePathCatalog from "@/components/CoursePathCatalog";
import LessonCatalog, { type CatalogLesson } from "@/components/LessonCatalog";
import { Card, cardClasses } from "@/components/ui";
import { allLessons } from "@/lib/content";
import { coursePaths, museionFoundations } from "@/lib/curriculum";
import { subjectColor, subjectTint } from "@/lib/curriculum/subjects";
import { hasPractice } from "@/lib/engine/practice";
import { currentActor } from "@/lib/server/actor";
import { learnerProfile } from "@/lib/server/session-repository";

export const metadata: Metadata = { title: "Library", description: "Explore thoughtful courses in math, science and computing." };
export const dynamic = "force-dynamic";

function prerequisiteCopy(count: number): string {
  return count === 0 ? "Open starting point" : `Builds on ${count} earlier ${count === 1 ? "lesson" : "lessons"}`;
}

/**
 * One node of the authored prerequisite graph. The tint names the subject, and
 * the subject is written next to it — colour on its own would be decoration,
 * and this map's only job is to show which subject a node belongs to and what
 * has to come first.
 *
 * `done` borrows the trail's node grammar: a lesson with a completed record
 * trades its ordinal for the accent-filled check — walked ground — and every
 * other node keeps its number. Real record only; nothing else changes state.
 */
function FoundationNode({ node, index, done }: { node: (typeof museionFoundations.nodes)[number]; index: number; done: boolean }) {
  const accent = subjectColor(node.subject);
  const body = (
    <>
      <span className="flex items-center justify-between gap-2 text-micro font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>
        {done ? (
          <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full text-white" style={{ backgroundColor: accent }}>
            <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={3} />
          </span>
        ) : (
          <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        )}
        <span className="truncate">{node.subject}</span>
      </span>
      <h3 className="mt-2.5 text-body-sm font-semibold leading-5 transition group-hover:text-lapis-dark">
        {node.title}
        {done && <span className="sr-only"> — completed</span>}
      </h3>
      <p className="mt-2 text-micro capitalize leading-4 text-ink-soft">{node.level}</p>
      <p className="mt-0.5 text-micro leading-4 text-ink-soft">{prerequisiteCopy(node.prerequisiteIds.length)}</p>
    </>
  );
  // A node may be authored before its lesson exists. Linking to /lessons/null
  // would 404, so an unlinked node stays a plain card instead of a dead promise.
  if (!node.lessonId) {
    return (
      <li className={`${cardClasses("quiet")} min-w-0 p-4`} style={{ backgroundColor: subjectTint(node.subject) }}>
        {body}
      </li>
    );
  }
  return (
    <li className="min-w-0">
      <Link
        href={`/lessons/${node.lessonId}`}
        className={`${cardClasses("quiet", true)} group block h-full p-4`}
        style={{ backgroundColor: subjectTint(node.subject) }}
      >
        {body}
      </Link>
    </li>
  );
}

export default async function LibraryPage() {
  // The library's job is choosing, and the record is part of the choice: a
  // course already underway must read as a door left ajar, not one of ten
  // identical fronts. One profile read serves both the course grid and the
  // map's done-marks; a learner with no record gets the catalog unchanged.
  const learnerId = (await currentActor()).ownerId;
  const completed = (await learnerProfile(learnerId, false))?.completedLessons ?? new Set<string>();
  const courseProgress = Object.fromEntries(
    coursePaths.map((course) => [
      course.id,
      { completed: course.lessonIds.filter((id) => completed.has(id)).length, total: course.lessonIds.length },
    ]),
  );

  const lessons: CatalogLesson[] = allLessons().map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    track: lesson.track,
    description: lesson.description,
    concepts: lesson.concepts,
    stepCount: lesson.steps.length,
    practiceAvailable: hasPractice(lesson),
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-3xl">
        <p className="eyebrow">Library</p>
        <h1 className="mt-2 title-page">Follow your curiosity.</h1>
        <p className="mt-3 max-w-2xl text-body leading-6 text-ink-soft">
          Explore a course, try a short lesson, or build a path from your own material.
          Each small step gives you room to think and a way to check your understanding.
        </p>
      </header>

      <div className="mt-8">
        <CoursePathCatalog courses={coursePaths} progress={courseProgress} />
      </div>

      <details className="mt-8 rounded-3xl border border-ink/10 bg-surface p-5 sm:p-6">
        <summary className="cursor-pointer text-lg font-semibold tracking-title">See how the ideas connect</summary>
        <Card className="p-5">
          <p className="max-w-3xl text-body-sm leading-5 text-ink-soft">
            See what comes first and how each lesson builds on the last.
            Checkmarks show lessons you have completed.
          </p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {museionFoundations.nodes.map((node, index) => (
              <FoundationNode key={node.id} node={node} index={index} done={node.lessonId !== null && completed.has(node.lessonId)} />
            ))}
          </ol>
        </Card>
      </details>

      <details className="mt-5 rounded-3xl border border-ink/10 bg-surface p-5 sm:p-6">
        <summary className="cursor-pointer text-lg font-semibold tracking-title">Explore individual lessons</summary>
        <p className="mt-2 text-body-sm text-ink-soft">Find a particular idea, or revisit a foundation before starting a course.</p>
        <div className="mt-5"><LessonCatalog lessons={lessons} /></div>
      </details>
    </div>
  );
}
