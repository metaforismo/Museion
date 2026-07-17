"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { JudgeSessionView } from "@/lib/judge/contracts";
import type { RuntimeAction, RuntimeOutcome, RuntimeTutorIntervention } from "@/lib/runtime";

const InteractiveBlock = dynamic(() => import("./blocks/InteractiveBlock"), {
  loading: () => <div role="status" className="mt-7 h-64 animate-pulse rounded-xl bg-ink/5"><span className="sr-only">Loading interactive activity.</span></div>,
});

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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [tutor, setTutor] = useState<RuntimeTutorIntervention | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transferAnswer, setTransferAnswer] = useState("");
  const [transferTouched, setTransferTouched] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const started = useRef(false);

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
      setFeedback(result.outcome.message);
      setTutor(result.tutor);
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

  if (!session) return <div className="mx-auto max-w-2xl px-4 py-20"><div role="alert" className="rounded-xl bg-wrong-soft p-6 text-wrong"><h1 className="font-display text-2xl font-semibold">Judge route unavailable</h1><p className="mt-2">{error}</p><button type="button" onClick={() => location.reload()} className="mt-4 rounded-lg bg-ink px-5 py-2.5 font-medium text-white">Retry</button></div></div>;

  const currentState = currentBlock ? session.blockStates[currentBlock.id] : undefined;
  const canAdvance = currentBlock?.kind === "explanation" || completeState(currentState);

  return (
    <div className="mx-auto min-h-svh w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-correct-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-correct">{session.mode === "verified-replay" ? "Verified replay" : "Generated course"}</span><span className="rounded-md bg-lapis-soft px-3 py-1 text-xs font-medium text-lapis-dark">No login · deterministic runtime</span></div><h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{session.artifact.title}</h1><p className="mt-3 max-w-[62ch] text-lg leading-7 text-ink-soft">{session.artifact.bigQuestion}</p></div>
        <button type="button" disabled={busy} onClick={() => setConfirmReset(true)} className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium transition hover:border-lapis disabled:opacity-45">Reset run</button>
      </header>

      {confirmReset && <ResetConfirmation busy={busy} onCancel={() => setConfirmReset(false)} onConfirm={reset} />}

      <div className="mt-7" role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="flex justify-between text-xs font-medium text-ink-soft"><span>{blockIndex < lessonBlocks.length ? `Lesson block ${blockIndex + 1} of ${lessonBlocks.length}` : "Lesson complete"}</span><span className="font-mono tabular-nums">{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full origin-left rounded-full bg-lapis transition-transform duration-300" style={{ transform: `scaleX(${progress / 100})` }} /></div></div>

      {error && <div role="alert" className="mt-5 flex items-start justify-between gap-4 rounded-lg bg-wrong-soft px-4 py-3 text-sm text-wrong"><p>{error}</p><button type="button" onClick={() => setError(null)} className="shrink-0 font-semibold underline underline-offset-4">Dismiss</button></div>}

      {currentBlock?.kind === "explanation" && <section className="mt-7 rounded-xl border border-ink/10 bg-surface p-7 shadow-sm"><p className="text-sm font-semibold uppercase tracking-wide text-lapis">Grounded explanation</p><h2 className="mt-2 font-display text-2xl font-semibold">{currentBlock.title}</h2><p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{currentBlock.body}</p><p className="mt-5 text-xs text-ink-soft">Citations: {currentBlock.citations.map((item) => item.spanId).join(", ")}</p></section>}

      {currentBlock && ["prediction-choice", "sequence-builder", "range-explorer", "state-trace"].includes(currentBlock.kind) && currentState && (
        <div className="mt-7"><InteractiveBlock key={currentState.kind === "state-trace" ? currentBlock.id : `${currentBlock.id}:${JSON.stringify(currentState)}`} block={currentBlock as Extract<typeof currentBlock, { kind: "prediction-choice" | "sequence-builder" | "range-explorer" | "state-trace" }>} state={currentState} busy={busy} feedback={feedback} tutor={tutor} onAction={(action) => sendAction(currentBlock.id, action)} /></div>
      )}

      {tutor && <aside aria-label="Maia runtime guidance" className="mt-4 rounded-xl border border-lapis/20 bg-lapis-soft p-5"><p className="text-xs font-semibold uppercase tracking-wide text-lapis-dark">Maia · bounded intervention</p><p className="mt-2 font-medium">{tutor.turn.message}</p>{tutor.counterexample && <p className="mt-2 text-sm text-ink-soft">Counterexample: [{tutor.counterexample.before.low}, {tutor.counterexample.before.high}] with midpoint {tutor.counterexample.before.mid}; the proposed [{tutor.counterexample.proposed.low}, {tutor.counterexample.proposed.high}] can repeat the same midpoint.</p>}<p className="mt-3 text-xs text-ink-soft">Maia may highlight or focus registered targets. The deterministic runtime still owns state and correctness.</p></aside>}

      {currentBlock && canAdvance && <button type="button" disabled={busy} onClick={advance} className="sticky bottom-3 mt-5 w-full rounded-xl bg-lapis px-6 py-3 font-semibold text-white shadow-[0_12px_32px_rgba(19,28,49,0.18)] transition hover:bg-lapis-dark disabled:opacity-45 lg:static lg:shadow-none">{blockIndex === lessonBlocks.length - 1 ? "Finish lesson and unlock transfer" : "Continue"}</button>}

      {!currentBlock && session.transfer.status === "locked" && <section className="mt-7 rounded-xl border border-gold/30 bg-gold-soft p-7 text-center"><p className="text-sm font-semibold uppercase tracking-wide">Independent checkpoint</p><h2 className="mt-2 font-display text-2xl font-semibold">The lesson is complete. Your final challenge is ready.</h2><p className="mx-auto mt-3 max-w-xl text-ink-soft">Starting removes Maia, hints, solution reveal, and answer elimination. Exactly one scored answer is accepted.</p><button type="button" disabled={busy} onClick={() => void startLockedTransfer()} className="mt-5 rounded-lg bg-ink px-6 py-3 font-semibold text-white disabled:opacity-50">Start independent challenge</button></section>}

      {!currentBlock && transferBlock?.kind === "transfer-challenge" && session.transfer.status === "active" && <TransferChallenge prompt={transferBlock.prompt} responseKind={transferBlock.responseKind} options={transferBlock.options} answer={transferAnswer} valid={transferAnswerValid} touched={transferTouched} busy={busy} onAnswer={setTransferAnswer} onTouched={() => setTransferTouched(true)} onSubmit={submitTransfer} />}

      {!currentBlock && session.transfer.status === "scored" && session.transfer.observation && <EvidenceResult session={session} reviewHref={reviewHref} onReset={() => setConfirmReset(true)} />}
    </div>
  );
}

function ResetConfirmation({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel(): void;
  onConfirm(): Promise<void>;
}) {
  return (
    <section role="group" aria-label="Confirm reset run" className="mt-5 flex flex-col gap-4 rounded-xl border border-wrong/20 bg-wrong-soft p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-wrong">Start this experience again from the first block?</p>
        <p className="mt-1 text-sm text-ink-soft">This removes the current server session and its local recovery state.</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border border-ink/15 bg-surface px-4 py-2 text-sm font-semibold">Keep run</button>
        <button type="button" disabled={busy} onClick={() => void onConfirm()} className="rounded-lg bg-wrong px-4 py-2 text-sm font-semibold text-white disabled:opacity-45">{busy ? "Resetting…" : "Confirm reset"}</button>
      </div>
    </section>
  );
}

function TransferChallenge({
  prompt,
  responseKind,
  options,
  answer,
  valid,
  touched,
  busy,
  onAnswer,
  onTouched,
  onSubmit,
}: {
  prompt: string;
  responseKind: "numeric" | "multiple-choice" | "expression";
  options: string[];
  answer: string;
  valid: boolean;
  touched: boolean;
  busy: boolean;
  onAnswer(value: string): void;
  onTouched(): void;
  onSubmit(): Promise<void>;
}) {
  const invalid = touched && !valid;
  return (
    <section className="mt-7 rounded-[1.4rem] border-2 border-gold bg-surface p-6 shadow-[0_18px_60px_rgba(35,53,91,0.08)] sm:p-7">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-md bg-gold-soft px-3 py-1 text-xs font-semibold uppercase">Locked · one attempt</span>
        <span className="rounded-md bg-paper px-3 py-1 text-xs">Maia 0 · hints 0 · solutions 0</span>
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold">Near-transfer challenge</h2>
      <p className="mt-4 text-lg leading-relaxed">{prompt}</p>
      {responseKind === "multiple-choice" ? (
        <fieldset className="mt-5" onBlur={onTouched}>
          <legend className="font-medium">Choose one answer</legend>
          <div className="mt-3 grid gap-2">
            {options.map((option, index) => <label key={`${index}-${option}`} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${answer === String(index) ? "border-lapis bg-lapis-soft" : "border-ink/15 hover:border-lapis/50"}`}><input type="radio" name="transfer-answer" value={index} checked={answer === String(index)} onChange={(event) => onAnswer(event.target.value)} /><span>{option}</span></label>)}
          </div>
        </fieldset>
      ) : (
        <label className="mt-5 block font-medium" htmlFor="transfer-answer">
          {responseKind === "numeric" ? "Your number" : "Your expression"}
          <input id="transfer-answer" type="text" inputMode={responseKind === "numeric" ? "decimal" : "text"} autoComplete="off" maxLength={responseKind === "numeric" ? 64 : 240} value={answer} aria-invalid={invalid} aria-describedby="transfer-answer-help" onBlur={onTouched} onChange={(event) => onAnswer(event.target.value)} className="mt-2 block w-full rounded-lg border border-ink/15 px-4 py-3 font-mono text-lg tabular-nums" />
        </label>
      )}
      <p id="transfer-answer-help" className={`mt-2 text-sm ${invalid ? "text-wrong" : "text-ink-soft"}`}>{invalid ? responseKind === "multiple-choice" ? "Choose one answer before submitting." : responseKind === "numeric" ? "Enter a valid number." : "Enter an expression before submitting." : "No hint or second scored attempt is available."}</p>
      <button type="button" disabled={busy || !valid} onClick={() => void onSubmit()} className="mt-4 w-full rounded-lg bg-ink px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit only attempt"}</button>
    </section>
  );
}

function EvidenceResult({
  session,
  reviewHref,
  onReset,
}: {
  session: JudgeSessionView;
  reviewHref: string;
  onReset(): void;
}) {
  const observation = session.transfer.observation;
  if (!observation) return null;
  return (
    <section className="mt-7 space-y-5">
      <div className={`rounded-[1.4rem] p-7 ${session.transfer.correct ? "bg-correct-soft" : "bg-wrong-soft"}`}>
        <p className="text-sm font-semibold uppercase tracking-wide">Observed result</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">{session.transfer.correct ? "Correct" : "Not correct"}</h2>
        <p className="mt-3 leading-relaxed">{observation.statement}</p>
      </div>
      <div className="rounded-[1.4rem] bg-surface p-6 shadow-[0_18px_60px_rgba(35,53,91,0.07)]">
        <h3 className="font-display text-xl font-semibold">Evidence ledger</h3>
        <dl className="mt-5 grid border-y border-ink/10 text-sm sm:grid-cols-3 sm:divide-x sm:divide-ink/10">
          {[{ label: "Observation", value: "Immediate near transfer" }, { label: "Assistance", value: "0 Maia · 0 hints · 0 solutions" }, { label: "Event records", value: `${observation.eventIds.length} reconciled` }].map((item) => <div key={item.label} className="border-b border-ink/10 py-4 last:border-b-0 sm:border-b-0 sm:px-4 sm:first:pl-0"><dt className="text-ink-soft">{item.label}</dt><dd className="mt-1 font-medium">{item.value}</dd></div>)}
        </dl>
        <h4 className="mt-6 font-semibold">What this does not establish</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">{observation.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        <p className="mt-4 break-words font-mono text-xs text-ink-soft">Source citations: {observation.citations.map((item) => item.spanId).join(", ")}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onReset} className="rounded-lg bg-lapis px-5 py-2.5 font-medium text-white">Run again</button>
        <Link href={reviewHref} className="rounded-lg border border-lapis px-5 py-2.5 font-medium text-lapis">Inspect provenance</Link>
      </div>
    </section>
  );
}
