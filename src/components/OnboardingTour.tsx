"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { markOnboarded, saveLearningPreferences, type LearningPreferences } from "@/lib/client/storage";
import MaiaCharacter from "./MaiaCharacter";
import styles from "./OnboardingTour.module.css";

export interface StarterCourse { id: string; title: string; tagline: string; estimatedMinutes: number }
const GOALS = [
  { value: "build-foundations", title: "Build a strong foundation", detail: "Make the ideas click, one small step at a time.", symbol: "◎" },
  { value: "prepare-exam", title: "Feel ready for an exam", detail: "Work through the things that still feel tricky.", symbol: "↗" },
  { value: "teach-it-back", title: "Explain it in my own words", detail: "Understand an idea well enough to share it.", symbol: "✦" },
] as const;
const SUBJECTS = [
  { value: "math", title: "Math", detail: "Numbers, patterns, and how things add up.", symbol: "∑" },
  { value: "coding", title: "Coding", detail: "Think through problems like a programmer.", symbol: "⌘" },
  { value: "science", title: "Science", detail: "Explore what makes the world work.", symbol: "◌" },
  { value: "reasoning", title: "Clear thinking", detail: "Ask better questions and examine evidence.", symbol: "◇" },
] as const;
const FAMILIARITY = [
  { value: "new", title: "A fresh start", detail: "I’m new to this, or would like to begin again.", symbol: "○" },
  { value: "some", title: "I know a little", detail: "Some things click; others need a little practice.", symbol: "◐" },
  { value: "confident", title: "Ready to go deeper", detail: "I’d like to explore a new angle or challenge.", symbol: "●" },
] as const;
const PACES = [
  { value: 10, title: "10 minutes", detail: "A little discovery, even on a busy day.", symbol: "·" },
  { value: 20, title: "20 minutes", detail: "A comfortable pocket of focused learning.", symbol: "··" },
  { value: 30, title: "30 minutes", detail: "Time to explore, try, and think things through.", symbol: "···" },
] as const;
const HEADINGS = ["What brings you here?", "What sparks your curiosity?", "Where are you starting?", "A little time for yourself.", "Here’s a place to begin."];
const SUBTITLES = ["There’s no wrong reason to learn something.", "Pick one for now. You can explore everything later.", "Your own feeling about the subject — not a test.", "What feels comfortable on a typical day?", "A suggestion from your interests. You can change direction anytime."];

export default function OnboardingTour({ name, courses, initial }: { name: string; courses: StarterCourse[]; initial: LearningPreferences | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<LearningPreferences["goal"] | null>(initial?.goal ?? null);
  const [subject, setSubject] = useState<NonNullable<LearningPreferences["subject"]> | null>(initial?.subject ?? null);
  const [familiarity, setFamiliarity] = useState<NonNullable<LearningPreferences["familiarity"]> | null>(initial?.familiarity ?? null);
  const [dailyMinutes, setDailyMinutes] = useState<NonNullable<LearningPreferences["dailyMinutes"]> | null>(initial?.dailyMinutes ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  useEffect(() => { if (step !== previousStep.current) { previousStep.current = step; heading.current?.focus(); } }, [step]);
  const courseId = subject === "coding" ? (familiarity === "confident" ? "recursion-foundations" : "search-by-halving") : subject === "science" ? "forces-and-motion" : subject === "reasoning" ? "claims-to-evidence" : familiarity === "new" ? "proportional-reasoning" : "algebra-as-balance";
  const course = courses.find(({ id }) => id === courseId);
  const options = step === 0 ? GOALS : step === 1 ? SUBJECTS : step === 2 ? FAMILIARITY : PACES;
  const selected = step === 0 ? goal : step === 1 ? subject : step === 2 ? familiarity : dailyMinutes;
  function choose(value: string | number) {
    if (step === 0) setGoal(value as LearningPreferences["goal"]);
    else if (step === 1) setSubject(value as NonNullable<LearningPreferences["subject"]>);
    else if (step === 2) setFamiliarity(value as NonNullable<LearningPreferences["familiarity"]>);
    else setDailyMinutes(value as NonNullable<LearningPreferences["dailyMinutes"]>);
  }
  async function finish(destination: "course" | "dashboard") {
    if (!goal || !subject || !familiarity || !dailyMinutes || saving) return;
    setSaving(true); setError(null);
    try {
      await saveLearningPreferences({ schemaVersion: "1.0", role: initial?.role ?? "independent", ageBand: initial?.ageBand ?? "prefer-not-to-say", goal, subject, familiarity, dailyMinutes, suggestedCourseId: courseId });
      markOnboarded();
      router.push(destination === "course" && course ? `/courses/${course.id}` : "/dashboard");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We couldn’t save your starting point. Try again."); setSaving(false); }
  }
  return <div className={styles.page}>
    <div className={styles.top}><p>Your starting point</p><div className={styles.progress} role="progressbar" aria-label="Onboarding questions" aria-valuemin={0} aria-valuemax={4} aria-valuenow={Math.min(step, 4)} aria-valuetext={step === 4 ? "Your starting point is ready" : `Question ${step + 1} of 4`}>{[0, 1, 2, 3].map((index) => <span key={index} data-complete={index < step} data-current={index === step} />)}</div><span>{step === 4 ? "Ready when you are" : `${step + 1} of 4`}</span></div>
    <div className={styles.layout}>
      <aside className={styles.companion} aria-label="Your thinking companion"><div className={styles.orbit}><MaiaCharacter state={step === 4 ? "celebrating" : "curious"} size="hero" /></div><p className={styles.greeting}>Hi, {name.split(" ")[0] || "there"}.</p><h2>{step === 4 ? "Let’s follow that curiosity." : "Learning should feel like you."}</h2><p>{step === 4 ? "Your starting point is ready. Maia will help you work things out, one question at a time." : "A few small choices help us find a comfortable place to begin."}</p></aside>
      <section key={step} className={styles.stage} aria-labelledby="onboarding-title"><p className={styles.eyebrow}>{step === 4 ? "Chosen for your interests" : "Let’s make this yours"}</p><h1 ref={heading} tabIndex={-1} id="onboarding-title">{HEADINGS[step]}</h1><p className={styles.subtitle}>{SUBTITLES[step]}</p>
        {step < 4 ? <form onSubmit={(event) => { event.preventDefault(); if (selected) setStep(step + 1); }}><fieldset className={styles.options}><legend className="sr-only">{HEADINGS[step]}</legend>{options.map((option) => <label key={option.value} data-selected={selected === option.value}><input type="radio" name={`onboarding-${step}`} value={option.value} checked={selected === option.value} onChange={() => choose(option.value)} /><span className={styles.symbol} aria-hidden="true">{option.symbol}</span><span><strong>{option.title}</strong><span className={styles.detail}>{option.detail}</span></span></label>)}</fieldset><div className={styles.actions}>{step > 0 ? <button type="button" className={styles.back} onClick={() => setStep(step - 1)}>← Back</button> : <span />}<button type="submit" className={styles.primary} disabled={!selected}>{step === 3 ? "Find my starting point" : "Continue"}<span aria-hidden="true">→</span></button></div></form> : <><div className={styles.recommendation}><span className={styles.courseIcon} aria-hidden="true">{SUBJECTS.find(({ value }) => value === subject)?.symbol}</span><p className={styles.eyebrow}>Your first course</p><h2>{course?.title ?? "Explore a new idea"}</h2><p>{course?.tagline ?? "Choose something that makes you curious."}</p><div className={styles.courseMeta}><span>{dailyMinutes} minutes a day</span><span>{course?.estimatedMinutes} min course</span></div></div><p className={styles.note}>This is a starting suggestion, not a measure of your ability.</p><button type="button" disabled={saving} aria-busy={saving} className={styles.start} onClick={() => void finish("course")}>{saving ? "Saving your starting point…" : "Explore this course"}<span aria-hidden="true">↗</span></button><div className={styles.finalActions}><button type="button" disabled={saving} onClick={() => setStep(3)}>← Change my choices</button><button type="button" disabled={saving} onClick={() => void finish("dashboard")}>Go to my dashboard</button></div></>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </section>
    </div>
  </div>;
}
