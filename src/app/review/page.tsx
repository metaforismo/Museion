import type { Metadata } from "next";
import Link from "next/link";

import MaiaCharacter from "@/components/MaiaCharacter";
import { Card, Chip, SectionHeader, cardClasses } from "@/components/ui";
import { buildDashboardSnapshot } from "@/lib/dashboard";
import { buildRevisitPlan, formatDueDate, REVISIT_INTERVALS_DAYS } from "@/lib/revisit/scheduler";
import { currentActor } from "@/lib/server/actor";

export const metadata: Metadata = { title: "Review", description: "A spaced review queue computed from recorded learning signals." };
export const dynamic = "force-dynamic";

function titleCase(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * The "nothing recorded yet" edge. It is inline rather than `border-dashed`
 * because .surface-card-quiet is unlayered CSS, so its `border` shorthand —
 * which carries `solid` — beats any Tailwind border-style utility.
 */
const EMPTY_EDGE = { borderStyle: "dashed" } as const;

const LADDER_STEPS = [
  ["1. Unresolved misconception", "A registered error pattern still needs correction — always first."],
  ["2. Spaced checks", `An unassisted correct answer schedules the next check on an expanding ladder: ${REVISIT_INTERVALS_DAYS.join(" → ")} days.`],
  ["3. Climbing and falling", "A check at least 12 hours after the last one climbs a rung; cramming refreshes the clock without climbing; a miss resets the ladder."],
] as const;

export default async function ReviewPage() {
  const learnerId = (await currentActor()).ownerId;
  const [snapshot, revisitPlan] = await Promise.all([buildDashboardSnapshot(learnerId), buildRevisitPlan(learnerId)]);
  const scheduled = revisitPlan.filter((item) => item.status === "scheduled");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-4 border-b border-ink/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Review</p>
          <h1 className="mt-2 title-page">Revisit what the record can justify.</h1>
          <p className="mt-3 max-w-2xl text-body leading-6 text-ink-soft">
            Due items come from registered misconceptions, assisted completions, and the spaced schedule —
            an expanding ladder computed from recorded timestamps, never invented.
          </p>
        </div>
        <Chip tone="neutral" className="self-start sm:self-auto">{snapshot.reviewQueue.length} ready</Chip>
      </header>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="queue-title">
            <SectionHeader id="queue-title" title="Due now" />
            {snapshot.reviewQueue.length ? (
              <ol className="space-y-3">
                {snapshot.reviewQueue.map((item, index) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`${cardClasses("solid", true)} grid gap-4 p-5 sm:grid-cols-[2.25rem_minmax(0,1fr)_auto] sm:items-center`}
                    >
                      {/* Gold is the attention state: the rank square is the one
                          mark in this row that is not simply an ordinal. */}
                      <span
                        aria-hidden="true"
                        className={`grid h-9 w-9 place-items-center rounded-xl text-body-sm font-semibold tabular-nums ${item.priority === "high" ? "bg-gold-soft text-ink" : "bg-paper text-ink-soft"}`}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-body font-semibold">
                          {item.concept}
                          {item.priority === "high" && <span className="sr-only"> — highest priority</span>}
                        </span>
                        <span className="mt-1 block text-body-sm leading-5 text-ink-soft">{item.reason}</span>
                      </span>
                      <span className="text-body-sm font-semibold text-lapis-dark">Review <span aria-hidden="true">→</span></span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <Card className="flex flex-wrap items-center gap-6 p-6" style={EMPTY_EDGE}>
                <MaiaCharacter state="curious" size="hero" className="shrink-0" title="Maia, waiting for checked work" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-body font-semibold">No review signal yet.</h3>
                  <p className="mt-2 text-body-sm leading-6 text-ink-soft">
                    Complete checked work first. Your queue will stay empty rather than guessing.
                  </p>
                  <Link
                    href="/library"
                    className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-ink px-4 text-body-sm font-semibold text-white transition hover:bg-lapis-dark"
                  >
                    Choose a lesson
                  </Link>
                </div>
              </Card>
            )}
          </section>

          {scheduled.length > 0 && (
            <section aria-labelledby="scheduled-title">
              <SectionHeader id="scheduled-title" title="Scheduled" meta={`${scheduled.length} waiting`} />
              <p className="-mt-1 mb-3 text-body-sm text-ink-soft">Verified concepts waiting for their next unassisted check.</p>
              <Card className="px-5">
                <ol className="divide-y divide-ink/8">
                  {scheduled.map((item) => (
                    <li key={item.concept} className="flex flex-wrap items-center gap-3 py-3.5">
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-sm font-semibold">{titleCase(item.concept)}</span>
                        <span className="mt-0.5 block text-label text-ink-soft">{item.lessonTitle}</span>
                      </span>
                      {/* Green marks the rungs an unassisted check has already cleared. */}
                      <span aria-label={`Ladder rung ${item.rung + 1} of ${REVISIT_INTERVALS_DAYS.length}`} className="flex items-center gap-1">
                        {REVISIT_INTERVALS_DAYS.map((interval, index) => (
                          <span key={interval} aria-hidden="true" className={`h-1.5 w-4 rounded-full ${index <= item.rung ? "bg-correct" : "bg-ink/10"}`} />
                        ))}
                      </span>
                      <Chip tone="neutral" className="tabular-nums">{formatDueDate(item.dueAt)}</Chip>
                    </li>
                  ))}
                </ol>
              </Card>
            </section>
          )}
        </div>

        {/* The ink panel is the product's explainer surface, shared with Evidence.
            It goes through Card so it takes the same radius and elevation as
            every other panel instead of a one-off rounded-2xl. */}
        <Card as="aside" tone="tinted" tint="var(--color-ink)" className="h-fit p-6 text-white" aria-labelledby="schedule-explainer-title">
          <p id="schedule-explainer-title" className="text-label font-semibold uppercase tracking-[0.08em] text-gold">How the schedule works</p>
          <ol className="mt-5 space-y-4">
            {LADDER_STEPS.map(([heading, detail]) => (
              <li key={heading}>
                <strong className="block text-body-sm font-semibold">{heading}</strong>
                <span className="mt-1 block text-body-sm leading-5 text-white/65">{detail}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 border-t border-white/15 pt-5 text-label leading-5 text-white/60">
            Every date is computed from recorded timestamps in the learning record. Nothing here is a
            streak, an urgency score, or a guess.
          </p>
        </Card>
      </div>
    </div>
  );
}
