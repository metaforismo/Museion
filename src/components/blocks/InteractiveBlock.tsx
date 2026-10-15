"use client";

import { useEffect, useState } from "react";

import ActivityTarget from "@/components/ActivityTarget";
import { Pressable } from "@/components/ui";
import type { PublicLearningBlock } from "@/lib/compiler";
import type { RuntimeAction, RuntimeState, RuntimeTutorIntervention } from "@/lib/runtime";
import { parseRuntimeInteger, validRangeBoundaries, validTraceState } from "@/lib/runtime/input";

type PublicInteractiveBlock = Extract<
  PublicLearningBlock,
  { kind: "prediction-choice" | "sequence-builder" | "range-explorer" | "state-trace" }
>;

/**
 * A checked outcome, or a note. The verdict decides which of the reserved
 * colours — correct-green bloom, wrong-red — the status area may use: only
 * an outcome the engine accepted and checked earns one. A rejected (invalid)
 * action is a `note` and stays neutral.
 */
export interface CheckedFeedback {
  message: string;
  verdict: "correct" | "wrong" | "note";
}

export interface InteractiveBlockProps {
  block: PublicInteractiveBlock;
  state: RuntimeState;
  busy: boolean;
  /** Keeps the Check pressable pressed: while checking, and through the wrong-answer beat. */
  held: boolean;
  /** Subject accent fill for the Check pressables — `subjectColor(...)`. */
  accent: string;
  /** Its deep edge — `subjectDeep(...)`. */
  edge: string;
  feedback: CheckedFeedback | null;
  tutor: RuntimeTutorIntervention | null;
  embedded?: boolean;
  lastAction?: RuntimeAction | null;
  onDraftChange?: (action: RuntimeAction) => void;
  uiActions?: import("@/lib/maia/contracts").TutorUiAction[];
  onAction(action: RuntimeAction): Promise<void>;
}

export default function InteractiveBlock({
  block,
  state,
  busy,
  held,
  accent,
  edge,
  feedback,
  tutor,
  onAction,
  onDraftChange,
  embedded = false,
  lastAction,
  uiActions,
}: InteractiveBlockProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [order, setOrder] = useState<string[]>(
    block.kind === "sequence-builder" ? state.kind === "sequence-builder" && state.submittedOrder.length ? state.submittedOrder : block.items.map((item) => item.id).reverse() : [],
  );
  const [low, setLow] = useState(
    String(state.kind === "range-explorer" ? state.low : lastAction && (lastAction.kind === "trace_submit" || lastAction.kind === "range_update") ? lastAction.low : block.kind === "state-trace" ? block.initialState.low : 0),
  );
  const [high, setHigh] = useState(
    String(state.kind === "range-explorer" ? state.high : lastAction && (lastAction.kind === "trace_submit" || lastAction.kind === "range_update") ? lastAction.high : block.kind === "state-trace" ? block.initialState.high : 0),
  );
  const [mid, setMid] = useState(
    String(lastAction?.kind === "trace_submit" ? lastAction.mid : block.kind === "state-trace" ? block.initialState.mid : 0),
  );
  const [fieldsTouched, setFieldsTouched] = useState(false);
  const actions = uiActions ?? tutor?.turn.uiActions ?? [];
  const emphasized = new Set(actions.map((action) => action.targetId));
  const emphasis = (targetId: string) => emphasized.has(targetId) ? " ring-2 ring-gold ring-offset-2" : "";
  const lowValue = parseRuntimeInteger(low);
  const highValue = parseRuntimeInteger(high);
  const midValue = parseRuntimeInteger(mid);
  const rangeValid = validRangeBoundaries(lowValue, highValue);
  const traceValid = validTraceState(lowValue, highValue, midValue);

  useEffect(() => {
    if (!onDraftChange) return;
    if (block.kind === "sequence-builder") onDraftChange({ kind: "sequence_submit", order });
    else if (block.kind === "prediction-choice" && selectedIndex !== null) onDraftChange({ kind: "prediction_select", optionIndex: selectedIndex });
    else if (block.kind === "range-explorer" && rangeValid && lowValue !== null && highValue !== null) onDraftChange({ kind: "range_update", low: lowValue, high: highValue });
    else if (block.kind === "state-trace" && traceValid && lowValue !== null && highValue !== null && midValue !== null) onDraftChange({ kind: "trace_submit", low: lowValue, high: highValue, mid: midValue });
  }, [block.kind, order, selectedIndex, rangeValid, traceValid, lowValue, highValue, midValue, onDraftChange]);

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
    <ActivityTarget targetId={`block:${block.id}`} actions={actions} label="Activity"><section
      aria-labelledby={`${block.id}-title`}
      data-runtime-target={`block:${block.id}`}
      className={`${embedded ? "" : "surface-card p-5"}${emphasis(`block:${block.id}`)}`}
    >
      <h3 id={`${block.id}-title`} className={embedded ? "sr-only" : "text-xl font-semibold"}>
        {block.accessibilityLabel}
      </h3>
      <ActivityTarget targetId={`prompt:${block.id}`} actions={actions} label="Activity question"><p data-runtime-target={`prompt:${block.id}`} className={embedded ? "sr-only" : `mt-3 leading-relaxed${emphasis(`prompt:${block.id}`)}`}>{block.prompt}</p></ActivityTarget>

      {block.kind === "prediction-choice" && (
        <fieldset className="mt-5 space-y-2" disabled={busy || state.kind !== block.kind || state.complete}>
          <legend className="sr-only">Choose your prediction</legend>
          {block.options.map((option, index) => (
            <label key={option} data-runtime-target={`option:${block.id}:${index}`} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-ink/15 px-3 py-2 focus-within:ring-2 focus-within:ring-lapis${emphasis(`option:${block.id}:${index}`)}`}>
              <input type="radio" name={`${block.id}-prediction`} checked={selectedIndex === index} onChange={() => setSelectedIndex(index)} />
              <span>{option}</span>
            </label>
          ))}
          <Pressable accent={accent} edge={edge} disabled={selectedIndex === null || busy} onClick={() => selectedIndex !== null && void onAction({ kind: "prediction_select", optionIndex: selectedIndex })} className={`mt-3 px-5 ${held ? "pressable-held" : ""}`}>
            Check prediction
          </Pressable>
        </fieldset>
      )}

      {block.kind === "sequence-builder" && (
        <div className="mt-5">
          <p className="text-body-sm text-ink-soft">Use the buttons to place every step in a justified order.</p>
          <ol className="mt-3 space-y-2">
            {order.map((id, index) => {
              const item = block.items.find((candidate) => candidate.id === id);
              return (
                <li key={id} data-runtime-target={`item:${block.id}:${id}`} className={`flex items-center gap-2 rounded-lg border border-ink/15 p-3${emphasis(`item:${block.id}:${id}`)}`}>
                  <span className="w-6 font-semibold" aria-hidden="true">{index + 1}.</span>
                  <ActivityTarget as="span" targetId={`item:${block.id}:${id}`} actions={actions} label={item?.label ?? "Sequence item"} className="flex-1">{item?.label}</ActivityTarget>
                  <button type="button" aria-label={`Move ${item?.label} up`} disabled={busy || index === 0} onClick={() => move(index, -1)} className="pressable min-h-10 min-w-10 rounded-lg border border-ink/15 bg-surface">↑</button>
                  <button type="button" aria-label={`Move ${item?.label} down`} disabled={busy || index === order.length - 1} onClick={() => move(index, 1)} className="pressable min-h-10 min-w-10 rounded-lg border border-ink/15 bg-surface">↓</button>
                </li>
              );
            })}
          </ol>
          <Pressable accent={accent} edge={edge} disabled={busy || (state.kind === block.kind && state.complete)} onClick={() => void onAction({ kind: "sequence_submit", order })} className={`mt-4 px-5 ${held ? "pressable-held" : ""}`}>
            Check order
          </Pressable>
        </div>
      )}

      {block.kind === "range-explorer" && state.kind === block.kind && (
        <div className="mt-5">
          <div className="overflow-x-auto pb-2" aria-label="Binary search values">
            <div className="flex min-w-max gap-2">
              {block.values.map((value, index) => {
                const active = index >= state.low && index <= state.high;
                const current = index === state.mid;
                return <div key={index} data-runtime-target={`value:${block.id}:${index}`} className={`min-w-14 rounded-lg border px-3 py-2 text-center ${current ? "border-gold bg-gold-soft" : active ? "border-lapis bg-lapis-soft" : "border-ink/10 opacity-45"}${emphasis(`value:${block.id}:${index}`)}`}><span className="block text-label text-ink-soft">{index}</span><span className="font-semibold">{value}</span></div>;
              })}
            </div>
          </div>
          <p className="mt-2 text-body-sm">Current: low {state.low}, high {state.high}, mid {state.mid ?? "—"}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ActivityTarget targetId={`control:${block.id}:low`} actions={actions} label="Low control"><label data-runtime-target={`control:${block.id}:low`} className={`text-body-sm font-medium${emphasis(`control:${block.id}:low`)}`}>Next low<input type="text" inputMode="numeric" value={low} aria-invalid={fieldsTouched && (lowValue === null || lowValue < 0)} aria-describedby={`${block.id}-range-help`} onBlur={() => setFieldsTouched(true)} onChange={(event) => setLow(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-lead tabular-nums" /></label></ActivityTarget>
            <ActivityTarget targetId={`control:${block.id}:high`} actions={actions} label="High control"><label data-runtime-target={`control:${block.id}:high`} className={`text-body-sm font-medium${emphasis(`control:${block.id}:high`)}`}>Next high<input type="text" inputMode="numeric" value={high} aria-invalid={fieldsTouched && (highValue === null || highValue < -1)} aria-describedby={`${block.id}-range-help`} onBlur={() => setFieldsTouched(true)} onChange={(event) => setHigh(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-lead tabular-nums" /></label></ActivityTarget>
          </div>
          <p id={`${block.id}-range-help`} role={fieldsTouched && !rangeValid ? "alert" : undefined} className={`mt-2 text-body-sm ${fieldsTouched && !rangeValid ? "text-wrong" : "text-ink-soft"}`}>Low must be non-negative. High may be -1 only when the interval becomes empty.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pressable accent={accent} edge={edge} disabled={busy || state.status !== "active" || !rangeValid} onClick={() => { setFieldsTouched(true); if (rangeValid && lowValue !== null && highValue !== null) void onAction({ kind: "range_update", low: lowValue, high: highValue }); }} className={`px-5 ${held ? "pressable-held" : ""}`}>Update interval</Pressable>
            <Pressable variant="secondary" disabled={busy || state.mid === null || state.status !== "active"} onClick={() => state.mid !== null && void onAction({ kind: "range_confirm_found", index: state.mid })} className="px-5">Confirm target at mid</Pressable>
          </div>
        </div>
      )}

      {block.kind === "state-trace" && state.kind === block.kind && (
        <div className="mt-5">
          <p className="text-body-sm text-ink-soft">Enter the next inclusive-boundary state.</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <ActivityTarget targetId={`control:${block.id}:low`} actions={actions} label="Low control"><label data-runtime-target={`control:${block.id}:low`} className={`text-body-sm font-medium${emphasis(`control:${block.id}:low`)}`}>Low<input type="text" inputMode="numeric" value={low} aria-invalid={fieldsTouched && (lowValue === null || lowValue < 0)} aria-describedby={`${block.id}-trace-help`} onBlur={() => setFieldsTouched(true)} onChange={(event) => setLow(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-lead tabular-nums" /></label></ActivityTarget>
            <ActivityTarget targetId={`control:${block.id}:high`} actions={actions} label="High control"><label data-runtime-target={`control:${block.id}:high`} className={`text-body-sm font-medium${emphasis(`control:${block.id}:high`)}`}>High<input type="text" inputMode="numeric" value={high} aria-invalid={fieldsTouched && (highValue === null || highValue < 0)} aria-describedby={`${block.id}-trace-help`} onBlur={() => setFieldsTouched(true)} onChange={(event) => setHigh(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-lead tabular-nums" /></label></ActivityTarget>
            <ActivityTarget targetId={`control:${block.id}:mid`} actions={actions} label="Mid control"><label data-runtime-target={`control:${block.id}:mid`} className={`text-body-sm font-medium${emphasis(`control:${block.id}:mid`)}`}>Mid<input type="text" inputMode="numeric" value={mid} aria-invalid={fieldsTouched && (midValue === null || midValue < 0)} aria-describedby={`${block.id}-trace-help`} onBlur={() => setFieldsTouched(true)} onChange={(event) => setMid(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-lead tabular-nums" /></label></ActivityTarget>
          </div>
          <p id={`${block.id}-trace-help`} role={fieldsTouched && !traceValid ? "alert" : undefined} className={`mt-2 text-body-sm ${fieldsTouched && !traceValid ? "text-wrong" : "text-ink-soft"}`}>Enter a non-negative whole number for every boundary and midpoint.</p>
          <Pressable accent={accent} edge={edge} disabled={busy || state.complete || !traceValid} onClick={() => { setFieldsTouched(true); if (traceValid && lowValue !== null && highValue !== null && midValue !== null) void onAction({ kind: "trace_submit", low: lowValue, high: highValue, mid: midValue }); }} className={`mt-4 px-5 ${held ? "pressable-held" : ""}`}>Check next state</Pressable>
        </div>
      )}

      {/* Checked outcomes follow the canvas grammar exactly: the engine said
          correct and the surface blooms its green; the engine said wrong and
          the card wears wrong-red (the shake plays on the wrapper above).
          Anything the engine did not check stays neutral. */}
      <ActivityTarget targetId={`status:${block.id}`} actions={actions} label="Activity feedback"><div role="status" aria-live="polite" data-runtime-target={`status:${block.id}`} className={`mt-4 min-h-6${emphasis(`status:${block.id}`)}`}>
        {feedback?.verdict === "correct" && <p className="rounded-xl bg-correct px-4 py-3 font-semibold text-white animate-verified-bloom">{feedback.message}</p>}
        {feedback?.verdict === "wrong" && <p className="rounded-xl border-2 border-wrong/20 bg-wrong-soft px-4 py-3 font-semibold text-wrong">{feedback.message}</p>}
        {feedback?.verdict === "note" && <p className="text-body-sm font-medium text-ink-soft">{feedback.message}</p>}
      </div></ActivityTarget>
      {tutor?.turn.uiActions.some((action) => action.kind === "annotate" && action.text) && (
        <div className="mt-3 rounded-lg border-l-2 border-gold bg-gold-soft px-3 py-2 text-body-sm leading-6 text-ink" aria-label="Maia annotation">
          {tutor.turn.uiActions.filter((action) => action.kind === "annotate" && action.text).map((action) => (
            <p key={`${action.targetId}:${action.text}`}>{action.text}</p>
          ))}
        </div>
      )}
    </section></ActivityTarget>
  );
}
