import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AppIcon from "@/components/AppIcon";
import { getLesson } from "@/lib/content";
import { coursePaths, getCoursePath } from "@/lib/curriculum";

type Props = { params: Promise<{ courseId: string }> };

export function generateStaticParams() {
  return coursePaths.map(({ id }) => ({ courseId: id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = getCoursePath((await params).courseId);
  return course ? { title: course.title, description: course.tagline } : { title: "Course not found" };
}

export default async function CoursePage({ params }: Props) {
  const course = getCoursePath((await params).courseId);
  if (!course) notFound();
  const lessons = course.lessonIds.map((lessonId) => getLesson(lessonId));
  if (lessons.some((lesson) => !lesson)) notFound();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-soft"><Link href="/library" className="hover:text-lapis-dark">Library</Link><span aria-hidden="true"> / </span><span aria-current="page">{course.title}</span></nav>
      <header className="mt-6 overflow-hidden rounded-[2rem] border border-ink/10 bg-ink text-white shadow-[0_24px_70px_rgba(19,28,49,.16)]">
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)]">
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-soft">Museion-authored · {course.subject}</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">{course.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">{course.tagline}</p>
            <div className="mt-7 flex flex-wrap gap-2 text-sm text-white/75"><span className="rounded-full border border-white/15 px-3 py-1.5">{course.lessonIds.length} lessons</span><span className="rounded-full border border-white/15 px-3 py-1.5">About {course.estimatedMinutes} minutes</span><span className="rounded-full border border-white/15 px-3 py-1.5">{course.learnerBand}</span></div>
            <Link href={`/lessons/${course.lessonIds[0]}`} className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft">Start the path <span className="ml-2" aria-hidden="true">→</span></Link>
          </div>
          <div className="relative min-h-64 overflow-hidden border-t border-white/10 bg-lapis-dark lg:border-l lg:border-t-0">
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-[4.5rem] border-[3rem] border-white/15" />
            <div className="absolute inset-0 grid place-items-center p-8"><div className="grid h-28 w-28 place-items-center rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur"><AppIcon name="lesson" className="h-12 w-12 text-white" /></div></div>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div>
          <section aria-labelledby="sequence-title"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-lapis-dark">Learning sequence</p><h2 id="sequence-title" className="mt-2 font-display text-3xl font-semibold tracking-[-0.035em]">Three connected investigations</h2>
            <ol className="mt-5 space-y-3">{lessons.map((lesson, index) => lesson && <li key={lesson.id}><Link href={`/lessons/${lesson.id}`} className="group grid gap-4 rounded-[1.35rem] border border-ink/10 bg-surface p-5 shadow-[var(--shadow-tight)] transition hover:-translate-y-0.5 hover:border-lapis/30 sm:grid-cols-[3.2rem_minmax(0,1fr)_auto] sm:items-center"><span className="grid h-12 w-12 place-items-center rounded-xl bg-lapis-soft font-mono text-sm font-semibold text-lapis-dark">{String(index + 1).padStart(2, "0")}</span><span><span className="block text-lg font-semibold group-hover:text-lapis-dark">{lesson.title}</span><span className="mt-1 block text-sm leading-6 text-ink-soft">{lesson.description}</span></span><span className="text-sm font-semibold text-lapis-dark">Open <span aria-hidden="true">→</span></span></Link></li>)}</ol>
          </section>
          <section aria-labelledby="outcomes-title" className="mt-8 rounded-[1.5rem] border border-ink/10 bg-surface p-6"><h2 id="outcomes-title" className="text-xl font-semibold">What this path asks you to reason about</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{course.outcomes.map((outcome) => <li key={outcome} className="flex gap-3 text-sm leading-6 text-ink-soft"><span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-correct" />{outcome}</li>)}</ul></section>
        </div>
        <aside className="space-y-4">
          <section className="rounded-[1.35rem] border border-ink/10 bg-surface p-5"><h2 className="font-semibold">Before you begin</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-ink-soft">{course.prerequisites.map((item) => <li key={item}>• {item}</li>)}</ul></section>
          <section className="rounded-[1.35rem] border border-ink/10 bg-surface p-5"><h2 className="font-semibold">Source basis</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-ink-soft">{course.sourceLabels.map((source) => <li key={source}>{source}</li>)}</ul><p className="mt-4 border-t border-ink/8 pt-4 text-xs leading-5 text-ink-soft">Sources inform the facts. The pedagogy, examples, answers, and sequence are authored by Museion; source publishers do not endorse this course.</p></section>
          <section className="rounded-[1.35rem] border border-gold/25 bg-gold-soft p-5"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">Evidence boundary</p><p className="mt-2 text-sm leading-6 text-ink-soft">{course.evidenceBoundary}</p></section>
        </aside>
      </div>
    </div>
  );
}
