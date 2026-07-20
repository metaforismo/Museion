import Link from "next/link";

import { HugeiconsIcon } from "@hugeicons/react";
import { Atom01Icon, CalculatorIcon, Dna01Icon, FunctionSquareIcon, SourceCodeIcon, TestTube01Icon } from "@hugeicons/core-free-icons";

import MaiaCharacter from "@/components/MaiaCharacter";
import MethodTraceDemo from "@/components/MethodTraceDemo";
import { coursePaths } from "@/lib/curriculum";
import { subjectColor } from "@/lib/curriculum/subjects";

const SUBJECT_BAND = [
  { name: "Mathematics", icon: FunctionSquareIcon, color: "var(--color-subject-algebra)" },
  { name: "Physics", icon: Atom01Icon, color: "var(--color-subject-physics)" },
  { name: "Biology", icon: Dna01Icon, color: "var(--color-subject-biology)" },
  { name: "Computer Science", icon: SourceCodeIcon, color: "var(--color-subject-cs)" },
  { name: "Arithmetic", icon: CalculatorIcon, color: "var(--color-subject-arithmetic)" },
  { name: "Research", icon: TestTube01Icon, color: "var(--color-subject-research)" },
] as const;

const METHOD_MOVES = [
  ["Ground", "Every claim starts from source material you can inspect — exact spans, pages, hashes."],
  ["Predict", "You commit to an answer before any explanation appears. No commitment, no reveal."],
  ["Interact", "You manipulate the idea — order steps, narrow ranges, trace state — not just read it."],
  ["Diagnose", "Deterministic code checks your move and matches it against known wrong paths."],
  ["Explain", "You put the why into your own words. Generation beats recognition."],
  ["Transfer", "One nearby problem, completely unassisted. Maia leaves the room."],
  ["Revisit", "Verified concepts return on an expanding schedule — 1, 3, 7, 14, then 30 days — computed from your real record."],
] as const;

const MAIA_NEVER = [
  "state the final answer, in any language or phrasing",
  "fill an input or choose an option for you",
  "overrule the deterministic checker",
  "stay in the room during the transfer check",
] as const;

const RESEARCH_BOUNDARIES = [
  ["Observed", "What happened in this session, including help used and checked responses."],
  ["Inferred", "How much scaffolding may be useful next. This remains an adaptive estimate."],
  ["Not claimed", "Durable mastery, far transfer, or a general learning gain from one run."],
] as const;

export default function HomePage() {
  return (
    <div>
      {/* ————— Hero ————— */}
      <section className="relative overflow-hidden border-b border-ink/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(43,74,203,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(43,74,203,.04)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]"
        />
        {/* Geometric accents — quiet shapes, never content */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-28 hidden h-64 w-64 rounded-full border-2 border-lapis/10 lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 top-44 hidden h-44 w-44 rotate-12 rounded-[2.2rem] border-2 border-gold/15 lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute left-[9%] top-[70%] hidden h-3 w-3 rounded-full bg-gold/40 lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute right-[11%] top-24 hidden h-2.5 w-2.5 rounded-full bg-lapis/30 lg:block" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface/80 px-3.5 py-1.5 text-xs font-medium text-ink-soft">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-lapis" />
              Built on tutoring research, honest about its limits
            </p>
            <h1 className="mt-8 font-display text-[2.7rem] font-semibold leading-[1.06] tracking-[-0.01em] sm:text-6xl lg:text-[4.2rem]">
              AI can solve the problem.
              <br />
              <span className="text-lapis">Museion helps you learn to solve it.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
              Unrestricted AI help makes practice feel easy and leaves less behind. Museion is a learning environment where the
              engine owns the truth, the source keeps it honest, and Maia — a tutor who never gives the answer — guides your
              reasoning until you don&apos;t need her.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/judge"
                className="rounded-xl bg-ink px-6 py-3.5 font-semibold text-white shadow-[var(--shadow-2)] transition duration-200 hover:-translate-y-0.5 hover:bg-lapis-dark"
              >
                Try a lesson — no account <span aria-hidden="true">→</span>
              </Link>
              <Link href="/create" className="rounded-xl px-5 py-3.5 font-semibold text-lapis transition hover:bg-lapis-soft">
                Build from your material
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-4xl lg:mt-16">
            <MethodTraceDemo />
            <p className="mt-3 text-center text-xs text-ink-soft">
              A real trace, not a mock-up — click the options; the demo responds like the deterministic engine.
            </p>
          </div>
        </div>
      </section>

      {/* ————— Subjects band ————— */}
      <section className="border-b border-ink/10 bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">One method, every subject with checkable reasoning</p>
          <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {SUBJECT_BAND.map((subject) => (
              <li key={subject.name} className="flex flex-col items-center gap-2 rounded-xl border border-ink/8 bg-paper/40 px-2 py-4 text-center transition hover:-translate-y-0.5 hover:border-ink/15">
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 place-items-center rounded-xl"
                  style={{ backgroundColor: `color-mix(in srgb, ${subject.color} 12%, transparent)`, color: subject.color }}
                >
                  <HugeiconsIcon icon={subject.icon} size={22} strokeWidth={1.8} />
                </span>
                <span className="text-[0.72rem] font-medium leading-tight text-ink">{subject.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ————— The problem ————— */}
      <section className="bg-ink text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8 lg:py-24">
          <div>
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-gold">Why Museion exists</p>
            <h2 className="mt-5 max-w-xl font-display text-3xl font-semibold leading-tight sm:text-[2.6rem]">
              The better the assistant, the easier it is to stop thinking.
            </h2>
            <p className="mt-5 max-w-[52ch] leading-7 text-white/70">
              In a randomized field study of ~1,000 high-school students, unrestricted GPT access improved practice performance —
              and lowered subsequent unassisted exam performance. A guardrailed tutor kept most of the practice benefit without
              the damage. Personal tutoring is one of the best-evidenced interventions in education; the question is what kind.
            </p>
            <p className="mt-4 max-w-[52ch] text-sm leading-6 text-white/50">
              Bastani et al. 2025. Their population and prompts are not ours — this motivates Museion&apos;s constraints; it does not
              prove a Museion effect. We keep that distinction everywhere.
            </p>
          </div>
          <ol className="divide-y divide-white/15 border-y border-white/15 self-center">
            {[
              ["The engine owns truth", "Correctness is decided by deterministic code against author-verified content. The model never grades."],
              ["The source keeps it grounded", "Courses compile from material with exact evidence spans and hashes — claims trace back or don't publish."],
              ["The learner owns the thinking", "Predict before reveal. Explain in your own words. Finish with one unassisted transfer task."],
            ].map(([title, body], index) => (
              <li key={title} className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr]">
                <span className="font-mono text-xs font-semibold text-gold">0{index + 1}</span>
                <div>
                  <h3 className="font-display text-xl font-semibold">{title}</h3>
                  <p className="mt-1.5 leading-7 text-white/65">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ————— The Museion Method ————— */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">The Museion Method</p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-[2.6rem]">
            Seven moves, visible in every lesson.
          </h2>
          <p className="mt-5 leading-7 text-ink-soft">
            Not a metaphor — the same seven words appear inside the product while you learn, so you always know which move
            you&apos;re making and why it exists.
          </p>
        </div>
        <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {METHOD_MOVES.map(([name, body], index) => (
            <li key={name} className="border-t-2 border-ink/10 pt-4 [&:nth-child(-n+3)]:lg:border-lapis/40">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-semibold tabular-nums text-lapis-dark">0{index + 1}</span>
                <h3 className="font-display text-xl font-semibold">{name}</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ————— Maia ————— */}
      <section className="overflow-hidden border-y border-lapis/20 bg-lapis text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-20 lg:px-8 lg:py-24">
          <div className="relative mx-auto min-h-72 w-full max-w-xs">
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/8 blur-2xl" />
            <MaiaCharacter
              state="curious"
              animated
              className="absolute left-1/2 top-1/2 h-64 w-56 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_20px_35px_rgba(10,20,70,.25)]"
              title="Maia, Museion's Socratic learning companion"
            />
            <span className="absolute -left-2 top-8 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs backdrop-blur-sm">asks before telling</span>
            <span className="absolute -right-2 bottom-8 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs backdrop-blur-sm">leaves before transfer</span>
          </div>
          <div>
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-white/80">Meet Maia</p>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-[2.6rem]">
              A guide inside the work, not a shortcut around it.
            </h2>
            <p className="mt-5 max-w-[58ch] leading-7 text-white/80">
              Named for maieutics — the Socratic practice of helping an idea be born. Maia sees your current activity, your last
              move, and the misconception the engine detected. She can highlight the exact term you&apos;re misreading and ask one
              smaller question. Every word she says passes a leak gate before you see it.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
                <h3 className="font-display text-lg font-semibold">She will</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-white/85">
                  <li>point at the source span or equation term that matters</li>
                  <li>ask the one question that exposes the wrong assumption</li>
                  <li>give you another attempt, and mean it</li>
                  <li>fade as your record shows you need her less</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/5 p-5">
                <h3 className="font-display text-lg font-semibold">She will never</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-white/85">
                  {MAIA_NEVER.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden="true" className="mt-0.5 text-gold">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Museion Originals ————— */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow">Museion Originals</p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-[2.6rem]">
              Authored courses are the core, not the demo.
            </h2>
            <p className="mt-5 leading-7 text-ink-soft">
              Learning paths across math, physics, biology, and computer science — each with documented prerequisites,
              sources, a misconception map, deterministic answer verification, and an honest evidence boundary. Built for
              a 5-year-old&apos;s first pattern and an adult&apos;s first proof alike.
            </p>
          </div>
          <Link href="/library" className="inline-flex min-h-11 items-center rounded-xl border border-ink/15 bg-surface px-5 font-semibold text-ink transition hover:border-lapis/40">
            Browse the library <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
        <div className="mt-10 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {coursePaths.map((course) => {
            const accent = subjectColor(course.subject);
            return (
              <Link key={course.id} href={`/courses/${course.id}`} className="group flex min-h-44 flex-col border-t-2 py-5 transition" style={{ borderTopColor: `color-mix(in srgb, ${accent} 30%, transparent)` }}>
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                  <span className="text-xs text-ink-soft">{course.subject}</span>
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold tracking-[-0.01em] transition group-hover:text-lapis-dark">{course.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-soft">{course.tagline}</p>
                <p className="mt-auto pt-4 text-xs text-ink-soft">
                  {course.lessonIds.length} lessons · {course.estimatedMinutes} min
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ————— Create from your sources ————— */}
      <section className="border-y border-ink/10 bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20 lg:px-8 lg:py-24">
          <div>
            <p className="eyebrow">Bring your own material</p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-[2.6rem]">
              From a Source Pack to a course that cites itself.
            </h2>
            <p className="mt-5 max-w-[54ch] leading-7 text-ink-soft">
              Add notes, excerpts, transcripts, PDFs — material you have the right to use. The Course Architect first judges
              whether it can support a course at all, then designs predictions, activities and one transfer task around it.
              Claims that can&apos;t cite the source don&apos;t publish.
            </p>
            <p className="mt-4 text-sm leading-6 text-ink-soft">
              A link is provenance, not content: Museion never scrapes paid books, protected videos, or private captions.
            </p>
            <Link href="/create" className="mt-7 inline-flex min-h-11 items-center border-b-2 border-ink font-semibold hover:border-lapis hover:text-lapis-dark">
              Open Source Studio <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </div>
          <ol className="grid gap-0 text-sm">
            {[
              ["Source Pack", "Materials are normalized, hashed, and rights-checked. Raw text never leaves your review."],
              ["Feasibility", "The Architect says whether the material is enough — and refuses politely when it isn't."],
              ["Design", "Concepts, misconceptions to probe, activities, and a locked transfer task are planned against the source."],
              ["Validation", "Deterministic gates audit grounding, answer privacy, and runtime compatibility."],
              ["Review & publish", "You inspect every citation and coverage gap before any learner sees it."],
            ].map(([title, body], index, list) => (
              <li key={title} className="relative grid grid-cols-[2.2rem_1fr] gap-4 pb-7 last:pb-0">
                {index < list.length - 1 && <span aria-hidden="true" className="absolute left-[0.93rem] top-8 h-[calc(100%-1.7rem)] w-px bg-ink/12" />}
                <span className="grid h-8 w-8 place-items-center rounded-full border border-lapis/30 bg-lapis-soft font-mono text-[0.68rem] font-semibold text-lapis-dark">
                  {index + 1}
                </span>
                <div className="pt-1">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 leading-6 text-ink-soft">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ————— Evidence discipline ————— */}
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-24 lg:px-8 lg:py-28">
        <div>
          <p className="eyebrow">Evidence discipline</p>
          <h2 className="mt-4 max-w-lg font-display text-3xl font-semibold leading-tight sm:text-[2.6rem]">
            We show what is known — and what is not.
          </h2>
          <p className="mt-5 max-w-[58ch] leading-7 text-ink-soft">
            No XP theatre, no streaks engineered for urgency, no readiness scores invented before checked work exists. The
            record distinguishes three things, always:
          </p>
        </div>
        <dl className="divide-y divide-ink/10 border-y border-ink/10 self-center">
          {RESEARCH_BOUNDARIES.map(([term, description], index) => (
            <div key={term} className="grid gap-3 py-6 sm:grid-cols-[10.5rem_1fr] sm:items-start">
              <dt className="flex gap-5 font-display text-lg font-semibold">
                <span className="font-mono text-xs text-lapis-dark">0{index + 1}</span>
                {term}
              </dt>
              <dd className="text-sm leading-6 text-ink-soft">{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ————— Comparison ————— */}
      <section className="border-t border-ink/10 bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20 lg:px-8 lg:py-24">
          <div>
            <p className="eyebrow">Different by construction</p>
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-[2.4rem]">Not another chat window.</h2>
            <p className="mt-4 max-w-[44ch] leading-7 text-ink-soft">
              The difference isn&apos;t a system prompt asking the model to be Socratic. It&apos;s architecture: what the model is
              structurally unable to do.
            </p>
          </div>
          <div tabIndex={0} aria-label="Comparison between a generic tutor and Museion" className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis">
            <div className="min-w-[34rem] overflow-hidden rounded-2xl border border-ink/10 bg-paper/40">
              <div className="grid grid-cols-[0.8fr_1.1fr_1.1fr] border-b border-ink/10 bg-paper px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-soft sm:px-6">
                <span>Moment</span>
                <span>Generic tutor</span>
                <span>Museion</span>
              </div>
              {[
                ["Source", "May answer from anywhere", "Resolves exact spans and hashes"],
                ["Question", "Explains on request", "Requires a learner move first"],
                ["Correctness", "Model judges itself", "Typed verifier owns the result"],
                ["Answer privacy", "One jailbreak away", "Leak-gated; answers never sent to the client"],
                ["Outcome", "Reports completion", "Records a bounded observation"],
              ].map(([moment, generic, museion]) => (
                <div key={moment} className="grid grid-cols-[0.8fr_1.1fr_1.1fr] gap-3 border-b border-ink/10 px-4 py-4 text-sm last:border-b-0 sm:px-6">
                  <p className="font-semibold">{moment}</p>
                  <p className="leading-6 text-ink-soft">{generic}</p>
                  <p className="leading-6 text-ink">{museion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ————— Final CTA ————— */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-white sm:px-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12 lg:px-14 lg:py-14">
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="relative">
            <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-gold">Two minutes, no account</p>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-[2.6rem]">
              Keep the thinking. Use the AI.
            </h2>
            <p className="mt-4 max-w-[56ch] leading-7 text-white/65">
              The complete sample lesson — source, prediction, diagnosis, Maia, and a locked transfer check — runs without an
              account or API key.
            </p>
          </div>
          <Link
            href="/judge"
            className="relative mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 font-semibold text-ink transition hover:-translate-y-0.5 lg:mt-0"
          >
            Start the sample lesson <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
