import type { Metadata } from "next";
import Link from "next/link";

import { buildDashboardSnapshot } from "@/lib/dashboard";
import { readLearnerId } from "@/lib/server/learner";

export const metadata: Metadata = { title: "Home", description: "Your courses, review queue, evidence and next learning action." };
export const dynamic = "force-dynamic";

function formatTemplate(value: string) { return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export default async function DashboardPage() {
  const learnerId = await readLearnerId();
  const snapshot = await buildDashboardSnapshot(learnerId ?? "new-learner");
  const hasActivity = snapshot.activeLearning.length > 0;
  return <div className="mx-auto w-full max-w-[90rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-medium text-lapis-dark">Your learning workspace</p><h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Welcome back.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">Continue from recorded work, review a real signal, or build from a source you trust.</p></div>
      <div className="flex items-center gap-2 text-xs"><span className="rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-ink-soft">{snapshot.runtime.label}</span><span className="rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-ink-soft">{snapshot.runtime.persistence === "process-local" ? "Local session" : "Synced storage"}</span></div>
    </header>

    <section className="mt-7 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(19rem,.6fr)]" aria-labelledby="next-action-title">
      <article className="relative overflow-hidden rounded-2xl border border-ink/10 bg-ink p-6 text-white shadow-[var(--shadow-tight)] sm:p-7">
        <div aria-hidden="true" className="absolute -right-12 -top-20 h-56 w-56 rounded-full border border-white/10" />
        <div className="relative"><p className="text-xs font-semibold text-gold">Next action</p><h2 id="next-action-title" className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">{snapshot.nextAction.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{snapshot.nextAction.description}</p><div className="mt-6 flex flex-wrap items-center gap-4"><Link href={snapshot.nextAction.href} className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-ink">Continue <span aria-hidden="true" className="ml-2">→</span></Link><span className="max-w-lg text-xs leading-5 text-white/50">Why this: {snapshot.nextAction.reason}</span></div></div>
      </article>
      <aside className="rounded-2xl border border-ink/10 bg-surface p-5 shadow-[var(--shadow-tight)]"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-ink-soft">Review queue</p><p className="mt-2 text-3xl font-semibold tabular-nums">{snapshot.reviewQueue.length}</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-soft text-lg" aria-hidden="true">↻</span></div><p className="mt-3 text-sm leading-6 text-ink-soft">{snapshot.reviewQueue.length ? "Ranked from recorded misconceptions and assisted work." : "Nothing urgent. Museion will add items only after a real signal."}</p><Link href="/review" className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-lapis-dark">Open review <span aria-hidden="true" className="ml-1">→</span></Link></aside>
    </section>

    <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,.65fr)]">
      <div className="space-y-6">
        <section aria-labelledby="active-title"><div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-medium text-ink-soft">Courses</p><h2 id="active-title" className="mt-1 text-xl font-semibold">Continue learning</h2></div><Link href="/library" className="text-sm font-medium text-lapis-dark">View library</Link></div>
          {hasActivity ? <div className="grid gap-3 sm:grid-cols-2">{snapshot.activeLearning.map((item) => <Link key={item.id} href={item.href} className="group rounded-2xl border border-ink/10 bg-surface p-5 shadow-[var(--shadow-tight)] transition hover:-translate-y-0.5 hover:border-lapis/30"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-paper px-2.5 py-1 text-[0.68rem] font-medium text-ink-soft">{item.kind === "generated" ? "From your source" : "Museion lesson"}</span><span className="text-xs tabular-nums text-ink-soft">{Math.round(item.progress * 100)}%</span></div><h3 className="mt-4 font-semibold group-hover:text-lapis-dark">{item.title}</h3><p className="mt-1.5 text-sm text-ink-soft">{item.detail}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink/8"><div className="h-full rounded-full bg-lapis" style={{ width: `${Math.max(4, item.progress * 100)}%` }} /></div></Link>)}</div> : <div className="rounded-2xl border border-dashed border-ink/15 bg-surface p-6"><p className="font-semibold">Your workspace is ready.</p><p className="mt-2 text-sm leading-6 text-ink-soft">Start an interactive foundation or create a course from one source.</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/library" className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white">Browse lessons</Link><Link href="/create" className="rounded-lg border border-ink/15 px-4 py-2.5 text-sm font-semibold">Create a course</Link></div></div>}
        </section>

        <section aria-labelledby="evidence-title" className="rounded-2xl border border-ink/10 bg-surface p-5 shadow-[var(--shadow-tight)] sm:p-6"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-medium text-ink-soft">Understanding evidence</p><h2 id="evidence-title" className="mt-1 text-xl font-semibold">What the record supports</h2></div><Link href="/progress" className="text-sm font-medium text-lapis-dark">See evidence</Link></div>
          {snapshot.evidence.length ? <div className="mt-5 grid gap-x-6 gap-y-1 sm:grid-cols-2">{snapshot.evidence.slice(0,6).map((item) => <div key={`${item.concept}:${item.state}`} className="flex items-center justify-between border-t border-ink/8 py-3"><div><p className="text-sm font-medium">{item.concept}</p><p className="mt-0.5 text-xs text-ink-soft">{item.state === "observed-guided" ? "Observed in guided work" : item.state === "hint-free-practice" ? "Hint-free practice completed" : "Immediate near transfer"}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.result === "incorrect" || item.result === "developing" ? "bg-gold-soft text-ink" : "bg-correct-soft text-correct"}`}>{item.result}</span></div>)}</div> : <p className="mt-4 text-sm leading-6 text-ink-soft">No concept evidence yet. A checked response will create the first record.</p>}
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-2xl border border-ink/10 bg-surface p-5 shadow-[var(--shadow-tight)]" aria-labelledby="misconceptions-title"><div className="flex items-center justify-between"><h2 id="misconceptions-title" className="font-semibold">Recent misconceptions</h2><span className="text-xs text-ink-soft">{snapshot.misconceptions.length}</span></div>{snapshot.misconceptions.length ? <div className="mt-3 divide-y divide-ink/8">{snapshot.misconceptions.slice(0,3).map((item) => <Link key={`${item.id}:${item.observedAt}`} href={item.href} className="block py-3"><p className="text-xs font-medium text-lapis-dark">{item.concept}</p><p className="mt-1 line-clamp-2 text-sm leading-5 text-ink">{item.label}</p><p className="mt-1 text-xs text-ink-soft">{item.status === "corrected-in-session" ? "Corrected during the session; worth rechecking" : "Not yet resolved"}</p></Link>)}</div> : <p className="mt-3 text-sm leading-6 text-ink-soft">No registered misconception has been observed.</p>}<Link href="/review" className="mt-3 inline-flex text-sm font-semibold text-lapis-dark">Open misconception lab</Link></section>

        <section className="rounded-2xl border border-ink/10 bg-surface p-5 shadow-[var(--shadow-tight)]" aria-labelledby="sources-title"><div className="flex items-center justify-between"><h2 id="sources-title" className="font-semibold">Recent sources</h2><Link href="/create" className="text-xs font-medium text-lapis-dark">Add source</Link></div>{snapshot.recentSources.length ? <div className="mt-3 divide-y divide-ink/8">{snapshot.recentSources.map((source) => <Link key={source.id} href={source.href} className="block py-3"><p className="truncate text-sm font-medium">{source.title}</p><p className="mt-1 text-xs text-ink-soft">{source.pages} {source.pages === 1 ? "page" : "pages"} · {formatTemplate(source.templateId)}</p></Link>)}</div> : <p className="mt-3 text-sm leading-6 text-ink-soft">Compiled sources will appear here for their retention window.</p>}</section>
      </aside>
    </div>
    <p className="mt-7 border-t border-ink/10 pt-4 text-xs leading-5 text-ink-soft">{snapshot.limitations[0]} <Link href="/progress" className="font-medium text-lapis-dark">Read the evidence boundary.</Link></p>
  </div>;
}
