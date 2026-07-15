"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { JudgeSessionView } from "@/lib/judge/contracts";
import type { RuntimeAction, RuntimeOutcome, RuntimeTutorIntervention } from "@/lib/runtime";

import InteractiveBlock from "./blocks/InteractiveBlock";

const SESSION_KEY = "museion_judge_session_v1";
const RUN_KEY = "museion_judge_run_v1";

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? `Request failed (${response.status})`);
  return payload as T;
}

function completeState(state: JudgeSessionView["blockStates"][string] | undefined): boolean {
  if (!state) return false;
  if (state.kind === "range-explorer") return state.status !== "active";
  if (state.kind === "state-trace") return state.complete;
  return state.complete && state.correct === true;
}

export default function JudgeExperience() {
  const [session, setSession] = useState<JudgeSessionView | null>(null);
  const [blockIndex, setBlockIndex] = useState(0);
  const [busy, setBusy] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [tutor, setTutor] = useState<RuntimeTutorIntervention | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transferAnswer, setTransferAnswer] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const boot = async () => {
      try {
        const existingId = localStorage.getItem(SESSION_KEY);
        if (existingId) {
          try {
            const resumed = await jsonRequest<JudgeSessionView>(`/api/judge/${existingId}`);
            setSession(resumed);
            setBlockIndex(Number(localStorage.getItem(`${SESSION_KEY}:${existingId}:block`)) || 0);
            return;
          } catch {
            localStorage.removeItem(SESSION_KEY);
          }
        }
        const clientRunId = localStorage.getItem(RUN_KEY) ?? crypto.randomUUID();
        localStorage.setItem(RUN_KEY, clientRunId);
        const created = await jsonRequest<JudgeSessionView>("/api/judge", {
          method: "POST",
          body: JSON.stringify({ clientRunId }),
        });
        localStorage.setItem(SESSION_KEY, created.sessionId);
        setSession(created);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The verified replay could not start.");
      } finally {
        setBusy(false);
      }
    };
    void boot();
  }, []);

  const lesson = session?.artifact.lessons[0];
  const lessonBlocks = session && lesson ? lesson.blockIds.map((id) => session.artifact.blocks[id]) : [];
  const currentBlock = lessonBlocks[blockIndex];
  const progress = lessonBlocks.length === 0 ? 0 : Math.round((Math.min(blockIndex, lessonBlocks.length) / lessonBlocks.length) * 100);

  const advance = () => {
    if (!session) return;
    const next = Math.min(blockIndex + 1, lessonBlocks.length);
    setBlockIndex(next);
    localStorage.setItem(`${SESSION_KEY}:${session.sessionId}:block`, String(next));
    setFeedback(null);
    setTutor(null);
  };

  const sendAction = async (blockId: string, action: RuntimeAction) => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const result = await jsonRequest<{ session: JudgeSessionView; outcome: RuntimeOutcome; tutor: RuntimeTutorIntervention | null }>(`/api/judge/${session.sessionId}/action`, {
        method: "POST",
        body: JSON.stringify({ blockId, action }),
      });
      setSession(result.session);
      setFeedback(result.outcome.message);
      setTutor(result.tutor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The action could not be checked.");
    } finally {
      setBusy(false);
    }
  };

  const startLockedTransfer = async () => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      setSession(await jsonRequest<JudgeSessionView>(`/api/judge/${session.sessionId}/transfer`, { method: "POST", body: JSON.stringify({ kind: "start" }) }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Transfer is still locked.");
    } finally {
      setBusy(false);
    }
  };

  const submitTransfer = async () => {
    if (!session || !transferAnswer.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setSession(await jsonRequest<JudgeSessionView>(`/api/judge/${session.sessionId}/transfer`, {
        method: "POST",
        body: JSON.stringify({ kind: "submit", attemptId: crypto.randomUUID(), answer: transferAnswer }),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The transfer answer could not be scored.");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    if (session) await fetch(`/api/judge/${session.sessionId}`, { method: "DELETE" }).catch(() => undefined);
    localStorage.removeItem(SESSION_KEY);
    localStorage.setItem(RUN_KEY, crypto.randomUUID());
    location.reload();
  };

  if (busy && !session) return <div className="mx-auto min-h-svh max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16"><p className="font-display text-2xl font-semibold">Starting verified replay…</p><p className="mt-2 text-ink-soft">Loading the checked artifact and deterministic runtime.</p></div>;

  if (!session) return <div className="mx-auto max-w-2xl px-4 py-20"><div role="alert" className="rounded-xl bg-wrong-soft p-6 text-wrong"><h1 className="font-display text-2xl font-semibold">Judge route unavailable</h1><p className="mt-2">{error}</p><button type="button" onClick={() => location.reload()} className="mt-4 rounded-lg bg-ink px-5 py-2.5 font-medium text-white">Retry</button></div></div>;

  const transferId = session.artifact.transferBlockIds[0];
  const transferBlock = session.artifact.blocks[transferId];
  const currentState = currentBlock ? session.blockStates[currentBlock.id] : undefined;
  const canAdvance = currentBlock?.kind === "explanation" || completeState(currentState);

  return (
    <div className="mx-auto min-h-svh w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-correct-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-correct">Verified replay</span><span className="rounded-md bg-lapis-soft px-3 py-1 text-xs font-medium text-lapis-dark">No login · keyless</span></div><h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{session.artifact.title}</h1><p className="mt-3 max-w-[62ch] text-lg leading-7 text-ink-soft">{session.artifact.bigQuestion}</p></div>
        <button type="button" onClick={() => void reset()} className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium hover:border-lapis">Reset run</button>
      </header>

      <div className="mt-7" aria-label={`${progress}% lesson progress`}><div className="flex justify-between text-xs font-medium text-ink-soft"><span>{blockIndex < lessonBlocks.length ? `Lesson block ${blockIndex + 1} of ${lessonBlocks.length}` : "Lesson complete"}</span><span>{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-lapis transition-all" style={{ width: `${progress}%` }} /></div></div>

      {error && <p role="alert" className="mt-5 rounded-lg bg-wrong-soft px-4 py-3 text-sm text-wrong">{error}</p>}

      {currentBlock?.kind === "explanation" && <section className="mt-7 rounded-xl border border-ink/10 bg-surface p-7 shadow-sm"><p className="text-sm font-semibold uppercase tracking-wide text-lapis">Grounded explanation</p><h2 className="mt-2 font-display text-2xl font-semibold">{currentBlock.title}</h2><p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{currentBlock.body}</p><p className="mt-5 text-xs text-ink-soft">Citations: {currentBlock.citations.map((item) => item.spanId).join(", ")}</p></section>}

      {currentBlock && ["prediction-choice", "sequence-builder", "range-explorer", "state-trace"].includes(currentBlock.kind) && currentState && (
        <div className="mt-7"><InteractiveBlock key={currentBlock.id} block={currentBlock as Extract<typeof currentBlock, { kind: "prediction-choice" | "sequence-builder" | "range-explorer" | "state-trace" }>} state={currentState} busy={busy} feedback={feedback} tutor={tutor} onAction={(action) => sendAction(currentBlock.id, action)} /></div>
      )}

      {tutor && <aside aria-label="Maia runtime guidance" className="mt-4 rounded-xl border border-lapis/20 bg-lapis-soft p-5"><p className="text-xs font-semibold uppercase tracking-wide text-lapis-dark">Maia · bounded intervention</p><p className="mt-2 font-medium">{tutor.turn.message}</p>{tutor.counterexample && <p className="mt-2 text-sm text-ink-soft">Counterexample: [{tutor.counterexample.before.low}, {tutor.counterexample.before.high}] with midpoint {tutor.counterexample.before.mid}; the proposed [{tutor.counterexample.proposed.low}, {tutor.counterexample.proposed.high}] can repeat the same midpoint.</p>}<p className="mt-3 text-xs text-ink-soft">Maia may highlight or focus registered targets. The deterministic runtime still owns state and correctness.</p></aside>}

      {currentBlock && canAdvance && <button type="button" onClick={advance} className="mt-5 w-full rounded-xl bg-lapis px-6 py-3 font-semibold text-white transition hover:bg-lapis-dark">{blockIndex === lessonBlocks.length - 1 ? "Finish lesson and unlock transfer" : "Continue"} →</button>}

      {!currentBlock && session.transfer.status === "locked" && <section className="mt-7 rounded-xl border border-gold/30 bg-gold-soft p-7 text-center"><p className="text-sm font-semibold uppercase tracking-wide">Unassisted checkpoint</p><h2 className="mt-2 font-display text-2xl font-semibold">The lesson is complete. Transfer is now eligible.</h2><p className="mx-auto mt-3 max-w-xl text-ink-soft">Starting locks Maia, hints, solution reveal and elimination. Exactly one scored answer is accepted.</p><button type="button" disabled={busy} onClick={() => void startLockedTransfer()} className="mt-5 rounded-lg bg-ink px-6 py-3 font-semibold text-white disabled:opacity-50">Start locked transfer</button></section>}

      {!currentBlock && transferBlock?.kind === "transfer-challenge" && session.transfer.status === "active" && <section className="mt-7 rounded-xl border-2 border-gold bg-surface p-7 shadow-sm"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold uppercase">Locked · one attempt</span><span className="rounded-full bg-paper px-3 py-1 text-xs">Maia 0 · hints 0 · solutions 0</span></div><h2 className="mt-4 font-display text-2xl font-semibold">Near-transfer challenge</h2><p className="mt-4 text-lg leading-relaxed">{transferBlock.prompt}</p><label className="mt-5 block font-medium" htmlFor="transfer-answer">Final index<input id="transfer-answer" type="number" value={transferAnswer} onChange={(event) => setTransferAnswer(event.target.value)} className="mt-2 block w-full rounded-lg border border-ink/15 px-4 py-3 text-lg" /></label><button type="button" disabled={busy || !transferAnswer.trim()} onClick={() => void submitTransfer()} className="mt-4 w-full rounded-lg bg-ink px-6 py-3 font-semibold text-white disabled:opacity-50">Submit only attempt</button></section>}

      {!currentBlock && session.transfer.status === "scored" && session.transfer.observation && <section className="mt-7 space-y-5"><div className={`rounded-xl p-7 ${session.transfer.correct ? "bg-correct-soft" : "bg-wrong-soft"}`}><p className="text-sm font-semibold uppercase tracking-wide">Observed result</p><h2 className="mt-2 font-display text-3xl font-semibold">{session.transfer.correct ? "Correct" : "Not correct"}</h2><p className="mt-3 leading-relaxed">{session.transfer.observation.statement}</p></div><div className="rounded-xl border border-ink/10 bg-surface p-6"><h3 className="font-display text-xl font-semibold">Evidence ledger</h3><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div className="rounded-lg bg-paper p-3"><dt className="text-ink-soft">Observation</dt><dd className="mt-1 font-medium">Immediate near transfer</dd></div><div className="rounded-lg bg-paper p-3"><dt className="text-ink-soft">Assistance</dt><dd className="mt-1 font-medium">0 Maia · 0 hints · 0 solutions</dd></div><div className="rounded-lg bg-paper p-3"><dt className="text-ink-soft">Event records</dt><dd className="mt-1 font-medium">{session.transfer.observation.eventIds.length} reconciled</dd></div></dl><h4 className="mt-5 font-semibold">What this does not establish</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">{session.transfer.observation.limitations.map((item) => <li key={item}>{item}</li>)}</ul><p className="mt-4 text-xs text-ink-soft">Source citations: {session.transfer.observation.citations.map((item) => item.spanId).join(", ")}</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={() => void reset()} className="rounded-lg bg-lapis px-5 py-2.5 font-medium text-white">Run again</button><Link href="/create/review" className="rounded-lg border border-lapis px-5 py-2.5 font-medium text-lapis">Inspect provenance</Link></div></section>}
    </div>
  );
}
