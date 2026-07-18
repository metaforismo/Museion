"use client";

import { COURSE_TEMPLATES, type CourseTemplateId } from "@/lib/compiler/templates";

export default function SourceLearningDesign({
  templateId,
  level,
  language,
  targetMinutes,
  learnerGoal,
  onTemplate,
  onLevel,
  onLanguage,
  onMinutes,
  onGoal,
}: {
  templateId: CourseTemplateId;
  level: "novice" | "intermediate" | "advanced";
  language: string;
  targetMinutes: number;
  learnerGoal: string;
  onTemplate(value: CourseTemplateId): void;
  onLevel(value: "novice" | "intermediate" | "advanced"): void;
  onLanguage(value: string): void;
  onMinutes(value: number): void;
  onGoal(value: string): void;
}) {
  return <div className="mt-5 rounded-xl border border-ink/10 p-4">
    <div className="flex items-baseline justify-between gap-3"><h3 className="font-semibold">2. Learning design</h3><span className="text-xs text-ink-soft">Choose a pedagogy</span></div>
    <div className="mt-4 grid gap-3">
      {(Object.entries(COURSE_TEMPLATES) as Array<[CourseTemplateId, (typeof COURSE_TEMPLATES)[CourseTemplateId]]>).map(([id, template]) => (
        <button key={id} type="button" aria-pressed={templateId === id} onClick={() => onTemplate(id)} className={`rounded-xl border p-4 text-left transition ${templateId === id ? "border-lapis bg-lapis-soft shadow-[0_8px_28px_rgba(43,74,203,0.10)]" : "border-ink/10 bg-surface hover:border-lapis/40"}`}>
          <span className="flex items-center justify-between gap-3"><span className="font-semibold">{template.name}</span>{templateId === id && <span className="rounded-md bg-surface px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-lapis-dark">Selected</span>}</span>
          <span className="mt-1 block text-sm leading-6 text-ink-soft">{template.description}</span>
          <span className="mt-2 block text-xs text-ink-soft">Required mix: {template.requiredKinds.join(" · ")}</span>
        </button>
      ))}
    </div>
    <h3 className="mt-5 border-t border-ink/10 pt-4 font-semibold">Learning brief</h3>
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      <label className="text-sm">Level<select value={level} onChange={(event) => onLevel(event.target.value as typeof level)} className="mt-1 block w-full rounded-lg border border-ink/15 bg-surface px-3 py-2"><option value="novice">Novice</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
      <label className="text-sm">Language<input value={language} maxLength={35} aria-invalid={!language.trim()} aria-describedby={!language.trim() ? "language-error" : undefined} onChange={(event) => onLanguage(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" />{!language.trim() && <span id="language-error" className="mt-1 block text-xs text-wrong">Enter a language.</span>}</label>
      <label className="text-sm">Minutes<input type="number" min={3} max={60} value={targetMinutes} aria-invalid={targetMinutes < 3 || targetMinutes > 60} aria-describedby={targetMinutes < 3 || targetMinutes > 60 ? "duration-error" : undefined} onChange={(event) => onMinutes(Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" />{(targetMinutes < 3 || targetMinutes > 60) && <span id="duration-error" className="mt-1 block text-xs text-wrong">Choose 3 to 60 minutes.</span>}</label>
    </div>
    <label className="mt-3 block text-sm">Learner goal<textarea value={learnerGoal} maxLength={600} rows={3} aria-invalid={!learnerGoal.trim()} aria-describedby="learner-goal-help" onChange={(event) => onGoal(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" /><span id="learner-goal-help" className={`mt-1 flex justify-between gap-3 text-xs ${learnerGoal.trim() ? "text-ink-soft" : "text-wrong"}`}><span>{learnerGoal.trim() ? "Describe what the learner should do without assistance." : "Enter a learner goal."}</span><span className="shrink-0 font-mono tabular-nums">{learnerGoal.length}/600</span></span></label>
  </div>;
}
