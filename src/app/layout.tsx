import type { Metadata } from "next";
import Link from "next/link";

import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Museion — reasoning, made visible", template: "%s · Museion" },
  description: "Source-grounded interactive learning with deterministic truth and a leak-gated Socratic AI tutor.",
  keywords: ["interactive learning", "Socratic tutor", "deterministic assessment", "source-grounded courses"],
  openGraph: { title: "Museion — reasoning, made visible", description: "The engine owns truth. Maia owns questions.", siteName: "Museion", type: "website" },
  twitter: { card: "summary_large_image", title: "Museion — reasoning, made visible", description: "The engine owns truth. Maia owns questions." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
        <footer className="border-t border-ink/10 bg-surface/70 py-7 text-sm text-ink-soft">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>Museion — the engine owns truth; Maia owns questions.</p>
            <nav aria-label="Legal" className="flex gap-4 text-xs font-medium"><Link href="/privacy" className="hover:text-ink">Privacy</Link><Link href="/terms" className="hover:text-ink">Terms</Link></nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
