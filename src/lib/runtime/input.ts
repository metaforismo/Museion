/** Parse the deliberately small integer vocabulary accepted by runtime controls. */
export function parseRuntimeInteger(value: string): number | null {
  if (!/^-?\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/** Inclusive ranges may end at -1 only to represent an empty interval. */
export function validRangeBoundaries(low: number | null, high: number | null): boolean {
  return low !== null && low >= 0 && high !== null && high >= -1;
}

/** Trace states always describe a midpoint inside a non-empty index space. */
export function validTraceState(
  low: number | null,
  high: number | null,
  mid: number | null,
): boolean {
  return low !== null && low >= 0 && high !== null && high >= 0 && mid !== null && mid >= 0;
}
