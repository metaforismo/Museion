import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownIcon, Tick02Icon } from "@hugeicons/core-free-icons";

import MaiaCharacter from "@/components/MaiaCharacter";
import { Card, Pressable } from "@/components/ui";
import { subjectColor, subjectDeep, subjectTint } from "@/lib/curriculum/subjects";
import { buildTrail, trailComplete, type TrailNode } from "@/lib/design/course-trail";
import { MAIA_STATE_TITLE } from "@/lib/design/maia";

export interface TrailLesson {
  id: string;
  title: string;
  description: string;
}

/**
 * The snaking course path — lessons as places on walked ground rather than
 * rows in a list. Three states, all from the real record:
 *
 * - done    — 52px full accent fill, white check: the learner stood here.
 *             Title-only, and the whole row is the link.
 * - current — 64px, full accent fill, breathing halo, Maia beside it and the
 *             full lesson card with a chunky Start/Continue Pressable — the
 *             row's single interactive element, and the one loudest thing on
 *             the page, which is the whole point. The circle itself is
 *             presentational: two tab stops for one lesson is one too many.
 * - ahead   — 52px surface fill, quiet border, the lesson number. Never a
 *             padlock: Museion recommends order, it does not lock content, so
 *             ahead rows stay fully clickable and simply speak more softly.
 *
 * The rail connecting nodes is subject accent behind the learner and ink/10
 * ahead, thick enough (8–9px) to read as ground at a glance. Course
 * completion crowns the final node — legal celebration, because "every lesson
 * has a completed record" is a fact the engine checked.
 *
 * `justCompleted` names the lesson whose completion the learner is returning
 * from: its node fills and the rail segment arriving at it draws in, once.
 * The caller must have validated the id against the real learner record — a
 * lesson without a completed record animates nothing here either, because
 * the arrival classes only ever land on a node the trail derived as done.
 */

/**
 * Path geometry, in px. The node column is 11rem (176) on sm+; node cells are
 * 4.5rem (72) squares whose centres alternate between two fixed x positions,
 * which is what lets the connector curves be drawn once rather than measured.
 * Below sm the snake straightens into a single column at x = 36.
 */
const CENTERS = [40, 136] as const;
const CONNECTOR_HEIGHT = 64;

/** Rail colour for ground not yet walked: ink/10, same family as hairlines. */
const RAIL_QUIET = "color-mix(in srgb, var(--color-ink) 10%, transparent)";

function nodeOffsetClass(index: number): string {
  return index % 2 === 0 ? "sm:ml-1" : "sm:ml-[6.25rem]";
}

/** Offsets that centre the 8px-wide rail stubs on the node centres. */
function stubOffsetClass(index: number): string {
  return index % 2 === 0 ? "ml-8 sm:ml-9" : "ml-8 sm:ml-[8.25rem]";
}

/**
 * The rail between two nodes: a straight drop below sm, an S-curve between
 * the alternating centres on sm+. It overshoots the viewBox a few px each
 * side so the stroke runs underneath the node circles (which sit at z-10 on
 * opaque fills) instead of stopping short of them. `draw` plays the arrival
 * trace — only ever passed for a segment the record says is traversed.
 */
function Connector({
  index,
  traversed,
  accent,
  draw = false,
}: {
  index: number;
  traversed: boolean;
  accent: string;
  draw?: boolean;
}) {
  const from = CENTERS[(index - 1) % 2];
  const to = CENTERS[index % 2];
  const stroke = traversed ? accent : RAIL_QUIET;
  return (
    <div aria-hidden="true">
      <span
        className={`ml-8 block h-10 w-2 rounded-full sm:hidden ${draw ? "trail-rail-grow [animation-delay:160ms]" : ""}`.trimEnd()}
        style={{ backgroundColor: stroke }}
      />
      <svg
        className="hidden overflow-visible sm:block"
        width="176"
        height={CONNECTOR_HEIGHT}
        viewBox={`0 0 176 ${CONNECTOR_HEIGHT}`}
        fill="none"
      >
        <path
          d={`M ${from} -8 C ${from} ${CONNECTOR_HEIGHT - 26}, ${to} 26, ${to} ${CONNECTOR_HEIGHT + 8}`}
          stroke={stroke}
          strokeWidth="9"
          strokeLinecap="round"
          pathLength="1"
          className={draw ? "trail-rail-trace" : undefined}
        />
      </svg>
    </div>
  );
}

function stateWord(state: TrailNode["state"]): string {
  return state === "done" ? "completed" : state === "current" ? "up next" : "not started yet";
}

export default function CourseTrail({
  courseId,
  subject,
  lessons,
  completed,
  justCompleted = null,
}: {
  courseId: string;
  subject: string;
  lessons: TrailLesson[];
  completed: ReadonlySet<string>;
  /** Lesson id the learner is arriving from — pre-validated against the record. */
  justCompleted?: string | null;
}) {
  const accent = subjectColor(subject);
  const deep = subjectDeep(subject);
  const tint = subjectTint(subject);
  const trail = buildTrail(lessons.map(({ id }) => id), completed);
  const complete = trailComplete(lessons.map(({ id }) => id), completed);
  const started = trail.some(({ state }) => state === "done");
  const total = lessons.length;
  // The arrival only ever attaches to a node the record derived as done: a
  // hand-typed ?completed= for an uncompleted lesson finds no index here.
  const arrivalIndex = justCompleted
    ? trail.findIndex((node) => node.lessonId === justCompleted && node.state === "done")
    : -1;
  // Maia stands 56px taller than the node cell she is anchored to. Every row
  // after the first inherits that headroom from the connector above it; when
  // the current node IS the first row, the card must supply it or her head
  // crosses the card edge into the section heading.
  const headroom = trail[0]?.state === "current" ? "sm:pt-16" : "";

  return (
    <Card tone="tinted" tint={tint} accent={accent} className={`p-4 sm:p-6 ${headroom}`.trim()}>
      {/* list-none makes Safari/VoiceOver drop the implicit list role; restate it. */}
      <ol role="list" className="m-0 list-none p-0">
        {lessons.map((lesson, index) => {
          const node = trail[index];
          const crowned = complete && index === total - 1;
          const positionLabel = `Lesson ${index + 1} of ${total}`;
          // The segment arriving at the just-completed node: its stub lives in
          // the previous row, its connector in this one. Both draw only when
          // the record says that ground is genuinely traversed.
          const stubDraws = index === arrivalIndex - 1 && node.state === "done";
          const connectorDraws = index === arrivalIndex && node.traversedFrom;

          if (node.state === "current") {
            const even = index % 2 === 0;
            return (
              <li key={lesson.id} className="relative">
                {index > 0 && <Connector index={index} traversed={node.traversedFrom} accent={accent} draw={connectorDraws} />}
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-x-6">
                  <div className="flex flex-col">
                    {/* Presentational on purpose: the Start/Continue Pressable
                        below is this lesson's single tab stop, and it carries
                        the position, the title and aria-current. */}
                    <div className={`relative z-10 grid h-[4.5rem] w-[4.5rem] place-items-center ${nodeOffsetClass(index)}`}>
                      <span
                        aria-hidden="true"
                        className="relative grid h-16 w-16 place-items-center rounded-full text-white"
                        style={{ backgroundColor: accent }}
                      >
                        <span className="path-halo pointer-events-none absolute -inset-1.5 rounded-full border-[3px]" style={{ borderColor: accent }} />
                        <span className="font-mono text-xl font-bold">{index + 1}</span>
                      </span>
                      <MaiaCharacter
                        state="curious"
                        size="hero"
                        title={MAIA_STATE_TITLE.curious}
                        className={`pointer-events-none absolute bottom-0 hidden max-w-none sm:block ${even ? "left-[4.75rem]" : "right-[4.75rem]"}`}
                      />
                    </div>
                    {index < total - 1 && (
                      <span aria-hidden="true" className={`w-2 flex-1 rounded-full ${stubOffsetClass(index)}`} style={{ backgroundColor: RAIL_QUIET }} />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col justify-center gap-3 pb-1 sm:py-1">
                    <MaiaCharacter state="curious" size="hero" title={MAIA_STATE_TITLE.curious} className="sm:hidden" />
                    <Card tone="solid" className="p-5">
                      <p className="text-label font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>
                        Up next · {positionLabel}
                      </p>
                      <h3 className="mt-1.5 text-lg font-semibold tracking-title">{lesson.title}</h3>
                      <p className="mt-1 text-body-sm leading-6 text-ink-soft">{lesson.description}</p>
                      <div className="mt-4">
                        <Pressable
                          href={`/lessons/${lesson.id}?course=${courseId}`}
                          accent={accent}
                          edge={deep}
                          aria-current="step"
                          className="min-h-12 px-7"
                        >
                          {started ? "Continue" : "Start"}
                          <span className="sr-only"> {lesson.title} — {positionLabel}, up next</span>
                          <span aria-hidden="true">→</span>
                        </Pressable>
                      </div>
                    </Card>
                  </div>
                </div>
              </li>
            );
          }

          const done = node.state === "done";
          const arriving = index === arrivalIndex;
          return (
            <li key={lesson.id} className="relative">
              {index > 0 && <Connector index={index} traversed={node.traversedFrom} accent={accent} draw={connectorDraws} />}
              <Link
                href={`/lessons/${lesson.id}?course=${courseId}`}
                className="group grid min-h-11 grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 rounded-2xl transition active:translate-y-px sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-x-6"
              >
                <span className="flex flex-col">
                  <span className={`relative z-10 grid h-[4.5rem] w-[4.5rem] place-items-center ${nodeOffsetClass(index)}`}>
                    {done ? (
                      <span aria-hidden="true" className="relative grid h-13 w-13 place-items-center">
                        {/* Under the arriving fill, the ground as it looked a
                            moment ago — the quiet circle the accent blooms
                            over. Absent everywhere else. */}
                        {arriving && (
                          <span className="absolute inset-0 grid place-items-center rounded-full border-2 border-ink/15 bg-surface font-mono text-body-sm font-semibold text-ink-soft">
                            {index + 1}
                          </span>
                        )}
                        <span
                          className={`relative grid h-full w-full place-items-center rounded-full text-white transition group-hover:-translate-y-0.5 ${arriving ? "trail-node-fill" : ""}`.trimEnd()}
                          style={{ backgroundColor: accent }}
                        >
                          <HugeiconsIcon icon={Tick02Icon} size={26} strokeWidth={2.5} />
                        </span>
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="grid h-13 w-13 place-items-center rounded-full border-2 border-ink/15 bg-surface font-mono text-body-sm font-semibold text-ink-soft transition group-hover:border-ink/30"
                      >
                        {index + 1}
                      </span>
                    )}
                    {crowned && (
                      <span
                        aria-hidden="true"
                        className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-gold text-ink"
                      >
                        <HugeiconsIcon icon={CrownIcon} size={14} strokeWidth={2} />
                      </span>
                    )}
                  </span>
                  {index < total - 1 && (
                    <span
                      aria-hidden="true"
                      className={`w-2 flex-1 rounded-full ${stubOffsetClass(index)} ${stubDraws ? "trail-rail-grow" : ""}`.trimEnd()}
                      style={{ backgroundColor: done ? accent : RAIL_QUIET }}
                    />
                  )}
                </span>
                {/* Title-only: the full card belongs to the current node, and
                    the board reads as ground rather than a list of blurbs.
                    (The current card keeps lesson.description on the page.) */}
                <span className="flex min-w-0 flex-col justify-center py-2 sm:min-h-[4.5rem]">
                  <span className={`text-body font-semibold tracking-title transition group-hover:text-lapis-dark ${done ? "text-ink" : "text-ink-soft"}`}>
                    {lesson.title}
                    <span className="sr-only"> — {positionLabel}, {stateWord(node.state)}{crowned ? "; course complete" : ""}</span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
