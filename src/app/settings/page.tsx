import type { Metadata } from "next";
import Link from "next/link";

import AiSettingsPanel from "@/components/AiSettingsPanel";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-3xl">
        <p className="eyebrow">AI settings</p>
        <h1 className="mt-2 title-page">Settings</h1>
        <p className="mt-3 max-w-[62ch] text-body leading-6 text-ink-soft">
          Choose how Maia supports your learning and connect your preferred AI provider.
          Your lesson checks and progress stay consistent whichever option you use.
        </p>
      </header>
      <Link href="/account" className="mt-4 inline-flex min-h-11 items-center text-body-sm font-semibold text-lapis-dark">Manage your account and data <span aria-hidden="true" className="ml-2">→</span></Link>
      <div className="mt-8">
        <AiSettingsPanel />
      </div>
    </div>
  );
}
