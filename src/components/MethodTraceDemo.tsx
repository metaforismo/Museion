"use client";

import { useEffect, useRef, useState } from "react";

import MaiaCharacter from "@/components/MaiaCharacter";

/**
 * A miniature, fully deterministic replay of one real Museion learning
 * move: ground → predict → diagnose → Maia's question → correction →
 * recorded evidence. The options are genuinely clickable — choosing the
 * right answer first skips the misconception branch, exactly like the
 * product. No network, no model, no fake data.
 */

type StageId = "ground" | "predict" | "diagnose" | "maia" | "correct" | "evidence";

const STAGES: { id: StageId; label: string }[] = [
  { id: "ground", label: "Ground" },
  { id: "predict", label: "Predict" },
  { id: "diagnose", label: "Diagnose" },
  { id: "maia", label: "Maia asks" },
  { id: "correct", label: "Correct" },
  { id: "evidence", label: "Evidence" },
];

const AUTO_ADVANCE_MS = 3400;

export default function MethodTraceDemo() {
  const [stageIndex, setStageIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [firstTry, setFirstTry] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const interacted = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const frame = requestAnimationFrame(() => setReducedMotion(query.matches));
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || paused || interacted.current) return;
    const timer = window.setTimeout(() => {
      setStageIndex((index) => {
        const next = (index + 1) % STAGES.length;
        if (next === 0) {
          setChoice(null);
          setFirstTry(false);
        } else if (STAGES[next].id === "diagnose") {
          setChoice(0);
        } else if (STAGES[next].id === "correct") {
          setChoice(1);
        }
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [stageIndex, paused, reducedMotion]);

  const stage = STAGES[stageIndex].id;
  const goTo = (index: number) => {
    interacted.current = true;
    const id = STAGES[index].id;
    if (id === "ground" || id === "predict") {
      setChoice(null);
      setFirstTry(false);
    } else if (id === "diagnose" || id === "maia") {
      setChoice(0);
      setFirstTry(false);
    } else if (choice === null) {
      setChoice(1);
    }
    setStageIndex(index);
  };

  const pick = (option: number) => {
    interacted.current = true;
    setChoice(option);
    if (option === 1) {
      setFirstTry(stage === "predict");
      setStageIndex(STAGES.findIndex((item) => item.id === "correct"));
    } else {
      setFirstTry(false);
      setStageIndex(STAGES.findIndex((item) => item.id === "diagnose"));
    }
  };

  const maiaState =
    stage === "diagnose" ? "redirecting" : stage === "maia" ? "curious" : stage === "correct" || stage === "evidence" ? "celebrating" : "attentive";

  return (
    <figure
      className="w-full overflow-hidden rounded-[var(--radius-card)] border border-ink/10 bg-surface shadow-[var(--shadow-3)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="A replay of one Museion learning move"
    >
      {/* Trace header */}
      <div className="flex items-center justify-between border-b border-ink/8 bg-paper/60 px-4 py-2.5 sm:px-5">
        <p className="font-mono text-[0.64rem] font-semibold uppercase tracking-[0.09em] text-ink-soft">One learning move · replayed</p>
        <p className="font-mono text-[0.64rem] text-ink-soft">algebra / page 1</p>
      </div>

      <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Source panel */}
        <div className="border-b border-ink/8 p-4 sm:border-b-0 sm:border-r sm:p-5">
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.09em] text-lapis-dark">Source</p>
          <blockquote
            className={`mt-2.5 border-l-2 pl-3 font-display text-[1.02rem] leading-6 transition-colors duration-300 ${
              stage === "ground" ? "border-gold bg-gold-soft/50 text-ink" : "border-ink/15 text-ink-soft"
            }`}
          >
            “Subtracting the same amount from both sides preserves equality.”
          </blockquote>
          <p className="mt-2.5 text-[0.68rem] leading-4 text-ink-soft">Exact text, page and hash stay attached to the lesson.</p>

          <div className="mt-4 flex items-start gap-2.5">
            <MaiaCharacter state={maiaState} className="h-14 w-12 shrink-0" animated={!reducedMotion} />
            <div
              className={`min-h-11 flex-1 rounded-xl rounded-bl-sm border px-3 py-2 text-[0.78rem] leading-5 transition-colors duration-300 ${
                stage === "maia"
                  ? "border-lapis/30 bg-lapis-soft text-ink"
                  : stage === "correct" || stage === "evidence"
                    ? "border-correct/25 bg-correct-soft text-ink"
                    : "border-ink/10 bg-paper text-ink-soft"
              }`}
              aria-live="polite"
            >
              {stage === "ground" && "I can see the source you're reasoning from."}
              {stage === "predict" && "Commit to a move first — then we'll look at it together."}
              {stage === "diagnose" && "The checker caught something. Look again before I say more."}
              {stage === "maia" && (
                <>
                  Which term is keeping <em className="font-semibold not-italic">2x</em> from being alone on the left?
                </>
              )}
              {stage === "correct" && (firstTry ? "Committed and correct — no help needed." : "You corrected it yourself. That's the part that counts.")}
              {stage === "evidence" && "I step back now. The record shows what you did unaided."}
            </div>
          </div>
        </div>

        {/* Activity panel */}
        <div className="p-4 sm:p-5">
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.09em] text-lapis-dark">Learner activity</p>
          <p className="mt-2.5 text-[0.95rem] font-semibold leading-6">
            What should you subtract from both sides of{" "}
            <span
              className={`rounded px-1 transition-colors duration-300 ${stage === "maia" ? "bg-gold-soft ring-2 ring-gold/70" : ""}`}
            >
              2x + 6
            </span>{" "}
            = 14?
          </p>

          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Answer options">
            {[
              { label: "2", index: 0 },
              { label: "6", index: 1 },
              { label: "14", index: 2 },
            ].map((option) => {
              const isPicked = choice === option.index;
              const wrongPicked = isPicked && option.index !== 1 && (stage === "diagnose" || stage === "maia");
              const rightPicked = isPicked && option.index === 1 && (stage === "correct" || stage === "evidence");
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => pick(option.index)}
                  className={`min-h-10 min-w-14 rounded-lg border px-4 text-sm font-semibold transition ${
                    wrongPicked
                      ? "border-wrong/40 bg-wrong-soft text-wrong"
                      : rightPicked
                        ? "border-correct/40 bg-correct-soft text-correct"
                        : "border-ink/15 bg-surface text-ink hover:border-lapis/50 hover:bg-lapis-soft/40"
                  }`}
                  aria-pressed={isPicked}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 min-h-[3.4rem] text-[0.78rem] leading-5" aria-live="polite">
            {stage === "diagnose" && (
              <p className="rounded-lg border border-wrong/20 bg-wrong-soft/60 px-3 py-2 text-ink">
                <span className="font-semibold text-wrong">Checked by code:</span> not yet. Pattern matched:{" "}
                <span className="font-mono text-[0.7rem]">subtracted-the-coefficient</span>. Maia is told what went wrong — never the answer to give you.
              </p>
            )}
            {stage === "correct" && (
              <p className="rounded-lg border border-correct/25 bg-correct-soft/70 px-3 py-2 text-ink">
                <span className="font-semibold text-correct">Correct.</span> 2x + 6 − 6 = 14 − 6. The explanation appears after the reasoning, not before.
              </p>
            )}
            {stage === "evidence" && (
              <div className="rounded-lg border border-ink/10 bg-paper px-3 py-2">
                <p className="font-mono text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">Recorded observation</p>
                <p className="mt-1 text-ink">
                  {firstTry ? "Correct on the first unassisted attempt." : "One misconception caught, corrected without the answer being shown."}{" "}
                  Nothing stronger is claimed.
                </p>
              </div>
            )}
            {stage === "ground" && <p className="text-ink-soft">Every activity starts from evidence you can inspect.</p>}
            {stage === "predict" && <p className="text-ink-soft">Try it — pick any option. The trace responds like the real engine.</p>}
          </div>
        </div>
      </div>

      {/* Stage rail */}
      <figcaption className="border-t border-ink/8 bg-paper/60 px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-1" role="tablist" aria-label="Stages of the learning move">
          {STAGES.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === stageIndex}
              onClick={() => goTo(index)}
              className={`group flex min-h-8 flex-1 flex-col items-center gap-1 rounded-md px-0.5 pt-1 transition hover:bg-ink/4 ${
                index === stageIndex ? "text-ink" : "text-ink-soft"
              }`}
            >
              <span className={`h-1 w-full rounded-full transition-colors ${index <= stageIndex ? "bg-lapis" : "bg-ink/10 group-hover:bg-ink/20"}`} />
              <span className="text-[0.6rem] font-semibold sm:text-[0.66rem]">{item.label}</span>
            </button>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
