"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HugeiconsIcon } from "@hugeicons/react";
import { ChartUpIcon, Files02Icon, Home09Icon, LibraryIcon, RepeatIcon, Settings01Icon } from "@hugeicons/core-free-icons";

import AppIcon from "./AppIcon";
import BrandMark from "./BrandMark";
import MaiaCharacter from "./MaiaCharacter";
import SubjectIcon from "./SubjectIcon";

const GROUPS: { label: string; items: { href: string; label: string; icon: typeof Home09Icon }[] }[] = [
  { label: "Learn", items: [
    { href: "/dashboard", label: "Home", icon: Home09Icon },
    { href: "/library", label: "Library", icon: LibraryIcon },
    { href: "/review", label: "Review", icon: RepeatIcon },
  ] },
  { label: "Your work", items: [
    { href: "/create", label: "Source Studio", icon: Files02Icon },
    { href: "/progress", label: "Evidence", icon: ChartUpIcon },
  ] },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarCourse = { id: string; title: string; subject: string; lessonCount: number };

export default function AppSidebar({ collapsed = false, courses = [], lessonCount = 0, onNavigate, onToggle }: { collapsed?: boolean; courses?: SidebarCourse[]; lessonCount?: number; onNavigate?: () => void; onToggle?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className={`flex h-20 shrink-0 items-center border-b border-ink/[0.06] ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <Link href="/dashboard" aria-label="Museion home" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <BrandMark className="h-10 w-10 shrink-0" />
          {!collapsed && <span className="min-w-0"><span className="block font-display text-lg font-semibold leading-none tracking-tight">Museion</span><span className="mt-1 block truncate text-[0.68rem] text-ink-soft">A house for reasoning</span></span>}
        </Link>
      </div>

      <nav aria-label="Application navigation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-5 pt-4 [scrollbar-width:thin]">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            {!collapsed && <p className="px-2.5 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">{group.label}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined} onClick={onNavigate} className={`group relative flex min-h-10 items-center gap-2.5 rounded-xl text-sm font-medium transition duration-200 active:translate-y-px ${active ? "bg-lapis-soft/55 text-lapis-dark" : "text-ink-soft hover:bg-paper hover:text-ink"} ${collapsed ? "justify-center px-0" : "px-2"}`}>
                  {active && <span aria-hidden="true" className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-lapis" />}
                  <span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition duration-200 ${active ? "bg-lapis text-white shadow-[0_2px_6px_rgba(43,74,203,0.35)]" : "text-ink-soft group-hover:bg-ink/[0.05] group-hover:text-ink"}`}>
                    <HugeiconsIcon icon={item.icon} size={17} strokeWidth={1.8} />
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>;
              })}
            </div>
          </div>
        ))}

        {collapsed && courses.length > 0 && (
          <div className="mt-5 border-t border-ink/8 pt-4">
            <ol aria-label="Paths" className="space-y-1">
              {courses.slice(0, 8).map((course) => {
                const href = `/courses/${course.id}`;
                const active = isActive(pathname, href);
                return (
                  <li key={course.id} className="flex justify-center">
                    <Link
                      href={href}
                      title={`${course.title} — ${course.lessonCount} lessons`}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                      className={`grid min-h-10 min-w-10 place-items-center rounded-xl transition duration-200 active:translate-y-px ${active ? "bg-paper shadow-[inset_0_0_0_1px_rgba(24,35,65,.08)]" : "hover:bg-paper"}`}
                    >
                      <SubjectIcon subject={course.subject} size={26} iconSize={14} className="rounded-lg!" />
                      <span className="sr-only">{course.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {!collapsed && courses.length > 0 && (
          <section aria-labelledby="sidebar-paths-title" className="mt-7 border-t border-ink/8 pt-5">
            <div className="flex items-start justify-between gap-3 px-2.5 pb-3">
              <div>
                <p id="sidebar-paths-title" className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Paths</p>
                <p className="mt-1 text-[0.64rem] tabular-nums text-ink-soft">{courses.length} {courses.length === 1 ? "path" : "paths"} · {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}</p>
              </div>
              <Link href="/library" onClick={onNavigate} className="rounded-md px-1 py-0.5 text-[0.66rem] font-medium text-lapis-dark hover:bg-lapis-soft">View all</Link>
            </div>
            <ol className="space-y-0.5">
              {courses.map((course) => {
                const href = `/courses/${course.id}`;
                const active = isActive(pathname, href);
                return <li key={course.id}><Link href={href} aria-current={active ? "page" : undefined} onClick={onNavigate} title={`${course.title} — ${course.subject}, ${course.lessonCount} lessons`} className={`group flex min-h-10 items-center gap-2.5 rounded-xl px-2 transition duration-200 active:translate-y-px ${active ? "bg-paper text-ink shadow-[inset_0_0_0_1px_rgba(24,35,65,.05)]" : "text-ink-soft hover:bg-paper hover:text-ink"}`}>
                  <SubjectIcon subject={course.subject} size={26} iconSize={14} className="rounded-lg! transition duration-200 group-hover:scale-105" />
                  <span className={`min-w-0 flex-1 truncate text-xs font-semibold ${active ? "text-ink" : "group-hover:text-ink"}`}>{course.title}</span>
                  <span className="shrink-0 text-[0.62rem] tabular-nums text-ink-soft/80">{course.lessonCount}<span className="sr-only"> lessons, {course.subject}</span></span>
                </Link></li>;
              })}
            </ol>
          </section>
        )}
      </nav>

      <div className="shrink-0 border-t border-ink/8 bg-surface/95 p-2">
        {!collapsed && (
          <div className="mb-1.5 flex items-center gap-2.5 rounded-xl border border-lapis/10 bg-gradient-to-r from-lapis-soft/55 via-lapis-soft/25 to-transparent px-2.5 py-2">
            <MaiaCharacter state="attentive" animated className="h-9 w-8 shrink-0" title="Maia" />
            <p className="min-w-0 text-[0.66rem] leading-4 text-ink-soft">
              <span className="block text-xs font-semibold text-ink">Maia</span>
              <span className="block truncate">Asks questions, never answers</span>
            </p>
          </div>
        )}
        <div className={collapsed ? "space-y-1" : "flex items-center gap-1"}>
          <Link href="/settings" title={collapsed ? "Settings" : undefined} aria-current={isActive(pathname, "/settings") ? "page" : undefined} onClick={onNavigate} className={`flex min-h-11 items-center gap-2.5 rounded-xl text-sm font-medium text-ink-soft transition hover:bg-paper hover:text-ink active:translate-y-px ${collapsed ? "justify-center" : "flex-1 px-2"}`}>
            <span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition duration-200 ${isActive(pathname, "/settings") ? "bg-lapis text-white" : ""}`}><HugeiconsIcon icon={Settings01Icon} size={17} strokeWidth={1.8} /></span>
            {!collapsed && "Settings"}
          </Link>
          {onToggle && <button type="button" onClick={onToggle} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className={`hidden min-h-11 items-center justify-center rounded-xl text-ink-soft transition hover:bg-paper hover:text-ink lg:flex ${collapsed ? "w-full" : "w-11 shrink-0"}`}><AppIcon name="collapse" className={`h-[1.15rem] w-[1.15rem] transition-transform ${collapsed ? "rotate-180" : ""}`} /></button>}
        </div>
      </div>
    </div>
  );
}
