"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import MaiaPanel, { type MaiaOutbox } from "@/components/MaiaPanel";
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
import type { PublicLesson, PublicStep } from "@/lib/content/types";

type Feedback =
  | { kind: "correct"; mastery: number; solution: string | null }
  | { kind: "wrong"; attempts: number }
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
}

// React's development Strict Mode mounts effects twice. Share an in-flight
// creation per lesson/mode so concurrent mounts cannot mint two anonymous
// learner cookies and orphan the first session.
const pendingSessionCreations = new Map<
  string,
  Promise<SessionStateResponse | null>
>();

function createSessionOnce(
  storeKey: string,
  lessonId: string,
  mode: SessionMode,
): Promise<SessionStateResponse | null> {
  const pending = pendingSessionCreations.get(storeKey);
  if (pending) return pending;

  const creation = fetchWithTimeout("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId, mode }),
  })
    .then(async (response) => {
      if (!response.ok) return null;
      return (await response.json()) as SessionStateResponse;
    })
    .finally(() => {
      pendingSessionCreations.delete(storeKey);
    });
  pendingSessionCreations.set(storeKey, creation);
  return creation;
}

export default function LessonPlayer({ lesson, mode }: PlayerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  // The authoritative lesson comes from the session (shuffled in
  // practice mode); the prop only covers the loading state.
  const [activeLesson, setActiveLesson] = useState<PublicLesson>(lesson);
  const [stepIndex, setStepIndex] = useState(0);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [complete, setComplete] = useState(false);
  const [stats, setStats] = useState<SessionStats | null>(null);
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
  const [initialChat, setInitialChat] = useState<ChatMessage[]>([]);
  const [shakeTick, setShakeTick] = useState(0);
  const outboxSeq = useRef(0);
  const actionInFlight = useRef(false);

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

  const sendToMaia = useCallback((text: string, targetStepId: string) => {
    outboxSeq.current += 1;
    setOutbox({ id: outboxSeq.current, text, stepId: targetStepId });
  }, []);

  const applyState = useCallback((state: SessionStateResponse) => {
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
    setInitialChat(state.chatHistory);
    setSessionId(state.sessionId);
    setRequestError(null);
    setRetryMutation(null);
    setRecoveryNeeded(false);
  }, []);

  // Open a session: resume from localStorage when the server still
  // remembers it, otherwise start fresh.
  useEffect(() => {
    let cancelled = false;
    const storeKey = sessionStorageKey(lesson.id, mode);

    async function createSession(): Promise<void> {
      const state = await createSessionOnce(storeKey, lesson.id, mode).catch(() => null);
      if (!state) {
        if (!cancelled) setRequestError("The lesson session could not be created. Try reloading the page.");
        return;
      }
      if (cancelled) return;
      localStorage.setItem(storeKey, state.sessionId);
      applyState(state);
    }

    async function open(): Promise<void> {
      try {
        const saved = localStorage.getItem(storeKey);
        if (saved) {
          const res = await fetchWithTimeout(`/api/sessions/${saved}`);
          if (res.ok) {
            const state = (await res.json()) as SessionStateResponse;
            if (!cancelled) applyState(state);
            return;
          }
          if (res.status === 404 || res.status === 410) {
            localStorage.removeItem(storeKey);
          } else {
            throw new Error("SESSION_TEMPORARILY_UNAVAILABLE");
          }
        }
        await createSession();
      } catch {
        if (!cancelled) setRequestError("The lesson session could not be opened. Try reloading the page.");
      }
    }

    void open();
    return () => {
      cancelled = true;
    };
  }, [lesson.id, mode, applyState]);

  const step: PublicStep | undefined = activeLesson.steps[stepIndex];

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
        if (outcome.correct) {
          setFeedback({
            kind: "correct",
            mastery: outcome.mastery,
            solution: outcome.solution,
          });
          setShowSolution(false);
        } else {
          setFeedback({ kind: "wrong", attempts: outcome.attemptsOnStep });
          setShakeTick((t) => t + 1);
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
    [beginAction, finishAction, sessionId, sessionVersion, step],
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
      applyState((await response.json()) as SessionStateResponse);
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

  const restartPractice = useCallback(() => {
    localStorage.removeItem(sessionStorageKey(lesson.id, mode));
    window.location.reload();
  }, [lesson.id, mode]);

  if (!sessionId) {
    if (requestError) {
      return (
        <section role="alert" className="mx-auto w-full max-w-xl px-4 py-20 text-center animate-fade-up">
          <p className="eyebrow">Session unavailable</p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Your lesson could not open.</h1>
          <p className="mx-auto mt-3 max-w-[52ch] leading-7 text-ink-soft">{requestError} A saved session is kept unless the server confirms that it expired.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => location.reload()} className="rounded-lg bg-ink px-5 py-2.5 font-semibold text-white transition hover:bg-lapis-dark">Retry session</button>
            <Link href="/" className="rounded-lg border border-ink/15 bg-surface px-5 py-2.5 font-semibold transition hover:border-lapis">Back to lessons</Link>
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
      />
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0">
        {requestError && (
          <div role="alert" className="mb-5 border-l-2 border-wrong bg-wrong-soft/70 px-4 py-3">
            <p className="text-sm font-medium text-wrong">{requestError}</p>
            {(retryMutation || recoveryNeeded) && (
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
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
        {/* Progress */}
        <div className="mb-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-lapis-dark hover:underline">
              Back to lessons
            </Link>
            <span className="rounded-md bg-surface px-2.5 py-1 text-xs font-semibold text-ink-soft">
              {mode === "practice" ? "Unassisted practice" : activeLesson.track}
            </span>
          </div>
          <div className="mb-2 flex items-baseline justify-between">
            <h1 className="font-display text-2xl font-semibold">
              {activeLesson.title}
            </h1>
            <span className="text-sm text-ink-soft">
              Step {Math.min(stepIndex + 1, activeLesson.steps.length)} of{" "}
              {activeLesson.steps.length}
            </span>
          </div>
          <div
            className="flex gap-1.5"
            role="progressbar"
            aria-label="Lesson progress"
            aria-valuemin={0}
            aria-valuemax={activeLesson.steps.length}
            aria-valuenow={Math.min(stepIndex + 1, activeLesson.steps.length)}
          >
            {activeLesson.steps.map((s, i) => (
              <div
                key={s.id}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i < stepIndex
                    ? "bg-gold"
                    : i === stepIndex
                      ? "bg-lapis"
                      : "bg-ink/10"
                }`}
              />
            ))}
          </div>
          {mode === "practice" && (
            <p className="mt-2 text-xs text-ink-soft">
              Practice mode: no hint ladder — retrieval is the workout. Maia is
              still here if you need a question answered with a question.
            </p>
          )}
        </div>

        {/* Step card */}
        {step && (
          <div
            key={`${step.id}-${shakeTick > 0 && feedback?.kind === "wrong" ? shakeTick : "steady"}`}
            aria-busy={busy}
            className={`rounded-xl border border-ink/10 bg-surface p-6 shadow-sm ${
              feedback?.kind === "wrong" ? "animate-shake" : "animate-fade-up"
            }`}
          >
            <p className="text-lg leading-relaxed">{step.prompt}</p>

            <div className="mt-6">
              <AnswerControl
                key={step.id}
                step={step}
                disabled={busy || feedback?.kind === "correct"}
                checking={pendingAction === "answer"}
                onSubmit={submitAnswer}
              />
            </div>

            {feedback?.kind === "correct" && (
              <div className="mt-4 rounded-lg bg-correct-soft px-4 py-3 animate-fade-up">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-correct">
                    Correct — nice reasoning.
                    <span className="ml-2 text-sm font-normal">Adaptive support updated.</span>
                  </p>
                  {!complete && (
                    <button
                      onClick={() => void advance()}
                      disabled={busy}
                      className="rounded-lg bg-correct px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
                    >
                      {pendingAction === "advance" ? "Opening next step…" : "Continue"}
                    </button>
                  )}
                </div>
                {feedback.solution && (
                  <div className="mt-2">
                    <button
                      onClick={() => setShowSolution((s) => !s)}
                      className="text-sm font-medium text-correct underline-offset-2 hover:underline"
                    >
                      {showSolution ? "Hide why it works" : "See why it works"}
                    </button>
                    {showSolution && (
                      <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-sm leading-relaxed text-ink animate-fade-up">
                        {feedback.solution}
                      </p>
                    )}
                  </div>
                )}
                {mode === "lesson" && !complete && (
                  <SelfExplain
                    key={step.id}
                    onSend={(text) => sendToMaia(selfExplainMessage(text), step.id)}
                  />
                )}
              </div>
            )}

            {feedback?.kind === "wrong" && (
              <div className="mt-4 rounded-lg bg-wrong-soft px-4 py-3">
                <p className="font-medium text-wrong">Not yet — stay with it.</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Try again{mode === "lesson" ? ", take a hint," : ""} or{" "}
                  <button
                    onClick={() => sendToMaia(ASK_WHY_MESSAGE, step.id)}
                    className="font-medium text-lapis underline-offset-2 hover:underline"
                  >
                    ask Maia why
                  </button>
                  .
                </p>
              </div>
            )}

            {/* Hint ladder: lesson mode only — practice is unassisted. */}
            {mode === "lesson" && (
              <div className="mt-6 border-t border-ink/10 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink-soft">
                    Hint ladder
                  </span>
                  <button
                    onClick={() => void requestHint()}
                    disabled={busy || feedback?.kind === "correct"}
                    className="rounded-lg border border-gold bg-gold-soft px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-gold/20 disabled:opacity-50"
                  >
                    {pendingAction === "hint" ? "Getting hint…" : "Take a hint"}
                  </button>
                </div>
                {hints.map((hint, i) => (
                  <p
                    key={i}
                    className="mt-3 rounded-lg bg-gold-soft px-4 py-2.5 text-sm animate-fade-up"
                  >
                    <span className="mr-2 font-semibold text-gold">{i + 1}.</span>
                    {hint}
                  </p>
                ))}
                {hintNote && (
                  <p className="mt-3 text-sm italic text-ink-soft">{hintNote}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <MaiaPanel
        sessionId={sessionId}
        stepId={step?.id ?? ""}
        sessionVersion={sessionVersion}
        onSessionVersion={setSessionVersion}
        outbox={outbox}
        initialMessages={initialChat}
      />
    </div>
  );
}

function CompletionScreen({
  lesson,
  mode,
  stats,
  onRestartPractice,
}: {
  lesson: PublicLesson;
  mode: SessionMode;
  stats: SessionStats | null;
  onRestartPractice: () => void;
}) {
  const practiceDone = mode === "practice";
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <p className="eyebrow">{practiceDone ? "Unassisted practice recorded" : "Lesson path completed"}</p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
        {practiceDone ? "Practice complete" : "Lesson complete"}
      </h1>
      <p className="mt-4 max-w-[62ch] text-lg leading-8 text-ink-soft">
        {practiceDone
          ? `You completed an unassisted retrieval run on “${lesson.title}”.`
          : `You worked through every step of “${lesson.title}”. The real test is what stays with you — come back in a few days and try it without Maia.`}
      </p>

      <div className="mt-6 border-l-2 border-gold pl-4 text-sm leading-6 text-ink-soft">
        {practiceDone
          ? "This records one completed unassisted practice run. It does not establish long-term retention or transfer."
          : "This records completion of the assisted lesson path. Completion is not the same as proven mastery."}
      </div>

      {stats && (
        <>
          <dl className="mt-10 grid border-y border-ink/10 sm:grid-cols-3 sm:divide-x sm:divide-ink/10">
            {[{ label: "First-try steps", value: `${stats.firstTryCorrect}/${stats.steps}` }, { label: "Total attempts", value: String(stats.totalAttempts) }, { label: "Hints used", value: String(stats.hintsUsed) }].map((item) => <div key={item.label} className="border-b border-ink/10 py-5 last:border-b-0 sm:border-b-0 sm:px-6 sm:first:pl-0"><dt className="text-sm text-ink-soft">{item.label}</dt><dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-lapis-dark">{item.value}</dd></div>)}
          </dl>

          <div className="mt-10 rounded-[1.4rem] bg-surface p-6 shadow-[0_18px_60px_rgba(35,53,91,0.08)] sm:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Adaptive support estimate
            </h2>
            <p className="mb-5 mt-2 max-w-xl text-sm leading-6 text-ink-soft">
              This tunes future scaffolding. It is not a grade or proof of retained learning.
            </p>
            {Object.entries(stats.conceptMastery).map(([concept, mastery]) => (
              <div key={concept} className="mb-3 last:mb-0">
                <div className="mb-1 flex justify-between text-sm">
                  <span>{concept}</span>
                  <span className="text-ink-soft">
                    {(mastery * 100).toFixed(0)}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${concept} adaptive support estimate`}
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
        </>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {practiceDone ? (
          <button
            onClick={onRestartPractice}
            className="rounded-lg bg-lapis px-5 py-2.5 font-medium text-white transition hover:bg-lapis-dark"
          >
            Practice again
          </button>
        ) : (
          lesson.practiceAvailable && (
            <Link
              href={`/lessons/${lesson.id}/practice`}
              className="rounded-lg bg-lapis px-5 py-2.5 font-medium text-white transition hover:bg-lapis-dark"
            >
              Try practice mode
            </Link>
          )
        )}
        <Link
          href="/"
          className="rounded-lg border border-ink/15 bg-surface px-5 py-2.5 font-medium text-ink transition hover:border-lapis"
        >
          Back to lessons
        </Link>
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
      <p className="mt-3 text-sm text-ink-soft animate-fade-up">
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
      className="mt-3 border-t border-correct/20 pt-3"
    >
      <label
        htmlFor="self-explain"
        className="text-sm font-medium text-correct"
      >
        Lock it in: why did that work, in one sentence?
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="self-explain"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Because…"
          className="min-w-0 flex-1 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm outline-none transition focus:border-correct"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-lg border border-correct bg-correct-soft px-3 py-2 text-sm font-medium text-correct transition hover:bg-correct/15 disabled:opacity-50"
        >
          Check with Maia
        </button>
      </div>
    </form>
  );
}

function AnswerControl({
  step,
  disabled,
  checking,
  onSubmit,
}: {
  step: PublicStep;
  disabled: boolean;
  checking: boolean;
  onSubmit: (answer: string) => void;
}) {
  const [value, setValue] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  if (step.kind === "multipleChoice" && step.options) {
    return (
      <div className="flex flex-col gap-2.5">
        {step.options.map((option, i) => (
          <button
            type="button"
            key={option}
            disabled={disabled}
            onClick={() => {
              setSelected(i);
              onSubmit(String(i));
            }}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left font-medium transition disabled:opacity-60 ${
              selected === i
                ? "border-lapis bg-lapis-soft text-lapis-dark"
                : "border-ink/15 bg-surface hover:border-lapis"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold ${
                selected === i
                  ? "bg-lapis text-white"
                  : "bg-paper text-ink-soft"
              }`}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="capitalize">{option}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value);
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder={step.kind === "expression" ? "e.g. 5/6" : "Your answer"}
        aria-label="Your answer"
        inputMode={step.kind === "numeric" ? "decimal" : "text"}
        className="w-full min-w-0 rounded-lg border border-ink/15 bg-surface px-4 py-2.5 outline-none transition focus:border-lapis disabled:opacity-60 sm:w-44"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-lg bg-lapis px-5 py-2.5 font-medium text-white transition hover:bg-lapis-dark disabled:opacity-50"
      >
        {checking ? "Checking…" : "Check"}
      </button>
    </form>
  );
}
