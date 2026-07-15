"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
        <div className="mt-6 grid gap-4 md:grid-cols-12">
          {filteredLessons.map((lesson, index) => {
            const featured = lesson.id === "linear-equations-intro";
            const wide = index % 4 === 0 || index % 4 === 3;

            return (
              <article key={lesson.id} className={`${wide ? "md:col-span-7" : "md:col-span-5"}`}>
                <Link
                  href={`/lessons/${lesson.id}`}
                  className={`group flex min-h-64 h-full flex-col rounded-[1.4rem] p-6 transition duration-200 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-lapis ${featured ? "bg-ink text-white shadow-[0_18px_50px_rgba(19,28,49,0.15)]" : "border border-ink/10 bg-surface/75 hover:border-lapis/30"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
                    <span className={featured ? "text-gold" : "text-lapis-dark"}>{lesson.track}</span>
                    <span className={featured ? "text-white/60" : "text-ink-soft"}>{lesson.stepCount} verified steps</span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{lesson.title}</h3>
                  <p className={`mt-3 max-w-[55ch] text-sm leading-6 ${featured ? "text-white/65" : "text-ink-soft"}`}>
                    {lesson.description}
                  </p>
                  <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
                    <div className="flex flex-wrap gap-2">
                      {lesson.concepts.slice(0, 3).map((concept) => (
                        <span key={concept} className={`rounded-md px-2 py-1 text-xs ${featured ? "bg-white/10 text-white/80" : "bg-lapis-soft text-lapis-dark"}`}>
                          {concept}
                        </span>
                      ))}
                    </div>
                    <span className={`shrink-0 text-xs font-semibold ${featured ? "text-gold" : "text-lapis-dark"}`}>
                      Open lesson
                    </span>
                  </div>
                  {lesson.practiceAvailable && (
                    <p className={`mt-4 border-t pt-3 text-xs font-medium ${featured ? "border-white/10 text-white/65" : "border-ink/10 text-ink-soft"}`}>
                      Unassisted practice available after the lesson
                    </p>
                  )}
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
