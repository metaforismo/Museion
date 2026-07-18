"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import AppIcon, { type AppIconName } from "./AppIcon";

export interface SearchableLesson {
  id: string;
  title: string;
  track: string;
  description: string;
  concepts: string[];
}

export interface SearchableCourse {
  id: string;
  title: string;
  subject: string;
  tagline: string;
  lessonCount: number;
}

interface CommandItem {
  id: string;
  href: string;
  label: string;
  detail: string;
  group: "Navigate" | "Courses" | "Lessons";
  icon: AppIconName;
  searchText: string;
}

const NAVIGATION: Omit<CommandItem, "searchText">[] = [
  { id: "home", href: "/dashboard", label: "Home", detail: "Your next learning action", group: "Navigate", icon: "home" },
  { id: "library", href: "/library", label: "Library", detail: "Browse authored lessons", group: "Navigate", icon: "library" },
  { id: "review", href: "/review", label: "Review", detail: "Revisit recorded misconceptions", group: "Navigate", icon: "review" },
  { id: "create", href: "/create", label: "Create from source", detail: "Turn trusted material into a course", group: "Navigate", icon: "source" },
  { id: "evidence", href: "/progress", label: "Evidence", detail: "Inspect what the record supports", group: "Navigate", icon: "evidence" },
  { id: "settings", href: "/settings", label: "Settings", detail: "AI runtime and model routing", group: "Navigate", icon: "settings" },
];

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

function rank(item: CommandItem, query: string) {
  const label = normalize(item.label);
  if (label === query) return 0;
  if (label.startsWith(query)) return 1;
  if (label.includes(query)) return 2;
  return 3;
}

export default function AppCommandPalette({ courses = [], lessons = [], open, onClose }: { courses?: SearchableCourse[]; lessons?: SearchableLesson[]; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const items = useMemo<CommandItem[]>(() => [
    ...NAVIGATION.map((item) => ({ ...item, searchText: normalize(`${item.label} ${item.detail}`) })),
    ...courses.map((course) => ({
      id: `course:${course.id}`,
      href: `/courses/${course.id}`,
      label: course.title,
      detail: `${course.subject} course · ${course.lessonCount} ${course.lessonCount === 1 ? "lesson" : "lessons"} · ${course.tagline}`,
      group: "Courses" as const,
      icon: "library" as const,
      searchText: normalize(`${course.title} ${course.subject} ${course.tagline}`),
    })),
    ...lessons.map((lesson) => ({
      id: `lesson:${lesson.id}`,
      href: `/lessons/${lesson.id}`,
      label: lesson.title,
      detail: `${lesson.track} · ${lesson.concepts.join(" · ")}`,
      group: "Lessons" as const,
      icon: "lesson" as const,
      searchText: normalize(`${lesson.title} ${lesson.track} ${lesson.description} ${lesson.concepts.join(" ")}`),
    })),
  ], [courses, lessons]);

  const results = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return items;
    return items
      .filter((item) => item.searchText.includes(normalizedQuery))
      .sort((left, right) => rank(left, normalizedQuery) - rank(right, normalizedQuery));
  }, [items, query]);

  const close = () => {
    onClose();
    setQuery("");
    setActiveIndex(0);
    returnFocusRef.current?.focus();
  };

  const choose = (item: CommandItem) => {
    onClose();
    setQuery("");
    setActiveIndex(0);
    if (item.href !== pathname) router.push(item.href);
    else requestAnimationFrame(() => returnFocusRef.current?.focus());
  };

  useLayoutEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();
    const frame = requestAnimationFrame(() => {
      if (document.activeElement !== inputRef.current) inputRef.current?.focus();
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const activeItem = results[activeIndex];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-3 pt-[max(1rem,8vh)] backdrop-blur-md sm:px-5" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search Museion"
        className="w-full max-w-[44rem] overflow-hidden rounded-[1.75rem] border border-white/80 bg-surface/95 shadow-[0_32px_100px_rgba(19,28,49,.24),inset_0_1px_0_rgba(255,255,255,.9)]"
        onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); close(); return; }
          if (event.key === "ArrowDown" && results.length) { event.preventDefault(); setActiveIndex((value) => (value + 1) % results.length); return; }
          if (event.key === "ArrowUp" && results.length) { event.preventDefault(); setActiveIndex((value) => (value - 1 + results.length) % results.length); return; }
          if (event.key === "Enter" && activeItem) { event.preventDefault(); choose(activeItem); return; }
          if (event.key !== "Tab") return;
          const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('input,button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])');
          if (!focusable?.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}
      >
        <div className="border-b border-ink/8 px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-[0.67rem] font-bold uppercase tracking-[0.16em] text-lapis-dark">Museion search</p>
              <h2 id="command-title" className="mt-1 text-base font-semibold tracking-[-0.01em] text-ink sm:text-lg">Find your next learning move</h2>
            </div>
            <button type="button" onClick={close} className="group flex min-h-10 items-center gap-2 rounded-xl px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-paper hover:text-ink active:bg-ink/8">
              <span className="hidden sm:inline">Close</span>
              <kbd className="rounded-md border border-ink/10 bg-paper px-1.5 py-1 font-sans text-[0.65rem] font-semibold shadow-[0_1px_0_rgba(19,28,49,.08)] group-hover:bg-surface">Esc</kbd>
            </button>
          </div>
          <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-ink/10 bg-paper/75 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] transition-[border-color,background-color,box-shadow] focus-within:border-ink/20 focus-within:bg-surface focus-within:shadow-[0_3px_14px_rgba(19,28,49,.07),inset_0_1px_0_rgba(255,255,255,.9)] sm:px-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface text-lapis-dark shadow-[0_1px_3px_rgba(19,28,49,.08)]"><AppIcon name="search" className="h-[1.05rem] w-[1.05rem]" /></span>
            <input
              ref={inputRef}
              id="global-search"
              type="text"
              inputMode="search"
              aria-label="Search Museion"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
              placeholder="Search courses, lessons, or concepts"
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls="global-search-results"
              aria-activedescendant={activeItem ? `command-${activeItem.id}` : undefined}
              className="min-h-14 min-w-0 flex-1 bg-transparent text-[0.95rem] text-ink !outline-none placeholder:text-ink-soft/65 focus-visible:!outline-none sm:text-base"
            />
            {query ? <button type="button" onClick={() => { setQuery(""); setActiveIndex(0); requestAnimationFrame(() => inputRef.current?.focus()); }} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-ink-soft transition-colors hover:bg-paper hover:text-ink">Clear</button> : null}
          </div>
        </div>

        <div id="global-search-results" role="listbox" aria-label="Search results" className="max-h-[min(30rem,58vh)] overflow-y-auto p-2.5 sm:p-3">
          {results.length ? results.map((item, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={item.id}
                id={`command-${item.id}`}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(item)}
                className={`relative flex min-h-16 w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-2.5 text-left transition-[background-color,border-color,box-shadow,transform] active:scale-[.995] ${selected ? "border-ink/8 bg-surface shadow-[0_4px_16px_rgba(19,28,49,.07)]" : "border-transparent hover:bg-paper"}`}
              >
                {selected ? <span className="absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-lapis" aria-hidden="true" /> : null}
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors ${selected ? "bg-lapis-soft text-lapis-dark" : "bg-paper text-ink-soft"}`}><AppIcon name={item.icon} className="h-[1.1rem] w-[1.1rem]" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold tracking-[-0.005em]">{item.label}</span><span className="mt-0.5 block truncate text-xs text-ink-soft">{item.detail}</span></span>
                <span className="hidden rounded-full bg-paper px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-ink-soft sm:block">{item.group}</span>
              </button>
            );
          }) : <div className="px-5 py-10 text-center" role="status"><span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-paper text-ink-soft"><AppIcon name="search" className="h-5 w-5" /></span><p className="mt-4 font-semibold">No matching destination</p><p className="mt-2 text-sm leading-6 text-ink-soft">Try a subject such as algebra, arithmetic, or computer science.</p><button type="button" onClick={() => { setQuery(""); setActiveIndex(0); requestAnimationFrame(() => inputRef.current?.focus()); }} className="mt-4 min-h-10 rounded-xl px-3 text-sm font-semibold text-lapis-dark hover:bg-lapis-soft">Clear search</button></div>}
        </div>
        <div className="hidden items-center justify-between border-t border-ink/8 bg-paper/55 px-5 py-3 text-[0.68rem] text-ink-soft sm:flex"><span className="flex items-center gap-2"><span><kbd className="rounded border border-ink/10 bg-surface px-1.5 py-0.5 font-sans shadow-[0_1px_0_rgba(19,28,49,.06)]">↑↓</kbd> move</span><span><kbd className="rounded border border-ink/10 bg-surface px-1.5 py-0.5 font-sans shadow-[0_1px_0_rgba(19,28,49,.06)]">Enter</kbd> open</span></span><span>{results.length} {results.length === 1 ? "result" : "results"}</span></div>
      </div>
    </div>
  );
}
