"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { PublicStep } from "@/lib/content/types";

/**
 * Function Transformation Lab.
 *
 * The learner shapes y = a(x−h)² + k (or a line) until it matches the
 * dashed target curve, then submits the parameters. Everything here is
 * display logic: verification, tolerance and misconception matching
 * happen server-side in the deterministic engine, like every other
 * answer kind. Drag, keyboard and numeric input are all first-class.
 */

type GraphConfig = NonNullable<PublicStep["graph"]>;

const PARAM_STEP = 0.5;
const A_LIMIT = 3;

function trim(value: number): string {
  return String(Number(value.toFixed(2)));
}

function snap(value: number): number {
  return Math.round(value / PARAM_STEP) * PARAM_STEP;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function GraphTransformLab({
  graph,
  disabled,
  checking,
  highlight = null,
  onStateChange,
  onSubmit,
}: {
  graph: GraphConfig;
  disabled: boolean;
  checking: boolean;
  /** Engine attention mark: pulses one parameter control after a diagnosed misconception. */
  highlight?: "a" | "h" | "k" | null;
  /** Reports the live, unchecked canvas state so Maia can see it. */
  onStateChange?: (state: { a: number; h: number; k: number }) => void;
  onSubmit: (answer: string) => void;
}) {
  const [a, setA] = useState(1);
  const [h, setH] = useState(0);
  const [k, setK] = useState(0);
  useEffect(() => {
    onStateChange?.({ a, h, k });
  }, [a, h, k, onStateChange]);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const labelId = useId();

  const [minX, maxX] = graph.xRange;
  const [minY, maxY] = graph.yRange;
  const width = 460;
  const height = 320;
  const toPx = (x: number, y: number): [number, number] => [
    ((x - minX) / (maxX - minX)) * width,
    height - ((y - minY) / (maxY - minY)) * height,
  ];
  const toGraph = (px: number, py: number): [number, number] => [
    minX + (px / width) * (maxX - minX),
    minY + ((height - py) / height) * (maxY - minY),
  ];

  const value = (x: number) => {
    const shifted = x - h;
    return graph.family === "quadratic-vertex" ? a * shifted * shifted + k : a * shifted + k;
  };

  const learnerPath = useMemo(() => {
    const segments: string[] = [];
    for (let index = 0; index <= 64; index += 1) {
      const x = minX + ((maxX - minX) * index) / 64;
      const [px, py] = toPx(x, value(x));
      segments.push(`${index === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return segments.join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, h, k, graph.family, minX, maxX, minY, maxY]);

  const targetPath = useMemo(
    () =>
      graph.targetPoints
        .map(([x, y], index) => {
          const [px, py] = toPx(x, y);
          return `${index === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
        })
        .join(" "),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graph.targetPoints, minX, maxX, minY, maxY],
  );

  const applyPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current || disabled) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const [gx, gy] = toGraph(
      ((event.clientX - rect.left) / rect.width) * width,
      ((event.clientY - rect.top) / rect.height) * height,
    );
    setH(clamp(snap(gx), minX, maxX));
    setK(clamp(snap(gy), minY, maxY));
  };

  const moveVertex = (dx: number, dy: number) => {
    setH((current) => clamp(snap(current + dx), minX, maxX));
    setK((current) => clamp(snap(current + dy), minY, maxY));
  };

  const [vertexPx, vertexPy] = toPx(h, k);
  const gridX = [];
  for (let x = Math.ceil(minX); x <= Math.floor(maxX); x += 1) gridX.push(x);
  const gridY = [];
  for (let y = Math.ceil(minY); y <= Math.floor(maxY); y += 1) gridY.push(y);

  const term = (name: "a" | "h" | "k", value: number) => (
    <strong className={highlight === name ? "rounded bg-gold-soft px-1 text-ink shadow-[inset_0_-2px_0_var(--color-gold)]" : "text-lapis-dark"}>
      {trim(value)}
    </strong>
  );
  const equation =
    graph.family === "quadratic-vertex" ? (
      <span className="font-mono text-sm tabular-nums">
        y = {term("a", a)}(x − {term("h", h)})²{" "}
        + {term("k", k)}
      </span>
    ) : (
      <span className="font-mono text-sm tabular-nums">
        y = {term("a", a)}(x − {term("h", h)}) +{" "}
        {term("k", k)}
      </span>
    );

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-ink/10 bg-paper/40">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 bg-surface px-4 py-2">
          <p className="text-xs font-medium text-ink-soft">
            <span aria-hidden="true" className="mr-1.5 inline-block h-0.5 w-5 -translate-y-0.5 border-b-2 border-dashed border-gold align-middle" />
            Target curve — match it with yours
          </p>
          <p aria-live="polite">{equation}</p>
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby={labelId}
          className="block w-full touch-none select-none"
          onPointerDown={(event) => {
            if (disabled) return;
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            applyPointer(event);
          }}
          onPointerMove={applyPointer}
          onPointerUp={() => {
            dragging.current = false;
          }}
        >
          <title id={labelId}>
            Interactive graph. The dashed target curve is fixed; adjust a, h and k until your solid curve matches it.
          </title>
          {gridX.map((x) => {
            const [px] = toPx(x, 0);
            return <line key={`gx${x}`} x1={px} y1={0} x2={px} y2={height} stroke={x === 0 ? "rgba(20,25,43,0.35)" : "rgba(20,25,43,0.07)"} strokeWidth={x === 0 ? 1.4 : 1} />;
          })}
          {gridY.map((y) => {
            const [, py] = toPx(0, y);
            return <line key={`gy${y}`} x1={0} y1={py} x2={width} y2={py} stroke={y === 0 ? "rgba(20,25,43,0.35)" : "rgba(20,25,43,0.07)"} strokeWidth={y === 0 ? 1.4 : 1} />;
          })}
          <path d={targetPath} fill="none" stroke="#c79114" strokeWidth="2.5" strokeDasharray="7 6" strokeLinecap="round" />
          <path d={learnerPath} fill="none" stroke="#2b4acb" strokeWidth="3" strokeLinecap="round" />
          <circle cx={vertexPx} cy={vertexPy} r="14" fill="rgba(43,74,203,0.14)" />
          <circle cx={vertexPx} cy={vertexPy} r="7" fill="#2b4acb" stroke="#ffffff" strokeWidth="2.5" />
        </svg>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <button
          type="button"
          disabled={disabled}
          onKeyDown={(event) => {
            const delta =
              event.key === "ArrowLeft" ? [-PARAM_STEP, 0] : event.key === "ArrowRight" ? [PARAM_STEP, 0] : event.key === "ArrowUp" ? [0, PARAM_STEP] : event.key === "ArrowDown" ? [0, -PARAM_STEP] : null;
            if (!delta) return;
            event.preventDefault();
            moveVertex(delta[0], delta[1]);
          }}
          className="min-h-11 rounded-lg border border-ink/15 bg-surface px-3 text-xs font-medium text-ink-soft transition focus-visible:border-lapis hover:border-lapis/50"
          aria-label={`Move the ${graph.family === "quadratic-vertex" ? "vertex" : "anchor point"} with arrow keys. Currently h ${trim(h)}, k ${trim(k)}.`}
        >
          ✛ Arrow keys move the {graph.family === "quadratic-vertex" ? "vertex" : "anchor"}
        </button>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["a", a, (next: number) => setA(clamp(snap(next), -A_LIMIT, A_LIMIT)), "steepness and flip"],
              ["h", h, (next: number) => setH(clamp(snap(next), minX, maxX)), "horizontal shift"],
              ["k", k, (next: number) => setK(clamp(snap(next), minY, maxY)), "vertical shift"],
            ] as const
          ).map(([name, current, update, describe]) => (
            <div
              key={name}
              className={`rounded-lg border p-2 transition ${highlight === name ? "border-gold bg-gold-soft/50 shadow-[0_0_0_3px_var(--color-gold-soft)] motion-safe:animate-pulse" : "border-ink/10 bg-surface"}`}
            >
              <label htmlFor={`${labelId}-${name}`} className="flex items-baseline justify-between text-xs font-semibold">
                {name}
                <span className="font-normal text-ink-soft">{describe}</span>
              </label>
              <div className="mt-1.5 flex items-center gap-1">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => update(current - PARAM_STEP)}
                  aria-label={`Decrease ${name}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-ink/15 font-semibold transition hover:border-lapis"
                >
                  −
                </button>
                <input
                  id={`${labelId}-${name}`}
                  type="number"
                  step={PARAM_STEP}
                  value={current}
                  disabled={disabled}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isFinite(next)) update(next);
                  }}
                  className="h-9 w-full min-w-0 rounded-md border border-ink/15 bg-surface px-1 text-center font-mono text-sm tabular-nums outline-none focus:border-lapis"
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => update(current + PARAM_STEP)}
                  aria-label={`Increase ${name}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-ink/15 font-semibold transition hover:border-lapis"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onSubmit(`a=${trim(a)},h=${trim(h)},k=${trim(k)}`)}
        className="mx-auto mt-4 block min-h-12 rounded-2xl bg-lapis px-7 text-sm font-bold text-white shadow-[var(--shadow-1)] transition hover:-translate-y-0.5 hover:bg-lapis-dark disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
      >
        {checking ? "Checking…" : "Check my curve"}
      </button>
    </div>
  );
}
