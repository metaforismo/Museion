import type { AnswerSpec, Lesson, Step } from "@/lib/content/types";
import type { CourseArtifactV2, LearningBlock } from "./schemas/course-artifact";
import type { SourceGraph } from "./schemas/source-graph";
import { getPrivateCompilerRun } from "./runs";

export const generatedLessonId = (runId: string) => `generated:${runId}`;

/** One trusted adapter feeds the same persistent session, deterministic
 * checker and Maia workspace used by Originals. Validation is a launch gate;
 * generated answer specifications remain provisional source-based content. */
export function generatedArtifactLesson(runId: string, artifact: CourseArtifactV2, graph: SourceGraph, sourceTitle: string, mode: "live" | "replay"): Lesson {
  if (artifact.validation.status !== "accepted" || artifact.validation.blockingIssueCount !== 0 || artifact.lessons.length !== 1) throw new Error("GENERATED_COURSE_NOT_ACCEPTED");
  const namespace = `generated:${runId}:`;
  const concept = (block: LearningBlock) => namespace + (block.conceptIds[0] ?? artifact.concepts[0].id);
  const citations = (block: LearningBlock) => block.citations.map(({ spanId }) => {
    const span = graph.spans[spanId];
    if (!span) throw new Error("GENERATED_COURSE_NOT_ACCEPTED");
    return { label: `${sourceTitle} · page ${span.pageNumber}`, quote: span.exactText };
  });
  const misconceptions = (block: LearningBlock) => Object.values(artifact.misconceptions).filter((item) => block.conceptIds.includes(item.conceptId)).map((item) => ({ id: item.id, triggerAnswers: item.triggerAnswers, description: item.description, remediationFocus: item.remediationFocus }));
  const answer = (block: Extract<LearningBlock, { kind: "guided-response" | "transfer-challenge" }>): AnswerSpec => {
    const spec = artifact.answerSpecs[block.answerSpecId];
    if (!spec || spec.kind !== block.responseKind) throw new Error("GENERATED_COURSE_NOT_ACCEPTED");
    if (spec.kind === "multiple-choice") return { kind: "multipleChoice", options: block.options, correctIndex: spec.correctIndex };
    if (spec.kind === "numeric") return { kind: "numeric", value: spec.value, tolerance: spec.tolerance };
    return { kind: "expression", acceptedForms: spec.acceptedForms };
  };
  const steps: Step[] = [];
  let explanations: NonNullable<Step["explanation"]> = [];
  for (const id of [...artifact.lessons[0].blockIds, ...artifact.transferBlockIds]) {
    const block = artifact.blocks[id];
    if (!block) throw new Error("GENERATED_COURSE_NOT_ACCEPTED");
    if (block.kind === "explanation") { explanations.push({ title: block.title, body: block.body }); continue; }
    const common = { id: block.id, concept: concept(block), prompt: block.prompt, explanation: explanations, citations: citations(block), misconceptions: misconceptions(block) };
    explanations = [];
    if (block.kind === "prediction-choice") {
      steps.push({ ...common, answer: { kind: "multipleChoice", options: block.options, correctIndex: block.correctIndex }, solution: block.reveal, hints: ["Compare each option with the source explanation. Which claim does the evidence support?"], misconceptions: common.misconceptions.map((item) => ({ ...item, triggerAnswers: [...item.triggerAnswers, ...Object.entries(block.misconceptionByIndex).filter(([, id]) => id === item.id).map(([index]) => block.options[Number(index)])] })) });
    } else if (block.kind === "guided-response") {
      steps.push({ ...common, answer: answer(block), solution: block.solution, hints: block.hints });
    } else if (block.kind === "transfer-challenge") {
      steps.push({ ...common, answer: answer(block), solution: "Your response matches this course's source-based answer specification.", hints: [], assistancePolicy: "none" });
    } else {
      steps.push({ ...common, answer: { kind: "expression", acceptedForms: ["runtime-complete"] }, runtimeBlock: block, solution: "Every move in this activity satisfies the course's deterministic checks.", hints: [block.kind === "sequence-builder" ? "Which step must happen before the next one can make sense?" : "Compare the current midpoint with the target. Which candidates can still remain?"] });
    }
  }
  if (!steps.length) throw new Error("GENERATED_COURSE_NOT_ACCEPTED");
  if (explanations.length) steps[steps.length - 1].explanation = [...(steps.at(-1)!.explanation ?? []), ...explanations];
  return { id: generatedLessonId(runId), title: artifact.title, track: "Your sources", description: artifact.bigQuestion, concepts: artifact.concepts.map((item) => namespace + item.id), steps, generatedFrom: { runId, sourceTitle, mode } };
}

export async function ownedGeneratedLesson(lessonId: string, ownerId: string): Promise<Lesson | undefined> {
  if (!lessonId.startsWith("generated:")) return undefined;
  const runId = lessonId.slice("generated:".length);
  const record = await getPrivateCompilerRun(runId, ownerId);
  return generatedArtifactLesson(runId, record.result.artifact, record.result.sourceGraph, record.document.title, record.result.mode);
}
