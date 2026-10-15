import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import CoursePathLayout from "@/components/CoursePathLayout";
import CourseTrail from "@/components/CourseTrail";
import SubjectIcon from "@/components/SubjectIcon";
import TrailArrivalCleanup from "@/components/TrailArrivalCleanup";
import { ProgressRail } from "@/components/ui";
import { getLesson } from "@/lib/content";
import { coursePaths, getCoursePath } from "@/lib/curriculum";
import { subjectColor, subjectTint } from "@/lib/curriculum/subjects";
import { courseArtSrc } from "@/lib/design/assets";
import { currentActor } from "@/lib/server/actor";
import { learnerProfile } from "@/lib/server/session-repository";
import styles from "./course.module.css";

type Props = { params: Promise<{ courseId: string }>; searchParams: Promise<{ completed?: string | string[] }> };
export const dynamic = "force-dynamic";
export function generateStaticParams() { return coursePaths.map(({ id }) => ({ courseId: id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = getCoursePath((await params).courseId);
  return course ? { title: course.title, description: course.tagline } : { title: "Course not found" };
}

export default async function CoursePage({ params, searchParams }: Props) {
  const course = getCoursePath((await params).courseId);
  if (!course) notFound();
  const lessons = course.lessonIds.map((lessonId) => getLesson(lessonId));
  if (lessons.some((lesson) => !lesson)) notFound();
  const learnerId = (await currentActor()).ownerId;
  const completed = (await learnerProfile(learnerId, false))?.completedLessons ?? new Set<string>();
  const { completed: completedParam } = await searchParams;
  // A URL alone can never award completion or trigger a completion animation.
  const justCompleted = typeof completedParam === "string" && completed.has(completedParam) && course.lessonIds.includes(completedParam) ? completedParam : null;
  const total = course.lessonIds.length;
  const doneCount = course.lessonIds.filter((id) => completed.has(id)).length;
  const accent = subjectColor(course.subject);
  const tint = subjectTint(course.subject);
  const art = courseArtSrc(course.id);
  const surfaceStyle = { "--course-accent": accent, "--course-tint": tint } as CSSProperties;

  return (
    <div className={styles.page} style={surfaceStyle}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}><Link href="/library">← Library</Link><span aria-hidden="true">/</span><span aria-current="page">{course.subject}</span></nav>
      <CoursePathLayout overview={<>
        <section className={styles.card} aria-labelledby="course-title">
          <div className={styles.art}>{art ? (
            // eslint-disable-next-line @next/next/no-img-element -- fixed-size decorative artwork shared with the catalog
            <img src={art} alt="" aria-hidden="true" width={144} height={144} />
          ) : <SubjectIcon subject={course.subject} variant="object" size={144} />}</div>
          <div className={styles.body}>
            <p className={styles.original}>Museion Original · {course.subject}</p>
            <h1 id="course-title" className={styles.title}>{course.title}</h1>
            <p className={styles.tagline}>{course.tagline}</p>
            <div className={styles.metrics}><span>{total} lessons</span><span>About {course.estimatedMinutes} min</span></div>
            <p className={styles.band}>{course.learnerBand}</p>
            {doneCount > 0 && <div className={styles.progress}><ProgressRail ratio={doneCount / total} accent={accent} label={`${course.title} progress`} showValue={false} /><p>{doneCount} of {total} lessons completed</p></div>}
          </div>
        </section>
        <details className={styles.details}>
          <summary>About this course</summary>
          <section aria-labelledby="outcomes-title"><h2 id="outcomes-title">What you will explore</h2><ul>{course.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></section>
          <section aria-labelledby="prerequisites-title"><h2 id="prerequisites-title">Before you begin</h2><ul>{course.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section aria-labelledby="sources-title"><h2 id="sources-title">Source basis</h2><ul>{course.sourceLabels.map((source) => <li key={source}>{source}</li>)}</ul><p>Sources inform the facts. The sequence, activities, and examples are authored by Museion; source publishers do not endorse this course.</p></section>
        </details>
      </>}>
        <CourseTrail courseId={course.id} subject={course.subject} level={course.level} lessons={lessons.map((lesson) => ({ id: lesson!.id, title: lesson!.title, description: lesson!.description }))} completed={completed} justCompleted={justCompleted} />
        {completedParam !== undefined && <TrailArrivalCleanup />}
        <details className={styles.pathFooter}><summary>What completion shows</summary><p>{course.evidenceBoundary}</p></details>
      </CoursePathLayout>
    </div>
  );
}
