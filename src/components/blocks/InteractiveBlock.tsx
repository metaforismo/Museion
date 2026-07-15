"use client";

import { useState } from "react";

import type { PublicLearningBlock } from "@/lib/compiler";
import type { RuntimeAction, RuntimeState } from "@/lib/runtime";

type PublicInteractiveBlock = Extract<
  PublicLearningBlock,
  { kind: "prediction-choice" | "sequence-builder" | "range-explorer" | "state-trace" }
>;

export interface InteractiveBlockProps {
  block: PublicInteractiveBlock;
  state: RuntimeState;
  busy: boolean;
  feedback: string | null;
  onAction(action: RuntimeAction): Promise<void>;
}

export default function InteractiveBlock({
  block,
  state,
  busy,
  feedback,
  onAction,
}: InteractiveBlockProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [order, setOrder] = useState<string[]>(
    block.kind === "sequence-builder" ? block.items.map((item) => item.id).reverse() : [],
  );
  const [low, setLow] = useState(
    block.kind === "range-explorer" || block.kind === "state-trace" ? block.initialState.low : 0,
  );
  const [high, setHigh] = useState(
    block.kind === "range-explorer" || block.kind === "state-trace" ? block.initialState.high : 0,
  );
  const [mid, setMid] = useState(
    block.kind === "state-trace" ? block.initialState.mid : 0,
  );

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
      className="rounded-xl border border-ink/10 bg-surface p-5 shadow-sm"
    >
      <h3 id={`${block.id}-title`} className="font-display text-xl font-semibold">
        {block.accessibilityLabel}
      </h3>
      <p className="mt-3 leading-relaxed">{block.prompt}</p>

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
                return <div key={index} className={`min-w-14 rounded-lg border px-3 py-2 text-center ${current ? "border-gold bg-gold-soft" : active ? "border-lapis bg-lapis-soft" : "border-ink/10 opacity-45"}`}><span className="block text-xs text-ink-soft">{index}</span><span className="font-semibold">{value}</span></div>;
              })}
            </div>
          </div>
          <p className="mt-2 text-sm">Current: low {state.low}, high {state.high}, mid {state.mid ?? "—"}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">Next low<input type="number" min={0} value={low} onChange={(event) => setLow(Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" /></label>
            <label className="text-sm font-medium">Next high<input type="number" min={0} value={high} onChange={(event) => setHigh(Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" /></label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy || state.status !== "active"} onClick={() => void onAction({ kind: "range_update", low, high })} className="rounded-lg bg-lapis px-5 py-2.5 font-medium text-white disabled:opacity-50">Update interval</button>
            <button type="button" disabled={busy || state.mid === null || state.status !== "active"} onClick={() => state.mid !== null && void onAction({ kind: "range_confirm_found", index: state.mid })} className="rounded-lg border border-lapis px-5 py-2.5 font-medium text-lapis disabled:opacity-50">Confirm target at mid</button>
          </div>
        </div>
      )}

      {block.kind === "state-trace" && state.kind === block.kind && (
        <div className="mt-5">
          <p className="text-sm text-ink-soft">Enter the next inclusive-boundary state. The expected trace remains server-side.</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <label className="text-sm font-medium">Low<input type="number" min={0} value={low} onChange={(event) => setLow(Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" /></label>
            <label className="text-sm font-medium">High<input type="number" min={0} value={high} onChange={(event) => setHigh(Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" /></label>
            <label className="text-sm font-medium">Mid<input type="number" min={0} value={mid} onChange={(event) => setMid(Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" /></label>
          </div>
          <button type="button" disabled={busy || state.complete} onClick={() => void onAction({ kind: "trace_submit", low, high, mid })} className="mt-4 rounded-lg bg-lapis px-5 py-2.5 font-medium text-white disabled:opacity-50">Check next state</button>
        </div>
      )}

      <p role="status" aria-live="polite" className="mt-4 min-h-6 text-sm font-medium text-ink-soft">
        {feedback}
      </p>
    </section>
  );
}
