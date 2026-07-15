import type { Metadata } from "next";

import AiSettingsPanel from "@/components/AiSettingsPanel";

export const metadata: Metadata = { title: "AI settings" };

export default function SettingsPage() {
  return <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
    <div className="max-w-3xl"><p className="eyebrow">AI settings</p><h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">Choose how Museion thinks.</h1><p className="mt-5 max-w-[62ch] text-lg leading-8 text-ink-soft">Models propose pedagogy. Museion’s deterministic engine still owns answers, citations, state and evidence.</p></div>
    <div className="mt-10"><AiSettingsPanel /></div>
  </div>;
}
