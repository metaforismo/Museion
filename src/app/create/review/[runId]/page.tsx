import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getCompilerRun } from "@/lib/compiler";
import { COURSE_TEMPLATES } from "@/lib/compiler/templates";
import { readLearnerId } from "@/lib/server/learner";

export const metadata: Metadata = { title: "Review compilation run" };

export default async function CompilationRunReview({ params }: { params: Promise<{ runId: string }> }) {
  const ownerId = await readLearnerId();
  if (!ownerId) notFound();
  let run;
  try {
    run = await getCompilerRun((await params).runId, ownerId);
  } catch {
    notFound();
  }
  const supportedKinds = new Set(["explanation", "prediction-choice", "sequence-builder", "range-explorer", "state-trace"]);
  const learnerCompatible = run.artifact.lessons.length === 1 && run.artifact.lessons[0].blockIds.every((id) => supportedKinds.has(run.artifact.blocks[id]?.kind));
  const template = COURSE_TEMPLATES[run.templateId];
  return <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
    <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start"><div><p className="eyebrow">Creator review · {run.mode}</p><h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold tracking-[-0.04em]">{run.artifact.title}</h1><p className="mt-4 max-w-[62ch] text-lg leading-8 text-ink-soft">{run.artifact.bigQuestion}</p></div><div className="rounded-xl bg-correct-soft px-5 py-4 text-sm text-correct"><p className="font-semibold">Accepted for learning</p><p className="mt-1">0 blocking issues</p></div></div>
    <nav aria-label="Review sections" className="mt-8 flex gap-2 overflow-x-auto border-b border-ink/10 pb-3 text-sm font-semibold"><a href="#overview" className="rounded-lg bg-ink px-4 py-2 text-white">Overview</a><a href="#sequence" className="rounded-lg px-4 py-2 text-ink-soft hover:bg-surface">Learning sequence</a><a href="#citations" className="rounded-lg px-4 py-2 text-ink-soft hover:bg-surface">Citations</a><a href="#provenance" className="rounded-lg px-4 py-2 text-ink-soft hover:bg-surface">Provenance</a></nav>
    <section id="overview" className="mt-7 grid gap-4 md:grid-cols-[1.15fr_.85fr]"><div className="premium-surface rounded-[1.6rem] p-6 sm:p-8"><p className="eyebrow">Course design</p><h2 className="mt-3 font-display text-3xl font-semibold">{template.name}</h2><p className="mt-3 max-w-[58ch] leading-7 text-ink-soft">{template.description}</p><dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div><dt className="text-ink-soft">Level</dt><dd className="mt-1 font-semibold capitalize">{run.audience.level}</dd></div><div><dt className="text-ink-soft">Language</dt><dd className="mt-1 font-semibold">{run.audience.language}</dd></div><div><dt className="text-ink-soft">Time</dt><dd className="mt-1 font-semibold">{run.audience.targetMinutes} min</dd></div><div><dt className="text-ink-soft">Blocks</dt><dd className="mt-1 font-semibold">{Object.keys(run.artifact.blocks).length}</dd></div></dl></div><div className="rounded-[1.6rem] bg-ink p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Grounding record</p><p className="mt-5 font-display text-4xl font-semibold">{run.sourceGraph.concepts.length}</p><p className="text-sm text-white/60">source-backed concepts</p><p className="mt-5 font-display text-4xl font-semibold">{Object.keys(run.sourceGraph.spans).length}</p><p className="text-sm text-white/60">exact verified quotations</p></div></section>
    <section id="sequence" className="premium-surface mt-6 rounded-[1.6rem] p-6 sm:p-8"><div className="max-w-2xl"><p className="eyebrow">Learning sequence</p><h2 className="mt-3 font-display text-3xl font-semibold">What the learner will do</h2><p className="mt-3 text-ink-soft">Generated pedagogy is visible here. Correct answers and evaluator truth stay server-side.</p></div><ol className="mt-7 divide-y divide-ink/10">{Object.values(run.artifact.blocks).map((block, index) => <li key={block.id} className="grid gap-3 py-5 sm:grid-cols-[3rem_1fr_auto]"><span className="font-mono text-sm font-semibold text-lapis">{String(index + 1).padStart(2, "0")}</span><div><p className="font-semibold">{block.accessibilityLabel}</p><p className="mt-1 text-sm text-ink-soft">{block.kind.replaceAll("-", " ")} · {Math.ceil(block.estimatedSeconds / 60)} min</p></div><span className="self-start rounded-md bg-lapis-soft px-2 py-1 text-xs font-semibold text-lapis-dark">{block.citations.length} citation{block.citations.length === 1 ? "" : "s"}</span></li>)}</ol></section>
    <section id="citations" className="mt-6 rounded-[1.6rem] border border-ink/10 bg-surface/65 p-6 sm:p-8"><p className="eyebrow">Exact evidence</p><h2 className="mt-3 font-display text-3xl font-semibold">Source quotations</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{Object.entries(run.sourceGraph.spans).map(([id, span]) => <figure key={id} className="rounded-xl bg-paper p-5"><blockquote className="leading-7">“{span.exactText}”</blockquote><figcaption className="mt-4 flex flex-wrap justify-between gap-2 font-mono text-xs text-ink-soft"><span>{id}</span><span>page {span.pageNumber} · {span.start}–{span.end}</span></figcaption></figure>)}</div></section>
    <section id="provenance" className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]"><div className="rounded-xl bg-paper p-5"><h2 className="font-semibold">Deterministic validation</h2><p className="mt-2 text-sm leading-6 text-ink-soft">{run.validation.validatorVersion} accepted the artifact with {run.validation.warningCount} warning{run.validation.warningCount === 1 ? "" : "s"}. Private answer truth is excluded from this page.</p></div><div className="rounded-xl bg-paper p-5"><h2 className="font-semibold">Model trace</h2><p className="mt-2 text-sm leading-6 text-ink-soft">{run.telemetry.length} recorded stages · {run.repaired ? "one bounded repair used" : "no repair needed"}.</p><ul className="mt-3 space-y-1 font-mono text-xs text-ink-soft">{run.telemetry.map((item) => <li key={`${item.stage}-${item.outputSha256}`}>{item.stage}: {item.resolvedModel}</li>)}</ul></div></section>
    {learnerCompatible
      ? <Link href={`/learn/${run.runId}`} className="mt-7 block rounded-xl bg-lapis px-6 py-4 text-center text-lg font-semibold text-white">Launch generated learner experience →</Link>
      : <p role="alert" className="mt-7 rounded-xl bg-wrong-soft p-5 text-wrong">Learner launch is blocked because this accepted artifact contains a lesson block that this renderer does not support yet.</p>}
  </div>;
}
