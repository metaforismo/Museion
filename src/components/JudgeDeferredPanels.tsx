"use client";

import Link from "next/link";

import type { JudgeSessionView } from "@/lib/judge/contracts";

type DeferredPanelProps =
  | { kind: "reset"; busy: boolean; onCancel(): void; onConfirm(): Promise<void> }
  | { kind: "transfer"; prompt: string; responseKind: "numeric" | "multiple-choice" | "expression"; options: string[]; answer: string; valid: boolean; touched: boolean; busy: boolean; onAnswer(value: string): void; onTouched(): void; onSubmit(): Promise<void> }
  | { kind: "evidence"; session: JudgeSessionView; reviewHref: string; onReset(): void };

export default function JudgeDeferredPanel(props: DeferredPanelProps) {
  if (props.kind === "reset") return <ResetConfirmation {...props} />;
  if (props.kind === "transfer") return <TransferChallenge {...props} />;
  return <EvidenceResult {...props} />;
}

function ResetConfirmation({ busy, onCancel, onConfirm }: { busy: boolean; onCancel(): void; onConfirm(): Promise<void> }) {
  return <section role="group" aria-label="Confirm reset run" className="mt-5 flex flex-col gap-4 rounded-xl border border-wrong/20 bg-wrong-soft p-4 sm:flex-row sm:items-center sm:justify-between">
    <div><p className="font-semibold text-wrong">Start this experience again from the first block?</p><p className="mt-1 text-sm text-ink-soft">This removes the current server session and its local recovery state.</p></div>
    <div className="flex shrink-0 gap-2"><button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border border-ink/15 bg-surface px-4 py-2 text-sm font-semibold">Keep run</button><button type="button" disabled={busy} onClick={() => void onConfirm()} className="rounded-lg bg-wrong px-4 py-2 text-sm font-semibold text-white disabled:opacity-45">{busy ? "Resetting…" : "Confirm reset"}</button></div>
  </section>;
}

function TransferChallenge({ prompt, responseKind, options, answer, valid, touched, busy, onAnswer, onTouched, onSubmit }: { prompt: string; responseKind: "numeric" | "multiple-choice" | "expression"; options: string[]; answer: string; valid: boolean; touched: boolean; busy: boolean; onAnswer(value: string): void; onTouched(): void; onSubmit(): Promise<void> }) {
  const invalid = touched && !valid;
  return <section className="mt-7 rounded-[1.4rem] border-2 border-gold bg-surface p-6 shadow-[0_18px_60px_rgba(35,53,91,0.08)] sm:p-7">
    <div className="flex flex-wrap gap-2"><span className="rounded-md bg-gold-soft px-3 py-1 text-xs font-semibold uppercase">Locked · one attempt</span><span className="rounded-md bg-paper px-3 py-1 text-xs">Maia 0 · hints 0 · solutions 0</span></div>
    <h2 className="mt-4 font-display text-2xl font-semibold">Near-transfer challenge</h2><p className="mt-4 text-lg leading-relaxed">{prompt}</p>
    {responseKind === "multiple-choice" ? <fieldset className="mt-5" onBlur={onTouched}><legend className="font-medium">Choose one answer</legend><div className="mt-3 grid gap-2">{options.map((option, index) => <label key={`${index}-${option}`} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${answer === String(index) ? "border-lapis bg-lapis-soft" : "border-ink/15 hover:border-lapis/50"}`}><input type="radio" name="transfer-answer" value={index} checked={answer === String(index)} onChange={(event) => onAnswer(event.target.value)} /><span>{option}</span></label>)}</div></fieldset> : <label className="mt-5 block font-medium" htmlFor="transfer-answer">{responseKind === "numeric" ? "Your number" : "Your expression"}<input id="transfer-answer" type="text" inputMode={responseKind === "numeric" ? "decimal" : "text"} autoComplete="off" maxLength={responseKind === "numeric" ? 64 : 240} value={answer} aria-invalid={invalid} aria-describedby="transfer-answer-help" onBlur={onTouched} onChange={(event) => onAnswer(event.target.value)} className="mt-2 block w-full rounded-lg border border-ink/15 px-4 py-3 font-mono text-lg tabular-nums" /></label>}
    <p id="transfer-answer-help" className={`mt-2 text-sm ${invalid ? "text-wrong" : "text-ink-soft"}`}>{invalid ? responseKind === "multiple-choice" ? "Choose one answer before submitting." : responseKind === "numeric" ? "Enter a valid number." : "Enter an expression before submitting." : "No hint or second scored attempt is available."}</p>
    <button type="button" disabled={busy || !valid} onClick={() => void onSubmit()} className="mt-4 w-full rounded-lg bg-ink px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit only attempt"}</button>
  </section>;
}

function EvidenceResult({ session, reviewHref, onReset }: { session: JudgeSessionView; reviewHref: string; onReset(): void }) {
  const observation = session.transfer.observation;
  if (!observation) return null;
  return <section className="mt-7 space-y-5">
    <div className={`rounded-[1.4rem] p-7 ${session.transfer.correct ? "bg-correct-soft" : "bg-wrong-soft"}`}><p className="text-sm font-semibold uppercase tracking-wide">Observed result</p><h2 className="mt-2 font-display text-3xl font-semibold">{session.transfer.correct ? "Correct" : "Not correct"}</h2><p className="mt-3 leading-relaxed">{observation.statement}</p></div>
    <div className="rounded-[1.4rem] bg-surface p-6 shadow-[0_18px_60px_rgba(35,53,91,0.07)]"><h3 className="font-display text-xl font-semibold">Evidence ledger</h3><dl className="mt-5 grid border-y border-ink/10 text-sm sm:grid-cols-3 sm:divide-x sm:divide-ink/10">{[{ label: "Observation", value: "Immediate near transfer" }, { label: "Assistance", value: "0 Maia · 0 hints · 0 solutions" }, { label: "Event records", value: `${observation.eventIds.length} reconciled` }].map((item) => <div key={item.label} className="border-b border-ink/10 py-4 last:border-b-0 sm:border-b-0 sm:px-4 sm:first:pl-0"><dt className="text-ink-soft">{item.label}</dt><dd className="mt-1 font-medium">{item.value}</dd></div>)}</dl><h4 className="mt-6 font-semibold">What this does not establish</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">{observation.limitations.map((item) => <li key={item}>{item}</li>)}</ul><p className="mt-4 break-words font-mono text-xs text-ink-soft">Source citations: {observation.citations.map((item) => item.spanId).join(", ")}</p></div>
    <div className="flex flex-wrap gap-3"><button type="button" onClick={onReset} className="rounded-lg bg-lapis px-5 py-2.5 font-medium text-white">Run again</button><Link href={reviewHref} className="rounded-lg border border-lapis px-5 py-2.5 font-medium text-lapis">Inspect provenance</Link></div>
  </section>;
}
