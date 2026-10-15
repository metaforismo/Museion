import type { Metadata } from "next";
import Link from "next/link";

import JourneyStats from "@/components/JourneyStats";
import MaiaCharacter from "@/components/MaiaCharacter";
import VerifiedMoment from "@/components/VerifiedMoment";
import { Card, Chip, Pressable, SectionHeader, SubjectBadge } from "@/components/ui";
import { subjectColor, subjectTint } from "@/lib/curriculum/subjects";
import { buildDashboardSnapshot } from "@/lib/dashboard";
import { buildConceptMap } from "@/lib/dashboard/concept-map";
import { evidenceTone } from "@/lib/design/evidence-tone";
import { verifiedMomentFor } from "@/lib/design/moments";
import { currentActor } from "@/lib/server/actor";

export const metadata: Metadata = { title: "Progress", description: "Recorded learning observations and their explicit limits." };
export const dynamic = "force-dynamic";

const STATE_COPY = {
  "observed-guided": ["Worked through with guidance", "An answer was checked during a guided lesson."],
  "hint-free-practice": ["Practised without lesson hints", "No lesson hints were used. Maia may still have been available."],
  "immediate-transfer": ["Tried independently", "A new related problem, one attempt, without assistance."],
} as const;

const LADDER = [
  ["1. Guided observation", "Useful for adapting support, not a mastery claim.", false],
  ["2. Hint-free practice", "A different observation; it may still include Maia.", false],
  ["3. Immediate near transfer", "Unassisted and structurally related, but not delayed.", false],
  ["4. Retention", "Not measured yet. A delayed probe is required.", true],
] as const;

/** Dashed rather than border-dashed: .surface-card-quiet is unlayered CSS and its `border` shorthand wins. */
const EMPTY_EDGE = { borderStyle: "dashed" } as const;

export default async function EvidencePage() {
  const learnerId = (await currentActor()).ownerId;
  const [snapshot, conceptMap] = await Promise.all([buildDashboardSnapshot(learnerId), buildConceptMap(learnerId)]);
  const verifiedMoment = verifiedMomentFor(snapshot);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-4 border-b border-ink/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Progress</p>
          <h1 className="mt-2 title-page">See what you’re building.</h1>
          <p className="mt-3 max-w-3xl text-body leading-6 text-ink-soft">
            See the ideas you have practised, the steps you worked through and what could use another look.
          </p>
        </div>
        {/* The one press this page offers follows the record: a non-empty
            queue takes the warm gold press with the real count — the same
            sanctioned urgency the dashboard carries — and an empty queue
            leaves a quiet secondary door. Never a zero, never a nudge. */}
        {snapshot.reviewQueue.length > 0 ? (
          <Pressable href="/review" variant="attention" className="shrink-0 self-start lg:self-auto">
            {snapshot.reviewQueue.length} to revisit
          </Pressable>
        ) : (
          <Pressable href="/review" variant="secondary" className="shrink-0 self-start lg:self-auto">
            Open review
          </Pressable>
        )}
      </header>

      {/* The strongest thing the record can currently justify, with the line
          that justifies it. This page is where a celebration belongs: it is
          the page that also states what the observation does not prove. It is
          absent entirely until an engine-checked trigger fires — there is no
          placeholder, no counter and nothing to accumulate. */}
      {verifiedMoment && <VerifiedMoment kind={verifiedMoment} className="mt-7" />}

      {/* The record in numbers, arriving by count-up — earned, not inflated:
          every value is the recorded count and the animation lands on it
          exactly. Absent until there is a record to count. */}
      {snapshot.journey.lessonsCompleted > 0 && (
        <section aria-label="The record in numbers" className="mt-7">
          <JourneyStats journey={snapshot.journey} />
        </section>
      )}

      {conceptMap.groups.length > 0 && (
        <section className="mt-7" aria-labelledby="concept-map-title">
          <SectionHeader
            id="concept-map-title"
            title="Concepts you have worked on"
            meta={`${conceptMap.groups.length} ${conceptMap.groups.length === 1 ? "subject" : "subjects"}`}
          />
          <p className="-mt-1 mb-3 max-w-3xl text-body-sm leading-5 text-ink-soft">
            A growing collection of ideas you have explored. Return to a lesson whenever you want to give it another try.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {conceptMap.groups.map((group) => {
              const accent = subjectColor(group.subject);
              return (
                // The subject's own accent holds the card's top edge, the same
                // grammar as its course card: this section is the subject's
                // ground on the evidence page, warmed by its tint band below.
                <Card key={group.subject} accent={accent} className="overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ backgroundColor: subjectTint(group.subject) }}>
                    {/* The badge is the group's heading, not decoration: without the
                        h3 there is no way to move between subjects with a screen
                        reader. Preflight resets heading type, so this renders the
                        badge unchanged. */}
                    <h3 className="min-w-0"><SubjectBadge subject={group.subject} size={32} /></h3>
                    <span className="shrink-0 text-label tabular-nums text-ink-soft">
                      {group.entries.length} {group.entries.length === 1 ? "concept" : "concepts"}
                    </span>
                  </div>
                  <ul className="grid gap-2 p-4 sm:grid-cols-2">
                    {group.entries.map((entry) => (
                      <li key={entry.concept}>
                        <Link href={`/lessons/${entry.lessonId}`} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-paper">
                          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                          <span className="min-w-0">
                            <span className="block truncate text-body-sm font-medium transition group-hover:text-lapis-dark">{entry.label}</span>
                            <span className="block truncate text-label text-ink-soft">{entry.lessonTitle}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
          {conceptMap.revisit.length > 0 && (
            // Gold is attention: these are the concepts the estimate says to
            // look at first, not concepts that were answered wrongly.
            <Card tint="var(--color-gold-soft)" className="mt-4 border-gold/30 p-4">
              <p className="text-body-sm font-semibold">Worth revisiting first</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {conceptMap.revisit.map((entry) => (
                  <Link
                    key={entry.concept}
                    href={`/lessons/${entry.lessonId}`}
                    className="inline-flex min-h-9 items-center gap-2 rounded-full border border-gold/40 bg-surface px-3.5 text-label font-medium transition hover:border-gold hover:text-lapis-dark"
                  >
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: subjectColor(entry.subject) }} />
                    {entry.label}
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </section>
      )}

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="min-w-0" aria-labelledby="concept-evidence-title">
          <SectionHeader
            id="concept-evidence-title"
            title="Learning observations"
            meta={`${snapshot.evidence.length} ${snapshot.evidence.length === 1 ? "signal" : "signals"}`}
          />
          {snapshot.evidence.length ? (
            <Card className="px-5 sm:px-7">
              <div className="divide-y divide-ink/8">
                {snapshot.evidence.map((item) => {
                  const copy = STATE_COPY[item.state];
                  return (
                    <article key={`${item.concept}:${item.state}`} className="grid gap-3 py-4 sm:grid-cols-[minmax(9rem,.7fr)_minmax(13rem,1fr)_auto] sm:items-center">
                      <div className="min-w-0">
                        <h3 className="text-body-sm font-semibold">{item.concept}</h3>
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-sm font-medium">{copy[0]}</p>
                        <p className="mt-1 text-label leading-5 text-ink-soft">{copy[1]}</p>
                      </div>
                      {/* The tone is the checked outcome. `developing` is attention,
                          `incorrect` is wrong — merging them would report a wrong
                          answer the engine never recorded. */}
                      <Chip tone={evidenceTone(item.result)}>{item.result}</Chip>
                    </article>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card className="flex flex-wrap items-center gap-6 p-6" style={EMPTY_EDGE}>
              <MaiaCharacter state="curious" size="hero" className="shrink-0" title="Maia, waiting for checked work" />
              <div className="min-w-0 flex-1">
                <h3 className="text-body font-semibold">No observations yet.</h3>
                <p className="mt-2 text-body-sm leading-6 text-ink-soft">
                  Start a course and try your first learning step. Your work will appear here.
                </p>
                {/* Quiet on purpose: an empty record is a starting point, not
                    a deficit, so the way in is a secondary press. */}
                <Pressable href="/library" variant="secondary" className="mt-4">
                  Find a course
                </Pressable>
              </div>
            </Card>
          )}
        </section>

      </div>

      <details className="mt-7 rounded-3xl border border-ink/10 bg-surface p-5 sm:p-6">
        <summary className="cursor-pointer text-body font-semibold">How to read your progress</summary>
        <p className="mt-4 max-w-3xl text-body-sm leading-6 text-ink-soft">Finishing a lesson and understanding an idea independently are different observations. Here is what the record can show.</p>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2">{LADDER.map(([heading, detail]) => <li key={heading}><p className="text-body-sm font-semibold">{heading}</p><p className="mt-1 text-label leading-5 text-ink-soft">{detail}</p></li>)}</ol>
        <ul className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-label leading-5 text-ink-soft">{snapshot.limitations.map(item => <li key={item}>{item}</li>)}</ul>
      </details>
    </div>
  );
}
