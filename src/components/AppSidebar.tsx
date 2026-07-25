"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { HugeiconsIcon } from "@hugeicons/react";
import { ChartUpIcon, Files02Icon, Home09Icon, LibraryIcon, RepeatIcon, Settings01Icon } from "@hugeicons/core-free-icons";

import AppIcon from "./AppIcon";
import BrandMark from "./BrandMark";
import SubjectIcon from "./SubjectIcon";
import { subjectColor } from "@/lib/curriculum/subjects";
import { orderSidebarPaths, type CourseProgress, type SidebarCourse } from "@/lib/design/sidebar-paths";

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

/**
 * One row geometry for every destination in the rail — 44px tall, one 28px
 * icon slot, one label column — so nav items and paths share a spine instead
 * of drifting apart. One active treatment too: a filled lapis pill that is
 * actually visible, replacing the 3.5% ink tint nobody could see.
 */
const ROW = "group relative flex min-h-11 items-center gap-2.5 rounded-xl transition duration-200 active:translate-y-px";
const ROW_ACTIVE = "bg-lapis-soft text-lapis-dark";
const ROW_IDLE = "text-ink-soft hover:bg-paper hover:text-ink";
const SLOT = "grid h-7 w-7 shrink-0 place-items-center";
const SECTION = "px-2.5 pb-1.5 text-label font-semibold uppercase tracking-[0.12em] text-ink-soft";

type Guidance = "live" | "offline";
type SidebarState = { progress: CourseProgress; guidance: Guidance | null };

/**
 * Per-learner state is fetched here rather than threaded through props, so the
 * root layout stays static. A failed request degrades to catalog order with no
 * progress rails and no guidance claim — never to a guess.
 */
function useSidebarState(): SidebarState {
  const [state, setState] = useState<SidebarState>({ progress: {}, guidance: null });
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/progress", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload) return;
        const provider = payload.runtime?.provider;
        setState({
          progress: payload.courseProgress ?? {},
          guidance: provider ? (provider === "offline" ? "offline" : "live") : null,
        });
      })
      .catch(() => { /* the rail degrades to catalog order without progress rails */ });
    return () => controller.abort();
  }, []);
  return state;
}

function GuidanceStatus({ guidance, collapsed }: { guidance: Guidance | null; collapsed: boolean }) {
  const label = guidance === "live" ? "Live guidance connected" : "Offline verified guidance";
  // The row keeps its height before the state resolves so the footer never jumps.
  if (!guidance) return <p aria-hidden="true" className="h-7" />;
  const dot = <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${guidance === "live" ? "bg-correct" : "bg-ink/30"}`} />;
  if (collapsed) {
    return <p title={label} className="flex h-7 items-center justify-center text-label">{dot}<span className="sr-only">{label}</span></p>;
  }
  return <p className="flex h-7 items-center gap-2 px-2.5 text-label text-ink-soft">{dot}{label}</p>;
}

export default function AppSidebar({
  collapsed = false,
  courses = [],
  onNavigate,
  onToggle,
  guidance,
}: {
  collapsed?: boolean;
  courses?: SidebarCourse[];
  onNavigate?: () => void;
  onToggle?: () => void;
  guidance?: Guidance;
}) {
  const pathname = usePathname();
  const state = useSidebarState();
  const settingsActive = isActive(pathname, "/settings");
  const { visible, hiddenCount } = orderSidebarPaths(courses, state.progress, 6);
  // The meter lane appears only once it carries information. A learner who has
  // started nothing gets six clean rows, not six empty ticks.
  const meters = visible.some((course) => (state.progress[course.id]?.completed ?? 0) > 0);

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className={`flex h-16 shrink-0 items-center border-b border-ink/[0.06] ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <Link
          href="/dashboard"
          aria-label="Museion home"
          onClick={onNavigate}
          className={`flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg ${collapsed ? "min-w-11 justify-center" : ""}`}
        >
          <BrandMark className="h-9 w-9 shrink-0" />
          {!collapsed && <span className="truncate text-lead font-semibold tracking-title">Museion</span>}
        </Link>
      </div>

      <nav aria-label="Application navigation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-5 pt-4 [scrollbar-width:thin]">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            {!collapsed && <p className={SECTION}>{group.label}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={`${ROW} text-body-sm ${active ? `${ROW_ACTIVE} font-semibold` : `${ROW_IDLE} font-medium`} ${collapsed ? "justify-center px-0" : "px-2"}`}
                  >
                    <span aria-hidden="true" className={SLOT}>
                      <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.75} />
                    </span>
                    {/* Kept in the tree when collapsed so the icon-only rail still has an accessible name. */}
                    <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {visible.length > 0 && (
          <section aria-label="Paths" className="mt-6 border-t border-ink/8 pt-4">
            {!collapsed && <p className={SECTION}>Paths</p>}
            <ol className="space-y-0.5">
              {visible.map((course) => {
                const href = `/courses/${course.id}`;
                const active = isActive(pathname, href);
                const entry = state.progress[course.id];
                const percent = entry && entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0;
                return (
                  <li key={course.id}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                      title={`${course.title} — ${course.subject}`}
                      className={`${ROW} text-body-sm ${active ? ROW_ACTIVE : ROW_IDLE} ${collapsed ? "justify-center px-0" : "px-2"}`}
                    >
                      <span aria-hidden="true" className={SLOT}>
                        <SubjectIcon subject={course.subject} variant="object" size={26} />
                      </span>
                      {collapsed ? (
                        <span className="sr-only">{course.title}</span>
                      ) : (
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate ${active ? "font-semibold" : "font-medium"}`}>{course.title}</span>
                          {/* A short meter on a lane every row shares: full-width bars read as link
                              underlines, and a lane only some rows have makes those rows look underlined. */}
                          {meters && (
                            <span aria-hidden="true" className="mt-1.5 block h-0.5 w-14 overflow-hidden rounded-full bg-ink/10">
                              <span className="block h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: subjectColor(course.subject) }} />
                            </span>
                          )}
                        </span>
                      )}
                      <span className="sr-only">
                        {course.subject}, {course.lessonCount} lessons
                        {percent > 0 ? `, ${percent}% complete` : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
              {hiddenCount > 0 && (
                <li>
                  <Link
                    href="/library"
                    onClick={onNavigate}
                    title={`View all ${courses.length} paths`}
                    className={`${ROW} text-body-sm font-medium ${ROW_IDLE} ${collapsed ? "justify-center px-0" : "px-2"}`}
                  >
                    <span aria-hidden="true" className={`${SLOT} rounded-lg bg-ink/[0.05] text-label font-semibold tabular-nums`}>+{hiddenCount}</span>
                    <span className={collapsed ? "sr-only" : "truncate"}>View all {courses.length} paths</span>
                  </Link>
                </li>
              )}
            </ol>
          </section>
        )}
      </nav>

      <div className="shrink-0 border-t border-ink/8 bg-surface/95 p-2">
        <GuidanceStatus guidance={guidance ?? state.guidance} collapsed={collapsed} />
        <div className={collapsed ? "space-y-1" : "flex items-center gap-1"}>
          <Link
            href="/settings"
            aria-current={settingsActive ? "page" : undefined}
            onClick={onNavigate}
            className={`${ROW} text-body-sm ${settingsActive ? `${ROW_ACTIVE} font-semibold` : `${ROW_IDLE} font-medium`} ${collapsed ? "justify-center px-0" : "flex-1 px-2"}`}
          >
            <span aria-hidden="true" className={SLOT}><HugeiconsIcon icon={Settings01Icon} size={18} strokeWidth={1.75} /></span>
            <span className={collapsed ? "sr-only" : "truncate"}>Settings</span>
          </Link>
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`hidden min-h-11 items-center justify-center rounded-xl text-ink-soft transition hover:bg-paper hover:text-ink lg:flex ${collapsed ? "w-full" : "w-11 shrink-0"}`}
            >
              <AppIcon name="collapse" className={`h-[1.15rem] w-[1.15rem] transition-transform ${collapsed ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
