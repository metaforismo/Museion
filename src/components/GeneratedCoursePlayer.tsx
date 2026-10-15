"use client";

import LessonPlayer from "@/components/LessonPlayer";
import type { PublicLesson } from "@/lib/content/types";

/** Source courses use the same workspace and Maia implementation as Originals. */
export default function GeneratedCoursePlayer({ lesson }: { lesson: PublicLesson }) {
  return <LessonPlayer lesson={lesson} mode="lesson" />;
}
