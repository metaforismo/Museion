import type { Metadata } from "next";
import Link from "next/link";

import { buildDashboardSnapshot } from "@/lib/dashboard";
import { readLearnerId } from "@/lib/server/learner";

export const metadata: Metadata = { title: "Evidence", description: "Recorded learning observations and their explicit limits." };
export const dynamic = "force-dynamic";

const STATE_COPY = {
  "observed-guided": ["Observed in guided work", "A checked response was recorded during a supported lesson."],
  "hint-free-practice": ["Hint-free practice completed", "A practice run used no deterministic hint ladder; Maia may still have been available."],
      "immediate-transfer": ["Immediate near transfer", "A one-attempt check used a new surface and no assistance."],
} as const;

export default async function EvidencePage() {
  const learnerId = await readLearnerId();
  const snapshot = await buildDashboardSnapshot(learnerId ?? "new-learner");
  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <header className="grid gap-5 border-b border-ink/10 pb-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-sm font-medium text-lapis-dark">Evidence</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.04em]">What Museion observed—and no more.</h1><p className="mt-3 max-w-3xl leading-7 text-ink-soft">The record separates guided work, hint-free practice and immediate near transfer. None of these alone establishes retained mastery.</p></div><Link href="/review" className="inline-flex min-h-11 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-white">Review next</Link></header>

    <section className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,.65fr)]" aria-labelledby="concept-evidence-title"><div className="rounded-2xl border border-ink/10 bg-surface p-5 shadow-[var(--shadow-tight)] sm:p-7"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-medium text-ink-soft">Concept record</p><h2 id="concept-evidence-title" className="mt-1 text-xl font-semibold">Learning observations</h2></div><span className="text-xs text-ink-soft">{snapshot.evidence.length} signals</span></div>
      {snapshot.evidence.length ? <div className="mt-5 divide-y divide-ink/8">{snapshot.evidence.map((item) => { const copy = STATE_COPY[item.state]; return <article key={`${item.concept}:${item.state}`} className="grid gap-3 py-4 sm:grid-cols-[minmax(10rem,.7fr)_minmax(15rem,1fr)_auto] sm:items-center"><div><h3 className="text-sm font-semibold">{item.concept}</h3><p className="mt-1 text-xs text-ink-soft">Suggested support: {item.support}</p></div><div><p className="text-sm font-medium">{copy[0]}</p><p className="mt-1 text-xs leading-5 text-ink-soft">{copy[1]}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${item.result === "incorrect" || item.result === "developing" ? "bg-gold-soft" : "bg-correct-soft text-correct"}`}>{item.result}</span></article>; })}</div> : <div className="mt-5 rounded-xl bg-paper p-5"><p className="font-medium">No observations yet.</p><p className="mt-2 text-sm leading-6 text-ink-soft">Museion will not display a readiness score before it has checked work.</p><Link href="/library" className="mt-4 inline-flex text-sm font-semibold text-lapis-dark">Choose a lesson →</Link></div>}
    </div>
    <aside className="rounded-2xl bg-ink p-6 text-white"><p className="text-xs font-medium text-gold">Evidence ladder</p><ol className="mt-5 space-y-5"><li><p className="font-semibold">1. Guided observation</p><p className="mt-1 text-xs leading-5 text-white/60">Useful for adapting support, not a mastery claim.</p></li><li><p className="font-semibold">2. Hint-free practice</p><p className="mt-1 text-xs leading-5 text-white/60">A different observation; it may still include Maia.</p></li><li><p className="font-semibold">3. Immediate near transfer</p><p className="mt-1 text-xs leading-5 text-white/60">Unassisted and structurally related, but not delayed.</p></li><li className="border-t border-white/15 pt-5"><p className="font-semibold text-white/60">4. Retention</p><p className="mt-1 text-xs leading-5 text-white/60">Not measured yet. A delayed probe is required.</p></li></ol></aside></section>

    <section className="mt-7 rounded-2xl border border-ink/10 bg-gold-soft p-5 sm:p-6" aria-labelledby="limitations-title"><h2 id="limitations-title" className="font-semibold">Current evidence boundary</h2><ul className="mt-3 grid gap-2 text-sm leading-6 text-ink-soft lg:grid-cols-3">{snapshot.limitations.map((item) => <li key={item} className="border-l-2 border-gold pl-3">{item}</li>)}</ul></section>
  </div>;
}
