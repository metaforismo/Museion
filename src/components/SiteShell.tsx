"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { subjectTint } from "@/lib/curriculum/subjects";
import { washStyle, zoneForPath } from "@/lib/design/zones";
import styles from "./product.module.css";

import AppIcon from "./AppIcon";
import AppSidebar from "./AppSidebar";
import AppCommandPalette, { type SearchableCourse, type SearchableLesson } from "./AppCommandPalette";
import BrandMark from "./BrandMark";
import SiteHeader from "./SiteHeader";
import AuthButton from "./AuthButton";
import PublicFooterNav from "./PublicFooterNav";
import { PUBLIC_CONTENT_PATHS, AUTH_PAGE_PATHS } from "@/lib/site/public-routes";

const PUBLIC_ROUTES = new Set(PUBLIC_CONTENT_PATHS);
const AUTH_ROUTES = new Set(AUTH_PAGE_PATHS);
const FOCUS_PREFIXES = ["/lessons/", "/learn/"];
const SIDEBAR_KEY = "museion-sidebar-collapsed";

/**
 * A course route paints the learn zone in that course's own subject tint, so
 * the page around an illustrated hero belongs to the same subject. Resolved
 * from the courses the shell already has; an unknown id falls back to the
 * zone's own tint rather than guessing a subject.
 */
function courseWashTint(pathname: string, courses: SearchableCourse[]): string | undefined {
  const courseId = /^\/courses\/([^/?#]+)/.exec(pathname)?.[1];
  if (!courseId) return undefined;
  const subject = courses.find((course) => course.id === courseId)?.subject;
  return subject ? subjectTint(subject) : undefined;
}

function PublicFooter() {
  return <footer className="border-t border-ink/10 bg-surface py-7 text-body-sm text-ink-soft"><div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p className="flex items-center gap-2"><BrandMark className="h-7 w-7" /><span>A little closer to understanding.</span></p><PublicFooterNav className="flex flex-wrap gap-x-5 gap-y-2 text-label font-medium [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center"/></div></footer>;
}

function MobileBottomNav() {
  const pathname = usePathname();
  const items = [
    ["/dashboard", "Home", "home"], ["/library", "Library", "library"], ["/review", "Review", "review"], ["/create", "Create", "source"],
  ] as const;
  return <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-ink/10 bg-surface/95 px-1 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur lg:hidden">{items.map(([href, label, icon]) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-lg text-micro font-medium transition-colors ${active ? "text-lapis-dark" : "text-ink-soft"}`}><span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${active ? "bg-lapis-soft/70" : ""}`}><AppIcon name={icon} className="h-5 w-5" /></span>{label}</Link>; })}</nav>;
}

export default function SiteShell({ children, courses, lessons }: { children: ReactNode; courses: SearchableCourse[]; lessons: SearchableLesson[] }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const mobileDrawer = useRef<HTMLElement>(null);
  const publicRoute = PUBLIC_ROUTES.has(pathname);
  const authRoute = AUTH_ROUTES.has(pathname);
  const focusRoute = FOCUS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const openSearch = () => setSearchOpen(true);
  const closeNavigation = () => { setSidebarOpen(false); requestAnimationFrame(() => menuButton.current?.focus()); };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1"); } catch { /* storage is optional */ }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if (!publicRoute && !authRoute && pathname !== "/welcome" && (event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, [publicRoute, authRoute, pathname]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSidebarOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setSidebarOpen(false); menuButton.current?.focus(); return; }
      if (event.key !== "Tab") return;
      const focusable = mobileDrawer.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; closeButton.current?.focus(); document.addEventListener("keydown", handleKeyboard);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKeyboard); };
  }, [sidebarOpen]);

  if (authRoute) return <div className={styles.authShell}><main id="main-content" tabIndex={-1}>{children}</main></div>;

  if (pathname === "/welcome") return <div className={styles.authShell}><header className="flex h-18 items-center justify-between border-b border-ink/8 px-5 sm:px-8"><Link href="/" className="flex items-center gap-2.5 font-semibold"><BrandMark className="h-8 w-8"/>Museion</Link><AuthButton/></header><main id="main-content" tabIndex={-1}>{children}</main></div>;

  if (publicRoute) {
    const landing = pathname === "/";
    return <div className="flex min-h-[100dvh] flex-col"><SiteHeader landing={landing} /><main id="main-content" tabIndex={-1} className="flex-1">{children}</main>{!landing && <PublicFooter />}</div>;
  }
  if (focusRoute) return <div style={washStyle("learn")} className="min-h-[100dvh] bg-paper"><main id="main-content" tabIndex={-1}>{children}</main></div>;

  // Signup enters /welcome; normal navigation remains direct and predictable.

  const toggle = () => setCollapsed((value) => { const next = !value; try { localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0"); } catch { /* storage is optional */ } return next; });
  return <div style={washStyle(zoneForPath(pathname), courseWashTint(pathname, courses))} className={`${styles.shell} min-h-[100dvh] bg-paper bg-fixed lg:grid lg:grid-rows-[auto_minmax(0,1fr)] ${collapsed ? "lg:grid-cols-[4.5rem_minmax(0,1fr)]" : "lg:grid-cols-[17rem_minmax(0,1fr)]"}`}>
    <aside aria-label="Application navigation" className="hidden border-r border-ink/8 bg-surface lg:row-span-2 lg:block"><div className="sticky top-0 h-[100dvh]"><AppSidebar collapsed={collapsed} courses={courses} onToggle={toggle} /></div></aside>
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink/10 bg-surface/95 px-4 backdrop-blur lg:col-start-2 lg:px-6">
      <button ref={menuButton} type="button" aria-label="Open navigation" aria-expanded={sidebarOpen} aria-controls="mobile-app-navigation" onClick={() => setSidebarOpen(true)} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-ink/15 lg:hidden"><span aria-hidden="true" className="grid gap-1"><span className="h-px w-4 bg-ink"/><span className="h-px w-4 bg-ink"/><span className="h-px w-4 bg-ink"/></span></button>
      <button type="button" onClick={openSearch} aria-label="Search Museion" className="hidden h-10 w-full max-w-sm min-w-0 items-center gap-2.5 rounded-xl border border-ink/8 bg-paper/70 px-3.5 text-left transition-colors hover:border-ink/20 hover:bg-paper lg:flex"><AppIcon name="search" className="h-4 w-4 shrink-0 text-ink-soft"/><span className="min-w-0 flex-1 truncate text-body-sm text-ink-soft">Find a course or concept</span><kbd className="shrink-0 rounded border border-ink/10 bg-surface px-1.5 py-0.5 text-micro text-ink-soft">⌘ K</kbd></button>
      <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-3"><AuthButton /><button type="button" onClick={openSearch} aria-label="Search Museion" className="grid min-h-11 min-w-11 place-items-center rounded-lg text-ink-soft hover:bg-paper hover:text-ink lg:hidden"><AppIcon name="search" className="h-5 w-5"/></button><Link href="/create" className="inline-flex min-h-11 items-center rounded-xl bg-ink px-3.5 text-body-sm font-semibold text-white transition-colors hover:bg-lapis-dark active:scale-[.97]"><span className="min-[360px]:hidden">Create</span><span className="hidden min-[360px]:inline">New course</span></Link></div>
    </header>
    {sidebarOpen && <div className="fixed inset-0 z-40 lg:hidden"><button type="button" aria-label="Close navigation" onClick={closeNavigation} className="absolute inset-0 bg-ink/30"/><aside ref={mobileDrawer} id="mobile-app-navigation" role="dialog" aria-modal="true" aria-label="Application navigation" className="relative h-full w-[min(20rem,88vw)] border-r border-ink/10 bg-surface shadow-[var(--shadow-3)]"><button ref={closeButton} type="button" onClick={closeNavigation} className="absolute right-3 top-3 z-10 min-h-11 rounded-lg px-3 text-body-sm font-medium text-ink-soft">Close</button><AppSidebar courses={courses} onNavigate={() => setSidebarOpen(false)} /></aside></div>}
    <main id="main-content" tabIndex={-1} inert={sidebarOpen ? true : undefined} className="min-w-0 pb-20 lg:col-start-2 lg:pb-0">{children}</main><MobileBottomNav /><AppCommandPalette courses={courses} lessons={lessons} open={searchOpen} onClose={() => setSearchOpen(false)} />
  </div>;
}
