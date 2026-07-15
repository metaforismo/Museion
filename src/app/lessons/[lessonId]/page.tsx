import { notFound } from "next/navigation";

import LessonPlayer from "@/components/LessonPlayer";
import { getLesson, toPublicLesson } from "@/lib/content";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();
  // Only the sanitized lesson crosses to the browser: prompts and option
  // texts, never answers, solutions, or hints.
  return <LessonPlayer lesson={toPublicLesson(lesson)} mode="lesson" />;
}
