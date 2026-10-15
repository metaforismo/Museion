import { notFound } from "next/navigation";
import GeneratedCoursePlayer from "@/components/GeneratedCoursePlayer";
import { generatedLessonId, ownedGeneratedLesson } from "@/lib/compiler/lesson-adapter";
import { toPublicLesson } from "@/lib/content";
import { currentActor } from "@/lib/server/actor";

export default async function GeneratedLearnerPage({ params }: { params: Promise<{ runId: string }> }) {
  const actor = await currentActor();
  if (actor.kind !== "account") notFound();
  const lesson = await ownedGeneratedLesson(generatedLessonId((await params).runId), actor.ownerId).catch(() => undefined);
  if (!lesson) notFound();
  return <GeneratedCoursePlayer lesson={toPublicLesson(lesson)} />;
}
