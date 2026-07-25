import type { Metadata } from "next";
import Link from "next/link";

import { GraduationScrollIcon, Idea01Icon, LibraryIcon, RepeatIcon, Target01Icon, Files02Icon } from "@hugeicons/core-free-icons";

import CoursePathCard from "@/components/CoursePathCard";
import DashboardEmptyState from "@/components/DashboardEmptyState";
import MaiaCharacter from "@/components/MaiaCharacter";
import { Card, Chip, ProgressRail, SectionHeader, StatTile, cardClasses } from "@/components/ui";
import { allLessons } from "@/lib/content";
import { coursePaths } from "@/lib/curriculum";
import { subjectColor, subjectTint } from "@/lib/curriculum/subjects";
import { buildDashboardSnapshot, type DashboardSnapshot } from "@/lib/dashboard";
import { evidenceTone } from "@/lib/design/evidence-tone";
import { maiaStateForAction, MAIA_STATE_TITLE } from "@/lib/design/maia";
import { currentActor } from "@/lib/server/actor";
import { readLearnerPreferences } from "@/lib/server/preferences";

export const metadata: Metadata = { title: "Home", description: "Your courses, review queue, evidence and next learning action." };
export const dynamic = "force-dynamic";

const METHOD_MOVES = ["Ground", "Predict", "Interact", "Diagnose", "Explain", "Transfer", "Revisit"] as const;
type MethodMove = (typeof METHOD_MOVES)[number];

/**
 * The record's own colours. These tiles count recorded work, so they may not
 * borrow a subject accent — violet here would read as Computer Science. Three
 * report activity; the unaided transfer is the one observation the learner
 * produced without help, so it alone carries the verified green.
 */
const JOURNEY_TILES = [
  { key: "lessonsCompleted", label: "Lessons completed", icon: GraduationScrollIcon, accent: "var(--color-lapis)", tint: "var(--color-lapis-soft)" },
  { key: "coursesCompleted", label: "Courses finished", icon: LibraryIcon, accent: "var(--color-lapis)", tint: "var(--color-lapis-soft)" },
  { key: "conceptsObserved", label: "Concepts observed", icon: Idea01Icon, accent: "var(--color-lapis)", tint: "var(--color-lapis-soft)" },
  { key: "unassistedTransfers", label: "Unaided transfers", icon: Target01Icon, accent: "var(--color-correct)", tint: "var(--color-correct-soft)" },
] as const satisfies readonly { key: keyof DashboardSnapshot["journey"]; label: string; icon: typeof LibraryIcon; accent: string; tint: string }[];

function formatTemplate(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Which method move the recommended action actually exercises. */
function activeMethodMove(action: DashboardSnapshot["nextAction"]): MethodMove {
  if (action.kind === "review") return "Revisit";
  if (action.kind === "resume") return "Interact";
  if (action.kind === "launch") return "Predict";
  return "Ground";
}

/**
 * The subject behind an in-app href, or null when it has none. Action hrefs
 * never carry a course id — they point at lessons, /judge, /review or
 * /create — so the lesson's own track is the only derivation that is ever
 * right. Guessing a subject for /judge would paint the page a colour the
 * recommendation does not have.
 */
function subjectForHref(href: string): string | null {
  const lessonId = /^\/lessons\/([^/?#]+)/.exec(href)?.[1];
  if (!lessonId) return null;
  return allLessons().find((lesson) => lesson.id === lessonId)?.track ?? null;
}

/** Unrecognised subjects collapse to the default palette entry: lapis on sky. */
function accentFor(subject: string | null) {
  return { accent: subjectColor(subject ?? "default"), tint: subjectTint(subject ?? "default") };
}

function evidenceState(state: DashboardSnapshot["evidence"][number]["state"]) {
  if (state === "observed-guided") return "Observed in guided work";
  if (state === "hint-free-practice") return "Hint-free practice completed";
  return "Immediate near transfer";
}

/**
 * The seven moves, named at every width. Four per row on phones instead of
 * bare numerals: the method is the product's central claim, and "3" states
 * none of it.
 */
function MethodSpine({ activeMove, accent }: { activeMove: MethodMove; accent: string }) {
  const activeIndex = METHOD_MOVES.indexOf(activeMove);
  return (
    <ol
      aria-label="The Museion Method"
      className="flex flex-wrap justify-center border-t border-ink/8 bg-surface/55 sm:grid sm:grid-cols-7"
    >
      {METHOD_MOVES.map((move, index) => {
        const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "upcoming";
        return (
          <li
            key={move}
            aria-current={state === "active" ? "step" : undefined}
            className="flex basis-1/4 flex-col items-center gap-1.5 px-1 py-2.5 text-center"
          >
            <span
              aria-hidden="true"
              className="h-1 w-8 rounded-full bg-ink/10 sm:w-9"
              style={state === "upcoming" ? undefined : { backgroundColor: accent, opacity: state === "done" ? 0.45 : 1 }}
            />
            <span className={`text-micro ${state === "active" ? "font-semibold text-ink" : "font-medium text-ink-soft"}`}>
              {move}
              {state === "active" && <span className="sr-only"> — current move</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ActiveLearningCard({ item }: { item: DashboardSnapshot["activeLearning"][number] }) {
  const subject = subjectForHref(item.href);
  const { accent } = accentFor(subject);
  return (
    <Link href={item.href} className={`${cardClasses("quiet", true)} group flex flex-col p-5`}>
      <div className="flex items-center justify-between gap-3">
        <Chip tone="neutral">{item.kind === "generated" ? "From your source" : "Museion Original"}</Chip>
        {subject && <span className="truncate text-micro font-semibold" style={{ color: accent }}>{subject}</span>}
      </div>
      <h3 className="mt-3 text-lg font-semibold tracking-title">{item.title}</h3>
      <p className="mt-1 text-body-sm text-ink-soft">{item.detail}</p>
      <div className="mt-4">
        <ProgressRail ratio={item.progress} accent={accent} label={`${item.title} progress`} />
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const learnerId = (await currentActor()).ownerId;
  const [snapshot, preferences] = await Promise.all([
    buildDashboardSnapshot(learnerId),
    readLearnerPreferences(),
  ]);
  const hasActivity = snapshot.activeLearning.length > 0;
  const activeMove = activeMethodMove(snapshot.nextAction);
  const heroMaiaState = maiaStateForAction(snapshot.nextAction.kind);
  const resumeItem = snapshot.activeLearning.find((item) => snapshot.nextAction.href === item.href) ?? null;
  const heroSubject = subjectForHref(snapshot.nextAction.href);
  const { accent: heroAccent, tint: heroTint } = accentFor(heroSubject);
  const localRecord = snapshot.runtime.persistence === "process-local";
  const greeting = preferences?.goal
    ? `Working toward: ${preferences.goal}.`
    : "Continue from recorded work, review a real signal, or build from a source you trust.";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="title-page">Welcome back.</h1>
          <p className="mt-2 max-w-2xl text-body leading-6 text-ink-soft">{greeting}</p>
        </div>
        {/* Guidance status lives in the sidebar footer now; this pill says where
            the record is kept, and a process-local record is a caveat, not a fact
            with no valence — so it carries the attention tone. */}
        {/* self-start keeps the pill at its own width in the mobile column, where
            the header's stretch would otherwise run it edge to edge. */}
        <Chip tone={localRecord ? "attention" : "neutral"} className="self-start sm:self-auto">
          {localRecord ? "Learning record on this device" : "Generated work synced"}
        </Chip>
      </header>

      {/* Mission — one compact, justified next move, in the colour of the subject
          it belongs to. The accent edge carries the subject even for sky, whose
          tint is close enough to the learn-zone wash to read as white. */}
      <Card as="section" tone="solid" tint={heroTint} accent={heroAccent} className="mt-6 overflow-hidden" aria-labelledby="next-action-title">
        <div className="flex items-stretch">
          <div className="flex-1 p-5 sm:p-6">
            <p className="flex flex-wrap items-center gap-2 text-label font-semibold uppercase tracking-[0.08em]" style={{ color: heroAccent }}>
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: heroAccent }} />
              <span>
                Next move · {activeMove}
                {heroSubject && <> · <span className="text-ink-soft">{heroSubject}</span></>}
              </span>
            </p>
            <h2 id="next-action-title" className="mt-2.5 max-w-2xl text-2xl font-semibold tracking-title sm:text-3xl">
              {snapshot.nextAction.title}
            </h2>
            <p className="mt-1.5 max-w-2xl text-body leading-6 text-ink-soft">
              {snapshot.nextAction.description} {snapshot.nextAction.reason}
            </p>
            {resumeItem && (
              <div className="mt-4 max-w-md">
                <ProgressRail ratio={resumeItem.progress} accent={heroAccent} label={`${resumeItem.title} progress`} />
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link
                href={snapshot.nextAction.href}
                className="group inline-flex min-h-11 items-center rounded-xl px-5 text-body-sm font-semibold text-white shadow-[var(--shadow-1)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]"
                style={{ backgroundColor: heroAccent }}
              >
                Begin <span aria-hidden="true" className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <p className="text-label text-ink-soft">
                <span className="font-medium text-ink">Review queue</span>{" "}
                {snapshot.reviewQueue.length === 0 ? "empty" : `${snapshot.reviewQueue.length} waiting`} ·{" "}
                {snapshot.evidence.length === 0
                  ? "no evidence recorded yet — the first checked move starts the record"
                  : `${snapshot.evidence.length} evidence ${snapshot.evidence.length === 1 ? "signal" : "signals"} recorded`}
              </p>
            </div>
          </div>
          <div className="relative hidden items-end pr-6 sm:flex">
            {/* Name and pose come from one state: when the recommendation is a
                review she is drawn thinking, and she must not be announced as
                ready for a move. */}
            <MaiaCharacter state={heroMaiaState} size="hero" className="relative -mb-1" title={MAIA_STATE_TITLE[heroMaiaState]} />
          </div>
        </div>

        {/* Method strip — the active move is derived from the real recommendation */}
        <MethodSpine activeMove={activeMove} accent={heroAccent} />
      </Card>

      {snapshot.journey.lessonsCompleted > 0 && (
        <section aria-label="Your journey so far" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {JOURNEY_TILES.map((tile) => (
            <StatTile
              key={tile.key}
              label={tile.label}
              value={snapshot.journey[tile.key]}
              icon={tile.icon}
              accent={tile.accent}
              tint={tile.tint}
            />
          ))}
        </section>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(19rem,.6fr)]">
        <div className="space-y-6">
          {hasActivity && (
            <section aria-labelledby="active-title">
              <SectionHeader id="active-title" title="Continue learning" actionHref="/library" actionLabel="View library" />
              <div className="grid gap-3 sm:grid-cols-2">
                {snapshot.activeLearning.map((item) => (
                  <ActiveLearningCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="paths-title">
            <SectionHeader
              id="paths-title"
              title={hasActivity ? "Explore another path" : "Choose a learning path"}
              actionHref="/library"
              actionLabel="All lessons"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {coursePaths.map((course) => (
                <CoursePathCard key={course.id} course={course} progress={snapshot.courseProgress[course.id] ?? { completed: 0, total: course.lessonIds.length }} />
              ))}
            </div>
          </section>

          <section aria-labelledby="evidence-title">
            <SectionHeader id="evidence-title" title="What the record supports" actionHref="/progress" actionLabel="Full evidence" />
            {snapshot.evidence.length ? (
              <Card className="grid gap-x-6 gap-y-0 px-5 sm:grid-cols-2">
                {snapshot.evidence.slice(0, 6).map((item) => (
                  <div key={`${item.concept}:${item.state}`} className="flex items-center justify-between gap-3 border-t border-ink/8 py-3 first:border-t-0 sm:[&:nth-child(2)]:border-t-0">
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium">{item.concept}</p>
                      <p className="mt-0.5 text-label text-ink-soft">{evidenceState(item.state)}</p>
                    </div>
                    <Chip tone={evidenceTone(item.result)}>{item.result}</Chip>
                  </div>
                ))}
              </Card>
            ) : (
              <Card>
                <DashboardEmptyState
                  icon="evidence"
                  title="No evidence has been recorded"
                  description="Complete a checked learning move. Museion will record only the observation the engine can support."
                  actionHref={snapshot.nextAction.href}
                  actionLabel="Make the first checked move"
                />
              </Card>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="misconceptions-title">
            {/* Gold reads as attention. The square is solid gold with an ink
                glyph (6.6:1): gold on gold-soft is 2.5:1 — under the 3:1 a
                meaningful graphic needs, and too pale to register as a state. */}
            <SectionHeader
              id="misconceptions-title"
              title="Recent misconceptions"
              icon={RepeatIcon}
              accent="var(--color-ink)"
              tint="var(--color-gold)"
              meta={String(snapshot.misconceptions.length)}
            />
            {snapshot.misconceptions.length ? (
              <Card className="px-5">
                <div className="divide-y divide-ink/8">
                  {snapshot.misconceptions.slice(0, 3).map((item) => (
                    <Link key={`${item.id}:${item.observedAt}`} href={item.href} className="block py-3.5">
                      <p className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-soft">{item.concept}</p>
                      <p className="mt-1 line-clamp-2 text-body-sm leading-5 text-ink">{item.label}</p>
                      <Chip tone={item.status === "corrected-in-session" ? "neutral" : "attention"} className="mt-2">
                        {item.status === "corrected-in-session" ? "Corrected in session · worth rechecking" : "Not yet resolved"}
                      </Chip>
                    </Link>
                  ))}
                </div>
                <Link href="/review" className="mb-4 mt-1 inline-flex text-body-sm font-semibold text-lapis-dark hover:underline hover:underline-offset-4">Open review</Link>
              </Card>
            ) : (
              <Card>
                <DashboardEmptyState
                  icon="review"
                  title="Nothing needs correction yet"
                  description="Appears only when a checked answer matches a known wrong path."
                  actionHref="/library"
                  actionLabel="Choose a lesson"
                />
              </Card>
            )}
          </section>

          <section aria-labelledby="sources-title">
            {/* Lapis reads as information — the same blue the product uses for
                navigation and provenance. White on lapis is 5.4:1. */}
            <SectionHeader
              id="sources-title"
              title="Recent sources"
              icon={Files02Icon}
              accent="var(--color-surface)"
              tint="var(--color-lapis)"
              actionHref={snapshot.recentSources.length > 0 ? "/create" : undefined}
              actionLabel={snapshot.recentSources.length > 0 ? "Add source" : undefined}
            />
            {snapshot.recentSources.length ? (
              <Card className="px-5">
                <div className="divide-y divide-ink/8">
                  {snapshot.recentSources.map((source) => (
                    <Link key={source.id} href={source.href} className="block py-3.5">
                      <p className="truncate text-body-sm font-medium">{source.title}</p>
                      <p className="mt-1 text-label text-ink-soft">
                        {source.pages} {source.pages === 1 ? "page" : "pages"} · {formatTemplate(source.templateId)}
                      </p>
                    </Link>
                  ))}
                </div>
              </Card>
            ) : (
              <Card>
                <DashboardEmptyState
                  icon="source"
                  title="No source has been compiled"
                  description="Bring material you may use — provenance stays attached to the course."
                  actionHref="/create"
                  actionLabel="Open Source Studio"
                />
              </Card>
            )}
          </section>
        </aside>
      </div>

      <p className="mt-10 border-t border-ink/10 pt-4 text-label leading-5 text-ink-soft">
        {snapshot.limitations[0]} <Link href="/progress" className="font-medium text-lapis-dark">Read the evidence boundary.</Link>
      </p>
    </div>
  );
}
