"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import SubjectIcon from "@/components/SubjectIcon";
import { subjectColor } from "@/lib/curriculum/subjects";

export interface CatalogLesson {
  id: string;
  title: string;
  track: string;
  description: string;
  concepts: string[];
  stepCount: number;
  practiceAvailable: boolean;
}

const ALL_TRACKS = "All subjects";

function matchesQuery(lesson: CatalogLesson, query: string) {
  const searchText = [
    lesson.title,
    lesson.track,
    lesson.description,
    ...lesson.concepts,
  ].join(" ").toLocaleLowerCase();

  return searchText.includes(query.trim().toLocaleLowerCase());
}

export default function LessonCatalog({ lessons }: { lessons: CatalogLesson[] }) {
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState(ALL_TRACKS);
  const searchInput = useRef<HTMLInputElement>(null);
  const tracks = useMemo(
    () => [ALL_TRACKS, ...new Set(lessons.map((lesson) => lesson.track))],
    [lessons],
  );
  const filteredLessons = useMemo(
    () => lessons.filter((lesson) => (
      (track === ALL_TRACKS || lesson.track === track)
      && matchesQuery(lesson, query)
    )),
    [lessons, query, track],
  );

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches("input, textarea, select, [contenteditable='true']");

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchInput.current?.focus();
      }
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const resetFilters = () => {
    setQuery("");
    setTrack(ALL_TRACKS);
    searchInput.current?.focus();
  };

  return (
    <div className="min-w-0">
      <div className="grid min-w-0 gap-5 border-y border-ink/10 py-5 lg:grid-cols-[minmax(18rem,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <label htmlFor="lesson-search" className="text-sm font-semibold">
            Find a lesson or concept
          </label>
          <div className="relative mt-2 max-w-xl">
            <input
              ref={searchInput}
              id="lesson-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && query) {
                  event.preventDefault();
                  setQuery("");
                }
              }}
              placeholder="Try fractions, variables, or binary"
              autoComplete="off"
              className="min-h-12 w-full rounded-xl border border-ink/15 bg-surface px-4 pr-20 text-base outline-none transition focus:border-lapis focus:ring-4 focus:ring-lapis-soft"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-ink/15 bg-paper px-2 py-1 font-mono text-[0.65rem] text-ink-soft sm:block" aria-hidden="true">
              /
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-soft">Search titles, descriptions, subjects, and registered concepts.</p>
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold">Subject</p>
          <div className="no-scrollbar mt-2 flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter lessons by subject">
            {tracks.map((item) => {
              const selected = track === item;
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTrack(item)}
                  className={`min-h-11 shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold transition active:translate-y-px ${selected ? "bg-ink text-white" : "bg-surface text-ink-soft hover:bg-lapis-soft hover:text-lapis-dark"}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft" aria-live="polite" aria-atomic="true">
          Showing <strong className="font-semibold text-ink">{filteredLessons.length}</strong> of {lessons.length} lessons
        </p>
        {(query || track !== ALL_TRACKS) && (
          <button type="button" onClick={resetFilters} className="min-h-11 text-sm font-semibold text-lapis-dark hover:underline">
            Clear search and filters
          </button>
        )}
      </div>

      <section aria-label="Lesson catalog results">
      {filteredLessons.length === 0 ? (
        <div className="mt-6 border-l-2 border-gold py-4 pl-6" role="status">
          <h3 className="font-display text-2xl font-semibold">No lesson matches yet</h3>
          <p className="mt-2 max-w-xl leading-7 text-ink-soft">
            Try a broader concept or show every subject. The compiler can also turn an authorized source into a new course.
          </p>
          <div className="mt-5 flex flex-wrap gap-4">
            <button type="button" onClick={resetFilters} className="min-h-11 font-semibold text-lapis-dark hover:underline">
              Reset the catalog
            </button>
            <Link href="/create" className="inline-flex min-h-11 items-center font-semibold text-lapis-dark hover:underline">
              Create from a source
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredLessons.map((lesson) => {
            const accent = subjectColor(lesson.track);

            return (
              <article key={lesson.id} className="min-w-0">
                <Link
                  href={`/lessons/${lesson.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-ink/10 bg-surface p-5 shadow-[var(--shadow-tight)] transition duration-200 hover:-translate-y-0.5 hover:border-lapis/30 hover:shadow-[var(--shadow-1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-lapis"
                >
                  <div className="flex items-center gap-2.5">
                    <SubjectIcon subject={lesson.track} size={32} iconSize={16} />
                    <span className="min-w-0 flex-1 truncate text-[0.68rem] font-semibold uppercase tracking-[0.09em]" style={{ color: `color-mix(in srgb, ${accent} 62%, var(--color-ink))` }}>{lesson.track}</span>
                    <span className="shrink-0 text-[0.68rem] font-medium text-ink-soft">{lesson.stepCount} verified steps</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.01em] transition group-hover:text-lapis-dark">{lesson.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-ink-soft">
                    {lesson.description}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    <div className="flex min-w-0 flex-wrap gap-1.5">
                      {lesson.concepts.slice(0, 2).map((concept) => (
                        <span key={concept} className="rounded-md bg-paper px-2 py-1 text-[0.68rem] text-ink-soft">
                          {concept}
                        </span>
                      ))}
                    </div>
                    <span className="shrink-0 text-xs font-semibold opacity-0 transition group-hover:opacity-100" style={{ color: accent }} aria-hidden="true">
                      Open →
                    </span>
                  </div>
                  {lesson.practiceAvailable && (
                    <p className="mt-3 flex items-center gap-1.5 border-t border-ink/8 pt-2.5 text-[0.68rem] font-medium text-ink-soft">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-correct" />
                      Hint-free practice after the lesson
                    </p>
                  )}
                </Link>
              </article>
            );
          })}
        </div>
      )}
      </section>
    </div>
  );
}
