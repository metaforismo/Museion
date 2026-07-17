import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCompilerRun } from "@/lib/compiler";
import { COURSE_TEMPLATES } from "@/lib/compiler/templates";
import { readLearnerId } from "@/lib/server/learner";

export const metadata: Metadata = { title: "Review compilation run" };

const SUPPORTED_LEARNER_BLOCKS = new Set([
  "explanation",
  "prediction-choice",
  "sequence-builder",
  "range-explorer",
  "state-trace",
]);

export default async function CompilationRunReview({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const ownerId = await readLearnerId();
  if (!ownerId) notFound();

  let run;
  try {
    run = await getCompilerRun((await params).runId, ownerId);
  } catch {
    notFound();
  }

  const lesson = run.artifact.lessons[0];
  const lessonBlocks = lesson
    ? lesson.blockIds.map((id) => run.artifact.blocks[id]).filter(Boolean)
    : [];
  const transferBlocks = run.artifact.transferBlockIds
    .map((id) => run.artifact.blocks[id])
    .filter(Boolean);
  const learnerCompatible =
    run.artifact.lessons.length === 1
    && lessonBlocks.length === lesson?.blockIds.length
    && lessonBlocks.every((block) => SUPPORTED_LEARNER_BLOCKS.has(block.kind));
  const template = COURSE_TEMPLATES[run.templateId];
  const totalMinutes = Math.max(
    1,
    Math.ceil(lessonBlocks.reduce((total, block) => total + block.estimatedSeconds, 0) / 60),
  );
  const accepted = run.validation.status === "accepted" && run.validation.blockingIssueCount === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <Link
        href="/create"
        className="mb-7 inline-flex min-h-11 items-center text-sm font-semibold text-lapis underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
      >
        Back to Creator Studio
      </Link>
      <header className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="eyebrow">Creator review · {run.mode}</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold tracking-[-0.04em]">
            {run.artifact.title}
          </h1>
          <p className="mt-4 max-w-[62ch] text-lg leading-8 text-ink-soft">
            {run.artifact.bigQuestion}
          </p>
        </div>
        <div className={`rounded-xl border px-5 py-4 text-sm ${accepted ? "border-correct/20 bg-correct-soft text-correct" : "border-wrong/20 bg-wrong-soft text-wrong"}`}>
          <p className="font-semibold">{accepted ? "Accepted for learning" : "Launch blocked"}</p>
          <p className="mt-1">
            {run.validation.blockingIssueCount} blocking issue{run.validation.blockingIssueCount === 1 ? "" : "s"}
            {" · "}
            {run.validation.warningCount} warning{run.validation.warningCount === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      <nav
        aria-label="Review sections"
        className="sticky top-16 z-20 -mx-4 mt-8 flex gap-1 overflow-x-auto border-y border-ink/10 bg-paper/95 px-4 py-3 text-sm font-semibold backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-3"
      >
        {[
          ["Overview", "#overview"],
          ["Learning sequence", "#sequence"],
          ["Citations", "#citations"],
          ["Validation", "#validation"],
          ["Provenance", "#provenance"],
        ].map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="shrink-0 rounded-lg px-3 py-2 text-ink-soft transition hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
          >
            {label}
          </a>
        ))}
      </nav>

      <section id="overview" className="mt-7 grid scroll-mt-32 gap-4 md:grid-cols-[1.15fr_.85fr]">
        <div className="premium-surface rounded-[1.6rem] p-6 sm:p-8">
          <p className="eyebrow">Course design</p>
          <h2 className="mt-3 font-display text-3xl font-semibold">{template.name}</h2>
          <p className="mt-3 max-w-[58ch] leading-7 text-ink-soft">{template.description}</p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-ink-soft">Level</dt>
              <dd className="mt-1 font-semibold capitalize">{run.audience.level}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Language</dt>
              <dd className="mt-1 font-semibold">{run.audience.language}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Designed time</dt>
              <dd className="mt-1 font-semibold">{run.audience.targetMinutes} min</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Authored estimate</dt>
              <dd className="mt-1 font-semibold">{totalMinutes} min</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-[1.6rem] bg-ink p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Grounding record</p>
          <p className="mt-5 font-display text-4xl font-semibold">{run.sourceGraph.concepts.length}</p>
          <p className="text-sm text-white/60">source-backed concepts</p>
          <p className="mt-5 font-display text-4xl font-semibold">{Object.keys(run.sourceGraph.spans).length}</p>
          <p className="text-sm text-white/60">exact verified quotations</p>
        </div>
      </section>

      <section id="sequence" className="premium-surface mt-6 scroll-mt-32 rounded-[1.6rem] p-6 sm:p-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Learning sequence</p>
          <h2 className="mt-3 font-display text-3xl font-semibold">What the learner will do</h2>
          <p className="mt-3 leading-7 text-ink-soft">
            Blocks appear in the exact authored order. Generated pedagogy is visible;
            correct answers and evaluator truth stay server-side.
          </p>
        </div>
        <ol className="mt-7 divide-y divide-ink/10">
          {lessonBlocks.map((block, index) => (
            <li key={block.id} className="grid gap-3 py-5 sm:grid-cols-[3rem_minmax(0,1fr)_auto]">
              <span className="font-mono text-sm font-semibold text-lapis">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-semibold">{block.accessibilityLabel}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {block.kind.replaceAll("-", " ")} · {Math.ceil(block.estimatedSeconds / 60)} min
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-md bg-lapis-soft px-2 py-1 text-lapis-dark">
                    Generated pedagogy
                  </span>
                  {block.citations.length > 0 && (
                    <span className="rounded-md bg-gold-soft px-2 py-1 text-ink">
                      Source-grounded
                    </span>
                  )}
                </div>
                {block.citations.length > 0 && (
                  <details className="mt-4 rounded-xl border border-ink/10 bg-paper px-4 py-3">
                    <summary className="cursor-pointer text-sm font-semibold text-lapis-dark">
                      Inspect linked source evidence
                    </summary>
                    <ul className="mt-4 space-y-4">
                      {block.citations.map((citation) => {
                        const span = run.sourceGraph.spans[citation.spanId];
                        if (!span) return null;
                        return (
                          <li key={`${block.id}-${citation.spanId}`} className="border-l-2 border-gold pl-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
                              {citation.purpose} · page {span.pageNumber}
                            </p>
                            <blockquote className="mt-2 text-sm leading-6">“{span.exactText}”</blockquote>
                            <a href={`#citation-${citation.spanId}`} className="mt-2 inline-block text-xs font-semibold text-lapis underline-offset-4 hover:underline">
                              Open in citation record
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                )}
              </div>
              <span className="self-start rounded-md bg-lapis-soft px-2 py-1 text-xs font-semibold text-lapis-dark">
                {block.citations.length} citation{block.citations.length === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ol>

        {transferBlocks.length > 0 && (
          <aside className="mt-7 border-l-2 border-gold pl-5" aria-labelledby="transfer-review-title">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">Locked transfer</p>
            <h3 id="transfer-review-title" className="mt-2 font-display text-xl font-semibold">
              Unassisted observation after the lesson
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
              Transfer remains separate from Maia, hints, and solutions. It opens only
              after the guided sequence is complete.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {transferBlocks.map((block) => (
                <li key={block.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-gold-soft/60 px-4 py-3">
                  <span className="font-semibold">{block.accessibilityLabel}</span>
                  <span className="text-ink-soft">{block.kind.replaceAll("-", " ")}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </section>

      <section id="citations" className="mt-6 scroll-mt-32 rounded-[1.6rem] border border-ink/10 bg-surface/65 p-6 sm:p-8">
        <p className="eyebrow">Exact evidence</p>
        <h2 className="mt-3 font-display text-3xl font-semibold">Source quotations</h2>
        <p className="mt-3 max-w-2xl leading-7 text-ink-soft">
          Every quotation preserves its page and normalized character offsets for deterministic verification.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Object.entries(run.sourceGraph.spans).map(([id, span]) => (
            <figure id={`citation-${id}`} key={id} className="scroll-mt-32 rounded-xl border border-ink/10 bg-paper p-5">
              <blockquote className="leading-7">“{span.exactText}”</blockquote>
              <figcaption className="mt-4 flex flex-wrap justify-between gap-2 font-mono text-xs text-ink-soft">
                <span>{id}</span>
                <span>page {span.pageNumber} · {span.start}–{span.end}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="validation" className="mt-6 scroll-mt-32 rounded-[1.6rem] border border-ink/10 bg-surface/65 p-6 sm:p-8">
        <p className="eyebrow">Publication gate</p>
        <h2 className="mt-3 font-display text-3xl font-semibold">Deterministic validation</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-paper p-4">
            <p className="text-sm text-ink-soft">Status</p>
            <p className={`mt-1 font-semibold capitalize ${accepted ? "text-correct" : "text-wrong"}`}>{run.validation.status.replace("-", " ")}</p>
          </div>
          <div className="rounded-xl bg-paper p-4">
            <p className="text-sm text-ink-soft">Blocking issues</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{run.validation.blockingIssueCount}</p>
          </div>
          <div className="rounded-xl bg-paper p-4">
            <p className="text-sm text-ink-soft">Warnings</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{run.validation.warningCount}</p>
          </div>
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-6 text-ink-soft">
          {run.validation.validatorVersion} checked references, source spans, answer privacy,
          activity structure and publication safety. Private answer truth is excluded from
          this page and remains server-side.
        </p>
      </section>

      <section id="provenance" className="mt-6 scroll-mt-32 rounded-[1.6rem] border border-ink/10 bg-paper p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Provenance</p>
            <h2 className="mt-3 font-display text-3xl font-semibold">Model and runtime trace</h2>
          </div>
          <p className="font-mono text-xs text-ink-soft">
            {run.mode} · {run.repaired ? "bounded repair used" : "no repair needed"}
          </p>
        </div>
        <div className="mt-6 grid gap-3 rounded-xl border border-ink/10 bg-surface p-4 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
          <span className="font-semibold">Learning source</span>
          <div className="min-w-0">
            <p>{run.document.title} · {run.document.pages} canonical page{run.document.pages === 1 ? "" : "s"}</p>
            {run.document.sourceReference ? (
              <p className="mt-1 break-words text-ink-soft">
                {run.document.sourceReference.kind.replaceAll("_", " ")} reference ·{" "}
                <a href={run.document.sourceReference.url} target="_blank" rel="noreferrer" className="font-medium text-lapis-dark underline underline-offset-4">
                  Open original reference
                </a>
              </p>
            ) : (
              <p className="mt-1 text-ink-soft">Direct text or file import; no external link was attached.</p>
            )}
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink/15 text-ink-soft">
                <th className="pb-3 pr-5 font-medium">Stage</th>
                <th className="pb-3 pr-5 font-medium">Provider</th>
                <th className="pb-3 pr-5 font-medium">Requested</th>
                <th className="pb-3 pr-5 font-medium">Resolved</th>
                <th className="pb-3 text-right font-medium">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 font-mono text-xs">
              {run.telemetry.map((item) => (
                <tr key={`${item.stage}-${item.outputSha256}`}>
                  <td className="py-3 pr-5 font-semibold text-ink">{item.stage.replaceAll("_", " ")}</td>
                  <td className="py-3 pr-5 text-ink-soft">{item.provider}</td>
                  <td className="py-3 pr-5 text-ink-soft">{item.requestedModel}</td>
                  <td className="py-3 pr-5">
                    {item.resolvedModel}
                    {item.requestedModel !== item.resolvedModel && (
                      <span className="ml-2 rounded bg-gold-soft px-1.5 py-0.5 font-sans text-[0.68rem] font-semibold text-ink">
                        substituted
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right tabular-nums text-ink-soft">{(item.durationMs / 1_000).toFixed(2)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 border-t border-ink/10 pt-5">
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Created {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(run.createdAt))}.
            Hashes for every stage output are retained in the run record.
          </p>
        </div>
      </section>

      {learnerCompatible && accepted ? (
        <Link
          href={`/learn/${run.runId}`}
          className="mt-7 block min-h-14 rounded-xl bg-lapis px-6 py-4 text-center text-lg font-semibold text-white transition hover:bg-lapis-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
        >
          Launch generated learner experience
        </Link>
      ) : (
        <p role="alert" className="mt-7 rounded-xl bg-wrong-soft p-5 text-wrong">
          {accepted
            ? "Learner launch is blocked because this artifact contains a lesson block that this renderer does not support yet."
            : "Learner launch is blocked because deterministic publication validation did not accept this artifact."}
        </p>
      )}
    </div>
  );
}
