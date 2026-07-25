import type { Metadata } from "next";
import "@fontsource-variable/inter/wght.css";
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
  openGraph: { title: "Museion — reasoning, made visible", description: "The engine owns truth. Maia owns questions.", siteName: "Museion", type: "website", images: [{ url: "/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Museion — reasoning, made visible", description: "The engine owns truth. Maia owns questions.", images: ["/og.png"] },
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
