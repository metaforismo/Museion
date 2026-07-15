import type { Lesson } from "@/lib/content";

import { canonicalSha256 } from "./canonical";
import { CourseArtifactV2Schema, type CourseArtifactV2 } from "./schemas/course-artifact";

const safeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^[^a-z]+/, "id_");

export async function adaptLegacyLesson(
  lesson: Lesson,
  generatedAt: string,
): Promise<CourseArtifactV2> {
  const sourceSha256 = await canonicalSha256(lesson);
  const conceptIds = lesson.concepts.map(safeId);
  const objectiveIds = conceptIds.map((id) => `objective_${id}`);
  const blocks = Object.fromEntries(
    lesson.steps.map((step) => {
      const id = safeId(`block_${step.id}`);
      const conceptId = safeId(step.concept);
      const answerSpecId = safeId(`answer_${step.id}`);
      return [id, {
        id,
        kind: "guided-response",
        objectiveIds: [`objective_${conceptId}`],
        conceptIds: [conceptId],
        citations: [],
        estimatedSeconds: 90,
        accessibilityLabel: step.prompt,
        prompt: step.prompt,
        responseKind: step.answer.kind === "multipleChoice" ? "multiple-choice" : step.answer.kind,
        options: step.answer.kind === "multipleChoice" ? step.answer.options : [],
        answerSpecId,
        solution: step.solution,
        hints: step.hints,
        misconceptionIds: step.misconceptions.map((item) => safeId(`misconception_${step.id}_${item.id}`)),
      }];
    }),
  );
  const answerSpecs = Object.fromEntries(lesson.steps.map((step) => {
    const id = safeId(`answer_${step.id}`);
    if (step.answer.kind === "multipleChoice") return [id, { id, kind: "multiple-choice", correctIndex: step.answer.correctIndex }];
    if (step.answer.kind === "expression") return [id, { id, kind: "expression", acceptedForms: step.answer.acceptedForms }];
    return [id, { id, kind: "numeric", value: step.answer.value, tolerance: step.answer.tolerance }];
  }));
  const misconceptions = Object.fromEntries(lesson.steps.flatMap((step) => step.misconceptions.map((item) => {
    const id = safeId(`misconception_${step.id}_${item.id}`);
    return [id, { id, conceptId: safeId(step.concept), triggerAnswers: item.triggerAnswers, description: item.description, remediationFocus: item.remediationFocus, citations: [] }];
  })));
  return CourseArtifactV2Schema.parse({
    schemaVersion: "2.0",
    id: safeId(`legacy_${lesson.id}`),
    title: lesson.title,
    source: { origin: "legacy_v1", sourceId: lesson.id, sourceSha256, sourceGraphSha256: null },
    audience: { level: "novice", language: "en", targetMinutes: Math.max(3, Math.ceil(lesson.steps.length * 1.5)), learnerGoal: lesson.description },
    description: lesson.description,
    bigQuestion: lesson.description,
    objectives: conceptIds.map((id, index) => ({ id: objectiveIds[index], statement: `Apply ${lesson.concepts[index]}.`, conceptIds: [id] })),
    concepts: conceptIds.map((id, index) => ({ id, label: lesson.concepts[index], prerequisiteIds: [], sourceConceptId: null })),
    lessons: [{ id: safeId(`lesson_${lesson.id}`), title: lesson.title, objectiveIds, blockIds: Object.keys(blocks) }],
    blocks,
    answerSpecs,
    misconceptions,
    transferBlockIds: [],
    validation: { validatorVersion: "legacy-adapter-v1", status: "needs-review", blockingIssueCount: 0, warningCount: 1, validatedAt: generatedAt },
    provenance: { compilerVersion: "legacy-adapter-v1", promptBundleVersion: "none", model: "none", generatedAt, deterministicSeed: sourceSha256.slice(0, 16), generationRunId: `legacy_${sourceSha256.slice(0, 16)}` },
  });
}
