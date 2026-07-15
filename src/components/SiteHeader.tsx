"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Lessons" },
  { href: "/create", label: "Create" },
  { href: "/judge", label: "Judge" },
  { href: "/progress", label: "Progress" },
  { href: "/about", label: "About" },
];

function activePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/lessons/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header border-b border-ink/10 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:flex-nowrap sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="Museion home">
          <span className="flex h-9 w-9 items-center justify-center rounded-[0.7rem] bg-ink font-display text-lg font-semibold text-white shadow-[0_8px_24px_rgba(19,28,49,0.16)] transition-transform duration-200 group-hover:-rotate-2 group-active:scale-95">M</span>
          <span><span className="block font-display text-xl font-semibold leading-none tracking-tight text-ink">Museion</span><span className="mt-1 hidden text-[0.66rem] font-medium uppercase tracking-[0.16em] text-ink-soft md:block">reasoning, made visible</span></span>
        </Link>
        <nav aria-label="Primary navigation" className="order-last w-full overflow-x-auto sm:order-none sm:w-auto">
          <div className="flex min-w-max items-center gap-1 rounded-xl bg-paper/80 p-1">
            {NAV_ITEMS.map((item) => { const active = activePath(pathname, item.href); return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`min-h-10 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis ${active ? "bg-surface text-ink shadow-[0_4px_16px_rgba(35,53,91,0.08)]" : "text-ink-soft hover:bg-surface/70 hover:text-ink active:translate-y-px"}`}>{item.label}</Link>; })}
          </div>
        </nav>
      </div>
    </header>
  );
}
