import type { Metadata } from "next";
import "./fonts.css";
import SiteShell from "@/components/SiteShell";
import { allLessons } from "@/lib/content";
import { coursePaths } from "@/lib/curriculum";
import { SITE } from "@/lib/site/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.origin),
  robots: SITE.indexing ? { index: true, follow: true } : { index: false, follow: false },
  title: { default: "Museion — reasoning, made visible", template: "%s · Museion" },
  description: "Build understanding with interactive courses and Maia, a tutor who helps you think through the next step.",
  keywords: ["interactive learning", "Socratic tutor", "deterministic assessment", "source-grounded courses"],
  icons: { icon: [{ url: "/brand/museion-mark.svg", type: "image/svg+xml" }], shortcut: "/brand/museion-mark.svg" },
  openGraph: { title: "Museion — reasoning, made visible", description: "Learn by doing. Think it through with Maia.", siteName: "Museion", type: "website", images: [{ url: "/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Museion — reasoning, made visible", description: "Learn by doing. Think it through with Maia.", images: ["/og.png"] },
};

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
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteShell courses={searchableCourses} lessons={searchableLessons}>{children}</SiteShell>
      </body>
    </html>
  );
}
