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
 * - done    — full accent fill, white check: the learner stood here.
 * - current — larger, full accent fill, breathing halo, Maia beside it and a
 *             chunky Start/Continue Pressable: the one loudest thing on the
 *             page, which is the whole point.
 * - ahead   — surface fill, quiet border, the lesson number. Never a padlock:
 *             Museion recommends order, it does not lock content, so ahead
 *             nodes stay fully clickable and simply speak more softly.
 *
 * The rail connecting nodes is subject accent behind the learner and ink/10
 * ahead. Course completion crowns the final node — legal celebration, because
 * "every lesson has a completed record" is a fact the engine checked.
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

function stubOffsetClass(index: number): string {
  return index % 2 === 0 ? "ml-[2.125rem] sm:ml-[2.375rem]" : "ml-[2.125rem] sm:ml-[8.375rem]";
}

/**
 * The rail between two nodes: a straight drop below sm, an S-curve between
 * the alternating centres on sm+. It overshoots the viewBox a few px each
 * side so the stroke runs underneath the node circles (which sit at z-10 on
 * opaque fills) instead of stopping short of them.
 */
function Connector({ index, traversed, accent }: { index: number; traversed: boolean; accent: string }) {
  const from = CENTERS[(index - 1) % 2];
  const to = CENTERS[index % 2];
  const stroke = traversed ? accent : RAIL_QUIET;
  return (
    <div aria-hidden="true">
      <span className="block h-10 w-1 rounded-full sm:hidden ml-[2.125rem]" style={{ backgroundColor: stroke }} />
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
          strokeWidth="5"
          strokeLinecap="round"
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
}: {
  courseId: string;
  subject: string;
  lessons: TrailLesson[];
  completed: ReadonlySet<string>;
}) {
  const accent = subjectColor(subject);
  const deep = subjectDeep(subject);
  const tint = subjectTint(subject);
  const trail = buildTrail(lessons.map(({ id }) => id), completed);
  const complete = trailComplete(lessons.map(({ id }) => id), completed);
  const started = trail.some(({ state }) => state === "done");
  const total = lessons.length;

  return (
    <Card tone="tinted" tint={tint} accent={accent} className="p-4 sm:p-6">
      <ol className="m-0 list-none p-0">
        {lessons.map((lesson, index) => {
          const node = trail[index];
          const crowned = complete && index === total - 1;
          const positionLabel = `Lesson ${index + 1} of ${total}`;

          if (node.state === "current") {
            const even = index % 2 === 0;
            return (
              <li key={lesson.id} className="relative">
                {index > 0 && <Connector index={index} traversed={node.traversedFrom} accent={accent} />}
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-x-6">
                  <div className="flex flex-col">
                    <div className={`relative z-10 h-[4.5rem] w-[4.5rem] ${nodeOffsetClass(index)}`}>
                      <Link
                        href={`/lessons/${lesson.id}?course=${courseId}`}
                        aria-current="step"
                        className="relative grid h-full w-full place-items-center rounded-full text-white"
                        style={{ backgroundColor: accent }}
                      >
                        <span aria-hidden="true" className="path-halo pointer-events-none absolute -inset-1.5 rounded-full border-[3px]" style={{ borderColor: accent }} />
                        <span aria-hidden="true" className="font-mono text-xl font-bold">{index + 1}</span>
                        <span className="sr-only">{positionLabel}: {lesson.title} — up next</span>
                      </Link>
                      <MaiaCharacter
                        state="curious"
                        size="hero"
                        title={MAIA_STATE_TITLE.curious}
                        className={`pointer-events-none absolute bottom-0 hidden max-w-none sm:block ${even ? "left-[4.75rem]" : "right-[4.75rem]"}`}
                      />
                    </div>
                    {index < total - 1 && (
                      <span aria-hidden="true" className={`w-1 flex-1 rounded-full ${stubOffsetClass(index)}`} style={{ backgroundColor: RAIL_QUIET }} />
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
                          className="min-h-12 px-7"
                        >
                          {started ? "Continue" : "Start"}
                          <span className="sr-only"> {lesson.title}</span>
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
          return (
            <li key={lesson.id} className="relative">
              {index > 0 && <Connector index={index} traversed={node.traversedFrom} accent={accent} />}
              <Link
                href={`/lessons/${lesson.id}?course=${courseId}`}
                className="group grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 rounded-2xl sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-x-6"
              >
                <span className="flex flex-col">
                  <span className={`relative z-10 grid h-[4.5rem] w-[4.5rem] place-items-center ${nodeOffsetClass(index)}`}>
                    {done ? (
                      <span
                        aria-hidden="true"
                        className="grid h-12 w-12 place-items-center rounded-full text-white transition group-hover:-translate-y-0.5"
                        style={{ backgroundColor: accent }}
                      >
                        <HugeiconsIcon icon={Tick02Icon} size={24} strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="grid h-12 w-12 place-items-center rounded-full border-2 border-ink/15 bg-surface font-mono text-body-sm font-semibold text-ink-soft transition group-hover:border-ink/30"
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
                      className={`w-1 flex-1 rounded-full ${stubOffsetClass(index)}`}
                      style={{ backgroundColor: done ? accent : RAIL_QUIET }}
                    />
                  )}
                </span>
                <span className="flex min-w-0 flex-col justify-center py-2 sm:min-h-[4.5rem]">
                  <span className={`text-body font-semibold tracking-title transition group-hover:text-lapis-dark ${done ? "text-ink" : "text-ink-soft"}`}>
                    {lesson.title}
                    <span className="sr-only"> — {positionLabel}, {stateWord(node.state)}{crowned ? "; course complete" : ""}</span>
                  </span>
                  <span className="mt-0.5 block text-body-sm leading-6 text-ink-soft">{lesson.description}</span>
                  {done && (
                    <span className="mt-1 text-label font-semibold" style={{ color: accent }}>
                      Revisit <span aria-hidden="true">→</span>
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
