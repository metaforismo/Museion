import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-ink/10 bg-paper">
      <div className="mx-auto flex min-h-18 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Museion home" className="flex shrink-0 items-center gap-3">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white">
            M
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Museion</span>
        </Link>
        <nav aria-label="Public navigation" className="flex items-center gap-1 sm:gap-2">
          <Link href="/library" className="hidden min-h-11 items-center px-3 text-sm font-medium text-ink-soft hover:text-ink sm:inline-flex">
            Library
          </Link>
          <Link href="/about" className="hidden min-h-11 items-center px-3 text-sm font-medium text-ink-soft hover:text-ink md:inline-flex">
            About
          </Link>
          <Link href="/create" className="hidden min-h-11 items-center px-3 text-sm font-medium text-ink-soft hover:text-ink sm:inline-flex">
            Create
          </Link>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-lapis-dark">
            Open Museion
          </Link>
        </nav>
      </div>
    </header>
  );
}
