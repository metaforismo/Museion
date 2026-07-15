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
import { sessionStorageKey } from "@/lib/client/storage";
import type { PublicLesson, PublicStep } from "@/lib/content/types";

type Feedback =
  | { kind: "correct"; mastery: number; solution: string | null }
  | { kind: "wrong"; attempts: number }
  | null;

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

export default function LessonPlayer({ lesson, mode }: PlayerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  // The authoritative lesson comes from the session (shuffled in
  // practice mode); the prop only covers the loading state.
  const [activeLesson, setActiveLesson] = useState<PublicLesson>(lesson);
  const [stepIndex, setStepIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [hintNote, setHintNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [outbox, setOutbox] = useState<MaiaOutbox | null>(null);
  const [initialChat, setInitialChat] = useState<ChatMessage[]>([]);
  const [shakeTick, setShakeTick] = useState(0);
  const outboxSeq = useRef(0);

  const sendToMaia = useCallback((text: string) => {
    outboxSeq.current += 1;
    setOutbox({ id: outboxSeq.current, text });
  }, []);

  const applyState = useCallback((state: SessionStateResponse) => {
    setActiveLesson(state.lesson);
    setStepIndex(state.stepIndex);
    setComplete(state.complete);
    setStats(state.stats);
    setHints(state.revealedHints);
    setInitialChat(state.chatHistory);
    setSessionId(state.sessionId);
  }, []);

  // Open a session: resume from localStorage when the server still
  // remembers it, otherwise start fresh.
  useEffect(() => {
    let cancelled = false;
    const storeKey = sessionStorageKey(lesson.id, mode);

    async function createSession(): Promise<void> {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, mode }),
      });
      if (!res.ok) return;
      const state = (await res.json()) as SessionStateResponse;
      if (cancelled) return;
      localStorage.setItem(storeKey, state.sessionId);
      applyState(state);
    }

    async function open(): Promise<void> {
      const saved = localStorage.getItem(storeKey);
      if (saved) {
        const res = await fetch(`/api/sessions/${saved}`);
        if (res.ok) {
          const state = (await res.json()) as SessionStateResponse;
          if (!cancelled) applyState(state);
          return;
        }
        localStorage.removeItem(storeKey);
      }
      await createSession();
    }

    void open();
    return () => {
      cancelled = true;
    };
  }, [lesson.id, mode, applyState]);

  const step: PublicStep | undefined = activeLesson.steps[stepIndex];

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!sessionId || busy) return;
      setBusy(true);
      try {
        const res = await fetch(`/api/sessions/${sessionId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer }),
        });
        if (!res.ok) return;
        const outcome = (await res.json()) as AnswerResponse;
        if (outcome.correct) {
          setFeedback({
            kind: "correct",
            mastery: outcome.mastery,
            solution: outcome.solution,
          });
          setShowSolution(false);
          if (outcome.stats) setStats(outcome.stats);
          if (outcome.lessonComplete) setComplete(true);
        } else {
          setFeedback({ kind: "wrong", attempts: outcome.attemptsOnStep });
          setShakeTick((t) => t + 1);
        }
      } finally {
        setBusy(false);
      }
    },
    [sessionId, busy],
  );

  const advance = useCallback(() => {
    setStepIndex((i) => i + 1);
    setFeedback(null);
    setShowSolution(false);
    setHints([]);
    setHintNote(null);
  }, []);

  const requestHint = useCallback(async () => {
    if (!sessionId || busy) return;
    const res = await fetch(`/api/sessions/${sessionId}/hint`, {
      method: "POST",
    });
    if (!res.ok) return;
    const data = (await res.json()) as HintResponse;
    if (data.granted && data.hint) {
      const granted = data.hint;
      setHints((current) => [...current, granted]);
      setHintNote(null);
    } else {
      setHintNote(
        "No more hints at your mastery level — trust your reasoning, or ask Maia a question.",
      );
    }
  }, [sessionId, busy]);

  const restartPractice = useCallback(() => {
    localStorage.removeItem(sessionStorageKey(lesson.id, mode));
    window.location.reload();
  }, [lesson.id, mode]);

  if (!sessionId) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-soft">
        Opening {mode === "practice" ? "practice" : "the lesson"}…
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
      <div>
        {/* Progress */}
        <div className="mb-6">
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
            aria-valuenow={stepIndex}
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
                onSubmit={submitAnswer}
              />
            </div>

            {feedback?.kind === "correct" && (
              <div className="mt-4 rounded-lg bg-correct-soft px-4 py-3 animate-fade-up">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-correct">
                    Correct — nice reasoning.
                    <span className="ml-2 text-sm font-normal">
                      mastery {feedback.mastery.toFixed(2)}
                    </span>
                  </p>
                  {!complete && (
                    <button
                      onClick={advance}
                      className="rounded-lg bg-correct px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      Continue →
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
                    onSend={(text) => sendToMaia(selfExplainMessage(text))}
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
                    onClick={() => sendToMaia(ASK_WHY_MESSAGE)}
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
                    onClick={requestHint}
                    disabled={busy || feedback?.kind === "correct"}
                    className="rounded-lg border border-gold bg-gold-soft px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-gold/20 disabled:opacity-50"
                  >
                    Take a hint
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
    <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center animate-fade-up">
      <p className="font-display text-3xl font-semibold">
        {practiceDone ? "Practice complete 💪" : "Lesson complete 🎓"}
      </p>
      <p className="mt-3 text-ink-soft">
        {practiceDone
          ? `Unassisted reps on “${lesson.title}” — this is the work that sticks.`
          : `You worked through every step of “${lesson.title}”. The real test is what stays with you — come back in a few days and try it without Maia.`}
      </p>

      {stats && (
        <>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <StatCard
              label="First-try steps"
              value={`${stats.firstTryCorrect}/${stats.steps}`}
            />
            <StatCard label="Total attempts" value={String(stats.totalAttempts)} />
            <StatCard label="Hints used" value={String(stats.hintsUsed)} />
          </div>

          <div className="mt-8 rounded-xl border border-ink/10 bg-surface p-6 text-left">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Concept mastery
            </h2>
            {Object.entries(stats.conceptMastery).map(([concept, mastery]) => (
              <div key={concept} className="mb-3 last:mb-0">
                <div className="mb-1 flex justify-between text-sm">
                  <span>{concept}</span>
                  <span className="text-ink-soft">
                    {(mastery * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-ink/10">
                  <div
                    className="h-2 rounded-full bg-gold animate-grow-bar"
                    style={{ width: `${Math.max(mastery * 100, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {practiceDone ? (
          <button
            onClick={onRestartPractice}
            className="rounded-lg bg-lapis px-5 py-2.5 font-medium text-white transition hover:bg-lapis-dark"
          >
            Practice again ↻
          </button>
        ) : (
          lesson.practiceAvailable && (
            <Link
              href={`/lessons/${lesson.id}/practice`}
              className="rounded-lg bg-lapis px-5 py-2.5 font-medium text-white transition hover:bg-lapis-dark"
            >
              Try practice mode →
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
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-surface p-4">
      <p className="font-display text-2xl font-semibold text-lapis-dark">
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-soft">{label}</p>
    </div>
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
      <div className="mt-2 flex gap-2">
        <input
          id="self-explain"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Because…"
          className="flex-1 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm outline-none transition focus:border-correct"
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
  onSubmit,
}: {
  step: PublicStep;
  disabled: boolean;
  onSubmit: (answer: string) => void;
}) {
  const [value, setValue] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  if (step.kind === "multipleChoice" && step.options) {
    return (
      <div className="flex flex-col gap-2.5">
        {step.options.map((option, i) => (
          <button
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
      className="flex gap-3"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        autoFocus
        placeholder={step.kind === "expression" ? "e.g. 5/6" : "Your answer"}
        className="w-44 rounded-lg border border-ink/15 bg-surface px-4 py-2.5 outline-none transition focus:border-lapis disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-lg bg-lapis px-5 py-2.5 font-medium text-white transition hover:bg-lapis-dark disabled:opacity-50"
      >
        Check
      </button>
    </form>
  );
}
