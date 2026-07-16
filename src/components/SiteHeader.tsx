"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PRIMARY_NAV_ITEMS = [
  { href: "/", label: "Lessons", mobileLabel: "Learn" },
  { href: "/create", label: "Create", mobileLabel: "Create" },
  { href: "/judge", label: "Judge", mobileLabel: "Judge" },
];

const SECONDARY_NAV_ITEMS = [
  { href: "/progress", label: "Progress" },
  { href: "/about", label: "About" },
  { href: "/settings", label: "Settings" },
];

const NAV_ITEMS = [...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS];

function activePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/lessons/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const mobileMenu = useRef<HTMLDivElement>(null);
  const mobileMenuButton = useRef<HTMLButtonElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeSecondaryItem = SECONDARY_NAV_ITEMS.find((item) => activePath(pathname, item.href));

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeFromOutside = (event: PointerEvent) => {
      if (!mobileMenu.current?.contains(event.target as Node)) setMobileMenuOpen(false);
    };
    const closeFromKeyboard = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileMenuOpen(false);
      mobileMenuButton.current?.focus();
    };

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromKeyboard);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [mobileMenuOpen]);

  const linkClass = (active: boolean, compact = false) => `flex min-h-11 shrink-0 items-center justify-center rounded-lg ${compact ? "px-1.5" : "px-3"} py-2 text-center text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis ${
    active
      ? "bg-surface text-ink shadow-[0_4px_16px_rgba(35,53,91,0.08)]"
      : "text-ink-soft hover:bg-surface/70 hover:text-ink active:translate-y-px"
  }`;

  return (
    <header className="site-header border-b border-ink/10 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-6 px-4 py-2 sm:justify-between sm:px-6 lg:px-8">
        <Link href="/" aria-label="Museion home" data-mobile-brand className="group flex shrink-0 items-center gap-3">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-[0.7rem] bg-ink font-display text-lg font-semibold text-white shadow-[0_8px_24px_rgba(19,28,49,0.16)] transition-transform duration-200 group-hover:-rotate-2 group-active:scale-95">M</span>
          <span className="hidden sm:block"><span className="block font-display text-xl font-semibold leading-none tracking-tight text-ink">Museion</span><span className="mt-1 hidden text-[0.66rem] font-medium uppercase tracking-[0.16em] text-ink-soft md:block">reasoning, made visible</span></span>
        </Link>
        <nav aria-label="Primary navigation" className="min-w-0 flex-1 sm:flex-none">
          <div className="hidden items-center gap-1 rounded-xl bg-paper/80 p-1 sm:flex">
            {NAV_ITEMS.map((item) => {
              const active = activePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={linkClass(active)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div ref={mobileMenu} className="relative flex items-center justify-end gap-0.5 rounded-xl bg-paper/80 p-1 sm:hidden">
            {PRIMARY_NAV_ITEMS.map((item) => {
              const active = activePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={linkClass(active, true)}
                >
                  {item.mobileLabel}
                </Link>
              );
            })}
            <button
              ref={mobileMenuButton}
              type="button"
              aria-label={activeSecondaryItem ? `${activeSecondaryItem.label}, current page; more pages` : "More pages"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-more-navigation"
              aria-current={activeSecondaryItem ? "page" : undefined}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className={linkClass(Boolean(activeSecondaryItem), true)}
            >
              More
              <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                className={`ml-1 h-3 w-3 transition-transform duration-200 ${mobileMenuOpen ? "rotate-180" : ""}`}
              >
                <path d="M2.25 4.25 6 8l3.75-3.75" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </button>
            {mobileMenuOpen && (
              <div
                id="mobile-more-navigation"
                aria-label="More pages"
                className="absolute right-0 top-[calc(100%+0.5rem)] w-48 overflow-hidden rounded-xl border border-ink/10 bg-surface p-1.5 shadow-[0_18px_45px_rgba(35,53,91,0.16)]"
              >
                {SECONDARY_NAV_ITEMS.map((item) => {
                  const active = activePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition ${active ? "bg-lapis-soft text-ink" : "text-ink-soft hover:bg-paper hover:text-ink"}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
