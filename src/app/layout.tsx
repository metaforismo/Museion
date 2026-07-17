import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
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
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
