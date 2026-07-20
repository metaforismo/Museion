import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import SiteShell from "@/components/SiteShell";
import { allLessons } from "@/lib/content";
import { coursePaths } from "@/lib/curriculum";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Museion — reasoning, made visible", template: "%s · Museion" },
  description: "Source-grounded interactive learning with deterministic truth and a leak-gated Socratic AI tutor.",
  keywords: ["interactive learning", "Socratic tutor", "deterministic assessment", "source-grounded courses"],
  icons: { icon: [{ url: "/brand/museion-mark.svg", type: "image/svg+xml" }], shortcut: "/brand/museion-mark.svg" },
  openGraph: { title: "Museion — reasoning, made visible", description: "The engine owns truth. Maia owns questions.", siteName: "Museion", type: "website" },
  twitter: { card: "summary_large_image", title: "Museion — reasoning, made visible", description: "The engine owns truth. Maia owns questions." },
};

const fontDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const searchableLessons = allLessons().map(({ id, title, track, description, concepts }) => ({ id, title, track, description, concepts }));
  const searchableCourses = coursePaths.map(({ id, title, subject, tagline, lessonIds }) => ({
    id,
    title,
    subject,
    tagline,
    lessonCount: lessonIds.length,
  }));
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontSans.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteShell courses={searchableCourses} lessons={searchableLessons}>{children}</SiteShell>
      </body>
    </html>
  );
}
