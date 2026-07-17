"use client";

import { useState } from "react";

import MaiaCharacter from "./MaiaCharacter";

const TRACE = [
  ["01", "Evidence", "An exact quotation remains attached to the lesson."],
  ["02", "Commit", "The learner answers before the explanation appears."],
  ["03", "Respond", "Maia questions the reasoning; code checks the answer."],
] as const;

export default function LandingCoursePreview() {
  const [answer, setAnswer] = useState<string | null>(null);
  const correct = answer === "6";
  return (
    <figure aria-labelledby="learning-trace-title" className="overflow-hidden rounded-[1.75rem] border border-ink/12 bg-surface shadow-[0_24px_70px_rgba(19,28,49,0.09)]">
      <figcaption id="learning-trace-title" className="flex items-center justify-between gap-4 border-b border-ink/10 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
        <span>One learning trace</span>
        <span className="font-mono tracking-normal">Algebra · 01</span>
      </figcaption>

      <div className="grid md:grid-cols-[0.76fr_1.24fr]">
        <section className="border-b border-ink/10 p-6 md:border-b-0 md:border-r" aria-labelledby="trace-source-title">
          <p id="trace-source-title" className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-lapis-dark">Source / page 1</p>
          <blockquote className="mt-5 text-xl font-medium leading-8 tracking-tight">
            “Subtracting the same amount from both sides preserves equality.”
          </blockquote>
          <p className="mt-5 text-xs leading-5 text-ink-soft">Exact text, page, and source hash remain available during review.</p>
        </section>

        <section className="p-6" aria-labelledby="trace-question-title">
          <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-lapis-dark">Learning move / predict</p>
          <h2 id="trace-question-title" className="mt-4 text-2xl font-semibold leading-8 tracking-tight">
            What should you subtract from both sides of 2x + 6 = 14?
          </h2>
          <div className="mt-6 flex gap-2" aria-label="Choose an answer">
            {["2", "6", "14"].map((option) => (
              <button type="button" key={option} onClick={() => setAnswer(option)} aria-pressed={answer === option} className={`min-h-11 min-w-14 rounded-lg border px-4 py-2 text-center font-mono text-sm transition ${answer === option ? "border-ink bg-ink text-white" : "border-ink/15 text-ink-soft hover:border-lapis/50 hover:bg-lapis-soft"}`}>
                {option}
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-paper p-3" aria-live="polite">
            <MaiaCharacter state={answer === null ? "curious" : correct ? "celebrating" : "redirecting"} className="h-14 w-12 shrink-0" />
            <p className="pt-1 text-sm leading-6 text-ink-soft">{answer === null ? "Which term prevents 2x from being isolated? Commit to a move first." : correct ? "That preserves equality. Now explain why the same move belongs on both sides." : "Test that choice: would it isolate 2x while keeping both sides balanced?"}</p>
          </div>
        </section>
      </div>

      <ol className="grid border-t border-ink/10 sm:grid-cols-3">
        {TRACE.map(([number, title, body], index) => (
          <li key={number} className={`py-5 sm:px-5 ${index > 0 ? "border-t border-ink/10 sm:border-l sm:border-t-0" : "sm:pl-0"}`}>
            <p className="font-mono text-[0.68rem] font-semibold text-lapis-dark">{number}</p>
            <p className="mt-2 text-sm font-semibold">{title}</p>
            <p className="mt-1 text-xs leading-5 text-ink-soft">{body}</p>
          </li>
        ))}
      </ol>
    </figure>
  );
}
