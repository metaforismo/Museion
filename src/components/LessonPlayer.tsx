"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import MaiaPanel, { type ChatMessage } from "@/components/MaiaPanel";
import type { PublicLesson, PublicStep } from "@/lib/content/types";

interface SessionStats {
  steps: number;
  totalAttempts: number;
  firstTryCorrect: number;
  hintsUsed: number;
  conceptMastery: Record<string, number>;
}

interface AnswerOutcome {
  correct: boolean;
  attemptsOnStep: number;
  lessonComplete: boolean;
  misconceptionId: string | null;
  mastery: number;
  scaffolding: string;
  stepIndex: number;
  solution: string | null;
  stats: SessionStats | null;
}

type Feedback =
  | { kind: "correct"; mastery: number; solution: string | null }
  | { kind: "wrong"; attempts: number }
  | null;

const storageKey = (lessonId: string) => `museion-session-${lessonId}`;

export default function LessonPlayer({ lesson }: { lesson: PublicLesson }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [hintNote, setHintNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [maiaNudge, setMaiaNudge] = useState(0);
  const [initialChat, setInitialChat] = useState<ChatMessage[]>([]);
  const [shakeTick, setShakeTick] = useState(0);

  // Open a session: resume from localStorage when the server still
  // remembers it, otherwise start fresh.
  useEffect(() => {
    let cancelled = false;

    async function createSession() {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      });
      const data = await res.json();
      if (cancelled) return;
      localStorage.setItem(storageKey(lesson.id), data.sessionId);
      setSessionId(data.sessionId);
    }

    async function open() {
      const saved = localStorage.getItem(storageKey(lesson.id));
      if (saved) {
        const res = await fetch(`/api/sessions/${saved}`);
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          setStepIndex(data.stepIndex);
          setComplete(data.complete);
          setStats(data.stats);
          setHints(data.revealedHints);
          setInitialChat(data.chatHistory);
          setSessionId(saved);
          return;
        }
        localStorage.removeItem(storageKey(lesson.id));
      }
      await createSession();
    }

    void open();
    return () => {
      cancelled = true;
    };
  }, [lesson.id]);

  const step: PublicStep | undefined = lesson.steps[stepIndex];

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
        const outcome = (await res.json()) as AnswerOutcome;
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
    const data = (await res.json()) as { hint: string | null; granted: boolean };
    if (data.granted && data.hint) {
      setHints((current) => [...current, data.hint!]);
      setHintNote(null);
    } else {
      setHintNote(
        "No more hints at your mastery level — trust your reasoning, or ask Maia a question.",
      );
    }
  }, [sessionId, busy]);

  if (!sessionId) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-soft">
        Opening the lesson…
      </div>
    );
  }

  if (complete) {
    return <CompletionScreen lesson={lesson} stats={stats} />;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <div>
        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex items-baseline justify-between">
            <h1 className="font-display text-2xl font-semibold">{lesson.title}</h1>
            <span className="text-sm text-ink-soft">
              Step {Math.min(stepIndex + 1, lesson.steps.length)} of{" "}
              {lesson.steps.length}
            </span>
          </div>
          <div className="flex gap-1.5">
            {lesson.steps.map((s, i) => (
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
              </div>
            )}

            {feedback?.kind === "wrong" && (
              <div className="mt-4 rounded-lg bg-wrong-soft px-4 py-3">
                <p className="font-medium text-wrong">Not yet — stay with it.</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Try again, take a hint, or{" "}
                  <button
                    onClick={() => setMaiaNudge((n) => n + 1)}
                    className="font-medium text-lapis underline-offset-2 hover:underline"
                  >
                    ask Maia why
                  </button>
                  .
                </p>
              </div>
            )}

            {/* Hints */}
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
          </div>
        )}
      </div>

      <MaiaPanel
        sessionId={sessionId}
        nudge={maiaNudge}
        initialMessages={initialChat}
      />
    </div>
  );
}

function CompletionScreen({
  lesson,
  stats,
}: {
  lesson: PublicLesson;
  stats: SessionStats | null;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center animate-fade-up">
      <p className="font-display text-3xl font-semibold">Lesson complete 🎓</p>
      <p className="mt-3 text-ink-soft">
        You worked through every step of “{lesson.title}”. The real test is
        what stays with you — come back in a few days and try it without Maia.
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

      <Link
        href="/"
        className="mt-8 inline-block rounded-lg bg-lapis px-5 py-2.5 font-medium text-white transition hover:bg-lapis-dark"
      >
        Back to lessons
      </Link>
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
