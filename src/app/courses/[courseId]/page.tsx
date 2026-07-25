import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircleIcon, CheckmarkCircle02Icon, Files02Icon, Target01Icon } from "@hugeicons/core-free-icons";

import CourseTrail from "@/components/CourseTrail";
import SubjectIcon from "@/components/SubjectIcon";
import { Card, Pressable, ProgressRail, SectionHeader } from "@/components/ui";
import { getLesson } from "@/lib/content";
import { coursePaths, getCoursePath } from "@/lib/curriculum";
import { subjectColor, subjectTint } from "@/lib/curriculum/subjects";
import { courseArtSrc } from "@/lib/design/assets";
import { currentActor } from "@/lib/server/actor";
import { learnerProfile } from "@/lib/server/session-repository";

type Props = { params: Promise<{ courseId: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return coursePaths.map(({ id }) => ({ courseId: id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = getCoursePath((await params).courseId);
  return course ? { title: course.title, description: course.tagline } : { title: "Course not found" };
}

function countWord(n: number): string {
  return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"][n] ?? String(n);
}

/**
 * Six courses own a bespoke clay illustration; four do not. So there are two
 * heroes on purpose:
 *
 *   art   — flat subject tint, with the course's own object resting on it.
 *   crest — the same tint poured as a soft wash, with the subject's clay
 *           object seated in a tint medallion.
 *
 * The crest is not the art hero minus the art: it changes the surface as well
 * as the object, so an artless course reads as the subject's own variant
 * rather than a card whose image failed to load.
 */
function HeroFigure({ subject, art }: { subject: string; art: string | null }) {
  if (art) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- fixed-size decorative clay asset; next/image adds no value at this scale
      <img
        src={art}
        alt=""
        aria-hidden="true"
        width={224}
        height={224}
        className="h-32 w-32 shrink-0 object-contain sm:h-52 sm:w-52"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid h-32 w-32 shrink-0 place-items-center rounded-full sm:h-44 sm:w-44"
      style={{ backgroundColor: subjectTint(subject) }}
    >
      <SubjectIcon subject={subject} variant="object" size={96} />
    </span>
  );
}

export default async function CoursePage({ params }: Props) {
  const course = getCoursePath((await params).courseId);
  if (!course) notFound();
  const lessons = course.lessonIds.map((lessonId) => getLesson(lessonId));
  if (lessons.some((lesson) => !lesson)) notFound();

  const learnerId = (await currentActor()).ownerId;
  const completed = (await learnerProfile(learnerId, false))?.completedLessons ?? new Set<string>();
  const total = course.lessonIds.length;
  const doneCount = course.lessonIds.filter((id) => completed.has(id)).length;
  const accent = subjectColor(course.subject);
  const tint = subjectTint(course.subject);
  const art = courseArtSrc(course.id);
  const firstUnfinished = course.lessonIds.find((id) => !completed.has(id)) ?? course.lessonIds[0];
  const started = doneCount > 0;

  // The crest hero's pools sit left and low so the right of the band stays
  // near-paper: a flat tint medallion needs somewhere unwashed to read against.
  const heroSurface = art
    ? { backgroundColor: tint }
    : {
        backgroundColor: "var(--color-surface)",
        backgroundImage: `radial-gradient(34rem 22rem at 0% -10%, ${tint}, transparent), radial-gradient(26rem 20rem at 40% 140%, ${tint}, transparent)`,
      };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <nav aria-label="Breadcrumb" className="text-body-sm text-ink-soft">
        <Link href="/library" className="hover:text-lapis-dark">Library</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{course.title}</span>
      </nav>

      <Card as="section" tone="solid" accent={accent} style={heroSurface} className="mt-4 overflow-hidden" aria-labelledby="course-title">
        <div className="flex flex-col gap-6 p-6 sm:flex-row-reverse sm:items-center sm:gap-8 sm:p-8">
          <div className="flex justify-center sm:justify-end">
            <HeroFigure subject={course.subject} art={art} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-label font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>
              Museion Original · {course.subject}
            </p>
            <p className="mt-1 text-micro capitalize text-ink-soft">{course.level} · {course.learnerBand}</p>
            <h1 id="course-title" className="mt-3 title-page">{course.title}</h1>
            <p className="mt-2 max-w-2xl text-lead leading-7 text-ink-soft">{course.tagline}</p>
            {/* Secondary on purpose: the page's one full-fill press lives at
                the path's current node below. Two loud buttons pointing at the
                same lesson would make neither of them the obvious one. */}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
              <Pressable
                href={`/lessons/${firstUnfinished}?course=${course.id}`}
                variant="secondary"
                className="group"
              >
                {doneCount === total ? "Revisit the path" : started ? "Continue the path" : "Start the path"}
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Pressable>
              <p className="text-label text-ink-soft">{total} lessons · about {course.estimatedMinutes} minutes</p>
            </div>
            {/* The rail appears only once there is a record to report; "Start the
                path" already says the rest, so an empty rail would be a claim
                about nothing. */}
            {started && (
              <div className="mt-4 max-w-sm">
                <ProgressRail ratio={doneCount / total} accent={accent} label={`${course.title} progress`} />
                <p className="mt-1.5 text-micro text-ink-soft">{doneCount} of {total} lessons completed</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0">
          <section aria-labelledby="sequence-title">
            <SectionHeader
              id="sequence-title"
              title={`${countWord(total).replace(/^\w/, (letter) => letter.toUpperCase())} connected investigations`}
              meta={started ? `${doneCount}/${total} completed` : undefined}
            />
            <CourseTrail
              courseId={course.id}
              subject={course.subject}
              lessons={lessons.map((lesson) => ({ id: lesson!.id, title: lesson!.title, description: lesson!.description }))}
              completed={completed}
            />
          </section>

          <section aria-labelledby="outcomes-title" className="mt-8">
            <SectionHeader id="outcomes-title" title="What this path asks you to reason about" icon={Target01Icon} accent={accent} tint={tint} />
            <Card className="p-5">
              <ul className="grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-3 text-body-sm leading-6 text-ink-soft">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                    {outcome}
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="prerequisites-title">
            <SectionHeader
              id="prerequisites-title"
              title="Before you begin"
              icon={CheckmarkCircle02Icon}
              accent="var(--color-lapis)"
              tint="var(--color-lapis-soft)"
            />
            <Card className="px-5 py-4">
              <ul className="space-y-2 text-body-sm leading-6 text-ink-soft">
                {course.prerequisites.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/25" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <section aria-labelledby="sources-title">
            {/* Lapis reads as information — the same blue the product uses for
                navigation and provenance. White on lapis is 5.4:1. */}
            <SectionHeader
              id="sources-title"
              title="Source basis"
              icon={Files02Icon}
              accent="var(--color-surface)"
              tint="var(--color-lapis)"
            />
            <Card className="px-5 py-4">
              <ul className="space-y-2 text-body-sm leading-6 text-ink-soft">
                {course.sourceLabels.map((source) => <li key={source}>{source}</li>)}
              </ul>
              <p className="mt-4 border-t border-ink/8 pt-4 text-label leading-5 text-ink-soft">
                Sources inform the facts. The pedagogy, examples, answers, and sequence are authored by
                Museion; source publishers do not endorse this course.
              </p>
            </Card>
          </section>

          {/* Gold reads as attention: this is the caveat on what finishing the
              path can be said to show, so it keeps the gold surface rather
              than the neutral one the panels above use. The mark is an ink
              glyph on solid gold (6.6:1) — gold on gold-soft is 2.5:1, under
              the 3:1 a meaningful graphic needs. */}
          <section aria-labelledby="boundary-title">
            <SectionHeader
              id="boundary-title"
              title="Evidence boundary"
              icon={AlertCircleIcon}
              accent="var(--color-ink)"
              tint="var(--color-gold)"
            />
            <Card tint="var(--color-gold-soft)" className="border-gold/25 px-5 py-4">
              <p className="text-body-sm leading-6 text-ink">{course.evidenceBoundary}</p>
            </Card>
          </section>
        </aside>
      </div>
    </div>
  );
}
