import type { Lesson } from "./types";
import fractionsUnlikeDenominators from "./lessons/fractions-unlike-denominators";
import linearEquationsIntro from "./lessons/linear-equations-intro";

export * from "./types";

const LESSONS: readonly Lesson[] = [
  linearEquationsIntro,
  fractionsUnlikeDenominators,
];

export function allLessons(): readonly Lesson[] {
  return LESSONS;
}

export function getLesson(lessonId: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === lessonId);
}
