"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { Pressable } from "@/components/ui";
import ActivityTarget from "@/components/ActivityTarget";
import type { TutorUiAction } from "@/lib/maia/contracts";
import type { RecursionLab } from "@/lib/content/types";
import { recursionChoicesFromAttempt } from "@/lib/client/lab-resume";

import styles from "./RecursionCodeLab.module.css";

/**
 * The Recursion Lab. The learner completes a recursive function by
 * choosing enumerated slot values; the definition is simulated with a
 * hard depth cap and the call trace + visible tests update live. No
 * arbitrary code runs — the "interpreter" only understands the
 * enumerated option forms, so behavior is fully deterministic.
 * Verification still happens server-side like every other answer.
 */

const DEPTH_CAP = 7;

/** Evaluate an enumerated option form against the parameter's current value. */
function evalForm(form: string, paramName: string, n: number): number | null {
  const trimmed = form.replaceAll(" ", "").replaceAll(paramName, "n");
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  if (trimmed === "n") return n;
  const match = trimmed.match(/^n([+-])(\d+)$/);
  if (match) return match[1] === "+" ? n + Number(match[2]) : n - Number(match[2]);
  return null;
}

interface TraceLine {
  depth: number;
  call: number;
}

interface RunResult {
  trace: TraceLine[];
  value: number | null;
  terminated: boolean;
}

function simulate(lab: RecursionLab, chosen: Record<string, string>, input: number): RunResult {
  const param = lab.paramName;
  const base = evalForm(chosen.base ?? "", param, input);
  const trace: TraceLine[] = [];
  const run = (n: number, depth: number): number | null => {
    trace.push({ depth, call: n });
    if (depth >= DEPTH_CAP) return null;
    const baseValue = evalForm(chosen.base ?? "", param, n);
    if (baseValue !== null && n === baseValue) {
      return evalForm(chosen.baseReturn ?? "", param, n);
    }
    const next = evalForm(chosen.next ?? "", param, n);
    const head = evalForm(chosen.head ?? "", param, n);
    if (next === null || head === null) return null;
    const rest = run(next, depth + 1);
    if (rest === null) return null;
    return lab.op === "+" ? head + rest : head * rest;
  };
  const value = run(input, 0);
  return { trace, value, terminated: value !== null && base !== null };
}

export default function RecursionCodeLab({
  lab,
  accent = "var(--color-lapis)",
  edge = "var(--color-lapis-deep)",
  disabled,
  solved = false,
  checking,
  held = false,
  uiActions = [],
  initialAnswer = null,
  onStateChange,
  onSubmit,
}: {
  lab: RecursionLab;
  /** Subject accent fill for the Check pressable — `subjectColor(track)`. */
  accent?: string;
  /** Its deep edge — `subjectDeep(track)`. */
  edge?: string;
  disabled: boolean;
  solved?: boolean;
  checking: boolean;
  /** Keeps the Check pressable pressed through checking and the wrong beat. */
  held?: boolean;
  uiActions?: readonly TutorUiAction[];
  /** Sanitized recorded learner input; choices must match public slot options. */
  initialAnswer?: string | null;
  /** Reports the live, unchecked slot choices so Maia can see them. */
  onStateChange?: (state: { slots: Record<string, string> }) => void;
  onSubmit: (answer: string) => void;
}) {
  const labelId = useId();
  const [chosen, setChosen] = useState<Record<string, string>>(() =>
    recursionChoicesFromAttempt(initialAnswer, lab),
  );
  const allChosen = lab.slots.every((slot) => chosen[slot.id]);
  useEffect(() => {
    const filled = Object.fromEntries(Object.entries(chosen).filter(([, value]) => value !== ""));
    onStateChange?.({ slots: filled });
  }, [chosen, onStateChange]);

  const firstTest = lab.tests[0];
  const run = useMemo(
    () => (allChosen && firstTest ? simulate(lab, chosen, firstTest.input) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allChosen, chosen, lab, firstTest?.input],
  );
  const testResults = useMemo(
    () =>
      lab.tests.map((test) => {
        if (!allChosen) return { ...test, got: null as number | null };
        const result = simulate(lab, chosen, test.input);
        return { ...test, got: result.value };
      }),
    [allChosen, chosen, lab],
  );
  const runaway = run !== null && !run.terminated;
  const repeatedInput = Boolean(runaway && run?.trace.length && run.trace.every((line) => line.call === run.trace[0].call));

  const canonical = lab.slots.map((slot) => `${slot.id}=${chosen[slot.id]}`).join(",").replaceAll(" ", "").toLowerCase();

  const renderLine = (line: string, lineIndex: number) => {
    const parts = line.split(/(\{[a-zA-Z]+\})/g);
    return (
      <div key={lineIndex} className={styles.codeLine}>
        <span className="mr-3 w-4 select-none text-right text-micro text-white/30">{lineIndex + 1}</span>
        {parts.map((part, partIndex) => {
          const slotMatch = part.match(/^\{([a-zA-Z]+)\}$/);
          if (!slotMatch) return <span key={partIndex}>{part}</span>;
          const slot = lab.slots.find(({ id }) => id === slotMatch[1]);
          if (!slot) return null;
          const value = chosen[slot.id];
          return (
            <ActivityTarget key={partIndex} as="span" targetId={`recursion:slot:${slot.id}`} label={`${slot.id} slot`} actions={uiActions}>
              <select
                aria-label={`Choose ${slot.id}`}
                value={value}
                disabled={disabled}
                onChange={(event) => setChosen((current) => ({ ...current, [slot.id]: event.target.value }))}
                className={`min-h-8 cursor-pointer appearance-none rounded-lg border-2 px-2.5 py-0.5 text-center font-mono text-lead font-semibold transition focus:outline-2 focus:outline-offset-2 focus:outline-gold ${
                  value ? "border-gold/70 bg-gold-soft text-ink" : "border-dashed border-white/40 bg-white/10 text-white"
                }`}
              >
                <option value="" disabled>
                  ▢
                </option>
                {slot.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </ActivityTarget>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.lab}>
      <div className={styles.panels}>
        {/* Code editor */}
        <ActivityTarget targetId="recursion:code" label="Your recursive function" actions={uiActions} className="rounded-xl">
          <div className="overflow-hidden rounded-xl border border-ink/60 bg-[#16192b] shadow-[var(--shadow-1)]">
            {/* Neutral window chrome: correct-green and wrong-red are reserved
                for checked outcomes, so the traffic lights stay monochrome. */}
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/25" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/25" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/25" aria-hidden="true" />
              <span className="ml-2 font-mono text-micro text-white/50">{lab.functionName}.py · fill the slots</span>
            </div>
            <div className={`${styles.codeBody} space-y-1.5 p-4 font-mono text-lead leading-7 text-[#d6e0ff]`} aria-labelledby={labelId}>
              <span id={labelId} className="sr-only">Complete the recursive function by choosing a value for each slot</span>
              {lab.lines.map(renderLine)}
            </div>
          </div>

        </ActivityTarget>
        {/* Output: live call trace */}
        <ActivityTarget targetId="recursion:trace" label="Your call trace" actions={uiActions} className="rounded-xl">
          <div className="overflow-hidden rounded-xl border border-gold/40 bg-gold-soft/60">
            <p className="border-b border-gold/25 px-4 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.08em] text-ink">
              ▾ Output · {firstTest ? `${lab.functionName}(${firstTest.input})` : ""}
            </p>
            <div className="min-h-36 p-4 font-mono text-body-sm leading-6" aria-live="polite">
              {!allChosen && <p className="text-ink-soft">Fill every slot to run the function.</p>}
              {run && (
                <>
                  {run.trace.slice(0, DEPTH_CAP).map((line, index) => (
                    <p key={index} style={{ paddingLeft: `${line.depth * 14}px` }} className={`break-words ${runaway ? "text-wrong" : "text-ink"}`}>
                      {lab.functionName}({line.call})
                    </p>
                  ))}
                  {runaway ? (
                    <p className="mt-2 font-sans text-body-sm font-semibold text-wrong">
                      {repeatedInput ? "The input repeats. What would help the next call move toward the base case?" : "This trace reached its safety limit. Check whether each call moves toward the base case."}
                    </p>
                  ) : (
                    // Ink, not correct-green: the run terminating says nothing
                    // about whether the definition is right.
                    <p className="mt-2 font-semibold text-ink">→ returns {run.value}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </ActivityTarget>
      </div>

      {/* Visible tests */}
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Visible tests">
        {testResults.map((test) => {
          const state = test.got === null ? allChosen ? "stopped" : "pending" : test.got === test.expected ? "pass" : "fail";
          return (
            <span
              key={test.input}
              className={`inline-flex min-h-9 max-w-full flex-wrap items-center gap-2 rounded-lg border px-3 py-1 font-mono text-body-sm tabular-nums ${
                state === "pass"
                  ? "border-correct/40 bg-correct-soft text-correct"
                  : state === "fail"
                    ? "border-wrong/40 bg-wrong-soft text-wrong"
                    : "border-ink/15 bg-surface text-ink-soft"
              }`}
            >
              {lab.functionName}({test.input}) = {test.expected}
              <span aria-hidden="true">{state === "pass" ? "✓" : state === "fail" ? `✗ got ${test.got}` : state === "stopped" ? "· trace stopped" : "·"}</span>
              <span className="sr-only">{state === "pass" ? "passes" : state === "fail" ? `fails, got ${test.got}` : state === "stopped" ? "trace stopped before returning a result" : "waiting for all slots"}</span>
            </span>
          );
        })}
      </div>

      {!solved && <div className="mt-4 flex justify-center">
        <Pressable
          accent={accent}
          edge={edge}
          disabled={disabled || !allChosen}
          onClick={() => onSubmit(canonical)}
          className={`min-h-12 px-7 ${held ? "pressable-held" : ""}`}
        >
          {checking ? "Checking…" : "Check my function"}
        </Pressable>
      </div>}
    </div>
  );
}
