import { notFound } from "next/navigation";

import LessonPlayer from "@/components/LessonPlayer";
import { getLesson, toPublicLesson } from "@/lib/content";
import { hasPractice } from "@/lib/engine/practice";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson || !hasPractice(lesson)) notFound();
  // The session API returns the shuffled practice set; the prop here
  // only covers the loading state.
  return <LessonPlayer lesson={toPublicLesson(lesson)} mode="practice" />;
}
