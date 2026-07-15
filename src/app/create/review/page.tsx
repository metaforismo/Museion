import type { Metadata } from "next";
import Link from "next/link";

import artifactInput from "../../../../tests/fixtures/binary-search-course-artifact-v2.json";
import blueprintInput from "../../../../tests/fixtures/binary-search-blueprint.json";
import documentInput from "../../../../tests/fixtures/binary-search-source-document.json";
import graphInput from "../../../../tests/fixtures/binary-search-source-graph.json";

import {
  canonicalSha256,
  CourseArtifactV2Schema,
  CourseBlueprintSchema,
  SourceGraphSchema,
  validateArtifactReferences,
  validateSourceGraph,
} from "@/lib/compiler";
import { SourceDocumentSchema } from "@/lib/source";

export const metadata: Metadata = {
  title: "Review verified compilation",
  description: "Inspect the grounded Source Graph, blueprint, blocks, citations, and validators before launch.",
};

export default async function CreatorReviewPage() {
  const document = SourceDocumentSchema.parse(documentInput);
  const graph = SourceGraphSchema.parse(graphInput);
  const blueprint = CourseBlueprintSchema.parse(blueprintInput);
  const artifact = CourseArtifactV2Schema.parse(artifactInput);
  const graphIssues = await validateSourceGraph(document, graph);
  const artifactIssues = validateArtifactReferences(artifact, new Set(Object.keys(graph.spans)));
  const blockingIssues = [...graphIssues, ...artifactIssues];
  const graphHash = await canonicalSha256(graph);
  const artifactHash = await canonicalSha256(artifact);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-3xl">
          <p className="eyebrow">Creator review · verified replay</p>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">{artifact.title}</h1>
          <p className="mt-5 max-w-[62ch] text-lg leading-8 text-ink-soft">Inspect what the compiler grounded, planned, and accepted before a learner sees it.</p>
        </div>
        <div className={`rounded-full px-4 py-2 text-sm font-semibold ${blockingIssues.length === 0 ? "bg-correct-soft text-correct" : "bg-wrong-soft text-wrong"}`}>
          {blockingIssues.length === 0 ? "Accepted · 0 blocking issues" : `${blockingIssues.length} blocking issues`}
        </div>
      </div>

      <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Compilation stages">
        {["Source normalized", "Graph grounded", "Course planned", "Artifact validated"].map((label, index) => (
          <div key={label} className="rounded-xl border border-correct/20 bg-correct-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-correct">Stage {index + 1} · passed</p>
            <p className="mt-1 font-medium">{label}</p>
          </div>
        ))}
      </section>

      <section className="premium-surface mt-8 rounded-[1.6rem] border border-white/80 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="font-display text-2xl font-semibold">Source Graph</h2><p className="mt-1 text-sm text-ink-soft">{graph.concepts.length} concepts · {graph.claims.length} claims · {Object.keys(graph.spans).length} exact spans</p></div>
          <code className="max-w-full overflow-x-auto text-xs text-ink-soft" title={graphHash}>graph {graphHash.slice(0, 16)}…</code>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {graph.concepts.map((concept) => (
            <article key={concept.id} className="rounded-lg border border-ink/10 p-4">
              <h3 className="font-semibold">{concept.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{concept.definition}</p>
              <p className="mt-3 text-xs font-medium text-lapis">Evidence: {concept.evidence.map((item) => item.spanId).join(", ")}</p>
            </article>
          ))}
        </div>
        <details className="mt-5 rounded-lg bg-paper p-4">
          <summary className="cursor-pointer font-semibold">Inspect all claims and exact quotations</summary>
          <div className="mt-4 space-y-4">
            {graph.claims.map((claim) => (
              <div key={claim.id} className="border-l-2 border-lapis pl-4">
                <p className="font-medium">{claim.text}</p>
                {claim.evidence.map(({ spanId }) => {
                  const span = graph.spans[spanId];
                  return <blockquote key={spanId} className="mt-2 text-sm italic text-ink-soft">“{span.exactText}” <span className="not-italic">— page {span.pageNumber}, {spanId}</span></blockquote>;
                })}
              </div>
            ))}
          </div>
        </details>
      </section>

      <section className="premium-surface mt-6 rounded-[1.6rem] border border-white/80 p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold">Blueprint</h2>
        <p className="mt-2 text-ink-soft">{blueprint.bigQuestion}</p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2">
          {blueprint.objectives.map((objective, index) => <li key={objective.id} className="rounded-lg bg-paper p-4"><span className="text-xs font-semibold text-lapis">Objective {index + 1} · {objective.evidenceTarget.replaceAll("_", " ")}</span><p className="mt-1 font-medium">{objective.statement}</p></li>)}
        </ol>
        <p className="mt-5 rounded-lg bg-gold-soft p-4"><strong>Aha:</strong> {blueprint.ahaMoment}</p>
      </section>

      <section className="premium-surface mt-6 rounded-[1.6rem] border border-white/80 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold">Published course</h2><p className="mt-1 text-sm text-ink-soft">Private truth is retained server-side; public serialization removes answer specs and misconception internals.</p></div><code className="text-xs text-ink-soft">artifact {artifactHash.slice(0, 16)}…</code></div>
        <div className="mt-5 space-y-3">
          {artifact.lessons[0].blockIds.map((id, index) => { const block = artifact.blocks[id]; return <div key={id} className="flex items-center gap-4 rounded-lg border border-ink/10 p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lapis-soft font-semibold text-lapis">{index + 1}</span><div><p className="font-semibold">{block.accessibilityLabel}</p><p className="text-sm text-ink-soft">{block.kind} · {block.citations.map((citation) => citation.spanId).join(", ")}</p></div></div>; })}
          <div className="flex items-center gap-4 rounded-lg border border-gold/30 bg-gold-soft p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold font-semibold text-white">T</span><div><p className="font-semibold">Locked unassisted near transfer</p><p className="text-sm text-ink-soft">One attempt · Maia/hints/solutions unavailable · evidence limitations shown after scoring</p></div></div>
        </div>
      </section>

      {blockingIssues.length > 0 ? <div role="alert" className="mt-6 rounded-xl bg-wrong-soft p-5 text-wrong"><h2 className="font-semibold">Launch blocked</h2><ul className="mt-2 list-disc pl-5">{blockingIssues.map((issue) => <li key={`${issue.path}-${issue.code}`}>{issue.path}: {issue.message}</li>)}</ul></div> : <Link href="/judge" className="mt-8 block rounded-xl bg-lapis px-6 py-4 text-center text-lg font-semibold text-white transition hover:bg-lapis-dark">Launch the no-login judge experience →</Link>}
    </div>
  );
}
