import type { Metadata } from "next";
import LessonCatalog, { type CatalogLesson } from "@/components/LessonCatalog";
import { allLessons } from "@/lib/content";
import { hasPractice } from "@/lib/engine/practice";

export const metadata: Metadata = { title: "Library", description: "Authored lessons with deterministic answer checks." };

export default function LibraryPage() {
  const lessons: CatalogLesson[] = allLessons().map((lesson) => ({ id: lesson.id, title: lesson.title, track: lesson.track, description: lesson.description, concepts: lesson.concepts, stepCount: lesson.steps.length, practiceAvailable: hasPractice(lesson) }));
  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><header className="max-w-3xl"><p className="text-sm font-medium text-lapis-dark">Library</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.04em]">Build the foundations through active practice.</h1><p className="mt-4 leading-7 text-ink-soft">Short authored sequences for arithmetic, algebra and computer science. Every response is checked by lesson rules, never by a model.</p></header><div className="mt-8"><LessonCatalog lessons={lessons} /></div></div>;
}
