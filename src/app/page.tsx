import Link from "next/link";

import LandingCoursePreview from "@/components/LandingCoursePreview";
import ScientificMethodDiagram from "@/components/ScientificMethodDiagram";

const PRODUCT_RULES = [
  ["Source before synthesis", "Every factual block points back to exact evidence."],
  ["Reasoning before reveal", "Activities require a move before an explanation appears."],
  ["Code before confidence", "Models can teach; deterministic systems decide what is correct."],
] as const;

const RESEARCH_BOUNDARIES = [
  ["Observed", "What happened in this session, including help used and checked responses."],
  ["Inferred", "How much scaffolding may be useful next. This remains an adaptive estimate."],
  ["Not claimed", "Durable mastery, far transfer, or a general learning gain from one run."],
] as const;

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink/10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(43,74,203,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(43,74,203,.045)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(34rem,1.18fr)] lg:items-center lg:px-8 lg:pb-28 lg:pt-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface/80 px-3 py-1.5 text-xs font-medium text-ink-soft shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-correct" />
              Research-led learning, observable by design
            </div>
            <h1 className="mt-7 font-display text-5xl font-semibold leading-[1.03] tracking-[-0.045em] sm:text-6xl">
              Turn material you trust into a course that makes you think.
            </h1>
            <p className="mt-6 max-w-[56ch] text-lg leading-8 text-ink-soft">
              Museion turns a source into a sequence of predictions, checked responses, bounded guidance, and one honest transfer observation.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/create" className="rounded-xl bg-ink px-6 py-3.5 font-semibold text-white shadow-[0_12px_34px_rgba(19,28,49,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-lapis-dark">
                Create a course <span aria-hidden="true">→</span>
              </Link>
              <Link href="/judge" className="rounded-xl px-5 py-3.5 font-semibold text-lapis transition hover:bg-lapis-soft">Try an interactive lesson</Link>
            </div>
            <dl className="mt-10 grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-3">
              {[
                ["Grounding", "Source evidence attached"],
                ["Correctness", "Answers checked by rules"],
                ["Evidence", "Independent final check"],
              ].map(([term, detail]) => (
                <div key={term}>
                  <dt className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.09em] text-lapis-dark">{term}</dt>
                  <dd className="mt-1 text-xs font-medium text-ink-soft">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
          <LandingCoursePreview />
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:gap-24 lg:px-8 lg:py-20">
          <div>
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-gold">The product contract</p>
            <h2 className="mt-5 max-w-xl font-display text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">The model is useful. It is not the authority.</h2>
            <p className="mt-5 max-w-[48ch] leading-7 text-white/65">Museion separates pedagogical generation from source integrity, answer checking, and evidence claims.</p>
          </div>
          <ol className="divide-y divide-white/15 border-y border-white/15">
            {PRODUCT_RULES.map(([title, body], index) => (
              <li key={title} className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr]">
                <span className="font-mono text-xs font-semibold text-gold">0{index + 1}</span>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-1 leading-7 text-white/65">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.68fr_1.32fr] lg:items-center lg:gap-20 lg:px-8 lg:py-28">
        <div>
          <p className="eyebrow">The method</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-0.035em]">Learning as a testable process.</h2>
          <p className="mt-5 leading-7 text-ink-soft">
            Museion does not optimize for finishing content. It creates observable learning moves, records the assistance used, and keeps claims narrower than the evidence.
          </p>
          <Link href="/about" className="mt-7 inline-flex min-h-11 items-center border-b border-ink text-sm font-semibold hover:text-lapis-dark">
            Read the research rationale <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
        <ScientificMethodDiagram />
      </section>

      <section className="border-y border-ink/10 bg-surface">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-24 lg:px-8 lg:py-24">
          <div>
            <p className="eyebrow">Evidence discipline</p>
            <h2 className="mt-4 max-w-lg font-display text-4xl font-semibold leading-tight tracking-[-0.035em]">A dashboard should show what is known—and what is not.</h2>
            <p className="mt-5 max-w-[58ch] leading-7 text-ink-soft">No XP theatre. No streak designed to manufacture urgency. The learner sees recorded activity, the next useful test, and the boundary around every inference.</p>
          </div>
          <dl className="divide-y divide-ink/10 border-y border-ink/10">
            {RESEARCH_BOUNDARIES.map(([term, description], index) => (
              <div key={term} className="grid gap-3 py-6 sm:grid-cols-[10.5rem_1fr] sm:items-start">
                <dt className="flex gap-5 font-semibold"><span className="font-mono text-xs text-lapis-dark">0{index + 1}</span>{term}</dt>
                <dd className="text-sm leading-6 text-ink-soft">{description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="eyebrow">Different by construction</p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em]">Not another chat window.</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-surface">
            <div className="grid grid-cols-[0.8fr_1.1fr_1.1fr] border-b border-ink/10 bg-paper px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-soft sm:px-6">
              <span>Moment</span><span>Generic tutor</span><span>Museion</span>
            </div>
            {[
              ["Source", "May answer from context", "Resolves exact spans and hashes"],
              ["Question", "Explains on request", "Requires a learner move first"],
              ["Correctness", "Model judges itself", "Typed verifier owns the result"],
              ["Outcome", "Reports completion", "Records a bounded observation"],
            ].map(([moment, generic, museion]) => (
              <div key={moment} className="grid grid-cols-[0.8fr_1.1fr_1.1fr] gap-3 border-b border-ink/10 px-4 py-5 text-sm last:border-b-0 sm:px-6">
                <p className="font-semibold">{moment}</p>
                <p className="leading-6 text-ink-soft">{generic}</p>
                <p className="leading-6 text-ink">{museion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-surface">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8 lg:py-20">
          <div><p className="eyebrow">Start with the foundations</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em]">Learn the method before bringing your own material.</h2><p className="mt-3 max-w-2xl leading-7 text-ink-soft">The Museion library contains short, authored lessons whose answers are checked by deterministic lesson rules.</p></div>
          <Link href="/library" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-ink/15 bg-white px-6 font-semibold text-ink hover:border-lapis/40">Browse the library <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-white sm:px-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12 lg:px-14 lg:py-14">
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="relative">
            <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-gold">Start with evidence</p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-[-0.035em]">Bring one source. Leave with a learning experiment.</h2>
            <p className="mt-4 max-w-[56ch] leading-7 text-white/65">The complete sample works without an account or API key.</p>
          </div>
          <Link href="/create" className="relative mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 font-semibold text-ink transition hover:-translate-y-0.5 lg:mt-0">Open the source lab <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
      </section>
    </div>
  );
}
