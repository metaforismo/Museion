import Link from "next/link";

import OnboardingRedirect from "@/components/OnboardingRedirect";
import { lessonsByTrack } from "@/lib/content";
import { hasPractice } from "@/lib/engine/practice";

const TRACK_ICONS: Record<string, string> = { Algebra: "∑", Arithmetic: "÷", "Computer Science": "⌘" };

const PIPELINE = [
  { step: "01", title: "Ground the source", body: "Stable pages, hashes, and exact quotations make every generated claim inspectable." },
  { step: "02", title: "Compile the reasoning", body: "A typed blueprint becomes deterministic interactions—not a chat transcript." },
  { step: "03", title: "Coach without leaking", body: "Maia asks questions inside strict targets. Code still decides what is true." },
  { step: "04", title: "Observe independence", body: "A locked transfer task records assistance and states exactly what was observed." },
];

export default function HomePage() {
  const tracks = lessonsByTrack();
  return (
    <div>
      <OnboardingRedirect />
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[minmax(0,1.14fr)_minmax(21rem,0.86fr)] lg:items-center lg:px-8 lg:pb-28 lg:pt-24">
        <div className="max-w-3xl">
          <p className="eyebrow">A source-grounded learning engine</p>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.96] tracking-[-0.045em] sm:text-6xl lg:text-7xl">Learn by reasoning,<br/><span className="text-lapis">not by being told.</span></h1>
          <p className="mt-7 max-w-[62ch] text-lg leading-8 text-ink-soft sm:text-xl">Museion turns trusted material into interactions with code-owned truth. Maia can see where your reasoning broke and ask the next useful question—the final answer stays out of reach.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/judge" className="rounded-xl bg-ink px-6 py-3.5 font-semibold text-white shadow-[0_12px_34px_rgba(19,28,49,0.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-lapis-dark">Run the verified experience <span aria-hidden="true">→</span></Link>
            <Link href="/create" className="rounded-xl px-5 py-3.5 font-semibold text-lapis transition hover:bg-lapis-soft">Inspect the source path</Link>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-ink-soft"><span className="h-2 w-2 rounded-full bg-correct" aria-hidden="true"/>Keyless replay · no login · evidence limits included</p>
        </div>

        <aside aria-label="Museion truth boundary" className="premium-surface relative overflow-hidden rounded-[2rem] border border-white/80 p-6 sm:p-8">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-gold-soft blur-2xl" aria-hidden="true"/>
          <div className="relative">
            <div className="flex items-center justify-between gap-4"><p className="eyebrow">Truth boundary</p><span className="tabular-nums text-xs text-ink-soft">artifact v2.0</span></div>
            <div className="mt-7 rounded-2xl bg-ink p-5 text-white shadow-[0_18px_50px_rgba(19,28,49,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Deterministic engine</p>
              <p className="mt-3 font-display text-2xl font-semibold">Owns truth.</p>
              <p className="mt-2 text-sm leading-6 text-white/65">Answers, expected states, misconception rules, and scoring remain server-side.</p>
            </div>
            <div className="relative mx-8 h-12 border-x border-dashed border-lapis/30" aria-hidden="true"><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-lapis-soft px-2 py-1 text-[0.62rem] font-bold uppercase tracking-wide text-lapis">typed state only</span></div>
            <div className="rounded-2xl border border-lapis/15 bg-lapis-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lapis">Maia</p>
              <p className="mt-3 font-display text-2xl font-semibold">Owns questions.</p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">She can highlight, focus, pulse, or annotate issued targets—never score or reveal.</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="border-y border-ink/10 bg-surface/65">
        <div className="mx-auto grid w-full max-w-6xl gap-px bg-ink/10 sm:grid-cols-3">
          {[{ value: "125", label: "offline tests passed" }, { value: "20/20", label: "clean desktop judge runs" }, { value: "0", label: "known dependency vulnerabilities" }].map((metric) => <div key={metric.label} className="bg-surface/95 px-6 py-7 text-center sm:text-left"><p className="tabular-nums font-display text-3xl font-semibold tracking-tight">{metric.value}</p><p className="mt-1 text-sm text-ink-soft">{metric.label}</p></div>)}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start"><p className="eyebrow">From source to evidence</p><h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Every link in the chain is inspectable.</h2><p className="mt-5 max-w-[45ch] leading-7 text-ink-soft">The model can propose. It cannot silently rewrite provenance, invent runtime truth, or turn one observation into a mastery claim.</p><Link href="/create/review" className="mt-6 inline-flex font-semibold text-lapis hover:underline">Review the golden compilation <span className="ml-2" aria-hidden="true">↗</span></Link></div>
          <ol className="space-y-3">
            {PIPELINE.map((item, index) => <li key={item.step} className={`grid gap-4 rounded-[1.4rem] p-5 sm:grid-cols-[3rem_1fr] sm:p-6 ${index % 2 === 0 ? "bg-surface shadow-[0_10px_36px_rgba(35,53,91,0.06)]" : "ml-0 border border-ink/10 bg-paper/60 lg:ml-12"}`}><span className="tabular-nums font-mono text-sm font-semibold text-lapis">{item.step}</span><div><h3 className="font-display text-xl font-semibold">{item.title}</h3><p className="mt-2 max-w-[55ch] leading-7 text-ink-soft">{item.body}</p></div></li>)}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Authored collection</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em]">Practice the foundations.</h2></div><p className="max-w-md text-sm leading-6 text-ink-soft">Existing lessons use the same deterministic verifier and fading support model. They remain a separate authored path from the Build Week compiler replay.</p></div>
        {[...tracks.entries()].map(([track, lessons]) => <section key={track} className="mb-12"><h3 className="mb-4 flex items-center gap-3 text-sm font-semibold text-ink-soft"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-mono text-sm text-white">{TRACK_ICONS[track] ?? "•"}</span>{track}</h3><div className="grid gap-4 sm:grid-cols-2">{lessons.map((lesson, index) => <Link key={lesson.id} href={`/lessons/${lesson.id}`} className={`group flex min-h-56 flex-col rounded-[1.4rem] p-6 transition duration-200 hover:-translate-y-1 ${index % 3 === 0 ? "bg-ink text-white shadow-[0_18px_50px_rgba(19,28,49,0.15)]" : "premium-surface border border-white/80"}`}><p className={`text-xs font-semibold uppercase tracking-[0.13em] ${index % 3 === 0 ? "text-gold" : "text-lapis"}`}>{lesson.steps.length} verified steps</p><h4 className="mt-4 font-display text-2xl font-semibold tracking-tight">{lesson.title}</h4><p className={`mt-3 max-w-[50ch] text-sm leading-6 ${index % 3 === 0 ? "text-white/65" : "text-ink-soft"}`}>{lesson.description}</p><div className="mt-auto flex items-end justify-between gap-4 pt-6"><div className="flex flex-wrap gap-2">{lesson.concepts.slice(0, 2).map((concept) => <span key={concept} className={`rounded-md px-2 py-1 text-xs ${index % 3 === 0 ? "bg-white/10 text-white/80" : "bg-lapis-soft text-lapis-dark"}`}>{concept}</span>)}</div><span className="text-xl transition-transform group-hover:translate-x-1" aria-hidden="true">→</span></div>{hasPractice(lesson) && <span className="sr-only">Practice available</span>}</Link>)}</div></section>)}
      </section>
    </div>
  );
}
