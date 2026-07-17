import { notFound } from "next/navigation";

import LessonPlayer from "@/components/LessonPlayer";
import { getLesson, toPublicLesson } from "@/lib/content";
import { getCourseLessonContext } from "@/lib/curriculum";

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ course?: string | string[] }>;
}) {
  const { lessonId } = await params;
  const { course } = await searchParams;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();
  // Only the sanitized lesson crosses to the browser: prompts and option
  // texts, never answers, solutions, or hints.
  const courseContext = typeof course === "string" ? getCourseLessonContext(course, lessonId) : undefined;
  return <LessonPlayer lesson={toPublicLesson(lesson)} mode="lesson" courseContext={courseContext} />;
}
