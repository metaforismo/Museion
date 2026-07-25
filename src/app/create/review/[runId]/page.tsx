import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCompilerRun } from "@/lib/compiler";
import { COURSE_TEMPLATES } from "@/lib/compiler/templates";
import { currentActor } from "@/lib/server/actor";

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
  const actor = await currentActor();
  if (actor.kind !== "account") notFound();
  const ownerId = actor.ownerId;

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
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href="/create"
        className="mb-6 inline-flex min-h-11 items-center text-body-sm font-semibold text-lapis-dark underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
      >
        Back to Creator Studio
      </Link>
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="eyebrow">Creator review · {run.mode}</p>
          <h1 className="mt-3 max-w-4xl title-page">
            {run.artifact.title}
          </h1>
          <p className="mt-3 max-w-[62ch] text-lead leading-7 text-ink-soft">
            {run.artifact.bigQuestion}
          </p>
        </div>
        <div className={`rounded-xl border px-5 py-4 text-body-sm ${accepted ? "border-correct/20 bg-correct-soft text-correct" : "border-wrong/20 bg-wrong-soft text-wrong"}`}>
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
        className="sticky top-16 z-20 -mx-4 mt-7 flex gap-1 overflow-x-auto border-y border-ink/10 bg-paper/95 px-4 py-3 text-body-sm font-semibold backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-3"
      >
        {[
          ["Overview", "#overview"],
          ["Source Pack", "#source-pack"],
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
        <div className="surface-card p-6 sm:p-8">
          <p className="eyebrow">Course design</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-title">{template.name}</h2>
          <p className="mt-2 max-w-[58ch] text-body leading-6 text-ink-soft">{template.description}</p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-body-sm sm:grid-cols-4">
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
        <section className="rounded-[var(--radius-card)] bg-ink p-6 text-white sm:p-8" aria-labelledby="grounding-record-title">
          <h2 id="grounding-record-title" className="text-label font-semibold uppercase tracking-[0.08em] text-gold">Grounding record</h2>
          <p className="mt-5 text-4xl font-semibold tabular-nums">{run.sourceGraph.concepts.length}</p>
          <p className="text-body-sm text-white/65">source-backed concepts</p>
          <p className="mt-5 text-4xl font-semibold tabular-nums">{Object.keys(run.sourceGraph.spans).length}</p>
          <p className="text-body-sm text-white/65">exact verified quotations</p>
        </section>
      </section>

      <section id="source-pack" className="mt-6 scroll-mt-32 rounded-[var(--radius-card)] border border-ink/10 bg-surface/65 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Source Pack ledger</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-title">Coverage by supplied material</h2>
          </div>
          {run.sourcePack && <p className="font-mono text-label text-ink-soft">pack {run.sourcePack.packSha256.slice(0, 12)}…</p>}
        </div>
        {!run.sourcePack || !run.materialCoverage ? (
          <p className="mt-5 rounded-xl bg-paper p-5 text-body-sm leading-6 text-ink-soft">This older run predates persisted Source Pack manifests. Its document and exact citations remain available below.</p>
        ) : (
          <>
            <div className="mt-5 grid gap-3 rounded-xl border border-ink/10 bg-paper p-4 text-body-sm sm:grid-cols-3">
              <div><p className="text-ink-soft">Materials</p><p className="mt-1 font-semibold">{run.sourcePack.materials.length}</p></div>
              <div><p className="text-ink-soft">Rights basis</p><p className="mt-1 font-semibold capitalize">{run.sourcePack.rights.basis.replaceAll("-", " ")}</p></div>
              <div><p className="text-ink-soft">Unmapped spans</p><p className={`mt-1 font-semibold ${run.materialCoverage.unmappedSpanCount === 0 ? "text-correct" : "text-wrong"}`}>{run.materialCoverage.unmappedSpanCount}</p></div>
            </div>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {run.sourcePack.materials.map((material) => {
                const coverage = run.materialCoverage?.materials.find((item) => item.materialId === material.id);
                return <li key={material.id} className="rounded-xl border border-ink/10 bg-paper p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-semibold">{material.title}</p><p className="mt-1 text-label capitalize text-ink-soft">{material.role.replaceAll("-", " ")} · compiled pages {material.compiledPageStart}–{material.compiledPageEnd}</p></div>
                    <span className={`rounded-full px-2.5 py-1 text-micro font-medium ${coverage?.status === "cited" ? "bg-correct-soft text-correct" : "bg-gold-soft text-ink"}`}>{coverage?.status.replaceAll("-", " ") ?? "not measured"}</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-3 text-body-sm">
                    <div><dt className="text-ink-soft">Cited spans</dt><dd className="mt-1 font-semibold">{coverage ? `${coverage.citedSpanCount}/${coverage.spanCount}` : "—"}</dd></div>
                    <div><dt className="text-ink-soft">Learning blocks</dt><dd className="mt-1 font-semibold">{coverage?.citedBlockCount ?? 0}</dd></div>
                    <div><dt className="text-ink-soft">Coverage</dt><dd className="mt-1 font-semibold">{coverage?.coveragePercent ?? 0}%</dd></div>
                  </dl>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink/10" aria-label={`${material.title} citation coverage`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={coverage?.coveragePercent ?? 0}><div className="h-full rounded-full bg-lapis" style={{ width: `${coverage?.coveragePercent ?? 0}%` }} /></div>
                  {material.reference && <a href={material.reference.url} target="_blank" rel="noreferrer" className="mt-4 inline-block break-all text-label font-semibold text-lapis-dark underline underline-offset-4">Open {material.reference.kind.replaceAll("_", " ")} reference</a>}
                  <p className="mt-3 break-all font-mono text-label text-ink-soft">material {material.documentSha256}</p>
                </li>;
              })}
            </ul>
          </>
        )}
      </section>

      <section id="sequence" className="surface-card mt-6 scroll-mt-32 p-6 sm:p-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Learning sequence</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-title">What the learner will do</h2>
          <p className="mt-2 text-body leading-6 text-ink-soft">
            Blocks appear in the exact authored order. Generated pedagogy is visible;
            correct answers and evaluator truth stay server-side.
          </p>
        </div>
        <ol className="mt-7 divide-y divide-ink/10">
          {lessonBlocks.map((block, index) => (
            <li key={block.id} className="grid gap-3 py-5 sm:grid-cols-[3rem_minmax(0,1fr)_auto]">
              <span className="font-mono text-body-sm font-semibold tabular-nums text-lapis-dark">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-body font-semibold">{block.accessibilityLabel}</p>
                <p className="mt-1 text-body-sm text-ink-soft">
                  {block.kind.replaceAll("-", " ")} · {Math.ceil(block.estimatedSeconds / 60)} min
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-label font-semibold">
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
                    <summary className="cursor-pointer text-body-sm font-semibold text-lapis-dark">
                      Inspect linked source evidence
                    </summary>
                    <ul className="mt-4 space-y-4">
                      {block.citations.map((citation) => {
                        const span = run.sourceGraph.spans[citation.spanId];
                        if (!span) return null;
                        return (
                          <li key={`${block.id}-${citation.spanId}`} className="border-l-2 border-gold pl-4">
                            <p className="text-label font-semibold uppercase tracking-[0.08em] text-ink-soft">
                              {citation.purpose} · page {span.pageNumber}
                            </p>
                            <blockquote className="mt-2 text-body-sm leading-6">“{span.exactText}”</blockquote>
                            <a href={`#citation-${citation.spanId}`} className="mt-2 inline-block text-label font-semibold text-lapis-dark underline-offset-4 hover:underline">
                              Open in citation record
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                )}
              </div>
              <span className="self-start rounded-full bg-lapis-soft px-2.5 py-1 text-micro font-medium text-lapis-dark">
                {block.citations.length} citation{block.citations.length === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ol>

        {transferBlocks.length > 0 && (
          <aside className="mt-7 border-l-2 border-gold pl-5" aria-labelledby="transfer-review-title">
            <p className="text-label font-semibold uppercase tracking-[0.08em] text-ink-soft">Locked transfer</p>
            <h3 id="transfer-review-title" className="mt-2 text-xl font-semibold tracking-title">
              Unassisted observation after the lesson
            </h3>
            <p className="mt-2 max-w-2xl text-body-sm leading-6 text-ink-soft">
              Transfer remains separate from Maia, hints, and solutions. It opens only
              after the guided sequence is complete.
            </p>
            <ul className="mt-4 space-y-2 text-body-sm">
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

      <section id="citations" className="mt-6 scroll-mt-32 rounded-[var(--radius-card)] border border-ink/10 bg-surface/65 p-6 sm:p-8">
        <p className="eyebrow">Exact evidence</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-title">Source quotations</h2>
        <p className="mt-2 max-w-2xl text-body leading-6 text-ink-soft">
          Every quotation preserves its page and normalized character offsets for deterministic verification.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Object.entries(run.sourceGraph.spans).map(([id, span]) => (
            <figure id={`citation-${id}`} key={id} className="scroll-mt-32 rounded-xl border border-ink/10 bg-paper p-5">
              <blockquote className="text-body leading-6">“{span.exactText}”</blockquote>
              <figcaption className="mt-4 flex flex-wrap justify-between gap-2 font-mono text-label text-ink-soft">
                <span>{id}</span>
                <span>page {span.pageNumber} · {span.start}–{span.end}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="validation" className="mt-6 scroll-mt-32 rounded-[var(--radius-card)] border border-ink/10 bg-surface/65 p-6 sm:p-8">
        <p className="eyebrow">Publication gate</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-title">Deterministic validation</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-paper p-4">
            <p className="text-label text-ink-soft">Status</p>
            <p className={`mt-1 text-body font-semibold capitalize ${accepted ? "text-correct" : "text-wrong"}`}>{run.validation.status.replace("-", " ")}</p>
          </div>
          <div className="rounded-xl bg-paper p-4">
            <p className="text-label text-ink-soft">Blocking issues</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{run.validation.blockingIssueCount}</p>
          </div>
          <div className="rounded-xl bg-paper p-4">
            <p className="text-label text-ink-soft">Warnings</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{run.validation.warningCount}</p>
          </div>
        </div>
        <p className="mt-5 max-w-3xl text-body-sm leading-6 text-ink-soft">
          {run.validation.validatorVersion} checked references, source spans, answer privacy,
          activity structure and publication safety. Private answer truth is excluded from
          this page and remains server-side.
        </p>
      </section>

      <section id="provenance" className="mt-6 scroll-mt-32 rounded-[var(--radius-card)] border border-ink/10 bg-paper p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Provenance</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-title">Model and runtime trace</h2>
          </div>
          <p className="font-mono text-label text-ink-soft">
            {run.mode} · {run.repaired ? "bounded repair used" : "no repair needed"}
          </p>
        </div>
        <div className="mt-6 grid gap-3 rounded-xl border border-ink/10 bg-surface p-4 text-body-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
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
          <table className="w-full min-w-[42rem] border-collapse text-left text-body-sm">
            <thead>
              <tr className="border-b border-ink/15 text-ink-soft">
                <th className="pb-3 pr-5 font-medium">Stage</th>
                <th className="pb-3 pr-5 font-medium">Provider</th>
                <th className="pb-3 pr-5 font-medium">Requested</th>
                <th className="pb-3 pr-5 font-medium">Resolved</th>
                <th className="pb-3 text-right font-medium">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 font-mono text-label">
              {run.telemetry.map((item) => (
                <tr key={`${item.stage}-${item.outputSha256}`}>
                  <td className="py-3 pr-5 font-semibold text-ink">{item.stage.replaceAll("_", " ")}</td>
                  <td className="py-3 pr-5 text-ink-soft">{item.provider}</td>
                  <td className="py-3 pr-5 text-ink-soft">{item.requestedModel}</td>
                  <td className="py-3 pr-5">
                    {item.resolvedModel}
                    {item.requestedModel !== item.resolvedModel && (
                      <span className="ml-2 rounded bg-gold-soft px-1.5 py-0.5 font-sans text-label font-semibold text-ink">
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
          <p className="mt-2 text-body-sm leading-6 text-ink-soft">
            Created {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(run.createdAt))}.
            Hashes for every stage output are retained in the run record.
          </p>
        </div>
      </section>

      {learnerCompatible && accepted ? (
        <Link
          href={`/learn/${run.runId}`}
          className="mt-7 flex min-h-14 items-center justify-center rounded-xl bg-lapis px-6 text-center text-lg font-semibold text-white shadow-[var(--shadow-1)] transition hover:bg-lapis-dark hover:shadow-[var(--shadow-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
        >
          Launch generated learner experience
        </Link>
      ) : (
        <p role="alert" className="mt-7 rounded-xl bg-wrong-soft p-5 text-body-sm leading-6 text-wrong">
          {accepted
            ? "Learner launch is blocked because this artifact contains a lesson block that this renderer does not support yet."
            : "Learner launch is blocked because deterministic publication validation did not accept this artifact."}
        </p>
      )}
    </div>
  );
}
