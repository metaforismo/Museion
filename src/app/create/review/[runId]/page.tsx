import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getCompilerRun } from "@/lib/compiler";
import { readLearnerId } from "@/lib/server/learner";

export const metadata: Metadata = { title: "Review compilation run" };

export default async function CompilationRunReview({ params }: { params: Promise<{ runId: string }> }) {
  const ownerId = await readLearnerId();
  if (!ownerId) notFound();
  let run;
  try {
    run = getCompilerRun((await params).runId, ownerId);
  } catch {
    notFound();
  }
  const supportedKinds = new Set(["explanation", "prediction-choice", "sequence-builder", "range-explorer", "state-trace"]);
  const learnerCompatible = run.artifact.lessons.length === 1 && run.artifact.lessons[0].blockIds.every((id) => supportedKinds.has(run.artifact.blocks[id]?.kind));
  return <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
    <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="eyebrow">Creator review · {run.mode}</p><h1 className="mt-4 font-display text-5xl font-semibold">{run.artifact.title}</h1><p className="mt-4 text-lg text-ink-soft">{run.artifact.bigQuestion}</p></div><span className="rounded-full bg-correct-soft px-4 py-2 text-sm font-semibold text-correct">Accepted · {run.validation.blockingIssueCount} blocking issues</span></div>
    <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Compilation stages">{["Source graph", "Blueprint", "Course artifact", "Critic"].map((label, index) => <div key={label} className="rounded-xl border border-correct/20 bg-correct-soft p-4"><p className="text-xs font-semibold uppercase text-correct">Stage {index + 1} · passed</p><p className="mt-1 font-medium">{label}</p></div>)}</section>
    <section className="premium-surface mt-7 rounded-[1.6rem] p-6 sm:p-8"><h2 className="font-display text-2xl font-semibold">Grounding</h2><p className="mt-2 text-ink-soft">{run.sourceGraph.concepts.length} concepts · {run.sourceGraph.claims.length} claims · {Object.keys(run.sourceGraph.spans).length} exact spans</p><div className="mt-5 grid gap-3 md:grid-cols-2">{run.sourceGraph.concepts.map((concept) => <article key={concept.id} className="rounded-lg border border-ink/10 p-4"><h3 className="font-semibold">{concept.label}</h3><p className="mt-2 text-sm text-ink-soft">{concept.definition}</p></article>)}</div></section>
    <section className="premium-surface mt-6 rounded-[1.6rem] p-6 sm:p-8"><h2 className="font-display text-2xl font-semibold">Validated public course</h2><p className="mt-2 text-ink-soft">Audience: {run.audience.level} · {run.audience.language} · {run.audience.targetMinutes} minutes</p><div className="mt-5 space-y-2">{Object.values(run.artifact.blocks).map((block) => <div key={block.id} className="rounded-lg border border-ink/10 p-4"><p className="font-semibold">{block.accessibilityLabel}</p><p className="text-sm text-ink-soft">{block.kind} · {block.citations.map((item) => item.spanId).join(", ")}</p></div>)}</div></section>
    <section className="mt-6 rounded-xl bg-paper p-5"><h2 className="font-semibold">Run evidence</h2><p className="mt-2 text-sm text-ink-soft">{run.telemetry.length} recorded stages · {run.repaired ? "one bounded repair used" : "no repair used"} · private answer truth excluded from this response.</p></section>
    {learnerCompatible
      ? <Link href={`/learn/${run.runId}`} className="mt-7 block rounded-xl bg-lapis px-6 py-4 text-center text-lg font-semibold text-white">Launch generated learner experience →</Link>
      : <p role="alert" className="mt-7 rounded-xl bg-wrong-soft p-5 text-wrong">Learner launch is blocked because this accepted artifact contains a lesson block that this renderer does not support yet.</p>}
  </div>;
}
