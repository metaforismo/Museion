"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import AppIcon from "./AppIcon";
import AppSidebar from "./AppSidebar";
import AppCommandPalette, { type SearchableCourse, type SearchableLesson } from "./AppCommandPalette";
import BrandMark from "./BrandMark";
import SiteHeader from "./SiteHeader";

const PUBLIC_ROUTES = new Set(["/", "/welcome", "/about", "/privacy", "/terms"]);
const FOCUS_PREFIXES = ["/lessons/", "/learn/"];
const SIDEBAR_KEY = "museion-sidebar-collapsed";

function PublicFooter() {
  return <footer className="border-t border-ink/10 bg-surface py-7 text-sm text-ink-soft"><div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p className="flex items-center gap-2"><BrandMark className="h-7 w-7" /><span>Museion — a house for reasoning from sources.</span></p><nav aria-label="Legal" className="flex gap-4 text-xs font-medium"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></div></footer>;
}

function MobileBottomNav() {
  const pathname = usePathname();
  const items = [
    ["/dashboard", "Home", "home"], ["/library", "Library", "library"], ["/review", "Review", "review"], ["/create", "Create", "source"],
  ] as const;
  return <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-ink/10 bg-surface/95 px-1 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur lg:hidden">{items.map(([href, label, icon]) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-13 flex-col items-center justify-center gap-1 rounded-lg text-[0.66rem] font-medium ${active ? "text-lapis-dark" : "text-ink-soft"}`}><AppIcon name={icon} className="h-5 w-5" />{label}</Link>; })}</nav>;
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
  const focusRoute = FOCUS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const openSearch = () => setSearchOpen(true);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1"); } catch { /* storage is optional */ }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);
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
    document.body.style.overflow = "hidden"; closeButton.current?.focus(); document.addEventListener("keydown", handleKeyboard);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", handleKeyboard); };
  }, [sidebarOpen]);

  if (publicRoute) return <div className="flex min-h-[100dvh] flex-col"><SiteHeader /><main id="main-content" tabIndex={-1} className="flex-1">{children}</main><PublicFooter /></div>;
  if (focusRoute) return <div className="min-h-[100dvh] bg-paper"><header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink/10 bg-surface/95 px-4 backdrop-blur"><Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold"><BrandMark className="h-8 w-8" />Museion</Link><Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink">Leave lesson</Link></header><main id="main-content" tabIndex={-1}>{children}</main></div>;

  const toggle = () => setCollapsed((value) => { const next = !value; try { localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0"); } catch { /* storage is optional */ } return next; });
  return <div className={`min-h-[100dvh] bg-paper lg:grid lg:grid-rows-[auto_minmax(0,1fr)] ${collapsed ? "lg:grid-cols-[5rem_minmax(0,1fr)]" : "lg:grid-cols-[17rem_minmax(0,1fr)]"}`}>
    <aside aria-label="Application navigation" className="hidden border-r border-ink/10 bg-surface transition-[width] lg:row-span-2 lg:block"><div className="sticky top-0 h-[100dvh]"><AppSidebar collapsed={collapsed} courses={courses} lessonCount={lessons.length} onToggle={toggle} /></div></aside>
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink/10 bg-surface/95 px-4 backdrop-blur lg:col-start-2 lg:px-6">
      <button ref={menuButton} type="button" aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-ink/15 lg:hidden"><span aria-hidden="true" className="grid gap-1"><span className="h-px w-4 bg-ink"/><span className="h-px w-4 bg-ink"/><span className="h-px w-4 bg-ink"/></span></button>
      <button type="button" onClick={openSearch} aria-label="Search Museion" className="hidden min-h-11 min-w-0 items-center gap-3 rounded-xl px-3 text-left transition-colors hover:bg-paper lg:flex"><AppIcon name="search" className="h-4 w-4 text-ink-soft"/><span className="text-sm text-ink-soft">Search courses and concepts</span><kbd className="rounded border border-ink/10 bg-paper px-1.5 py-0.5 text-[0.65rem] text-ink-soft">⌘ K</kbd></button>
      <div className="ml-auto flex items-center gap-2"><button type="button" onClick={openSearch} aria-label="Search Museion" className="grid min-h-11 min-w-11 place-items-center rounded-lg text-ink-soft hover:bg-paper hover:text-ink lg:hidden"><AppIcon name="search" className="h-5 w-5"/></button><Link href="/create" className="rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-white hover:bg-lapis-dark">New course</Link></div>
    </header>
    {sidebarOpen && <div className="fixed inset-0 z-40 lg:hidden"><button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-ink/30"/><aside ref={mobileDrawer} id="mobile-app-navigation" aria-label="Application navigation" className="relative h-full w-[min(20rem,88vw)] border-r border-ink/10 bg-surface shadow-2xl"><button ref={closeButton} type="button" onClick={() => setSidebarOpen(false)} className="absolute right-3 top-3 z-10 min-h-11 rounded-lg px-3 text-sm font-medium text-ink-soft">Close</button><AppSidebar courses={courses} lessonCount={lessons.length} onNavigate={() => setSidebarOpen(false)} /></aside></div>}
    <main id="main-content" tabIndex={-1} className="min-w-0 pb-20 lg:col-start-2 lg:pb-0">{children}</main><MobileBottomNav /><AppCommandPalette courses={courses} lessons={lessons} open={searchOpen} onClose={() => setSearchOpen(false)} />
  </div>;
}
