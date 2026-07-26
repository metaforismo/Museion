"use client";

import dynamic from "next/dynamic";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

import MaiaCharacter from "@/components/MaiaCharacter";
import { MAIA_STATE_TITLE } from "@/lib/design/maia";
import { Pressable } from "@/components/ui";
import { subjectColor, subjectDeep, subjectTint } from "@/lib/curriculum/subjects";
import type { JudgeSessionView } from "@/lib/judge/contracts";
import { JUDGE_SAMPLE_SUBJECT } from "@/lib/judge/subject";
import type { RuntimeAction, RuntimeOutcome, RuntimeTutorIntervention } from "@/lib/runtime";

import type { CheckedFeedback } from "./blocks/InteractiveBlock";

const InteractiveBlock = dynamic(() => import("./blocks/InteractiveBlock"), {
  loading: () => <div role="status" className="mt-7 h-64 animate-pulse rounded-xl bg-ink/5"><span className="sr-only">Loading interactive activity.</span></div>,
});
const JudgeDeferredPanel = lazy(() => import("./JudgeDeferredPanels"));

const SESSION_KEY = "museion_judge_session_v1";
const RUN_KEY = "museion_judge_run_v1";

class JudgeRequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "JudgeRequestError";
  }
}

function judgeErrorMessage(value: unknown, status: number): string {
  const code = typeof value === "string" ? value : "";
  const messages: Record<string, string> = {
    JUDGE_SESSION_QUOTA_EXCEEDED: "Too many replay sessions are still active. Reset an existing run or wait for an older session to expire.",
    COMPILER_RUN_NOT_FOUND: "This generated course is unavailable or belongs to a different browser session.",
    GENERATED_ROUTE_UNSUPPORTED_BLOCKS: "This course contains an activity that the learner renderer does not support yet.",
  };
  return messages[code] ?? (code || `Request failed (${status})`);
}

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  const code = typeof payload?.error === "string" ? payload.error : "JUDGE_REQUEST_FAILED";
  if (!response.ok) throw new JudgeRequestError(response.status, judgeErrorMessage(code, response.status));
  return payload as T;
}

function completeState(state: JudgeSessionView["blockStates"][string] | undefined): boolean {
  if (!state) return false;
  if (state.kind === "range-explorer") return state.status !== "active";
  if (state.kind === "state-trace") return state.complete;
  return state.complete && state.correct === true;
}

function safeResumeIndex(session: JudgeSessionView, storedValue: string | null): number {
  const lesson = session.artifact.lessons[0];
  const blocks = lesson ? lesson.blockIds.map((id) => session.artifact.blocks[id]) : [];
  const parsed = /^\d+$/.test(storedValue ?? "") ? Number(storedValue) : 0;
  const desired = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), blocks.length) : 0;
  for (let index = 0; index < desired; index += 1) {
    const block = blocks[index];
    if (!block) return index;
    if (block.kind !== "explanation" && !completeState(session.blockStates[block.id])) return index;
  }
  return desired;
}

function validTransferAnswer(value: string, kind?: "numeric" | "multiple-choice" | "expression", optionCount = 0): boolean {
  const normalized = value.trim();
  if (!kind || !normalized) return false;
  if (kind === "expression") return normalized.length <= 240;
  if (kind === "multiple-choice") {
    const index = Number(normalized);
    return Number.isInteger(index) && index >= 0 && index < optionCount;
  }
  return normalized.length <= 64 && Number.isFinite(Number(normalized));
}

export default function JudgeExperience({ compilerRunId }: { compilerRunId?: string }) {
  const sessionKey = compilerRunId ? `${SESSION_KEY}:${compilerRunId}` : SESSION_KEY;
  const runKey = compilerRunId ? `${RUN_KEY}:${compilerRunId}` : RUN_KEY;
  const [session, setSession] = useState<JudgeSessionView | null>(null);
  const [blockIndex, setBlockIndex] = useState(0);
  const [busy, setBusy] = useState(true);
  const [feedback, setFeedback] = useState<CheckedFeedback | null>(null);
  const [tutor, setTutor] = useState<RuntimeTutorIntervention | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transferAnswer, setTransferAnswer] = useState("");
  const [transferTouched, setTransferTouched] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  // The wrong-answer beat, exactly as the lesson canvas plays it: the block
  // card shakes while the Check pressable stays deflated, then both settle.
  const [shakeTick, setShakeTick] = useState(0);
  const [checkDeflated, setCheckDeflated] = useState(false);
  const deflateTimer = useRef(0);
  const started = useRef(false);

  // Timer-driven rather than animation-driven so reduced motion (animation:
  // none, no animationend event) still releases the key.
  const deflateCheck = () => {
    window.clearTimeout(deflateTimer.current);
    setCheckDeflated(true);
    deflateTimer.current = window.setTimeout(() => setCheckDeflated(false), 420);
  };
  useEffect(() => () => window.clearTimeout(deflateTimer.current), []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const boot = async () => {
      try {
        const existingId = localStorage.getItem(sessionKey);
        if (existingId) {
          try {
            const resumed = await jsonRequest<JudgeSessionView>(`/api/judge/${existingId}`);
            setSession(resumed);
            setBlockIndex(safeResumeIndex(resumed, localStorage.getItem(`${sessionKey}:${existingId}:block`)));
            return;
          } catch (cause) {
            if (cause instanceof JudgeRequestError && cause.status === 404) {
              localStorage.removeItem(sessionKey);
              localStorage.removeItem(`${sessionKey}:${existingId}:block`);
            } else {
              throw cause;
            }
          }
        }
        const clientRunId = localStorage.getItem(runKey) ?? crypto.randomUUID();
        localStorage.setItem(runKey, clientRunId);
        const created = await jsonRequest<JudgeSessionView>(compilerRunId ? `/api/compiler/runs/${compilerRunId}/launch` : "/api/judge", {
          method: "POST",
          body: JSON.stringify({ clientRunId }),
        });
        localStorage.setItem(sessionKey, created.sessionId);
        setSession(created);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The verified replay could not start.");
      } finally {
        setBusy(false);
      }
    };
    void boot();
  }, [compilerRunId, runKey, sessionKey]);

  const lesson = session?.artifact.lessons[0];
  const lessonBlocks = session && lesson ? lesson.blockIds.map((id) => session.artifact.blocks[id]) : [];
  const currentBlock = lessonBlocks[blockIndex];
  const progress = lessonBlocks.length === 0 ? 0 : Math.round((Math.min(blockIndex, lessonBlocks.length) / lessonBlocks.length) * 100);
  const transferId = session?.artifact.transferBlockIds[0];
  const transferBlock = session && transferId ? session.artifact.blocks[transferId] : undefined;
  const transferAnswerValid = validTransferAnswer(
    transferAnswer,
    transferBlock?.kind === "transfer-challenge" ? transferBlock.responseKind : undefined,
    transferBlock?.kind === "transfer-challenge" ? transferBlock.options.length : 0,
  );
  const reviewHref = compilerRunId ? `/create/review/${compilerRunId}` : "/create/review";
  // The verified replay is the binary-search lesson — Computer Science — so
  // this surface presses in that subject's violet. A generated course declares
  // no subject and resolves the palette's default pair through the same calls.
  const subject = compilerRunId ? "" : JUDGE_SAMPLE_SUBJECT;
  const accent = subjectColor(subject);
  const accentEdge = subjectDeep(subject);
  const accentTint = subjectTint(subject);

  const advance = () => {
    if (!session || busy) return;
    const next = Math.min(blockIndex + 1, lessonBlocks.length);
    setBlockIndex(next);
    localStorage.setItem(`${sessionKey}:${session.sessionId}:block`, String(next));
    setFeedback(null);
    setTutor(null);
  };

  const handleMutationFailure = async (cause: unknown) => {
    if (
      session &&
      cause instanceof JudgeRequestError && cause.status === 409
    ) {
      try {
        const restored = await jsonRequest<JudgeSessionView>(`/api/judge/${session.sessionId}`);
        setSession(restored);
        setBlockIndex(safeResumeIndex(restored, localStorage.getItem(`${sessionKey}:${session.sessionId}:block`)));
        setFeedback(null);
        setTutor(null);
        setError("Updated in another tab. Latest state restored.");
        return;
      } catch {
        setError("Reload to restore state.");
        return;
      }
    }
    setError(cause instanceof Error ? cause.message : "Request failed.");
  };

  const sendAction = async (blockId: string, action: RuntimeAction) => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const result = await jsonRequest<{ session: JudgeSessionView; outcome: RuntimeOutcome; tutor: RuntimeTutorIntervention | null }>(`/api/judge/${session.sessionId}/action`, {
        method: "POST",
        body: JSON.stringify({ blockId, action, expectedRevision: session.revision, commandId: crypto.randomUUID() }),
      });
      setSession(result.session);
      // Correct-green and wrong-red are reserved for outcomes the engine
      // actually checked; a rejected (invalid) action is a note, not a verdict.
      setFeedback({
        message: result.outcome.message,
        verdict: result.outcome.accepted ? (result.outcome.correct ? "correct" : "wrong") : "note",
      });
      setTutor(result.tutor);
      if (result.outcome.accepted && !result.outcome.correct) {
        setShakeTick((tick) => tick + 1);
        deflateCheck();
      }
    } catch (cause) {
      await handleMutationFailure(cause);
    } finally {
      setBusy(false);
    }
  };

  const startLockedTransfer = async () => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      setSession(await jsonRequest<JudgeSessionView>(`/api/judge/${session.sessionId}/transfer`, {
        method: "POST",
        body: JSON.stringify({ kind: "start", expectedRevision: session.revision, commandId: crypto.randomUUID() }),
      }));
    } catch (cause) {
      await handleMutationFailure(cause);
    } finally {
      setBusy(false);
    }
  };

  const submitTransfer = async () => {
    setTransferTouched(true);
    if (!session || !transferAnswerValid) return;
    setBusy(true);
    setError(null);
    try {
      const attemptKey = `${sessionKey}:${session.sessionId}:transfer-attempt`;
      const attemptId = localStorage.getItem(attemptKey) ?? crypto.randomUUID();
      localStorage.setItem(attemptKey, attemptId);
      setSession(await jsonRequest<JudgeSessionView>(`/api/judge/${session.sessionId}/transfer`, {
        method: "POST",
        body: JSON.stringify({
          kind: "submit",
          attemptId,
          answer: transferAnswer.trim(),
          expectedRevision: session.revision,
          commandId: attemptId,
        }),
      }));
      localStorage.removeItem(attemptKey);
    } catch (cause) {
      await handleMutationFailure(cause);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      if (session) {
        const response = await fetch(`/api/judge/${session.sessionId}`, { method: "DELETE" });
        if (!response.ok && response.status !== 404) throw new Error("The current run could not be removed. Try again before starting over.");
        localStorage.removeItem(`${sessionKey}:${session.sessionId}:block`);
        localStorage.removeItem(`${sessionKey}:${session.sessionId}:transfer-attempt`);
      }
      localStorage.removeItem(sessionKey);
      localStorage.setItem(runKey, crypto.randomUUID());
      location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The run could not be reset.");
      setConfirmReset(false);
      setBusy(false);
    }
  };

  if (busy && !session) return <section role="status" aria-label="Starting verified replay" className="mx-auto grid min-h-[100dvh] w-full max-w-5xl content-start gap-5 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><div className="h-5 w-40 animate-pulse rounded bg-ink/10"/><div className="h-12 max-w-xl animate-pulse rounded bg-ink/10"/><div className="h-5 max-w-2xl animate-pulse rounded bg-ink/5"/><div className="mt-3 h-2 animate-pulse rounded bg-ink/10"/><div className="mt-2 h-72 animate-pulse rounded-[1.6rem] bg-surface/70"/><span className="sr-only">Loading the checked artifact and deterministic runtime.</span></section>;

  if (!session) return <div className="mx-auto max-w-2xl px-4 py-20"><div role="alert" className="rounded-xl bg-wrong-soft p-6 text-wrong"><h1 className="tracking-title text-2xl font-semibold">Judge route unavailable</h1><p className="mt-2">{error}</p><button type="button" onClick={() => location.reload()} className="mt-4 rounded-lg bg-ink px-5 py-2.5 font-medium text-white">Retry</button></div></div>;

  const currentState = currentBlock ? session.blockStates[currentBlock.id] : undefined;
  const canAdvance = currentBlock?.kind === "explanation" || completeState(currentState);

  return (
    <div className="mx-auto min-h-svh w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        {/* The lesson chip is the subject speaking, not a verdict: correct-green
            stays reserved for outcomes the engine checked. */}
        <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-md px-3 py-1 text-label font-semibold uppercase tracking-wide" style={{ backgroundColor: accentTint, color: accent }}>{session.mode === "verified-replay" ? "Sample lesson" : "From your source"}</span><span className="rounded-md border border-ink/10 bg-surface px-3 py-1 text-label font-medium text-ink-soft">No account needed · answers checked by code</span></div><h1 className="mt-4 tracking-display text-3xl font-semibold sm:text-4xl">{session.artifact.title}</h1><p className="mt-3 max-w-[62ch] text-lg leading-7 text-ink-soft">{session.artifact.bigQuestion}</p></div>
        <Pressable variant="secondary" size="compact" disabled={busy} onClick={() => setConfirmReset(true)}>Reset run</Pressable>
      </header>

      {confirmReset && <Suspense fallback={<div role="status" className="mt-5 rounded-xl bg-paper p-4 text-body-sm text-ink-soft">Loading reset controls…</div>}><JudgeDeferredPanel kind="reset" busy={busy} onCancel={() => setConfirmReset(false)} onConfirm={reset} /></Suspense>}

      <div className="mt-7" role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="flex items-baseline justify-between"><span className="text-label font-semibold text-ink-soft">{blockIndex < lessonBlocks.length ? `Lesson block ${blockIndex + 1} of ${lessonBlocks.length}` : "Lesson complete"}</span><span className="font-mono text-label tabular-nums text-ink-soft">{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full origin-left rounded-full transition-transform duration-300 motion-reduce:transition-none" style={{ transform: `scaleX(${progress / 100})`, backgroundColor: accent }} /></div></div>

      {error && <div role="alert" className="mt-5 flex items-start justify-between gap-4 rounded-lg bg-wrong-soft px-4 py-3 text-body-sm text-wrong"><p>{error}</p><button type="button" onClick={() => setError(null)} className="shrink-0 font-semibold underline underline-offset-4">Dismiss</button></div>}

      {currentBlock?.kind === "explanation" && <section className="surface-card mt-7 p-7"><p className="text-label font-semibold uppercase tracking-wide" style={{ color: accent }}>Grounded explanation</p><h2 className="mt-2 tracking-title text-2xl font-semibold">{currentBlock.title}</h2><p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{currentBlock.body}</p><p className="mt-5 font-mono text-micro text-ink-soft">Citations: {currentBlock.citations.map((item) => item.spanId).join(", ")}</p></section>}

      {/* The shake lives on this wrapper, which stays mounted across the state
          change a checked answer causes — the block itself remounts by key. */}
      {currentBlock && ["prediction-choice", "sequence-builder", "range-explorer", "state-trace"].includes(currentBlock.kind) && currentState && (
        <div className={`mt-7 ${shakeTick > 0 && feedback?.verdict === "wrong" ? "animate-shake" : ""}`} onAnimationEnd={() => setShakeTick(0)}><InteractiveBlock key={currentState.kind === "state-trace" ? currentBlock.id : `${currentBlock.id}:${JSON.stringify(currentState)}`} block={currentBlock as Extract<typeof currentBlock, { kind: "prediction-choice" | "sequence-builder" | "range-explorer" | "state-trace" }>} state={currentState} busy={busy} held={busy || checkDeflated} accent={accent} edge={accentEdge} feedback={feedback} tutor={tutor} onAction={(action) => sendAction(currentBlock.id, action)} /></div>
      )}

      {/* Maia is live here: the deterministic tutor is intervening on a move
          it just checked, so she appears redirecting — never decoratively. */}
      {tutor && <aside aria-label="Maia runtime guidance" className="mt-4 rounded-[var(--radius-card)] border border-lapis/20 bg-lapis-soft p-5"><div className="flex items-start gap-3"><MaiaCharacter state="redirecting" size="inline" className="shrink-0" title={MAIA_STATE_TITLE.redirecting} /><div className="min-w-0"><p className="text-label font-semibold uppercase tracking-wide text-lapis-dark">Maia · bounded intervention</p><p className="mt-2 font-medium">{tutor.turn.message}</p>{tutor.counterexample && <p className="mt-2 text-body-sm text-ink-soft">Counterexample: [{tutor.counterexample.before.low}, {tutor.counterexample.before.high}] with midpoint {tutor.counterexample.before.mid}; the proposed [{tutor.counterexample.proposed.low}, {tutor.counterexample.proposed.high}] can repeat the same midpoint.</p>}<p className="mt-3 text-micro text-ink-soft">Maia may highlight or focus registered targets. The deterministic runtime still owns state and correctness.</p></div></div></aside>}

      {currentBlock && canAdvance && <Pressable accent={accent} edge={accentEdge} disabled={busy} onClick={advance} className="sticky bottom-3 mt-5 min-h-12 w-full lg:static">{blockIndex === lessonBlocks.length - 1 ? "Finish lesson and unlock transfer" : "Continue"}</Pressable>}

      {/* The gate into the locked transfer. The energy language stops at this
          door on purpose: a flat start control, no press celebration, so the
          unassisted measurement never feels assisted. */}
      {!currentBlock && session.transfer.status === "locked" && <section className="mt-7 rounded-[var(--radius-card)] border border-gold/30 bg-gold-soft p-7 text-center"><p className="text-label font-semibold uppercase tracking-wide">Independent checkpoint</p><h2 className="mt-2 tracking-title text-2xl font-semibold">The lesson is complete. Your final challenge is ready.</h2><p className="mx-auto mt-3 max-w-xl text-ink-soft">Starting removes Maia, hints, solution reveal, and answer elimination. Exactly one scored answer is accepted.</p><button type="button" disabled={busy} onClick={() => void startLockedTransfer()} className="mt-5 min-h-12 rounded-xl bg-ink px-6 py-3 font-semibold text-white disabled:opacity-50">Start independent challenge</button></section>}

      {!currentBlock && transferBlock?.kind === "transfer-challenge" && session.transfer.status === "active" && <Suspense fallback={<div role="status" className="mt-7 rounded-xl bg-paper p-5 text-body-sm text-ink-soft">Loading transfer challenge…</div>}><JudgeDeferredPanel kind="transfer" prompt={transferBlock.prompt} responseKind={transferBlock.responseKind} options={transferBlock.options} answer={transferAnswer} valid={transferAnswerValid} touched={transferTouched} busy={busy} onAnswer={setTransferAnswer} onTouched={() => setTransferTouched(true)} onSubmit={submitTransfer} /></Suspense>}

      {!currentBlock && session.transfer.status === "scored" && session.transfer.observation && <Suspense fallback={<div role="status" className="mt-7 rounded-xl bg-paper p-5 text-body-sm text-ink-soft">Loading evidence ledger…</div>}><JudgeDeferredPanel kind="evidence" session={session} reviewHref={reviewHref} accent={accent} edge={accentEdge} tint={accentTint} onReset={() => setConfirmReset(true)} /></Suspense>}
    </div>
  );
}
