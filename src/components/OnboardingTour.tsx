"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { markOnboarded } from "@/lib/client/storage";

interface Slide {
  kicker: string;
  title: string;
  body: React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    kicker: "Welcome to Museion",
    title: "Learn by reasoning, not by being told.",
    body: (
      <>
        <p>
          Museion is named after the ancient <em>Mouseion</em> of Alexandria —
          the seat of the Muses, the greatest house of knowledge of the
          ancient world.
        </p>
        <p>
          Here, knowledge isn&apos;t displayed. It&apos;s <strong>worked</strong>:
          every lesson is a problem you solve one verified step at a time.
        </p>
      </>
    ),
  },
  {
    kicker: "How lessons work",
    title: "One verified step at a time.",
    body: (
      <>
        <p>
          Each lesson breaks a skill into small reasoning steps. Your answers
          are checked by the lesson engine against author-verified solutions —
          never by an AI guessing.
        </p>
        <p>
          Get one wrong? Museion recognizes the <strong>specific
          misunderstanding</strong> behind common mistakes, so the help you
          get aims at exactly where your reasoning slipped.
        </p>
      </>
    ),
  },
  {
    kicker: "Meet Maia",
    title: "A tutor who asks — and never tells.",
    body: (
      <>
        <p>
          Maia is named after <em>maieutics</em>, the Socratic art of
          midwifery: helping ideas be born rather than handing them over. She
          sees the exact step you&apos;re on and everything you&apos;ve tried.
        </p>
        <p>
          Ask her anything about the step. She&apos;ll guide you with
          questions — but the final answer is the one thing she will{" "}
          <strong>never</strong> say. That&apos;s not a limitation; it&apos;s
          the point.
        </p>
      </>
    ),
  },
  {
    kicker: "Help that fades",
    title: "The goal is to not need us.",
    body: (
      <>
        <p>
          Hints come on a ladder, from a gentle nudge to a concrete pointer.
          As your mastery of a concept grows, the ladder gets shorter and Maia
          steps back — support fades as competence rises.
        </p>
        <p>
          When you finish a lesson, try <strong>practice mode</strong>:
          shuffled exercises with no hints at all. Unassisted retrieval is
          what makes learning stick.
        </p>
      </>
    ),
  },
];

export default function OnboardingTour() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    markOnboarded();
    router.push("/");
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-4 py-16">
      <div
        key={index}
        className="rounded-2xl border border-ink/10 bg-surface p-8 shadow-sm animate-fade-up"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">
          {slide.kicker}
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight">
          {slide.title}
        </h1>
        <div className="mt-4 space-y-3 leading-relaxed text-ink-soft">
          {slide.body}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-lapis" : "w-2 bg-ink/20 hover:bg-ink/40"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          {!isLast && (
            <button
              onClick={finish}
              className="text-sm text-ink-soft underline-offset-2 hover:underline"
            >
              Skip
            </button>
          )}
          {index > 0 && (
            <button
              onClick={() => setIndex((i) => i - 1)}
              className="rounded-lg border border-ink/15 bg-surface px-4 py-2 text-sm font-medium transition hover:border-lapis"
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? finish : () => setIndex((i) => i + 1)}
            className="rounded-lg bg-lapis px-5 py-2 text-sm font-medium text-white transition hover:bg-lapis-dark"
          >
            {isLast ? "Start learning →" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
