import type { Metadata } from "next";
import Link from "next/link";
import CoursePathCatalog from "@/components/CoursePathCatalog";
import LessonCatalog, { type CatalogLesson } from "@/components/LessonCatalog";
import { allLessons } from "@/lib/content";
import { coursePaths, museionFoundations } from "@/lib/curriculum";
import { hasPractice } from "@/lib/engine/practice";

export const metadata: Metadata = { title: "Library", description: "Authored lessons with deterministic answer checks." };

export default function LibraryPage() {
  const lessons: CatalogLesson[] = allLessons().map((lesson) => ({ id: lesson.id, title: lesson.title, track: lesson.track, description: lesson.description, concepts: lesson.concepts, stepCount: lesson.steps.length, practiceAvailable: hasPractice(lesson) }));
  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><header className="max-w-3xl"><p className="text-sm font-medium text-lapis-dark">Library</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em]">Learn through designed investigations.</h1><p className="mt-4 leading-7 text-ink-soft">Start with a complete Museion course, then use individual lessons for focused practice. Every response is checked by lesson rules, never by a model.</p></header>
    <div className="mt-10"><CoursePathCatalog courses={coursePaths} /></div>
    <section className="mt-10 rounded-[var(--radius-card)] border border-ink/10 bg-surface p-5 shadow-[var(--shadow-tight)]" aria-labelledby="foundation-map-title"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-lapis-dark">Prerequisite graph</p><h2 id="foundation-map-title" className="mt-1 text-xl font-semibold">The authored knowledge map</h2></div><p className="max-w-lg text-xs leading-5 text-ink-soft">This map covers only the lessons below. It does not imply standards alignment or silently treat external curricula as Museion content.</p></div><ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">{museionFoundations.nodes.map((node, index) => <li key={node.id} className="relative"><Link href={`/lessons/${node.lessonId}`} className="group block min-h-36 rounded-xl border border-ink/10 bg-paper p-4 transition hover:-translate-y-0.5 hover:border-lapis/30"><span className="font-mono text-[0.65rem] font-semibold text-lapis-dark">{String(index + 1).padStart(2,"0")} · {node.level}</span><h3 className="mt-3 text-sm font-semibold group-hover:text-lapis-dark">{node.title}</h3><p className="mt-2 text-xs leading-5 text-ink-soft">{node.prerequisiteIds.length ? `After ${node.prerequisiteIds.length} prerequisite ${node.prerequisiteIds.length === 1 ? "node" : "nodes"}` : "Open starting point"}</p></Link></li>)}</ol></section>
    <div className="mt-10"><LessonCatalog lessons={lessons} /></div></div>;
}
