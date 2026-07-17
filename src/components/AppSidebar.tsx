"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import AppIcon, { type AppIconName } from "./AppIcon";
import BrandMark from "./BrandMark";

const GROUPS: { label: string; items: { href: string; label: string; icon: AppIconName }[] }[] = [
  { label: "Study", items: [
    { href: "/dashboard", label: "Home", icon: "home" },
    { href: "/library", label: "Library", icon: "library" },
    { href: "/review", label: "Review", icon: "review" },
  ] },
  { label: "Research lab", items: [
    { href: "/create", label: "Source studio", icon: "source" },
    { href: "/progress", label: "Evidence record", icon: "evidence" },
  ] },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarCourse = { id: string; title: string; subject: string };

export default function AppSidebar({ collapsed = false, courses = [], onNavigate, onToggle }: { collapsed?: boolean; courses?: SidebarCourse[]; onNavigate?: () => void; onToggle?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className={`flex h-20 shrink-0 items-center ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <Link href="/dashboard" aria-label="Museion home" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <BrandMark className="h-10 w-10 shrink-0" />
          {!collapsed && <span className="min-w-0"><span className="block font-display text-lg font-semibold leading-none tracking-tight">Museion</span><span className="mt-1 block truncate text-[0.68rem] text-ink-soft">Learn through evidence</span></span>}
        </Link>
      </div>

      <nav aria-label="Application navigation" className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-1">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            {!collapsed && <p className="px-3 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-soft">{group.label}</p>}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined} onClick={onNavigate} className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-2.5 text-sm font-medium transition ${active ? "bg-lapis-soft/75 text-lapis-dark shadow-[inset_0_0_0_1px_rgba(43,74,203,.08)]" : "text-ink-soft hover:bg-paper hover:text-ink"} ${collapsed ? "justify-center" : ""}`}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${active ? "bg-surface text-lapis-dark shadow-sm" : "group-hover:bg-surface"}`}><AppIcon name={item.icon} className="h-[1.05rem] w-[1.05rem]" /></span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>;
              })}
            </div>
          </div>
        ))}

        {!collapsed && courses.length > 0 && (
          <section aria-labelledby="sidebar-paths-title" className="mt-6 border-t border-ink/8 pt-5">
            <div className="flex items-center justify-between px-3 pb-2">
              <p id="sidebar-paths-title" className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-soft">Learning paths</p>
              <Link href="/library" onClick={onNavigate} className="text-[0.66rem] font-medium text-lapis-dark">View all</Link>
            </div>
            <div className="space-y-0.5">
              {courses.slice(0, 4).map((course, index) => {
                const href = `/courses/${course.id}`;
                const active = isActive(pathname, href);
                return <Link key={course.id} href={href} aria-current={active ? "page" : undefined} onClick={onNavigate} className={`group flex min-h-12 items-center gap-3 rounded-xl px-3 transition ${active ? "bg-paper text-ink" : "text-ink-soft hover:bg-paper hover:text-ink"}`}>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-[0.62rem] font-semibold tabular-nums ${active ? "bg-lapis text-white" : "bg-paper text-ink-soft group-hover:bg-surface"}`}>{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0"><span className="block truncate text-xs font-semibold">{course.title}</span><span className="mt-0.5 block truncate text-[0.64rem] text-ink-soft">{course.subject}</span></span>
                </Link>;
              })}
            </div>
          </section>
        )}
      </nav>

      <div className="shrink-0 border-t border-ink/8 p-2">
        <Link href="/settings" title={collapsed ? "Settings" : undefined} aria-current={isActive(pathname, "/settings") ? "page" : undefined} onClick={onNavigate} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink ${collapsed ? "justify-center" : ""}`}><AppIcon name="settings" className="h-[1.15rem] w-[1.15rem]" />{!collapsed && "Settings"}</Link>
        {onToggle && <button type="button" onClick={onToggle} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className={`mt-1 hidden min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink lg:flex ${collapsed ? "justify-center" : ""}`}><AppIcon name="collapse" className={`h-[1.15rem] w-[1.15rem] transition-transform ${collapsed ? "rotate-180" : ""}`} />{!collapsed && "Collapse"}</button>}
      </div>
    </div>
  );
}
