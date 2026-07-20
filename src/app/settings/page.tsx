import type { Metadata } from "next";

import AiSettingsPanel from "@/components/AiSettingsPanel";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <div className="max-w-3xl"><p className="text-sm font-medium text-lapis-dark">AI settings</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em]">Settings</h1><p className="mt-4 max-w-[62ch] leading-7 text-ink-soft">Models propose pedagogy. Museion’s deterministic engine still owns answers, citations, state and evidence.</p></div>
    <div className="mt-8"><AiSettingsPanel /></div>
  </div>;
}
