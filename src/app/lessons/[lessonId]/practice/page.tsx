import { notFound } from "next/navigation";

import LessonPlayer from "@/components/LessonPlayer";
import { getLesson, toPublicLesson } from "@/lib/content";
import { hasPractice } from "@/lib/engine/practice";
import { getCourseLessonContext } from "@/lib/curriculum";

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ course?: string | string[] }>;
}) {
  const { lessonId } = await params;
  const { course } = await searchParams;
  const lesson = getLesson(lessonId);
  if (!lesson || !hasPractice(lesson)) notFound();
  // The session API returns the shuffled practice set; the prop here
  // only covers the loading state.
  const courseContext = typeof course === "string" ? getCourseLessonContext(course, lessonId) : undefined;
  return <LessonPlayer lesson={toPublicLesson(lesson)} mode="practice" courseContext={courseContext} />;
}
