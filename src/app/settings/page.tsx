import type { Metadata } from "next";

import AiSettingsPanel from "@/components/AiSettingsPanel";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-3xl">
        <p className="eyebrow">AI settings</p>
        <h1 className="mt-2 title-page">Settings</h1>
        <p className="mt-3 max-w-[62ch] text-body leading-6 text-ink-soft">
          Models propose pedagogy. Museion&rsquo;s deterministic engine still owns answers, citations,
          state and evidence.
        </p>
      </header>
      <div className="mt-8">
        <AiSettingsPanel />
      </div>
    </div>
  );
}
