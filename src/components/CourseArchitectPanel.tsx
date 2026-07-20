"use client";

import { useEffect, useRef, useState } from "react";

import type { SourceDocument, SourceReferenceKind } from "@/lib/source";

import BrandMark from "./BrandMark";

type ArchitectMode = "ask" | "material" | "goal";
type ArchitectMessage = { id: string; role: "architect" | "creator" | "marker"; text: string };

function packAssessment(input: {
  document: SourceDocument | null;
  textLength: number;
  materialCount: number;
  fileMaterialCount: number;
  sourceUrl: string;
  sourceAuthorized: boolean;
  warningsAccepted: boolean;
  learnerGoal: string;
}) {
  if (!input.document) {
    if (input.fileMaterialCount > 0) return `The draft contains ${input.materialCount} material${input.materialCount === 1 ? "" : "s"}, including ${input.fileMaterialCount} file${input.fileMaterialCount === 1 ? "" : "s"}. Normalize the complete pack so I can inspect each material's pages, role, warnings, reference, and hash.`;
    if (input.sourceUrl && input.textLength === 0) return "I can see a reference, but a URL is provenance—not evidence. Add an authorized transcript, excerpt, file, or your own notes before I can evaluate the pack.";
    if (input.textLength < 80) return "The pack needs enough source substance to support exact claims and a real learning sequence. Add a transcript, bounded excerpt, notes, or files, then normalize it.";
    return "There is usable text in the draft. Normalize the Source Pack so I can inspect page boundaries, warnings, and hashes before Course Architect designs anything.";
  }
  if (input.document.warnings.length > 0 && !input.warningsAccepted) return `The normalized pack has ${input.document.warnings.length} warning${input.document.warnings.length === 1 ? "" : "s"}. Review them first; source-like instructions must remain data, never control the agent.`;
  if (!input.sourceAuthorized) return "The evidence is normalized, but the rights boundary is unresolved. Confirm that you are allowed to use this transcript, excerpt, notes, or file before compilation.";
  if (input.learnerGoal.trim().length < 20) return "The source is usable, but the learning goal is too vague. Tell me what the learner should be able to do independently—not merely what topic the course should mention.";
  const density = input.document.charCount < 240
    ? "The pack is quite short, so the resulting course must stay narrow."
    : "The pack has enough material for a bounded concept graph.";
  return `${density} Rights, normalization, and the learner goal are present. The Codex-backed pipeline can now extract claims, test source coverage, design misconceptions and transfer, run a critic, and block publication if the evidence cannot support a meaningful Museion course.`;
}

function firstHttpsUrl(value: string): string | null {
  return value.match(/https:\/\/[^\s]+/i)?.[0]?.replace(/[),.;]+$/, "") ?? null;
}

export default function CourseArchitectPanel({
  document,
  textLength,
  materialCount,
  fileMaterialCount,
  sourceUrl,
  sourceAuthorized,
  warningsAccepted,
  learnerGoal,
  onAddMaterial,
  onSetGoal,
  onSetReference,
  onFiles,
  onClose,
}: {
  document: SourceDocument | null;
  textLength: number;
  materialCount: number;
  fileMaterialCount: number;
  sourceUrl: string;
  sourceAuthorized: boolean;
  warningsAccepted: boolean;
  learnerGoal: string;
  onAddMaterial: (value: string) => void;
  onSetGoal: (value: string) => void;
  onSetReference: (value: string, kind: SourceReferenceKind) => void;
  onFiles: (files: File[]) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<ArchitectMode>("ask");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ArchitectMessage[]>([
    { id: "intro", role: "architect", text: "Send me a source link, authorized text, files, or an independent learning goal. I will assemble one Source Pack, identify evidence and rights gaps, and only then hand it to the Codex-backed course pipeline." },
    { id: "boundary", role: "marker", text: "Course Architect creates from your material. Maia remains the learner-facing tutor." },
  ]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const addArchitectMessage = (text: string) => setMessages((current) => [
    ...current,
    { id: crypto.randomUUID(), role: "architect", text },
  ]);

  const evaluate = () => addArchitectMessage(packAssessment({ document, textLength, materialCount, fileMaterialCount, sourceUrl, sourceAuthorized, warningsAccepted, learnerGoal }));

  const send = () => {
    const message = input.trim();
    if (!message) return;
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "creator", text: message }]);
    setInput("");
    const url = firstHttpsUrl(message);
    if (url) {
      let kind: SourceReferenceKind = "webpage";
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        if (host === "youtu.be" || host.endsWith("youtube.com")) kind = parsed.searchParams.has("list") ? "youtube_playlist" : "youtube_video";
        else if (/book|gutenberg|openstax|archive/.test(`${host}${parsed.pathname}`)) kind = "book";
      } catch { /* the source normalizer will provide the exact error */ }
      onSetReference(url, kind);
      addArchitectMessage("I added that link as provenance. Now send the authorized transcript, excerpt, exported captions, files, or your own notes; the link alone cannot ground a course.");
      return;
    }
    if (mode === "material") {
      onAddMaterial(message);
      addArchitectMessage("I added that text to the current Source Pack draft. Normalize the pack when the material set is complete so I can inspect its evidence boundary.");
      return;
    }
    if (mode === "goal") {
      onSetGoal(message);
      addArchitectMessage("I set that as the independent learner goal. I will judge course ideas against what the learner should do without Maia or a revealed solution.");
      return;
    }
    evaluate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Course Architect"
          className="absolute inset-x-2 bottom-2 flex max-h-[88vh] flex-col overflow-hidden rounded-[1.5rem] border border-white/80 bg-surface shadow-[0_28px_90px_rgba(19,28,49,0.28)] sm:inset-y-3 sm:left-auto sm:right-3 sm:max-h-none sm:w-[28rem]"
        >
          <header className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-lapis-soft"><BrandMark className="h-9 w-9" title="Course Architect" /></span>
            <div className="min-w-0 flex-1"><p className="font-display text-lg font-semibold">Course Architect</p><p className="text-xs text-ink-soft">Deterministic intake · Codex-backed compilation</p></div>
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-paper hover:text-ink">Close</button>
          </header>

          <div className="border-b border-ink/10 bg-lapis-soft/45 px-4 py-3 text-xs leading-5 text-ink-soft">
            <strong className="text-ink">Method gate:</strong> source coverage, prerequisites, misconception opportunities, feasible interactions, independent transfer, accessibility, and answer-leak risk.
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" role="log" aria-live="polite">
            {messages.map((message) => message.role === "marker" ? (
              <p key={message.id} className="rounded-lg border border-gold/20 bg-gold-soft px-3 py-2 text-xs leading-5 text-ink-soft">{message.text}</p>
            ) : (
              <div key={message.id} className={`max-w-[90%] rounded-2xl px-3.5 py-3 text-sm leading-6 ${message.role === "creator" ? "ml-auto bg-lapis text-white" : "bg-paper text-ink"}`}>
                {message.text}
              </div>
            ))}
          </div>

          <div className="border-t border-ink/10 p-3">
            <div className="flex flex-wrap gap-2" aria-label="Course Architect message type">
              {([[
                "ask", "Evaluate pack"], ["material", "Add material"], ["goal", "Set learner goal"],
              ] as Array<[ArchitectMode, string]>).map(([value, label]) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === value ? "bg-lapis-soft text-lapis-dark" : "bg-paper text-ink-soft"}`}>{label}</button>)}
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg bg-paper px-3 py-2 text-xs font-semibold text-ink-soft">Add files</button>
              <input ref={fileRef} type="file" multiple accept=".txt,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf" className="sr-only" onChange={(event) => { const files = Array.from(event.currentTarget.files ?? []); if (files.length) { onFiles(files); addArchitectMessage(`I added ${files.length} file${files.length === 1 ? "" : "s"} and started normalization. I will evaluate the canonical record, not the filenames.`); } event.currentTarget.value = ""; }} />
            </div>
            <label className="sr-only" htmlFor="course-architect-message">Message Course Architect</label>
            <textarea
              ref={inputRef}
              id="course-architect-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }}
              rows={3}
              maxLength={20_000}
              placeholder={mode === "material" ? "Paste authorized material…" : mode === "goal" ? "What should the learner do independently?" : "Ask me to evaluate the current pack, or paste a source link…"}
              className="mt-3 w-full resize-none rounded-xl border border-ink/15 bg-surface px-3 py-3 text-sm leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <button type="button" onClick={evaluate} className="text-xs font-semibold text-lapis-dark underline underline-offset-4">Run method check</button>
              <button type="button" disabled={!input.trim()} onClick={send} className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Send</button>
            </div>
          </div>
        </aside>
    </div>
  );
}
