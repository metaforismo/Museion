import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Museion — learn by reasoning, with Maia",
    template: "%s · Museion",
  },
  description:
    "Interactive learning platform with Maia, a Socratic AI tutor that never gives away the answer. Deterministic engine for ground truth, AI for pedagogy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-ink/10 bg-surface">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="font-display text-xl font-semibold tracking-tight text-lapis-dark">
                Museion
              </span>
              <span className="hidden text-xs text-ink-soft sm:inline">
                seat of the Muses
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/"
                className="font-medium text-ink-soft transition hover:text-lapis-dark"
              >
                Lessons
              </Link>
              <Link
                href="/about"
                className="font-medium text-ink-soft transition hover:text-lapis-dark"
              >
                About
              </Link>
              <span className="hidden rounded-full bg-gold-soft px-3 py-1 text-xs font-medium text-ink sm:inline">
                with Maia, your Socratic tutor
              </span>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-ink/10 py-4 text-center text-xs text-ink-soft">
          Museion — the engine owns truth, the tutor owns questions.
        </footer>
      </body>
    </html>
  );
}
