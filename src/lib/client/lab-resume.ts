import type { PublicStep, RecursionLab } from "@/lib/content/types";

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "");

/** Restores only the learner's recorded submission, within the public control domain. */
export function graphParametersFromAttempt(answer: string | null | undefined, graph: NonNullable<PublicStep["graph"]>): { a: number; h: number; k: number } | null {
  if (!answer || answer.length > 200) return null;
  const match = normalize(answer).match(/^a=(-?\d+(?:\.\d+)?),h=(-?\d+(?:\.\d+)?),k=(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const [a, h, k] = match.slice(1).map(Number);
  if (![a, h, k].every(Number.isFinite) || a < -3 || a > 3 || h < graph.xRange[0] || h > graph.xRange[1] || k < graph.yRange[0] || k > graph.yRange[1]) return null;
  return { a, h, k };
}

/** Slot values must be actual public options. No evaluation or solution inference occurs. */
export function recursionChoicesFromAttempt(answer: string | null | undefined, lab: RecursionLab): Record<string, string> {
  const empty = Object.fromEntries(lab.slots.map((slot) => [slot.id, ""]));
  if (!answer || answer.length > 2_000) return empty;
  const entries = normalize(answer).split(",").map((item) => item.split("="));
  if (entries.length !== lab.slots.length || entries.some((item) => item.length !== 2) || new Set(entries.map(([id]) => id)).size !== entries.length) return empty;
  const values = new Map(entries.map(([id, value]) => [id, value]));
  const restored: Record<string, string> = {};
  for (const slot of lab.slots) {
    const chosen = slot.options.find((option) => normalize(option) === values.get(normalize(slot.id)));
    if (chosen === undefined) return empty;
    restored[slot.id] = chosen;
  }
  return restored;
}
