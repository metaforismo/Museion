/**
 * Live widget state for Maia's eyes: what the learner's canvas shows
 * RIGHT NOW, before anything is submitted. The client reports it with a
 * chat message; this module renders it into a deterministic sentence
 * only when it matches the active step — a graph report on a non-graph
 * step, or a slot value outside the enumerated options, is dropped.
 * The description contains only the learner's own values, never the
 * target's, so it cannot leak an answer.
 */

import type { Step } from "../content/types";

export type LabActivity =
  | { kind: "graph"; a: number; h: number; k: number }
  | { kind: "recursion"; slots: Record<string, string> };

const trim = (value: number) => String(Number(value.toFixed(2)));

export function describeActivity(step: Step, activity: LabActivity): string | null {
  if (activity.kind === "graph") {
    if (step.answer.kind !== "graph") return null;
    const { a, h, k } = activity;
    if (![a, h, k].every((value) => Number.isFinite(value) && Math.abs(value) <= 100)) return null;
    return `The learner's canvas right now (their own unchecked work): a=${trim(a)}, h=${trim(h)}, k=${trim(k)} — their curve's vertex sits at (${trim(h)}, ${trim(k)}).`;
  }

  const lab = step.lab;
  if (lab?.kind !== "recursion-code") return null;
  const entries = Object.entries(activity.slots);
  if (entries.length === 0 || entries.length > lab.slots.length) return null;
  const parts: string[] = [];
  for (const [slotId, value] of entries) {
    const slot = lab.slots.find((candidate) => candidate.id === slotId);
    if (!slot || !slot.options.includes(value)) return null;
    parts.push(`${slotId}=${value}`);
  }
  return `The learner's current slot choices (their own unchecked work): ${parts.join(", ")}.`;
}

/** Short first-person form for the deterministic offline reply. */
export function describeActivityInline(step: Step, activity: LabActivity): string | null {
  const full = describeActivity(step, activity);
  if (!full) return null;
  if (activity.kind === "graph") {
    return `I can see your canvas: a=${trim(activity.a)}, h=${trim(activity.h)}, k=${trim(activity.k)}.`;
  }
  return `I can see your current slot choices: ${Object.entries(activity.slots).map(([id, value]) => `${id}=${value}`).join(", ")}.`;
}
