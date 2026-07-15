import type { Lesson, Track } from "./types";
import binaryNumbers from "./lessons/binary-numbers";
import fractionsUnlikeDenominators from "./lessons/fractions-unlike-denominators";
import linearEquationsIntro from "./lessons/linear-equations-intro";
import negativeNumbers from "./lessons/negative-numbers";
import orderOfOperations from "./lessons/order-of-operations";

export * from "./types";
export { validateLesson } from "./validate";

const LESSONS: readonly Lesson[] = [
  linearEquationsIntro,
  orderOfOperations,
  negativeNumbers,
  fractionsUnlikeDenominators,
  binaryNumbers,
];

export function allLessons(): readonly Lesson[] {
  return LESSONS;
}

export function lessonsByTrack(): Map<Track, Lesson[]> {
  const tracks = new Map<Track, Lesson[]>();
  for (const lesson of LESSONS) {
    const group = tracks.get(lesson.track) ?? [];
    group.push(lesson);
    tracks.set(lesson.track, group);
  }
  return tracks;
}

export function getLesson(lessonId: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === lessonId);
}
