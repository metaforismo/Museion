import type { Metadata } from "next";
import Link from "next/link";

import { HugeiconsIcon } from "@hugeicons/react";
import { Files02Icon, GraduationScrollIcon, Idea01Icon, LibraryIcon, RepeatIcon, Target01Icon } from "@hugeicons/core-free-icons";

import DashboardEmptyState from "@/components/DashboardEmptyState";
import MaiaCharacter from "@/components/MaiaCharacter";
import ProgressRing from "@/components/ProgressRing";
import SubjectIcon from "@/components/SubjectIcon";
import { coursePaths } from "@/lib/curriculum";
import { subjectColor } from "@/lib/curriculum/subjects";
import { buildDashboardSnapshot, type DashboardSnapshot } from "@/lib/dashboard";
import { readLearnerId } from "@/lib/server/learner";
import { readLearnerPreferences } from "@/lib/server/preferences";

export const metadata: Metadata = { title: "Home", description: "Your courses, review queue, evidence and next learning action." };
export const dynamic = "force-dynamic";

const METHOD_MOVES = ["Ground", "Predict", "Interact", "Diagnose", "Explain", "Transfer", "Revisit"] as const;

function formatTemplate(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Which method move the recommended action actually exercises. */
function activeMethodMove(action: DashboardSnapshot["nextAction"]): (typeof METHOD_MOVES)[number] {
  if (action.kind === "review") return "Revisit";
  if (action.kind === "resume") return "Interact";
  if (action.kind === "launch") return "Predict";
  return "Ground";
}

function CoursePathCard({ course, progress }: { course: (typeof coursePaths)[number]; progress: { completed: number; total: number } }) {
  const accent = subjectColor(course.subject);
  const started = progress.completed > 0;
  return (
    <Link
      href={`/courses/${course.id}`}
      className="surface-card-quiet group relative flex min-h-40 flex-col overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-1)]"
      style={{ borderTop: `3px solid color-mix(in srgb, ${accent} 60%, white)` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <SubjectIcon subject={course.subject} size={38} iconSize={19} />
          <span className="text-[0.7rem] font-medium text-ink-soft">{course.subject}<span className="block text-[0.62rem] capitalize text-ink-soft">{course.level}</span></span>
        </div>
        {started ? (
          <ProgressRing completed={progress.completed} total={progress.total} color={accent} />
        ) : (
          <span className="rounded-full bg-paper px-2 py-0.5 text-[0.62rem] font-medium text-ink-soft">Not started</span>
        )}
      </div>
      <h3 className="mt-3 font-display text-xl font-semibold tracking-[-0.01em] transition group-hover:text-lapis-dark">{course.title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-ink-soft">{course.tagline}</p>
      <div className="mt-auto flex items-center justify-between pt-4 text-[0.7rem] text-ink-soft">
        <span>{course.lessonIds.length} lessons · {course.estimatedMinutes} min</span>
        <span className="font-semibold opacity-0 transition group-hover:opacity-100" style={{ color: accent }} aria-hidden="true">{started ? "Continue" : "Start"} →</span>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const learnerId = await readLearnerId();
  const [snapshot, preferences] = await Promise.all([
    buildDashboardSnapshot(learnerId ?? "new-learner"),
    readLearnerPreferences(),
  ]);
  const hasActivity = snapshot.activeLearning.length > 0;
  const activeMove = activeMethodMove(snapshot.nextAction);
  const resumeItem = snapshot.activeLearning.find((item) => snapshot.nextAction.href === item.href) ?? null;
  const greeting = preferences?.goal
    ? `Working toward: ${preferences.goal}.`
    : "Continue from recorded work, review a real signal, or build from a source you trust.";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="title-page">Welcome back.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{greeting}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-ink-soft">
            {snapshot.runtime.provider === "offline" ? "Offline verified guidance" : "Live guidance connected"}
          </span>
          <span className="hidden rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-ink-soft sm:inline">
            {snapshot.runtime.persistence === "process-local" ? "Learning record on this device" : "Generated work synced"}
          </span>
        </div>
      </header>

      {/* Mission — one compact, justified next move */}
      <section className="surface-card mt-6 overflow-hidden" aria-labelledby="next-action-title">
        <div className="flex items-stretch">
          <div className="flex-1 p-5 sm:p-6">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-lapis-dark">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-lapis" />
              Next move · {activeMove}
            </p>
            <h2 id="next-action-title" className="mt-2.5 max-w-2xl font-display text-2xl font-semibold tracking-[-0.01em] sm:text-[1.7rem]">
              {snapshot.nextAction.title}
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-soft">
              {snapshot.nextAction.description} {snapshot.nextAction.reason}
            </p>
            {resumeItem && (
              <div className="mt-4 flex max-w-md items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
                  <div className="h-full rounded-full bg-lapis" style={{ width: `${Math.max(4, resumeItem.progress * 100)}%` }} />
                </div>
                <span className="font-mono text-xs tabular-nums text-ink-soft">{Math.round(resumeItem.progress * 100)}%</span>
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link
                href={snapshot.nextAction.href}
                className="group inline-flex min-h-11 items-center rounded-xl bg-lapis px-5 text-sm font-semibold text-white shadow-[var(--shadow-1)] transition hover:-translate-y-0.5 hover:bg-lapis-dark"
              >
                Begin <span aria-hidden="true" className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <p className="text-xs text-ink-soft">
                <span className="font-medium text-ink">Review queue</span>{" "}
                {snapshot.reviewQueue.length === 0 ? "empty" : `${snapshot.reviewQueue.length} waiting`} ·{" "}
                {snapshot.evidence.length === 0
                  ? "no evidence recorded yet — the first checked move starts the record"
                  : `${snapshot.evidence.length} evidence ${snapshot.evidence.length === 1 ? "signal" : "signals"} recorded`}
              </p>
            </div>
          </div>
          <div className="relative hidden items-end pr-6 sm:flex">
            <span aria-hidden="true" className="absolute bottom-2 right-4 h-24 w-24 rounded-full bg-lapis-soft/80 blur-xl" />
            <MaiaCharacter state={snapshot.nextAction.kind === "review" ? "thinking" : "curious"} animated className="relative h-36 w-30 -mb-1" title="Maia is ready for the next learning move" />
          </div>
        </div>

        {/* Method strip — the active move is derived from the real recommendation */}
        <ol className="grid grid-cols-7 border-t border-ink/8 bg-paper/50" aria-label="The Museion Method">
          {METHOD_MOVES.map((move, index) => {
            const isActive = move === activeMove;
            return (
              <li key={move} className="relative flex flex-col items-center gap-1 px-1 py-2.5 text-center">
                <span
                  className={`h-1 w-6 rounded-full transition sm:w-9 ${isActive ? "bg-lapis shadow-[0_0_8px_rgba(43,74,203,0.55)]" : "bg-ink/10"}`}
                  aria-hidden="true"
                />
                <span className={`text-[0.56rem] font-semibold sm:text-[0.66rem] ${isActive ? "text-ink" : "text-ink-soft"}`}>
                  <span className="hidden sm:inline">{move}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {snapshot.journey.lessonsCompleted > 0 && (
        <section aria-label="Your journey so far" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Lessons completed", value: snapshot.journey.lessonsCompleted, icon: GraduationScrollIcon, tint: "var(--color-lapis)" },
            { label: "Courses finished", value: snapshot.journey.coursesCompleted, icon: LibraryIcon, tint: "var(--color-subject-cs)" },
            { label: "Concepts observed", value: snapshot.journey.conceptsObserved, icon: Idea01Icon, tint: "var(--color-gold)" },
            { label: "Unaided transfers", value: snapshot.journey.unassistedTransfers, icon: Target01Icon, tint: "var(--color-subject-biology)" },
          ].map((stat) => (
            <div key={stat.label} className="surface-card-quiet flex items-center gap-3 px-4 py-3">
              <span
                aria-hidden="true"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                style={{ backgroundColor: `color-mix(in srgb, ${stat.tint} 12%, transparent)`, color: stat.tint }}
              >
                <HugeiconsIcon icon={stat.icon} size={20} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-2xl font-semibold leading-none tabular-nums">{stat.value}</p>
                <p className="mt-1 truncate text-[0.7rem] leading-4 text-ink-soft">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(19rem,.6fr)]">
        <div className="space-y-6">
          {hasActivity && (
            <section aria-labelledby="active-title">
              <div className="mb-3 flex items-end justify-between">
                <h2 id="active-title" className="title-panel">Continue learning</h2>
                <Link href="/library" className="text-sm font-medium text-lapis-dark">View library</Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {snapshot.activeLearning.map((item) => (
                  <Link key={item.id} href={item.href} className="surface-card-quiet group p-5 transition hover:border-lapis/30 hover:shadow-[var(--shadow-1)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[0.68rem] font-medium text-ink-soft">{item.kind === "generated" ? "From your source" : "Museion Original"}</span>
                      <span className="font-mono text-xs tabular-nums text-ink-soft">{Math.round(item.progress * 100)}%</span>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold group-hover:text-lapis-dark">{item.title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{item.detail}</p>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink/8">
                      <div className="h-full rounded-full bg-lapis" style={{ width: `${Math.max(4, item.progress * 100)}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="paths-title">
            <div className="mb-1 flex items-end justify-between">
              <h2 id="paths-title" className="title-panel">{hasActivity ? "Explore another path" : "Choose a learning path"}</h2>
              <Link href="/library" className="text-sm font-medium text-lapis-dark">All lessons</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {coursePaths.map((course) => (
                <CoursePathCard key={course.id} course={course} progress={snapshot.courseProgress[course.id] ?? { completed: 0, total: course.lessonIds.length }} />
              ))}
            </div>
          </section>

          <section aria-labelledby="evidence-title">
            <div className="mb-3 flex items-end justify-between gap-4">
              <h2 id="evidence-title" className="title-panel">What the record supports</h2>
              <Link href="/progress" className="text-sm font-medium text-lapis-dark">Full evidence</Link>
            </div>
            {snapshot.evidence.length ? (
              <div className="surface-card-quiet grid gap-x-6 gap-y-0 px-5 sm:grid-cols-2">
                {snapshot.evidence.slice(0, 6).map((item) => (
                  <div key={`${item.concept}:${item.state}`} className="flex items-center justify-between border-t border-ink/8 py-3 first:border-t-0 sm:[&:nth-child(2)]:border-t-0">
                    <div>
                      <p className="text-sm font-medium">{item.concept}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {item.state === "observed-guided" ? "Observed in guided work" : item.state === "hint-free-practice" ? "Hint-free practice completed" : "Immediate near transfer"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.result === "incorrect" || item.result === "developing" ? "bg-gold-soft text-ink" : "bg-correct-soft text-correct"}`}>
                      {item.result}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="surface-card-quiet">
                <DashboardEmptyState
                  icon="evidence"
                  title="No evidence has been recorded"
                  description="Complete a checked learning move. Museion will record only the observation the engine can support."
                  actionHref={snapshot.nextAction.href}
                  actionLabel="Make the first checked move"
                />
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="misconceptions-title">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="misconceptions-title" className="flex items-center gap-2 title-panel"><span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-lg" style={{ backgroundColor: "color-mix(in srgb, var(--color-gold) 14%, transparent)", color: "var(--color-gold)" }}><HugeiconsIcon icon={RepeatIcon} size={15} strokeWidth={2} /></span>Recent misconceptions</h2>
              <span className="font-mono text-xs tabular-nums text-ink-soft">{snapshot.misconceptions.length}</span>
            </div>
            {snapshot.misconceptions.length ? (
              <div className="surface-card-quiet px-5">
                <div className="divide-y divide-ink/8">
                  {snapshot.misconceptions.slice(0, 3).map((item) => (
                    <Link key={`${item.id}:${item.observedAt}`} href={item.href} className="block py-3.5">
                      <p className="text-xs font-medium text-lapis-dark">{item.concept}</p>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink">{item.label}</p>
                      <p className="mt-1 text-xs text-ink-soft">
                        {item.status === "corrected-in-session" ? "Corrected during the session; worth rechecking" : "Not yet resolved"}
                      </p>
                    </Link>
                  ))}
                </div>
                <Link href="/review" className="mb-4 mt-1 inline-flex text-sm font-semibold text-lapis-dark">Open review</Link>
              </div>
            ) : (
              <div className="surface-card-quiet">
                <DashboardEmptyState
                  icon="review"
                  title="Nothing needs correction yet"
                  description="Appears only when a checked answer matches a known wrong path."
                  actionHref="/library"
                  actionLabel="Choose a lesson"
                />
              </div>
            )}
          </section>

          <section aria-labelledby="sources-title">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="sources-title" className="flex items-center gap-2 title-panel"><span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-lg" style={{ backgroundColor: "color-mix(in srgb, var(--color-lapis) 12%, transparent)", color: "var(--color-lapis)" }}><HugeiconsIcon icon={Files02Icon} size={15} strokeWidth={2} /></span>Recent sources</h2>
              {snapshot.recentSources.length > 0 && <Link href="/create" className="text-xs font-medium text-lapis-dark">Add source</Link>}
            </div>
            {snapshot.recentSources.length ? (
              <div className="surface-card-quiet px-5">
                <div className="divide-y divide-ink/8">
                  {snapshot.recentSources.map((source) => (
                    <Link key={source.id} href={source.href} className="block py-3.5">
                      <p className="truncate text-sm font-medium">{source.title}</p>
                      <p className="mt-1 text-xs text-ink-soft">
                        {source.pages} {source.pages === 1 ? "page" : "pages"} · {formatTemplate(source.templateId)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="surface-card-quiet">
                <DashboardEmptyState
                  icon="source"
                  title="No source has been compiled"
                  description="Bring material you may use — provenance stays attached to the course."
                  actionHref="/create"
                  actionLabel="Open Source Studio"
                />
              </div>
            )}
          </section>
        </aside>
      </div>

      <p className="mt-10 border-t border-ink/10 pt-4 text-xs leading-5 text-ink-soft">
        {snapshot.limitations[0]} <Link href="/progress" className="font-medium text-lapis-dark">Read the evidence boundary.</Link>
      </p>
    </div>
  );
}
