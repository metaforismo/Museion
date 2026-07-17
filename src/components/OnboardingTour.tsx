"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { markOnboarded, saveLearningPreferences, type LearningPreferences } from "@/lib/client/storage";
import BrandMark from "./BrandMark";
import MaiaCharacter from "./MaiaCharacter";

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
    kicker: "Adaptive support",
    title: "The goal is to not need us.",
    body: (
      <>
        <p>
          Hints come on a ladder, from a gentle nudge to a concrete pointer.
          As your in-session evidence improves, the ladder gets shorter and Maia
          steps back. This estimate tunes support; it does not certify mastery.
        </p>
        <p>
          When you finish a lesson, try <strong>practice mode</strong>:
          shuffled exercises with no hints at all. It records a cleaner observation
          of what you can do without the lesson&apos;s scaffolding.
        </p>
      </>
    ),
  },
  {
    kicker: "Make it yours",
    title: "Choose a starting posture, not a permanent label.",
    body: <p>These local preferences tune recommendations and language. Museion does not ask for a birth date, and you can change or clear them later.</p>,
  },
];

export default function OnboardingTour() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [preferences, setPreferences] = useState<LearningPreferences>({ schemaVersion: "1.0", role: "independent", ageBand: "prefer-not-to-say", goal: "build-foundations" });
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    saveLearningPreferences(preferences);
    markOnboarded();
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-16 sm:px-6 lg:py-24">
      <div
        key={index}
        className="premium-surface rounded-[2rem] border border-white/80 p-8 sm:p-10 animate-fade-up"
      >
        {index === 0 && <BrandMark className="mb-7 h-16 w-16" title="Museion" />}
        {index === 2 && <MaiaCharacter state="curious" className="mb-2 h-28 w-24" title="Maia"/>}
        <p className="eyebrow">
          {slide.kicker}
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">
          {slide.title}
        </h1>
        <div className="mt-4 space-y-3 leading-relaxed text-ink-soft">
          {slide.body}
        </div>
        {isLast && <div className="mt-7 space-y-6">
          <ChoiceGroup legend="I am learning as" value={preferences.role} options={[["student","Student"],["educator","Educator"],["independent","Independent learner"]]} onChange={(role) => setPreferences((current) => ({ ...current, role: role as LearningPreferences["role"] }))}/>
          <ChoiceGroup legend="Age band" value={preferences.ageBand} options={[["13-15","13–15"],["16-18","16–18"],["adult","Adult"],["prefer-not-to-say","Prefer not to say"]]} onChange={(ageBand) => setPreferences((current) => ({ ...current, ageBand: ageBand as LearningPreferences["ageBand"] }))}/>
          <ChoiceGroup legend="First goal" value={preferences.goal} options={[["build-foundations","Build foundations"],["prepare-exam","Prepare for an exam"],["teach-it-back","Explain it to someone"]]} onChange={(goal) => setPreferences((current) => ({ ...current, goal: goal as LearningPreferences["goal"] }))}/>
          <p className="text-xs leading-5 text-ink-soft">Local to this browser. No birth date or school identifier is collected.</p>
        </div>}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-1" aria-label={`Slide ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((_, i) => (
            <button
              type="button"
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? "step" : undefined}
              onClick={() => setIndex(i)}
              className="group flex min-h-6 min-w-6 items-center justify-center rounded-full"
            >
              <span aria-hidden="true" className={`h-2 rounded-full transition-all ${
                i === index ? "w-5 bg-lapis" : "w-2 bg-ink/25 group-hover:bg-ink/40"
              }`} />
            </button>
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

function ChoiceGroup({ legend, value, options, onChange }: { legend: string; value: string; options: readonly (readonly [string, string])[]; onChange(value: string): void }) {
  return <fieldset><legend className="text-sm font-semibold text-ink">{legend}</legend><div className="mt-2 flex flex-wrap gap-2">{options.map(([option,label]) => <button type="button" key={option} aria-pressed={value === option} onClick={() => onChange(option)} className={`min-h-11 rounded-xl border px-3.5 text-sm font-medium transition ${value === option ? "border-lapis bg-lapis-soft text-lapis-dark" : "border-ink/15 bg-surface text-ink-soft hover:border-lapis/40"}`}>{label}</button>)}</div></fieldset>;
}
