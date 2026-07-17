import { getAiSettings } from "@/lib/ai/settings";
import { allLessons } from "@/lib/content";
import { hasPractice } from "@/lib/engine/practice";
import { listCompilerRuns } from "@/lib/compiler/runs";
import { listJudgeSessions } from "@/lib/judge/store";
import { stateBackend } from "@/lib/server/durable-state";
import { getProfile, listSessionsForLearner } from "@/lib/store";

import { DashboardSnapshotSchema, type DashboardSnapshot } from "./contracts";

function titleCase(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function assistanceLabel(value: "novice" | "developing" | "proficient") {
  return value === "novice" ? "more" as const : value === "developing" ? "some" as const : "light" as const;
}

function answeredConcepts(sessions: ReturnType<typeof listSessionsForLearner>) {
  const guided = new Set<string>();
  const practiced = new Set<string>();

  for (const session of sessions) {
    const destination = session.mode === "practice" ? practiced : guided;
    for (const event of session.events) {
      if (event.kind !== "answer_submitted" || typeof event.stepId !== "string") continue;
      const step = session.lesson.steps.find(({ id }) => id === event.stepId);
      if (step) destination.add(step.concept);
    }
  }

  return { guided, practiced };
}

export async function buildDashboardSnapshot(learnerId: string): Promise<DashboardSnapshot> {
  const profile = getProfile(learnerId);
  const authoredSessions = listSessionsForLearner(learnerId);
  const [generatedSessions, compilerRuns] = await Promise.all([
    listJudgeSessions(learnerId).catch(() => []),
    listCompilerRuns(learnerId).catch(() => []),
  ]);

  const activeLearning = [
    ...generatedSessions
      .filter((session) => session.transfer.status !== "scored")
      .map((session) => ({
        id: session.sessionId,
        title: session.artifact.title,
        kind: "generated" as const,
        progress: session.completedBlockIds.length / Math.max(1, Object.keys(session.blockStates).length + 1),
        detail: session.transfer.status === "active" ? "Independent check in progress" : "Interactive course",
        href: "/judge",
        updatedAt: session.updatedAt,
      })),
    ...authoredSessions
      .filter((session) => !session.complete)
      .map((session) => ({
        id: session.sessionId,
        title: session.lesson.title,
        kind: "authored" as const,
        progress: session.stepIndex / Math.max(1, session.lesson.steps.length),
        detail: `${session.stepIndex + 1} of ${session.lesson.steps.length} learning moves`,
        href: `/lessons/${session.lesson.id}`,
        updatedAt: session.events.at(-1)?.ts ? new Date(session.events.at(-1)!.ts).toISOString() : null,
      })),
  ]
    .sort((left, right) => Date.parse(right.updatedAt ?? "1970-01-01") - Date.parse(left.updatedAt ?? "1970-01-01"))
    .slice(0, 6);

  const misconceptionMap = new Map<string, DashboardSnapshot["misconceptions"][number]>();
  for (const session of authoredSessions) {
    for (const event of session.events) {
      if (event.kind !== "answer_submitted" || typeof event.misconception !== "string") continue;
      const step = session.lesson.steps.find(({ id }) => id === event.stepId);
      const misconception = step?.misconceptions.find(({ id }) => id === event.misconception);
      if (!step || !misconception) continue;
      const laterCorrect = session.events.some((candidate) =>
        candidate.kind === "answer_submitted" && candidate.stepId === step.id && candidate.correct === true && candidate.ts > event.ts,
      );
      misconceptionMap.set(`${session.lesson.id}:${misconception.id}`, {
        id: misconception.id,
        concept: titleCase(step.concept),
        label: misconception.description,
        status: laterCorrect ? "corrected-in-session" : "observed",
        observedAt: new Date(event.ts).toISOString(),
        href: `/lessons/${session.lesson.id}`,
      });
    }
  }
  const misconceptions = [...misconceptionMap.values()]
    .sort((left, right) => Date.parse(right.observedAt) - Date.parse(left.observedAt))
    .slice(0, 5);

  const lessons = allLessons();
  const reviewQueue: DashboardSnapshot["reviewQueue"] = misconceptions.map((item) => ({
    id: `misconception:${item.id}`,
    concept: item.concept,
    reason: item.status === "observed" ? "A likely misconception is still unresolved." : "Recheck after an in-session correction.",
    href: item.href,
    priority: item.status === "observed" ? "high" : "normal",
  }));
  for (const lesson of lessons) {
    if (reviewQueue.length >= 6 || !profile?.completedLessons.has(lesson.id) || !hasPractice(lesson)) continue;
    const relatedSession = authoredSessions.find((session) => session.lesson.id === lesson.id);
    if ((relatedSession?.stats().hintsUsed ?? 0) > 0 && (profile.practiceRuns.get(lesson.id) ?? 0) === 0) {
      reviewQueue.push({
        id: `practice:${lesson.id}`,
        concept: lesson.title,
        reason: "The guided lesson used hints; a hint-free practice run would add a different observation.",
        href: `/lessons/${lesson.id}/practice`,
        priority: "normal",
      });
    }
  }

  const observations = answeredConcepts(authoredSessions);
  const observedConcepts = new Set([...observations.guided, ...observations.practiced]);
  const evidence: DashboardSnapshot["evidence"] = profile
    ? [...observedConcepts].slice(0, 12).map((concept) => {
        const value = profile.mastery.mastery(concept);
        const practiced = observations.practiced.has(concept);
        return {
          concept: titleCase(concept),
          state: practiced ? "hint-free-practice" as const : "observed-guided" as const,
          result: value >= 0.7 ? "consistent" as const : "developing" as const,
          support: assistanceLabel(profile.mastery.scaffoldingLevel(concept)),
        };
      })
    : [];

  for (const session of generatedSessions) {
    if (session.transfer.status !== "scored" || session.transfer.correct === null) continue;
    evidence.unshift({
      concept: session.artifact.title,
      state: "immediate-transfer",
      result: session.transfer.correct ? "correct" : "incorrect",
      support: "light",
    });
  }

  const transferActive = generatedSessions.find((session) => session.transfer.status === "active");
  const generatedIncomplete = generatedSessions.find((session) => session.transfer.status !== "scored");
  const authoredIncomplete = authoredSessions.find((session) => !session.complete);
  const failedTransfer = generatedSessions.find((session) => session.transfer.status === "scored" && session.transfer.correct === false);
  const freshCourse = compilerRuns.find((run) => !generatedSessions.some((session) => session.artifact.id === run.artifact.id));
  const firstLesson = lessons[0];
  const nextAction = transferActive
    ? { kind: "resume" as const, title: `Finish ${transferActive.artifact.title}`, description: "Complete the independent check without tutor help.", href: "/judge", reason: "An independent check is already active." }
    : generatedIncomplete
      ? { kind: "resume" as const, title: `Continue ${generatedIncomplete.artifact.title}`, description: "Return to the next unfinished interactive block.", href: "/judge", reason: "This is your most recent incomplete generated course." }
      : authoredIncomplete
        ? { kind: "resume" as const, title: `Continue ${authoredIncomplete.lesson.title}`, description: `Resume at learning move ${authoredIncomplete.stepIndex + 1}.`, href: `/lessons/${authoredIncomplete.lesson.id}`, reason: "This is your most recent incomplete authored lesson." }
        : failedTransfer
          ? { kind: "review" as const, title: `Review ${failedTransfer.artifact.title}`, description: "Revisit the underlying rule before another independent check.", href: "/review", reason: "The latest immediate transfer observation was not correct." }
          : reviewQueue[0]
            ? { kind: "review" as const, title: `Review ${reviewQueue[0].concept}`, description: reviewQueue[0].reason, href: reviewQueue[0].href, reason: "A recorded learning signal makes this the highest-priority review." }
            : freshCourse
              ? { kind: "launch" as const, title: `Start ${freshCourse.artifact.title}`, description: "Open the newly validated course.", href: `/learn/${freshCourse.runId}`, reason: "This validated course has not been launched yet." }
              : authoredSessions.length === 0
                ? { kind: "launch" as const, title: `Start ${firstLesson.title}`, description: "Make your first checked learning move.", href: `/lessons/${firstLesson.id}`, reason: "There is no learning record yet." }
                : { kind: "create" as const, title: "Create a course from a source", description: "Bring a document you want to understand.", href: "/create", reason: "There is no unfinished or high-priority review item." };

  const settings = getAiSettings();
  return DashboardSnapshotSchema.parse({
    schemaVersion: "1.0",
    nextAction,
    activeLearning,
    reviewQueue,
    evidence: evidence.slice(0, 12),
    misconceptions,
    recentSources: compilerRuns.slice(0, 4).map((run) => ({
      id: run.runId,
      title: run.document.title,
      pages: run.document.pages,
      templateId: run.templateId,
      createdAt: run.createdAt,
      href: `/learn/${run.runId}`,
    })),
    runtime: {
      provider: settings.provider,
      label: settings.provider === "codex" ? "ChatGPT via Codex" : settings.provider === "offline" ? "Offline demo" : "OpenAI API",
      // Authored lesson state is process-local today even when generated jobs
      // use Supabase. Never imply that the whole learning record is synced.
      persistence: stateBackend().kind === "supabase" ? "hybrid" : "process-local",
    },
    limitations: [
      "Guided work and hint-free practice are session observations, not proof of retained mastery.",
      "Retention is not measured until a delayed check is completed.",
      stateBackend().kind === "memory" ? "Local learning records expire and are not shared across servers." : "Generated sessions and compiler runs have bounded retention windows.",
    ],
    generatedAt: new Date().toISOString(),
  });
}
