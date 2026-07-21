import Link from "next/link";

import BrandMark from "./BrandMark";

export default function SiteHeader({ landing = false }: { landing?: boolean }) {
  return (
    <header className={landing ? "sticky top-0 z-40 bg-[#f7fbff]/90 px-3 py-2 backdrop-blur-xl" : "border-b border-ink/10 bg-paper"}>
      <div className={`mx-auto flex w-full items-center justify-between gap-6 ${landing ? "min-h-14 max-w-5xl rounded-full border border-ink/[.06] bg-white/90 px-4 shadow-[0_12px_35px_rgba(46,89,137,.08)] sm:px-5" : "min-h-18 max-w-7xl px-4 sm:px-6 lg:px-8"}`}>
        <Link href="/" aria-label="Museion home" className="flex shrink-0 items-center gap-3">
          <BrandMark className={landing ? "h-8 w-8 shrink-0" : "h-10 w-10 shrink-0"} />
          <span className={landing ? "text-sm font-bold tracking-[-0.02em]" : "font-display text-lg font-semibold tracking-tight"}>Museion</span>
        </Link>
        <nav aria-label="Public navigation" className="flex items-center gap-1 sm:gap-2">
          <Link href={landing ? "/#how-it-works" : "/library"} className="hidden min-h-11 items-center px-3 text-xs font-medium text-ink-soft hover:text-ink sm:inline-flex">
            {landing ? "How it works" : "Library"}
          </Link>
          <Link href={landing ? "/#library" : "/about"} className="hidden min-h-11 items-center px-3 text-xs font-medium text-ink-soft hover:text-ink md:inline-flex">
            {landing ? "Courses" : "About"}
          </Link>
          {!landing && <Link href="/create" className="hidden min-h-11 items-center px-3 text-sm font-medium text-ink-soft hover:text-ink sm:inline-flex">
            Create
          </Link>}
          <Link href="/dashboard" className={`inline-flex min-h-10 items-center bg-ink px-4 font-semibold text-white hover:bg-lapis-dark ${landing ? "rounded-full text-xs shadow-[0_3px_0_rgba(0,0,0,.14)]" : "rounded-lg text-sm"}`}>
            Open Museion
          </Link>
        </nav>
      </div>
    </header>
  );
}
