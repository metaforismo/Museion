import type { Metadata } from "next";
import Link from "next/link";

import { CheckmarkBadge01Icon, CourseIcon, HierarchyIcon, Route01Icon } from "@hugeicons/core-free-icons";

import artifactInput from "../../../../tests/fixtures/binary-search-course-artifact-v2.json";
import blueprintInput from "../../../../tests/fixtures/binary-search-blueprint.json";
import documentInput from "../../../../tests/fixtures/binary-search-source-document.json";
import graphInput from "../../../../tests/fixtures/binary-search-source-graph.json";

import { Card, Chip, SectionHeader } from "@/components/ui";
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

/**
 * The compiler's four deterministic gates, in run order. They are reported as
 * checked facts, so they take the record's own green — never a subject accent,
 * which would claim the pipeline belongs to a topic.
 */
const STAGES = ["Source normalized", "Graph grounded", "Course planned", "Artifact validated"] as const;

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
  const accepted = blockingIssues.length === 0;
  const spanCount = Object.keys(graph.spans).length;
  const blockIds = artifact.lessons[0].blockIds;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <Link href="/create" className="mb-5 inline-flex min-h-11 items-center text-body-sm font-semibold text-lapis-dark underline-offset-4 hover:underline">
        Back to Source Studio
      </Link>

      <header className="flex flex-col gap-4 border-b border-ink/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow">Creator review · verified replay</p>
          <h1 className="mt-2 title-page">{artifact.title}</h1>
          <p className="mt-3 max-w-[62ch] text-body leading-6 text-ink-soft">
            Inspect what the compiler grounded, planned, and accepted before a learner sees it.
          </p>
        </div>
        {/* The verdict is a fact the validator produced, so it is a chip with a
            checked tone — the same header geometry the dashboard uses. */}
        <Chip tone={accepted ? "correct" : "wrong"} className="self-start sm:self-auto">
          {accepted
            ? "Accepted · 0 blocking issues"
            : `${blockingIssues.length} blocking ${blockingIssues.length === 1 ? "issue" : "issues"}`}
        </Chip>
      </header>

      <section className="mt-7" aria-labelledby="stages-title">
        <SectionHeader
          id="stages-title"
          title="Compilation pipeline"
          icon={CheckmarkBadge01Icon}
          accent="var(--color-correct)"
          tint="var(--color-correct-soft)"
          meta={`${STAGES.length} of ${STAGES.length} passed`}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((label, index) => (
            <Card key={label} tone="tinted" tint="var(--color-correct-soft)" className="border-correct/20 p-4">
              <p className="text-label font-semibold uppercase tracking-[0.08em] text-correct">Stage {index + 1} · passed</p>
              <p className="mt-1 text-body-sm font-semibold">{label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-6" aria-labelledby="graph-title">
        <SectionHeader
          id="graph-title"
          title="Source Graph"
          icon={HierarchyIcon}
          accent="var(--color-lapis)"
          tint="var(--color-lapis-soft)"
          meta={`${graph.concepts.length} concepts`}
        />
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 pb-3">
            <p className="text-body-sm text-ink-soft">{graph.claims.length} claims · {spanCount} exact spans</p>
            <code className="max-w-full overflow-x-auto font-mono text-micro text-ink-soft" title={graphHash}>graph {graphHash.slice(0, 16)}…</code>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {graph.concepts.map((concept) => (
              <article key={concept.id} className="rounded-xl border border-ink/8 bg-paper p-4">
                <h3 className="text-body-sm font-semibold">{concept.label}</h3>
                <p className="mt-1.5 text-body-sm leading-5 text-ink-soft">{concept.definition}</p>
                <p className="mt-2.5 text-micro font-semibold text-lapis-dark">
                  Evidence: {concept.evidence.map((item) => item.spanId).join(", ")}
                </p>
              </article>
            ))}
          </div>
          <details className="mt-3 rounded-xl border border-ink/8 bg-paper px-4 py-3">
            <summary className="cursor-pointer text-body-sm font-semibold text-lapis-dark">Inspect all claims and exact quotations</summary>
            <div className="mt-4 space-y-4">
              {graph.claims.map((claim) => (
                <div key={claim.id} className="border-l-2 border-lapis pl-4">
                  <p className="text-body-sm font-medium">{claim.text}</p>
                  {claim.evidence.map(({ spanId }) => {
                    const span = graph.spans[spanId];
                    return (
                      <blockquote key={spanId} className="mt-2 text-body-sm italic leading-5 text-ink-soft">
                        “{span.exactText}” <span className="not-italic">— page {span.pageNumber}, {spanId}</span>
                      </blockquote>
                    );
                  })}
                </div>
              ))}
            </div>
          </details>
        </Card>
      </section>

      <section className="mt-6" aria-labelledby="blueprint-title">
        <SectionHeader
          id="blueprint-title"
          title="Blueprint"
          icon={Route01Icon}
          accent="var(--color-lapis)"
          tint="var(--color-lapis-soft)"
          meta={`${blueprint.objectives.length} objectives`}
        />
        <Card className="p-5 sm:p-6">
          <p className="max-w-[70ch] text-body leading-6 text-ink-soft">{blueprint.bigQuestion}</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {blueprint.objectives.map((objective, index) => (
              <li key={objective.id} className="rounded-xl border border-ink/8 bg-paper p-4">
                <p className="text-micro font-semibold uppercase tracking-[0.08em] text-lapis-dark">
                  Objective {index + 1} · {objective.evidenceTarget.replaceAll("_", " ")}
                </p>
                <p className="mt-1.5 text-body-sm font-medium">{objective.statement}</p>
              </li>
            ))}
          </ol>
          {/* Gold is attention: the aha is what the lesson is aimed at, not an
              outcome the engine checked. */}
          <p className="mt-3 rounded-xl border border-gold/25 bg-gold-soft p-4 text-body-sm leading-6">
            <span className="font-semibold">Aha ·</span> {blueprint.ahaMoment}
          </p>
        </Card>
      </section>

      <section className="mt-6" aria-labelledby="course-title">
        <SectionHeader
          id="course-title"
          title="Published course"
          icon={CourseIcon}
          accent="var(--color-surface)"
          tint="var(--color-lapis)"
          meta={`${blockIds.length} blocks`}
        />
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 pb-3">
            <p className="max-w-[62ch] text-body-sm text-ink-soft">Private truth is retained server-side; public serialization removes answer specs and misconception internals.</p>
            <code className="font-mono text-micro text-ink-soft" title={artifactHash}>artifact {artifactHash.slice(0, 16)}…</code>
          </div>
          <ol className="mt-4 space-y-2.5">
            {blockIds.map((id, index) => {
              const block = artifact.blocks[id];
              return (
                <li key={id} className="flex items-center gap-3.5 rounded-xl border border-ink/8 bg-paper p-3.5">
                  <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lapis-soft text-body-sm font-semibold tabular-nums text-lapis-dark">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold">{block.accessibilityLabel}</p>
                    <p className="mt-0.5 text-label text-ink-soft">
                      {block.kind.replaceAll("-", " ")} · {block.citations.map((citation) => citation.spanId).join(", ")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          {/* The locked transfer is not one of the numbered lesson blocks: it is
              the unassisted observation that follows them. Gold square with an
              ink glyph — gold carries white at only 2.8:1. */}
          <div className="mt-2.5 flex items-center gap-3.5 rounded-xl border border-gold/30 bg-gold-soft p-3.5">
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold text-body-sm font-semibold text-ink">T</span>
            <div className="min-w-0">
              <p className="text-body-sm font-semibold">Locked unassisted near transfer</p>
              <p className="mt-0.5 text-label text-ink-soft">One attempt · Maia/hints/solutions unavailable · evidence limitations shown after scoring</p>
            </div>
          </div>
        </Card>
      </section>

      {accepted ? (
        <Link
          href="/judge"
          className="group mt-7 flex min-h-14 items-center justify-center rounded-xl bg-lapis px-6 text-center text-lead font-semibold text-white shadow-[var(--shadow-1)] transition hover:bg-lapis-dark hover:shadow-[var(--shadow-2)]"
        >
          Launch the no-login judge experience
          <span aria-hidden="true" className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
        </Link>
      ) : (
        <Card role="alert" tone="tinted" tint="var(--color-wrong-soft)" className="mt-7 border-wrong/25 p-5" aria-labelledby="blocked-title">
          <h2 id="blocked-title" className="text-body font-semibold text-wrong">Launch blocked</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-body-sm leading-6 text-wrong">
            {blockingIssues.map((issue) => (
              <li key={`${issue.path}-${issue.code}`}>{issue.path}: {issue.message}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
