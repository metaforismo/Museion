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

interface CommandItem {
  id: string;
  href: string;
  label: string;
  detail: string;
  group: "Navigate" | "Lessons";
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

export default function AppCommandPalette({ lessons, open, onClose }: { lessons: SearchableLesson[]; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const items = useMemo<CommandItem[]>(() => [
    ...NAVIGATION.map((item) => ({ ...item, searchText: normalize(`${item.label} ${item.detail}`) })),
    ...lessons.map((lesson) => ({
      id: `lesson:${lesson.id}`,
      href: `/lessons/${lesson.id}`,
      label: lesson.title,
      detail: `${lesson.track} · ${lesson.concepts.join(" · ")}`,
      group: "Lessons" as const,
      icon: "lesson" as const,
      searchText: normalize(`${lesson.title} ${lesson.track} ${lesson.description} ${lesson.concepts.join(" ")}`),
    })),
  ], [lessons]);

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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/35 px-3 pt-[max(4rem,10vh)] backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-title"
        className="w-full max-w-2xl overflow-hidden rounded-[1.35rem] border border-white/60 bg-surface shadow-[0_28px_90px_rgba(19,28,49,.24)]"
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
        <div className="flex items-center gap-3 border-b border-ink/10 px-4 sm:px-5">
          <AppIcon name="search" className="h-5 w-5 shrink-0 text-ink-soft" />
          <h2 id="command-title" className="sr-only">Search Museion</h2>
          <input
            ref={inputRef}
            id="global-search"
            type="search"
            aria-label="Search Museion"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
            placeholder="Search pages, lessons, or concepts"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="global-search-results"
            aria-activedescendant={activeItem ? `command-${activeItem.id}` : undefined}
            className="min-h-16 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-soft/70"
          />
          <button type="button" onClick={close} className="min-h-10 rounded-lg px-2 text-xs font-semibold text-ink-soft hover:bg-paper hover:text-ink">Esc</button>
        </div>

        <div id="global-search-results" role="listbox" aria-label="Search results" className="max-h-[min(30rem,60vh)] overflow-y-auto p-2 sm:p-3">
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
                className={`flex min-h-15 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${selected ? "bg-lapis-soft" : "hover:bg-paper"}`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-surface text-lapis-dark" : "bg-paper text-ink-soft"}`}><AppIcon name={item.icon} className="h-[1.1rem] w-[1.1rem]" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.label}</span><span className="mt-0.5 block truncate text-xs text-ink-soft">{item.detail}</span></span>
                <span className="hidden text-[0.65rem] font-medium text-ink-soft sm:block">{item.group}</span>
              </button>
            );
          }) : <div className="px-5 py-10 text-center" role="status"><p className="font-semibold">No matching destination</p><p className="mt-2 text-sm leading-6 text-ink-soft">Try a subject such as algebra, arithmetic, or computer science.</p><button type="button" onClick={() => { setQuery(""); setActiveIndex(0); requestAnimationFrame(() => inputRef.current?.focus()); }} className="mt-4 min-h-10 text-sm font-semibold text-lapis-dark hover:underline">Clear search</button></div>}
        </div>
        <div className="hidden items-center justify-between border-t border-ink/8 bg-paper/70 px-5 py-2.5 text-[0.68rem] text-ink-soft sm:flex"><span>↑↓ move · Enter open · Esc close</span><span>{results.length} {results.length === 1 ? "result" : "results"}</span></div>
      </div>
    </div>
  );
}
