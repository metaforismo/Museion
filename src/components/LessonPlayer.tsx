"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ActivityTarget from "@/components/ActivityTarget";
import styles from "./lesson-workspace.module.css";
import { authoredUiActions } from "@/lib/maia/ui-targets";
import { guidanceMatchesScope, type MaiaGuidance } from "@/lib/maia/proactive";
import type { TutorUiAction } from "@/lib/maia/contracts";
import InteractiveBlock from "@/components/blocks/InteractiveBlock";
import { conceptLabel } from "@/lib/learning/concept-label";
import type { RuntimeState, RuntimeAction } from "@/lib/runtime";
import GraphTransformLab from "@/components/GraphTransformLab";
import MaiaCharacter from "@/components/MaiaCharacter";
import MaiaPanel, { type MaiaOutbox } from "@/components/MaiaPanel";
import RecursionCodeLab from "@/components/RecursionCodeLab";
import { Pressable } from "@/components/ui";
import type {
  AnswerResponse,
  ChatMessage,
  HintResponse,
  SessionMode,
  SessionStateResponse,
  SessionStats,
} from "@/lib/api-types";
import {
  fetchWithTimeout,
  RequestTimeoutError,
} from "@/lib/client/fetch-with-timeout";
import { sessionStorageKey } from "@/lib/client/storage";
import { openLessonSession } from "@/lib/client/open-lesson-session";
import type { MisconceptionHighlight, PublicLesson, PublicStep } from "@/lib/content/types";
import type { LabActivity } from "@/lib/maia/activity";
import type { CourseLessonContext } from "@/lib/curriculum";
import { subjectColor, subjectDeep } from "@/lib/curriculum/subjects";

type Feedback =
  | { kind: "correct"; mastery: number; solution: string | null }
  | { kind: "wrong"; attempts: number; highlight: MisconceptionHighlight | null }
  | null;

type PendingAction = "answer" | "advance" | "hint" | "recover" | null;

interface MutationCommand {
  expectedStepId: string;
  expectedVersion: number;
  idempotencyKey: string;
}

type RetryableMutation =
  | ({ kind: "answer"; answer: string } & MutationCommand)
  | ({ kind: "advance" } & MutationCommand)
  | ({ kind: "hint" } & MutationCommand);

const ASK_WHY_MESSAGE =
  "I just answered wrong and I'm not sure why. Can you help me see it?";

const selfExplainMessage = (explanation: string) =>
  `Here's my one-sentence explanation of why this step works: "${explanation}". ` +
  "Is my reasoning sound? Reply in one or two sentences.";

interface PlayerProps {
  /** The statically-known lesson; practice sessions override its steps. */
  lesson: PublicLesson;
  mode: SessionMode;
  courseContext?: CourseLessonContext;
}

export default function LessonPlayer({ lesson, mode, courseContext }: PlayerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  // The authoritative lesson comes from the session (shuffled in
  // practice mode); the prop only covers the loading state.
  const [activeLesson, setActiveLesson] = useState<PublicLesson>(lesson);
  const [stepIndex, setStepIndex] = useState(0);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [complete, setComplete] = useState(false);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [runtimeState, setRuntimeState] = useState<RuntimeState | null>(null);
  const [runtimeLastAction, setRuntimeLastAction] = useState<RuntimeAction | null>(null);
  const [runtimeNote, setRuntimeNote] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [hintNote, setHintNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [retryMutation, setRetryMutation] = useState<RetryableMutation | null>(null);
  const [recoveryNeeded, setRecoveryNeeded] = useState(false);
  const [outbox, setOutbox] = useState<MaiaOutbox | null>(null);
  const [visibleGuidance, setVisibleGuidance] = useState<MaiaGuidance | null>(null);
  const [proactiveGuidance, setProactiveGuidance] = useState<MaiaGuidance | null>(null);
  const [tutorMarks, setTutorMarks] = useState<{ stepId: string; variantIndex: number; version: number; actions: TutorUiAction[] } | null>(null);
  const [initialChat, setInitialChat] = useState<ChatMessage[]>([]);
  // Holds the Check pressable down through the wrong-answer beat: the key
  // deflates with the shake, then springs back. Timer-driven rather than
  // animation-driven so reduced motion (animation: none) still releases it.
  const [checkDeflated, setCheckDeflated] = useState(false);
  const [variantIndex, setVariantIndex] = useState(0);
  const [lastAttempt, setLastAttempt] = useState<SessionStateResponse["lastAttempt"]>(null);
  const [restoredControlsKey, setRestoredControlsKey] = useState(0);
  const [answerFocusRequest, setAnswerFocusRequest] = useState(0);
  const [chatSyncKey, setChatSyncKey] = useState(0);
  const outboxSeq = useRef(0);
  const actionInFlight = useRef(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const activityColumnRef = useRef<HTMLElement>(null);
  const promptRef = useRef<HTMLParagraphElement>(null);
  const previousActivity = useRef<string | null>(null);
  const activityJustChanged = useRef(false);
  const backHref = lesson.generatedFrom ? `/create/review/${lesson.generatedFrom.runId}` : courseContext ? `/courses/${courseContext.courseId}` : "/library";
  const backLabel = lesson.generatedFrom ? "Back to course review" : courseContext ? `Back to ${courseContext.courseTitle}` : "Back to Library";
  // The subject's press pair for the Check control — accent fill with its
  // deep edge, both from the palette. Components never darken a colour.
  const accent = subjectColor(activeLesson.track);
  const accentEdge = subjectDeep(activeLesson.track);

  const beginAction = useCallback((action: Exclude<PendingAction, null>) => {
    if (actionInFlight.current) return false;
    actionInFlight.current = true;
    setBusy(true);
    setPendingAction(action);
    if (action !== "recover") setRequestError(null);
    return true;
  }, []);

  const finishAction = useCallback(() => {
    actionInFlight.current = false;
    setBusy(false);
    setPendingAction(null);
  }, []);

  // Live, unchecked widget state (labs report as the learner works).
  // Sent alongside Maia messages so she can see the canvas; the server
  // cross-checks it against the active step before trusting it.
  const labActivityRef = useRef<LabActivity | null>(null);
  const reportLabState = useCallback((activity: LabActivity) => {
    labActivityRef.current = activity;
  }, []);
  const getLabActivity = useCallback(() => labActivityRef.current, []);

  const sendToMaia = useCallback((text: string, targetStepId: string) => {
    outboxSeq.current += 1;
    setOutbox({ id: outboxSeq.current, text, stepId: targetStepId });
  }, []);

  const applyState = useCallback((state: SessionStateResponse) => {
    setRuntimeState(state.runtimeState ?? null);
    setRuntimeLastAction(state.runtimeLastAction ?? null);
    setRuntimeNote(null);
    setActiveLesson(state.lesson);
    setStepIndex(state.stepIndex);
    setSessionVersion(state.sessionVersion);
    setComplete(state.complete);
    setStats(state.stats);
    setFeedback(
      state.awaitingAdvance && state.solvedStep
        ? {
            kind: "correct",
            mastery: state.solvedStep.mastery,
            solution: state.solvedStep.solution,
          }
        : null,
    );
    setHints(state.revealedHints);
    setVariantIndex(state.activeVariantIndex ?? 0);
    setLastAttempt(state.lastAttempt ?? null);
    setRestoredControlsKey((key) => key + 1);
    setInitialChat(state.chatHistory);
    setProactiveGuidance(state.proactiveGuidance ?? null);
    setSessionId(state.sessionId);
    setRequestError(null);
    setRetryMutation(null);
    setRecoveryNeeded(false);
  }, []);

  // Local pointers are only a cache. Recover durable account-owned work
  // before creating a run, including after sign-out or on another browser.
  useEffect(() => {
    let cancelled = false;
    const storeKey = sessionStorageKey(lesson.id, mode);
    const forceNew = new URL(window.location.href).searchParams.get("restart") === "1";
    let savedSessionId: string | null = null;
    try { savedSessionId = localStorage.getItem(storeKey); } catch { /* Browser storage is optional. */ }

    async function open(): Promise<void> {
      try {
        const state = await openLessonSession(lesson.id, mode, { savedSessionId, forceNew });
        if (cancelled) return;
        try { localStorage.setItem(storeKey, state.sessionId); } catch { /* The server keeps the session. */ }
        if (forceNew) {
          const url = new URL(window.location.href);
          url.searchParams.delete("restart");
          window.history.replaceState(window.history.state, "", url);
        }
        applyState(state);
      } catch {
        if (!cancelled) setRequestError("The lesson session could not be opened. Try reloading the page.");
      }
    }

    void open();
    return () => { cancelled = true; };
  }, [lesson.id, mode, applyState]);

  // Display the authored variant the engine says is active. Identity
  // (id) stays with the base step so guards and records line up.
  const step: PublicStep | undefined = useMemo(() => {
    const baseStep = activeLesson.steps[stepIndex];
    const variantSurface = variantIndex > 0 ? baseStep?.variants?.[variantIndex - 1] : undefined;
    return baseStep && variantSurface
      ? { ...baseStep, prompt: variantSurface.prompt, kind: variantSurface.kind, options: variantSurface.options, graph: variantSurface.graph }
      : baseStep;
  }, [activeLesson, stepIndex, variantIndex]);

  const activityIdentity = step && sessionId ? `${sessionId}:${step.id}:${variantIndex}` : null;
  useEffect(() => {
    if (!activityIdentity || previousActivity.current === activityIdentity) return;
    const hadActivity = previousActivity.current !== null;
    previousActivity.current = activityIdentity;
    activityJustChanged.current = hadActivity;
    activityColumnRef.current?.scrollTo({ top: 0, behavior: "instant" });
    if (hadActivity) {
      promptRef.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 1023px)").matches) {
        promptRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
      }
    }
  }, [activityIdentity]);

  useEffect(() => {
    if (activityJustChanged.current) { activityJustChanged.current = false; return; }
    if (!feedback) return;
    feedbackRef.current?.focus({ preventScroll: true });
    feedbackRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [feedback]);

  const deflateTimer = useRef(0);
  const deflateCheck = useCallback(() => {
    window.clearTimeout(deflateTimer.current);
    setCheckDeflated(true);
    deflateTimer.current = window.setTimeout(() => setCheckDeflated(false), 420);
  }, []);
  useEffect(() => () => window.clearTimeout(deflateTimer.current), []);

  const submitAnswer = useCallback(
    async (answer: string, retry?: Extract<RetryableMutation, { kind: "answer" }>) => {
      if (!sessionId || !step || !beginAction("answer")) return;
      const mutation: Extract<RetryableMutation, { kind: "answer" }> = retry ?? {
        kind: "answer",
        answer,
        expectedStepId: step.id,
        expectedVersion: sessionVersion,
        idempotencyKey: crypto.randomUUID(),
      };
      try {
        const res = await fetchWithTimeout(`/api/sessions/${sessionId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answer: mutation.answer,
            expectedStepId: mutation.expectedStepId,
            expectedVersion: mutation.expectedVersion,
            idempotencyKey: mutation.idempotencyKey,
          }),
        });
        if (!res.ok) {
          const failure = await res.json().catch(() => null);
          setRequestError(failure?.error ?? "The answer could not be checked.");
          setRetryMutation(res.status >= 500 ? mutation : null);
          setRecoveryNeeded(res.status === 404 || res.status === 409 || res.status >= 500);
          return;
        }
        const outcome = (await res.json()) as AnswerResponse;
        setRetryMutation(null);
        setRecoveryNeeded(false);
        setSessionVersion(outcome.sessionVersion);
        setRuntimeState(outcome.runtimeState ?? null);
        if (outcome.intermediate) { setRuntimeNote("That move checks out. Continue the activity."); setProactiveGuidance(outcome.proactiveGuidance ?? null); setFeedback(null); return; }
        if (outcome.runtimeAccepted === false) { setRuntimeNote(outcome.runtimeMessage ?? "Check this move against the current activity state."); setFeedback(null); setProactiveGuidance(outcome.proactiveGuidance ?? null); return; }
        setRuntimeNote(null);
        setProactiveGuidance(outcome.proactiveGuidance ?? null);
        setVariantIndex(outcome.activeVariantIndex ?? 0);
        if (outcome.correct) {
          setFeedback({
            kind: "correct",
            mastery: outcome.mastery,
            solution: outcome.solution,
          });
          setShowSolution(false);
        } else {
          setFeedback({ kind: "wrong", attempts: outcome.attemptsOnStep, highlight: outcome.misconceptionHighlight ?? null });
          // The wrong beat: the Check key stays deflated through the shake,
          // then springs back. Timer-driven so reduced motion (animation:
          // none, no animationend) still releases it.
          deflateCheck();
        }
      } catch (error) {
        setRetryMutation(mutation);
        setRecoveryNeeded(true);
        setRequestError(
          error instanceof RequestTimeoutError
            ? "Checking the answer timed out. The server may still have accepted it."
            : "The connection ended before Museion could confirm the answer.",
        );
      } finally {
        finishAction();
      }
    },
    [beginAction, deflateCheck, finishAction, sessionId, sessionVersion, step],
  );

  const advance = useCallback(async (retry?: Extract<RetryableMutation, { kind: "advance" }>) => {
    if (!sessionId || !step || !beginAction("advance")) return;
    const mutation: Extract<RetryableMutation, { kind: "advance" }> = retry ?? {
      kind: "advance",
      expectedStepId: step.id,
      expectedVersion: sessionVersion,
      idempotencyKey: crypto.randomUUID(),
    };
    // A deferred Maia message belongs to the step being left. Invalidate it
    // immediately instead of waiting for the server response and next render.
    setOutbox(null);
    try {
      const response = await fetchWithTimeout(`/api/sessions/${sessionId}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedStepId: mutation.expectedStepId,
          expectedVersion: mutation.expectedVersion,
          idempotencyKey: mutation.idempotencyKey,
        }),
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        setRequestError(failure?.error ?? "The next step could not be opened.");
        setRetryMutation(response.status >= 500 ? mutation : null);
        setRecoveryNeeded(response.status === 404 || response.status === 409 || response.status >= 500);
        return;
      }
      setRetryMutation(null);
      setRecoveryNeeded(false);
      applyState((await response.json()) as SessionStateResponse);
      setFeedback(null);
      setShowSolution(false);
      setHintNote(null);
    } catch (error) {
      setRetryMutation(mutation);
      setRecoveryNeeded(true);
      setRequestError(
        error instanceof RequestTimeoutError
          ? "Opening the next step timed out. The server may already have advanced."
          : "The connection ended before Museion could confirm the next step.",
      );
    } finally {
      finishAction();
    }
  }, [applyState, beginAction, finishAction, sessionId, sessionVersion, step]);

  const requestHint = useCallback(async (retry?: Extract<RetryableMutation, { kind: "hint" }>) => {
    if (!sessionId || !step || !beginAction("hint")) return;
    const mutation: Extract<RetryableMutation, { kind: "hint" }> = retry ?? {
      kind: "hint",
      expectedStepId: step.id,
      expectedVersion: sessionVersion,
      idempotencyKey: crypto.randomUUID(),
    };
    try {
      const res = await fetchWithTimeout(`/api/sessions/${sessionId}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedStepId: mutation.expectedStepId,
          expectedVersion: mutation.expectedVersion,
          idempotencyKey: mutation.idempotencyKey,
        }),
      });
      if (!res.ok) {
        const failure = await res.json().catch(() => null);
        setRequestError(failure?.error ?? "The hint could not be requested.");
        setRetryMutation(res.status >= 500 ? mutation : null);
        setRecoveryNeeded(res.status === 404 || res.status === 409 || res.status >= 500);
        return;
      }
      const data = (await res.json()) as HintResponse;
      setRetryMutation(null);
      setRecoveryNeeded(false);
      setSessionVersion(data.sessionVersion);
      if (data.granted && data.hint) {
        const granted = data.hint;
        setHints((current) => [...current, granted]);
        setHintNote(null);
      } else {
        setHintNote("No more hints at your current support level — trust your reasoning, or ask Maia a question.");
      }
    } catch (error) {
      setRetryMutation(mutation);
      setRecoveryNeeded(true);
      setRequestError(
        error instanceof RequestTimeoutError
          ? "The hint request timed out. The server may already have revealed it."
          : "The connection ended before Museion could confirm the hint.",
      );
    } finally {
      finishAction();
    }
  }, [beginAction, finishAction, sessionId, sessionVersion, step]);

  const retryFailedMutation = useCallback(() => {
    if (!retryMutation) return;
    if (retryMutation.kind === "answer") {
      void submitAnswer(retryMutation.answer, retryMutation);
    } else if (retryMutation.kind === "advance") {
      void advance(retryMutation);
    } else {
      void requestHint(retryMutation);
    }
  }, [advance, requestHint, retryMutation, submitAnswer]);

  const recoverSession = useCallback(async () => {
    if (!sessionId || !beginAction("recover")) return;
    try {
      const response = await fetchWithTimeout(`/api/sessions/${sessionId}`);
      if (!response.ok) {
        setRequestError(
          response.status === 404 || response.status === 410
            ? "This saved session has expired. Return to the catalog to start a fresh lesson."
            : "Museion could not recover the lesson state yet.",
        );
        setRetryMutation(null);
        setRecoveryNeeded(response.status !== 404 && response.status !== 410);
        return;
      }
      const recoveredState = (await response.json()) as SessionStateResponse;
      applyState(recoveredState);
      // An explicit recovery is the one point where the server's durable
      // history should replace Maia's local transcript. Normal lesson state
      // updates keep local cancellation and delivery notices intact.
      setChatSyncKey((key) => key + 1);
      setShowSolution(false);
      setHintNote(null);
    } catch (error) {
      setRequestError(
        error instanceof RequestTimeoutError
          ? "State recovery timed out. Check the connection and try again."
          : "Museion could not reach the saved lesson state.",
      );
      setRecoveryNeeded(true);
    } finally {
      finishAction();
    }
  }, [applyState, beginAction, finishAction, sessionId]);

  const receiveTutorMarks = useCallback((actions: TutorUiAction[], version: number) => {
    if (step) setTutorMarks({ stepId: step.id, variantIndex, version, actions: authoredUiActions(step, actions) });
  }, [step, variantIndex]);
  const guidanceScope = { sessionId: sessionId ?? "", stepId: step?.id ?? "", variantIndex, sessionVersion, independent: mode === "practice" };
  const scopedGuidance = proactiveGuidance && visibleGuidance?.id === proactiveGuidance.id && guidanceMatchesScope(guidanceScope, visibleGuidance) ? visibleGuidance : null;
  const uiActions = step ? authoredUiActions(step, [
    ...(scopedGuidance?.uiActions ?? []),
    ...(tutorMarks?.stepId === step.id && tutorMarks.variantIndex === variantIndex && tutorMarks.version === sessionVersion ? tutorMarks.actions : []),
  ]) : [];

  const restartPractice = useCallback(() => {
    try { localStorage.removeItem(sessionStorageKey(lesson.id, mode)); } catch { /* Browser storage is optional. */ }
    const url = new URL(window.location.href);
    url.searchParams.set("restart", "1");
    window.location.assign(url);
  }, [lesson.id, mode]);

  if (!sessionId) {
    if (requestError) {
      return (
        <section role="alert" className="mx-auto w-full max-w-xl px-4 py-20 text-center animate-fade-up">
          <p className="eyebrow">Session unavailable</p>
          <h1 className="mt-4 tracking-display text-3xl font-semibold">Your lesson could not open.</h1>
          <p className="mx-auto mt-3 max-w-[52ch] leading-7 text-ink-soft">{requestError} A saved session is kept unless the server confirms that it expired.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => location.reload()} className="rounded-lg bg-ink px-5 py-2.5 font-semibold text-white transition hover:bg-lapis-dark">Retry session</button>
            <Link href={backHref} className="rounded-lg border border-ink/15 bg-surface px-5 py-2.5 font-semibold transition hover:border-lapis">{backLabel}</Link>
          </div>
        </section>
      );
    }
    return (
      <div role="status" aria-label={`Opening ${mode === "practice" ? "practice" : "lesson"}`} className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5 animate-pulse"><div className="h-8 w-2/3 rounded bg-ink/10"/><div className="h-2 rounded bg-ink/10"/><div className="h-72 rounded-[1.4rem] bg-surface/70"/></div>
        <div className="hidden h-[36rem] rounded-[1.4rem] bg-surface/70 lg:block"/>
        <span className="sr-only">Opening {mode === "practice" ? "practice" : "the lesson"}.</span>
      </div>
    );
  }

  if (complete) {
    return (
      <CompletionScreen
        lesson={lesson}
        mode={mode}
        stats={stats}
        onRestartPractice={restartPractice}
        courseContext={courseContext}
      />
    );
  }

  return (
    <div className={styles.workspace}>
      <div className={styles.surface}>
        {requestError && (
          <div role="alert" className="mb-5 border-l-2 border-wrong bg-wrong-soft/70 px-4 py-3">
            <p className="text-body-sm font-medium text-wrong">{requestError}</p>
            {(retryMutation || recoveryNeeded) && (
              <div className="mt-3 flex flex-wrap gap-4 text-body-sm">
                {retryMutation && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={retryFailedMutation}
                    className="min-h-11 font-semibold text-wrong underline underline-offset-4 disabled:cursor-wait disabled:opacity-60"
                  >
                    Retry the same {retryMutation.kind} safely
                  </button>
                )}
                {recoveryNeeded && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void recoverSession()}
                    className="min-h-11 font-semibold text-lapis-dark underline underline-offset-4 disabled:cursor-wait disabled:opacity-60"
                  >
                    {pendingAction === "recover" ? "Recovering state…" : "Recover saved state"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {/* Slim chrome: back, continuous progress, phase + step. The lesson
            title lives here small — the activity is the page, Koji-style. */}
        <header className={styles.chrome}>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href={backHref}
              className={styles.close} aria-label={backLabel}
            >
              <span aria-hidden="true">×</span>
            </Link>
            {/* One segment per step: green = verified done, blue = where you
                are now, quiet = still ahead. Koji functional colors. */}
            <div
              className="flex min-w-0 flex-1 items-center gap-1"
              role="progressbar"
              aria-label="Lesson progress"
              aria-valuemin={0}
              aria-valuemax={activeLesson.steps.length}
              aria-valuenow={Math.min(stepIndex + (feedback?.kind === "correct" ? 1 : 0), activeLesson.steps.length)}
            >
              {activeLesson.steps.map((progressStep, segmentIndex) => {
                const solvedCount = Math.min(stepIndex + (feedback?.kind === "correct" ? 1 : 0), activeLesson.steps.length);
                const state = segmentIndex < solvedCount ? "done" : segmentIndex === stepIndex && !complete ? "current" : "ahead";
                return (
                  <span
                    key={progressStep.id}
                    className={`h-1.5 min-w-0 flex-1 rounded-full transition-colors duration-200 ${
                      state === "done" ? "bg-correct" : state === "current" ? "bg-lapis" : "bg-ink/8"
                    }`}
                  />
                );
              })}
            </div>
            <span className="flex shrink-0 items-center gap-2 whitespace-nowrap text-body-sm text-ink">
              {/* The Museion Method move this moment exercises, derived from real state. */}
              <span className="rounded-full bg-lapis-soft px-2.5 py-0.5 text-label font-semibold text-lapis-dark">
                {feedback?.kind === "wrong"
                  ? "Try again"
                  : feedback?.kind === "correct"
                    ? "Checked"
                    : mode === "practice"
                      ? "Practice"
                      : "Your turn"}
              </span>
              <span className="hidden text-label text-ink-soft sm:inline">
                Step {Math.min(stepIndex + 1, activeLesson.steps.length)} of {activeLesson.steps.length}
              </span>
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
            <h1 className="min-w-0 truncate text-body-sm font-semibold text-ink-soft">{activeLesson.title}</h1>
            <span className="text-label font-medium text-ink-soft">
              {mode === "practice"
                ? "Hint-free practice"
                : courseContext
                  ? `${courseContext.courseTitle} · ${courseContext.lessonIndex + 1}/${courseContext.totalLessons}`
                  : activeLesson.track}
            </span>
          </div>
          {mode === "practice" && (
            <p className="mt-2 px-1 text-label text-ink">
              Practice mode removes the hint ladder. Maia can still ask a guiding question,
              so this is not the independent transfer checkpoint.
            </p>
          )}
        </header>

        <div className={styles.stage}>
        <section ref={activityColumnRef} className={styles.activityColumn} aria-label="Lesson activity">
        {/* Keep the activity mounted after a checked attempt so lab inputs stay intact. */}
        {step && (
          <div
            key={step.id}
            aria-busy={busy}
            className={`${styles.activityCard} ${feedback?.kind === "wrong" ? styles.needsAnotherLook : feedback?.kind === "correct" ? styles.verified : ""}`}
          >
            {variantIndex > 0 && (
              <p className="mx-auto mb-3 w-fit rounded-full bg-lapis-soft px-3 py-1 text-center text-label font-semibold text-lapis-dark animate-pop-in">
                Fresh numbers, same idea — variation {variantIndex}
              </p>
            )}
            {step.explanation?.map((item, index) => <details key={`${step.id}:explanation:${index}`} className="mb-5 rounded-xl border border-ink/10 bg-surface px-5 py-4" open><summary className="font-semibold">{item.title}</summary><p className="mt-3 whitespace-pre-line text-body-sm leading-7 text-ink-soft">{item.body}</p></details>)}
            {step.assistancePolicy === "none" && <p className="mb-3 text-label font-semibold text-ink">Independent challenge · use your own reasoning.</p>}
            <p ref={promptRef} tabIndex={-1} className={styles.prompt}>
              <ActivityTarget as="span" targetId="prompt" actions={uiActions} label="Lesson question">
              <PromptWithMark
                prompt={step.prompt}
                highlight={feedback?.kind === "wrong" ? feedback.highlight : null}
              />
              </ActivityTarget>
            </p>

            <div className={styles.answerArea}>
              {step.runtime && runtimeState ? <InteractiveBlock
                key={step.id}
                embedded lastAction={runtimeLastAction} block={step.runtime} state={runtimeState} busy={busy || feedback?.kind === "correct"}
                held={pendingAction === "answer" || checkDeflated} accent={accent} edge={accentEdge}
                feedback={runtimeNote ? { message: runtimeNote, verdict: "note" } : null} tutor={null} uiActions={uiActions}
                onDraftChange={(action) => reportLabState({ kind: "runtime", blockId: step.runtime!.id, action })}
                onAction={async (action) => { await submitAnswer(JSON.stringify(action)); }}
              /> : <AnswerControl
                key={`${step.id}:${variantIndex}:${restoredControlsKey}`}
                step={step}
                initialAnswer={lastAttempt?.stepId === step.id && lastAttempt.variantIndex === variantIndex ? lastAttempt.answer : null}
                accent={accent}
                edge={accentEdge}
                disabled={busy || feedback?.kind === "correct"}
                solved={feedback?.kind === "correct"}
                checking={pendingAction === "answer"}
                held={pendingAction === "answer" || checkDeflated}
                focusRequest={answerFocusRequest}
                graphHighlight={feedback?.kind === "wrong" && feedback.highlight?.kind === "graph-region" ? feedback.highlight.param : null}
                uiActions={uiActions}
                onLabState={reportLabState}
                onSubmit={submitAnswer}
              />}
              {step.citations?.length ? <details className="mt-5 text-body-sm text-ink-soft"><summary className="cursor-pointer font-medium">Source evidence</summary>{step.citations.map((citation, index) => <blockquote key={index} className="mt-3 border-l-2 border-ink/15 pl-3"><p>{citation.quote}</p><cite className="mt-1 block text-label not-italic">{citation.label}</cite></blockquote>)}</details> : null}
            </div>

            {/* Checked-correct is the one moment the canvas goes full
                correct-green: the engine verified it, so the surface blooms.
                Correct-green is reserved for exactly this. */}
            {feedback?.kind === "correct" && (
              <div
                ref={feedbackRef}
                tabIndex={-1}
                role="status"
                aria-live="polite"
                className={`${styles.feedback} ${styles.correctFeedback}`}
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span className={styles.verifiedIcon} aria-hidden="true">✓</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold">That’s correct.</p>
                    </div>

                  </div>
                  {!complete && (
                    <Pressable
                      variant="secondary"
                      onClick={() => void advance()}
                      disabled={busy}
                      className="min-h-12 w-full px-7 sm:w-auto"
                    >
                      {pendingAction === "advance" ? "Opening next step…" : "Continue"}
                    </Pressable>
                  )}
                </div>
                {feedback.solution && (
                  <div className="mt-2">
                    <button
                      onClick={() => setShowSolution((s) => !s)}
                      className="text-body-sm font-medium text-ink underline-offset-2 hover:underline"
                    >
                      {showSolution ? "Hide why it works" : "See why it works"}
                    </button>
                    {showSolution && (
                      <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-body-sm leading-relaxed text-ink animate-fade-up">
                        {feedback.solution}
                      </p>
                    )}
                  </div>
                )}
                {mode === "lesson" && step.assistancePolicy !== "none" && !complete && (
                  <SelfExplain
                    key={step.id}
                    onSend={(text) => sendToMaia(selfExplainMessage(text), step.id)}
                  />
                )}
              </div>
            )}

            {feedback?.kind === "wrong" && (
              <div
                ref={feedbackRef}
                tabIndex={-1}
                role="alert"
                className={`${styles.feedback} ${styles.retryFeedback}`}
              >
                <div className="flex items-start gap-4">
                  <span className={styles.retryIcon} aria-hidden="true">↻</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="text-lead font-semibold text-ink">Not yet.</p>
                      <span className="text-label text-ink-soft">Attempt {feedback.attempts}</span>
                    </div>
                    {feedback.highlight && (feedback.highlight.kind === "graph-region" || step.prompt.includes(feedback.highlight.text)) && (
                      <p className="sr-only">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" />
                        {feedback.highlight.kind === "term"
                          ? "Review the marked part of the question."
                          : `Attention is on the ${feedback.highlight.param} control.`}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <Pressable
                        variant="attention"
                        aria-label="Try the answer again"
                        onClick={() => setAnswerFocusRequest((request) => request + 1)}
                        className="px-6"
                      >
                        Try again
                      </Pressable>
                      <Pressable
                        variant="secondary"
                        hidden={step.assistancePolicy === "none"}
                        aria-label="ask Maia why"
                        onClick={() => sendToMaia(ASK_WHY_MESSAGE, step.id)}
                        className="px-5"
                      >
                        Get help
                      </Pressable>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hint ladder: lesson mode only. Practice remains hint-free, while Maia is available. */}
            {mode === "lesson" && step.assistancePolicy !== "none" && (
              <div className="mt-6 border-t border-ink/10 pt-4">
                <div className="flex items-center justify-between">
                  <span className="sr-only">Hints</span>
                  <button
                    onClick={() => void requestHint()}
                    disabled={busy || feedback?.kind === "correct"}
                    className="rounded-lg border border-gold bg-gold-soft px-3 py-1.5 text-body-sm font-medium text-ink transition hover:bg-gold/20 disabled:opacity-50"
                  >
                    {pendingAction === "hint" ? "Getting hint…" : "Take a hint"}
                  </button>
                </div>
                {/* Progressive disclosure: only the newest rung stays open;
                    earlier hints collapse behind a toggle. */}
                {hints.length > 1 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer list-none text-label font-semibold text-ink-soft underline-offset-4 hover:underline">
                      Show earlier hints ({hints.length - 1})
                    </summary>
                    {hints.slice(0, -1).map((hint, i) => (
                      <p key={i} className="mt-2 rounded-lg bg-gold-soft/60 px-4 py-2.5 text-body-sm text-ink-soft">
                        <span className="mr-2 font-semibold text-gold">{i + 1}.</span>
                        {hint}
                      </p>
                    ))}
                  </details>
                )}
                {hints.length > 0 && (
                  <p className="mt-3 rounded-lg bg-gold-soft px-4 py-2.5 text-body-sm animate-fade-up">
                    <span className="mr-2 font-semibold text-gold">{hints.length}.</span>
                    {hints[hints.length - 1]}
                  </p>
                )}
                {hintNote && (
                  <p className="mt-3 text-body-sm italic text-ink-soft">{hintNote}</p>
                )}
              </div>
            )}
          </div>
        )}
        </section>

        <div className={styles.companionColumn}>
      {step?.assistancePolicy === "none" ? <aside className="rounded-2xl border border-ink/10 bg-surface p-6"><MaiaCharacter state="attentive" size="inline" /><p className="mt-3 text-body-sm text-ink-soft">Maia will wait while you complete this challenge.</p></aside> : <MaiaPanel
        key={`${sessionId}:${chatSyncKey}`}
        proactiveGuidance={proactiveGuidance}
        variantIndex={variantIndex}
        independent={mode === "practice"}
        onUiActions={receiveTutorMarks}
        onGuidanceChange={setVisibleGuidance}
        sessionId={sessionId}
        stepId={step?.id ?? ""}
        sessionVersion={sessionVersion}
        onSessionVersion={setSessionVersion}
        outbox={outbox}
        getActivity={getLabActivity}
        initialMessages={initialChat}
      />}
        </div>
        </div>
      </div>
    </div>
  );
}

function CompletionScreen({
  lesson,
  mode,
  stats,
  onRestartPractice,
  courseContext,
}: {
  lesson: PublicLesson;
  mode: SessionMode;
  stats: SessionStats | null;
  onRestartPractice: () => void;
  courseContext?: CourseLessonContext;
}) {
  const practiceDone = mode === "practice";
  const courseQuery = courseContext ? `?course=${courseContext.courseId}` : "";
  // The return to the course carries the completed lesson id — lesson mode
  // only, since practice does not complete a lesson — so the trail can play
  // the arrival. The course page re-validates the param against the real
  // learner record before animating anything.
  const backHref = lesson.generatedFrom ? `/create/review/${lesson.generatedFrom.runId}` : courseContext
    ? `/courses/${courseContext.courseId}${practiceDone ? "" : `?completed=${lesson.id}`}`
    : "/library";
  const backLabel = lesson.generatedFrom ? "Back to course review" : courseContext ? `Back to ${courseContext.courseTitle}` : "Back to Library";
  // The one full-fill press on this screen takes the subject's own accent,
  // standing on its deep edge from the palette.
  const accent = subjectColor(lesson.track);
  const accentEdge = subjectDeep(lesson.track);
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="flex items-end gap-5">
        <MaiaCharacter state="celebrating" animated size="moment" className="shrink-0 animate-pop-in" title="Maia celebrating" />
        <div>
          <p className="eyebrow">{practiceDone ? "Hint-free practice recorded" : "Lesson path completed"}</p>
          <h1 className="mt-2 tracking-display text-4xl font-semibold sm:text-5xl">
            {practiceDone ? "Practice complete" : "Lesson complete"}
          </h1>
        </div>
      </div>

      {/* The observation leads. These numbers are what the engine actually
          recorded this session, and they arrive before any prose about what
          completion might mean. */}
      {stats && (
        <dl className="mt-8 grid border-y border-ink/10 sm:grid-cols-3 sm:divide-x sm:divide-ink/10">
          {[
            { label: "First-try steps", value: `${stats.firstTryCorrect}/${stats.steps}` },
            { label: "Total attempts", value: String(stats.totalAttempts) },
            { label: "Hints used", value: String(stats.hintsUsed) },
          ].map((item) => (
            <div key={item.label} className="border-b border-ink/10 py-5 last:border-b-0 sm:border-b-0 sm:px-6 sm:first:pl-0">
              <dt className="text-body-sm text-ink-soft">{item.label}</dt>
              <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-lapis-dark">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {stats?.independentTransfer?.map((observation) => <p key={observation.stepId} className="mt-5 rounded-xl bg-surface px-4 py-3 text-body-sm text-ink-soft">First independent response: {observation.firstResponseCorrect ? "matched the course specification" : "did not match the course specification"}. Later attempts are practice and keep this observation unchanged.</p>)}

      <div className="mt-5 border-l-2 border-gold pl-4 text-body-sm leading-6 text-ink-soft">
        {practiceDone
          ? "This records one completed hint-free practice run. Maia remained available, so this is not an unassisted transfer observation."
          : "This records completion of the assisted lesson path. Completion is not the same as proven mastery."}
      </div>

      <p className="mt-5 max-w-[62ch] text-body leading-7 text-ink-soft">
        {practiceDone
          ? `You completed a hint-free retrieval run on “${lesson.title}”.`
          : `You worked through every step of “${lesson.title}”. The real test is what stays with you — come back in a few days and try it without Maia.`}
      </p>

      {stats && (
        <div className="mt-8 rounded-[1.4rem] bg-surface p-6 shadow-[0_18px_60px_rgba(35,53,91,0.08)] sm:p-8">
          <h2 className="text-label font-semibold uppercase tracking-wide text-ink-soft">
            Adaptive support estimate
          </h2>
          <p className="mb-5 mt-2 max-w-xl text-body-sm leading-6 text-ink-soft">
            This tunes future scaffolding. It is not a grade or proof of retained learning.
          </p>
          {Object.entries(stats.conceptMastery).map(([concept, mastery]) => (
            <div key={concept} className="mb-3 last:mb-0">
              <div className="mb-1 flex justify-between text-body-sm">
                <span>{conceptLabel(concept)}</span>
                <span className="text-ink-soft">
                  {(mastery * 100).toFixed(0)}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`${conceptLabel(concept)} adaptive support estimate`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(mastery * 100)}
                className="h-2 overflow-hidden rounded-full bg-ink/10"
              >
                <div
                  className="h-2 origin-left rounded-full bg-gold transition-transform duration-500 motion-reduce:transition-none"
                  style={{ transform: `scaleX(${Math.max(mastery, 0.02)})` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exactly one full-fill press. In lesson mode it returns to the course
          so the trail can show the ground actually moving — the next lesson's
          own press is waiting at the trail's current node, which is why there
          is no separate "continue" shortcut competing with the loop. */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {practiceDone ? (
          <>
            <Pressable onClick={onRestartPractice} accent={accent} edge={accentEdge} className="min-h-12 px-7">
              Practice again
            </Pressable>
            <Pressable href={backHref} variant="secondary">
              {backLabel}
            </Pressable>
          </>
        ) : (
          <>
            <Pressable href={backHref} accent={accent} edge={accentEdge} className="min-h-12 px-7">
              {backLabel} <span aria-hidden="true">→</span>
            </Pressable>
            {lesson.practiceAvailable && (
              <Pressable href={`/lessons/${lesson.id}/practice${courseQuery}`} variant="secondary">
                Try practice mode
              </Pressable>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/**
 * The generation effect: putting the "why" into your own words after a
 * correct answer strengthens the memory far more than re-reading the
 * solution. Optional, one sentence, checked by Maia.
 */
function SelfExplain({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="mt-3 text-body-sm text-ink-soft animate-fade-up">
        Sent to Maia — check her reply in the panel, then continue.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text.trim());
        setSent(true);
      }}
      className="mt-3 border-t border-correct/15 pt-3"
    >
      <label
        htmlFor="self-explain"
        className="text-body-sm font-medium text-ink"
      >
        Lock it in: why did that work, in one sentence?
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="self-explain"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Because…"
          className="min-w-0 flex-1 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-lead text-ink outline-none transition focus:border-ink/40"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-lg border border-ink/12 bg-surface px-3 py-2 text-body-sm font-semibold text-ink transition hover:bg-paper disabled:opacity-50"
        >
          Check with Maia
        </button>
      </div>
    </form>
  );
}

/**
 * The step prompt with the engine's attention mark applied. A term
 * highlight wraps the first occurrence of authored text that is already
 * in the prompt — attention only, no added information. Falls back to
 * the plain prompt whenever the mark's text is not on this surface
 * (e.g. the active variant changed on the same attempt).
 */
function PromptWithMark({ prompt, highlight }: { prompt: string; highlight: MisconceptionHighlight | null }) {
  if (highlight?.kind !== "term") return <>{prompt}</>;
  const at = prompt.indexOf(highlight.text);
  if (at === -1) return <>{prompt}</>;
  return (
    <>
      {prompt.slice(0, at)}
      <mark className="rounded-md bg-gold-soft px-1 py-0.5 text-inherit shadow-[inset_0_-2px_0_var(--color-gold)] animate-pop-in">
        <span className="sr-only">Maia marks: </span>
        {highlight.text}
      </mark>
      {prompt.slice(at + highlight.text.length)}
    </>
  );
}

function AnswerControl({
  step,
  initialAnswer,
  accent,
  edge,
  disabled,
  solved,
  checking,
  held,
  focusRequest,
  graphHighlight,
  uiActions,
  onLabState,
  onSubmit,
}: {
  step: PublicStep;
  initialAnswer?: string | null;
  /** Subject accent fill for the Check pressable — `subjectColor(track)`. */
  accent: string;
  /** Its deep edge — `subjectDeep(track)`. */
  edge: string;
  disabled: boolean;
  solved?: boolean;
  checking: boolean;
  /** Keeps the Check pressable pressed: while checking, and through the wrong-answer beat. */
  held: boolean;
  focusRequest: number;
  graphHighlight: "a" | "h" | "k" | null;
  uiActions: readonly TutorUiAction[];
  onLabState?: (activity: LabActivity) => void;
  onSubmit: (answer: string) => void;
}) {
  const [value, setValue] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const firstControlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusRequest > 0 && !disabled) firstControlRef.current?.focus();
  }, [disabled, focusRequest]);

  if (step.lab?.kind === "recursion-code") {
    return (
      <RecursionCodeLab
        lab={step.lab}
        initialAnswer={initialAnswer}
        uiActions={uiActions}
        accent={accent}
        edge={edge}
        disabled={disabled}
        solved={solved}
        checking={checking}
        held={held}
        onStateChange={(state) => onLabState?.({ kind: "recursion", slots: state.slots })}
        onSubmit={onSubmit}
      />
    );
  }

  if (step.kind === "graph" && step.graph) {
    // Keep the graph readable while leaving room for its Check control.
    return (
      <div className={styles.graphStage}>
        <GraphTransformLab
          graph={step.graph}
          initialAnswer={initialAnswer}
          uiActions={uiActions}
          accent={accent}
          edge={edge}
          disabled={disabled}
          solved={solved}
          checking={checking}
          held={held}
          highlight={graphHighlight}
          onStateChange={(state) => onLabState?.({ kind: "graph", ...state })}
          onSubmit={onSubmit}
        />
      </div>
    );
  }

  if (step.kind === "multipleChoice" && step.options) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (selected !== null) onSubmit(String(selected));
        }}
        className="mx-auto max-w-2xl"
      >
        <fieldset disabled={disabled} className="flex flex-col gap-2.5">
          <legend className="sr-only">Choose one answer</legend>
          {step.options.map((option, i) => (
            <label
              key={option}
              className={`flex min-h-13 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-medium transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-lapis ${
                selected === i
                  ? "border-lapis bg-lapis-soft text-lapis-dark shadow-[var(--shadow-1)]"
                  : "border-ink/12 bg-surface hover:border-lapis/50 hover:-translate-y-0.5"
              }`}
            >
              <input
                ref={i === 0 ? firstControlRef : undefined}
                type="radio"
                name={`${step.id}-answer`}
                value={i}
                checked={selected === i}
                onChange={() => setSelected(i)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-body-sm font-semibold ${
                  selected === i
                    ? "bg-lapis text-white"
                    : "bg-paper text-ink-soft"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="capitalize">{option}</span>
            </label>
          ))}
        </fieldset>
        <div className="mt-5 flex justify-end">
          <Pressable
            type="submit"
            accent={accent}
            edge={edge}
            disabled={disabled || selected === null}
            className={`min-h-12 px-8 ${held ? "pressable-held" : ""}`}
          >
            {checking ? "Checking…" : "Check answer"}
          </Pressable>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value);
      }}
      className="mx-auto flex max-w-md flex-col items-stretch justify-center gap-3 sm:flex-row"
    >
      <input
        ref={firstControlRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        maxLength={1_000}
        placeholder={step.kind === "expression" || /\bfraction\b/i.test(step.prompt) ? "e.g. 5/6" : "Your answer"}
        aria-label="Your answer"
        inputMode={step.kind === "numeric" && !/\bfraction\b/i.test(step.prompt) ? "decimal" : "text"}
        className="w-full min-w-0 rounded-2xl border-2 border-ink/12 bg-surface px-5 py-3 text-center font-mono text-lg tabular-nums outline-none transition focus:border-lapis disabled:opacity-60 sm:w-52"
      />
      <Pressable
        type="submit"
        accent={accent}
        edge={edge}
        disabled={disabled || !value.trim()}
        className={`min-h-12 px-8 ${held ? "pressable-held" : ""}`}
      >
        {checking ? "Checking…" : "Check"}
      </Pressable>
    </form>
  );
}
