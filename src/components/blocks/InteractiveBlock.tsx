"use client";

import { useState } from "react";

import type { PublicLearningBlock } from "@/lib/compiler";
import type { RuntimeAction, RuntimeState, RuntimeTutorIntervention } from "@/lib/runtime";

type PublicInteractiveBlock = Extract<
  PublicLearningBlock,
  { kind: "prediction-choice" | "sequence-builder" | "range-explorer" | "state-trace" }
>;

export interface InteractiveBlockProps {
  block: PublicInteractiveBlock;
  state: RuntimeState;
  busy: boolean;
  feedback: string | null;
  tutor: RuntimeTutorIntervention | null;
  onAction(action: RuntimeAction): Promise<void>;
}

function integerValue(value: string): number | null {
  if (!/^-?\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export default function InteractiveBlock({
  block,
  state,
  busy,
  feedback,
  tutor,
  onAction,
}: InteractiveBlockProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [order, setOrder] = useState<string[]>(
    block.kind === "sequence-builder" ? block.items.map((item) => item.id).reverse() : [],
  );
  const [low, setLow] = useState(
    String(block.kind === "range-explorer" || block.kind === "state-trace" ? block.initialState.low : 0),
  );
  const [high, setHigh] = useState(
    String(block.kind === "range-explorer" || block.kind === "state-trace" ? block.initialState.high : 0),
  );
  const [mid, setMid] = useState(
    String(block.kind === "state-trace" ? block.initialState.mid : 0),
  );
  const [fieldsTouched, setFieldsTouched] = useState(false);
  const emphasized = new Set(tutor?.turn.uiActions.map((action) => action.targetId) ?? []);
  const emphasis = (targetId: string) => emphasized.has(targetId) ? " ring-2 ring-gold ring-offset-2" : "";
  const lowValue = integerValue(low);
  const highValue = integerValue(high);
  const midValue = integerValue(mid);
  const rangeValid = lowValue !== null && highValue !== null;
  const traceValid = rangeValid && midValue !== null;

  const move = (index: number, delta: -1 | 1) => {
    const destination = index + delta;
    if (destination < 0 || destination >= order.length) return;
    setOrder((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };

  return (
    <section
      aria-labelledby={`${block.id}-title`}
      data-runtime-target={`block:${block.id}`}
      className={`rounded-xl border border-ink/10 bg-surface p-5 shadow-sm${emphasis(`block:${block.id}`)}`}
    >
      <h3 id={`${block.id}-title`} className="font-display text-xl font-semibold">
        {block.accessibilityLabel}
      </h3>
      <p data-runtime-target={`prompt:${block.id}`} className={`mt-3 leading-relaxed${emphasis(`prompt:${block.id}`)}`}>{block.prompt}</p>

      {block.kind === "prediction-choice" && (
        <fieldset className="mt-5 space-y-2" disabled={busy || state.kind !== block.kind || state.complete}>
          <legend className="sr-only">Choose your prediction</legend>
          {block.options.map((option, index) => (
            <label key={option} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-ink/15 px-3 py-2 focus-within:ring-2 focus-within:ring-lapis">
              <input type="radio" name={`${block.id}-prediction`} checked={selectedIndex === index} onChange={() => setSelectedIndex(index)} />
              <span>{option}</span>
            </label>
          ))}
          <button type="button" disabled={selectedIndex === null || busy} onClick={() => selectedIndex !== null && void onAction({ kind: "prediction_select", optionIndex: selectedIndex })} className="mt-3 rounded-lg bg-lapis px-5 py-2.5 font-medium text-white disabled:opacity-50">
            Check prediction
          </button>
        </fieldset>
      )}

      {block.kind === "sequence-builder" && (
        <div className="mt-5">
          <p className="text-sm text-ink-soft">Use the buttons to place every step in a justified order.</p>
          <ol className="mt-3 space-y-2">
            {order.map((id, index) => {
              const item = block.items.find((candidate) => candidate.id === id);
              return (
                <li key={id} className="flex items-center gap-2 rounded-lg border border-ink/15 p-3">
                  <span className="w-6 font-semibold" aria-hidden="true">{index + 1}.</span>
                  <span className="flex-1">{item?.label}</span>
                  <button type="button" aria-label={`Move ${item?.label} up`} disabled={busy || index === 0} onClick={() => move(index, -1)} className="min-h-10 min-w-10 rounded border border-ink/15 disabled:opacity-35">↑</button>
                  <button type="button" aria-label={`Move ${item?.label} down`} disabled={busy || index === order.length - 1} onClick={() => move(index, 1)} className="min-h-10 min-w-10 rounded border border-ink/15 disabled:opacity-35">↓</button>
                </li>
              );
            })}
          </ol>
          <button type="button" disabled={busy || (state.kind === block.kind && state.complete)} onClick={() => void onAction({ kind: "sequence_submit", order })} className="mt-4 rounded-lg bg-lapis px-5 py-2.5 font-medium text-white disabled:opacity-50">
            Check order
          </button>
        </div>
      )}

      {block.kind === "range-explorer" && state.kind === block.kind && (
        <div className="mt-5">
          <div className="overflow-x-auto pb-2" aria-label="Binary search values">
            <div className="flex min-w-max gap-2">
              {block.values.map((value, index) => {
                const active = index >= state.low && index <= state.high;
                const current = index === state.mid;
                return <div key={index} data-runtime-target={`value:${block.id}:${index}`} className={`min-w-14 rounded-lg border px-3 py-2 text-center ${current ? "border-gold bg-gold-soft" : active ? "border-lapis bg-lapis-soft" : "border-ink/10 opacity-45"}${emphasis(`value:${block.id}:${index}`)}`}><span className="block text-xs text-ink-soft">{index}</span><span className="font-semibold">{value}</span></div>;
              })}
            </div>
          </div>
          <p className="mt-2 text-sm">Current: low {state.low}, high {state.high}, mid {state.mid ?? "—"}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">Next low<input type="text" inputMode="numeric" value={low} aria-invalid={fieldsTouched && lowValue === null} onBlur={() => setFieldsTouched(true)} onChange={(event) => setLow(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2 font-mono tabular-nums" /></label>
            <label className="text-sm font-medium">Next high<input type="text" inputMode="numeric" value={high} aria-invalid={fieldsTouched && highValue === null} onBlur={() => setFieldsTouched(true)} onChange={(event) => setHigh(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2 font-mono tabular-nums" /></label>
          </div>
          {fieldsTouched && !rangeValid && <p role="alert" className="mt-2 text-sm text-wrong">Enter whole-number boundaries. A high boundary of -1 is valid when the interval becomes empty.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy || state.status !== "active" || !rangeValid} onClick={() => { setFieldsTouched(true); if (lowValue !== null && highValue !== null) void onAction({ kind: "range_update", low: lowValue, high: highValue }); }} className="rounded-lg bg-lapis px-5 py-2.5 font-medium text-white disabled:opacity-50">Update interval</button>
            <button type="button" disabled={busy || state.mid === null || state.status !== "active"} onClick={() => state.mid !== null && void onAction({ kind: "range_confirm_found", index: state.mid })} className="rounded-lg border border-lapis px-5 py-2.5 font-medium text-lapis disabled:opacity-50">Confirm target at mid</button>
          </div>
        </div>
      )}

      {block.kind === "state-trace" && state.kind === block.kind && (
        <div className="mt-5">
          <p className="text-sm text-ink-soft">Enter the next inclusive-boundary state. The expected trace remains server-side.</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <label className="text-sm font-medium">Low<input type="text" inputMode="numeric" value={low} aria-invalid={fieldsTouched && lowValue === null} onBlur={() => setFieldsTouched(true)} onChange={(event) => setLow(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2 font-mono tabular-nums" /></label>
            <label className="text-sm font-medium">High<input type="text" inputMode="numeric" value={high} aria-invalid={fieldsTouched && highValue === null} onBlur={() => setFieldsTouched(true)} onChange={(event) => setHigh(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2 font-mono tabular-nums" /></label>
            <label className="text-sm font-medium">Mid<input type="text" inputMode="numeric" value={mid} aria-invalid={fieldsTouched && midValue === null} onBlur={() => setFieldsTouched(true)} onChange={(event) => setMid(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2 font-mono tabular-nums" /></label>
          </div>
          {fieldsTouched && !traceValid && <p role="alert" className="mt-2 text-sm text-wrong">Enter a whole number for every boundary and midpoint.</p>}
          <button type="button" disabled={busy || state.complete || !traceValid} onClick={() => { setFieldsTouched(true); if (lowValue !== null && highValue !== null && midValue !== null) void onAction({ kind: "trace_submit", low: lowValue, high: highValue, mid: midValue }); }} className="mt-4 rounded-lg bg-lapis px-5 py-2.5 font-medium text-white disabled:opacity-50">Check next state</button>
        </div>
      )}

      <p role="status" aria-live="polite" data-runtime-target={`status:${block.id}`} className={`mt-4 min-h-6 text-sm font-medium text-ink-soft${emphasis(`status:${block.id}`)}`}>
        {feedback}
      </p>
    </section>
  );
}
