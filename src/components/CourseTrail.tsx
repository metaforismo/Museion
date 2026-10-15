import CourseLearningPath from "@/components/CourseLearningPath";
import { buildTrail } from "@/lib/design/course-trail";

export interface TrailLesson { id: string; title: string; description: string; }

/** Authored courses recommend an order; every existing lesson remains available. */
export default function CourseTrail({ courseId, subject, lessons, completed, justCompleted = null, level = "foundation" }: {
  courseId: string; subject: string; lessons: TrailLesson[]; completed: ReadonlySet<string>; justCompleted?: string | null; level?: string;
}) {
  const trail = buildTrail(lessons.map(({ id }) => id), completed);
  const started = trail.some(({ state }) => state === "done");
  return <CourseLearningPath subject={subject} eyebrow={`${level} · ${subject}`} title="Your learning path" justCompletedId={justCompleted} nodes={lessons.map((lesson, index) => ({
    ...lesson, state: trail[index].state, href: `/lessons/${lesson.id}?course=${courseId}`, actionLabel: started ? "Continue lesson" : "Start lesson",
  }))} />;
}
