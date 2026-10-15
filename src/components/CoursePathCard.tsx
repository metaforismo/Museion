import Link from "next/link";
import type { CSSProperties } from "react";
import ProgressRing from "@/components/ProgressRing";
import SubjectIcon from "@/components/SubjectIcon";
import type { CoursePath } from "@/lib/curriculum";
import { subjectColor, subjectDeep, subjectTint } from "@/lib/curriculum/subjects";
import { courseArtSrc } from "@/lib/design/assets";
import styles from "./CoursePathCard.module.css";

/** A course always opens its path. Progress is present only when a record was read. */
export default function CoursePathCard({ course, progress, band = false }: {
  course: CoursePath; progress?: { completed: number; total: number }; band?: boolean;
}) {
  const accent = subjectColor(course.subject);
  const tint = subjectTint(course.subject);
  const art = courseArtSrc(course.id);
  const started = (progress?.completed ?? 0) > 0;
  const complete = progress !== undefined && progress.total > 0 && progress.completed >= progress.total;
  const cta = progress === undefined ? "Open path" : complete ? "Revisit" : started ? "Continue" : "Start";
  return (
    <Link href={`/courses/${course.id}`} className={styles.card} style={{ "--course-accent": accent, "--course-tint": tint, "--course-edge": subjectDeep(course.subject) } as CSSProperties}>
      <div className={styles.cover}>
        <span className={styles.subject}>{course.subject}</span>
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element -- fixed-size decorative course artwork shared with its path overview
          <img src={art} alt="" aria-hidden="true" width={102} height={102} className={styles.art} />
        ) : <SubjectIcon subject={course.subject} variant="object" size={102} className={styles.art} />}
        {started && progress && <ProgressRing completed={progress.completed} total={progress.total} color={accent} size={34} className={styles.progress} />}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{course.title}</h3><p className={styles.tagline}>{course.tagline}</p>
        <div className={styles.footer}><div className={styles.facts}><span>{course.lessonIds.length} lessons · {course.estimatedMinutes} min</span><span aria-hidden="true" className={styles.cta}>{cta}<span>→</span></span></div>{band && <p className={styles.band}>{course.learnerBand}</p>}</div>
      </div>
    </Link>
  );
}
