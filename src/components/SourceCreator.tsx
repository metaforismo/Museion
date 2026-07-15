"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { parseCreatorDraft, serializeCreatorDraft } from "@/lib/client/creator-draft";
import type { SourceDocument } from "@/lib/source";
import {
  MAX_NORMALIZED_CHARACTERS,
  MAX_SOURCE_BYTES,
  MAX_SOURCE_PAGES,
  SourceIngestionError,
  ingestSourceFile,
  ingestTextSource,
} from "@/lib/source";
import { COURSE_TEMPLATES, type CourseTemplateId } from "@/lib/compiler/templates";

type TextMediaType = "text/plain" | "text/markdown";
const GOLDEN_SOURCE_SHA256 = "637c098ea73b6c2d4cde1dea3accb77e8059589a11d0d2cd996b363d6b326ed0";
const DRAFT_KEY = "museion:creator-draft:v1";
const ACTIVE_RUN_KEY = "museion:active-compiler-run:v1";

type CompilerJob = {
  runId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  stage: "source_graph" | "blueprint" | "course_artifact" | "critic" | "repair" | "critic_after_repair" | null;
  completedStages: number;
  totalStages: number;
  error: string | null;
  retryable: boolean;
  createdAt: string;
  updatedAt: string;
};

const COMPILE_STAGES = [
  { id: "source_graph", label: "Extract source graph", model: "Luna" },
  { id: "blueprint", label: "Design learning path", model: "Terra" },
  { id: "course_artifact", label: "Write questions and activities", model: "Terra" },
  { id: "critic", label: "Audit for publication", model: "Sol" },
  { id: "repair", label: "Repair if needed", model: "Sol" },
] as const;

function errorMessage(error: unknown): string {
  if (error instanceof SourceIngestionError) return error.message;
  return "The source could not be normalized. Check the file and try again.";
}

function compilerErrorMessage(code: string | null): string {
  const messages: Record<string, string> = {
    COMPILATION_REJECTED: "The generated course did not pass publication validation.",
    COMPILER_JOB_ALREADY_RUNNING: "A compilation is already running in this browser session.",
    COMPILER_RUN_QUOTA_EXCEEDED: "The local run history is full. Wait for older runs to expire, then try again.",
    LIVE_COMPILER_NOT_CONFIGURED: "Live compilation is unavailable here. Connect Codex in Settings or use the verified replay.",
  };
  return messages[code ?? ""] ?? "Compilation stopped safely before publication.";
}

function elapsedLabel(createdAt: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(createdAt)) / 1_000));
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function SourceCreator() {
  const compileLock = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const suppressNextDraftSave = useRef(false);
  const [title, setTitle] = useState("Binary Search Notes");
  const [text, setText] = useState("");
  const [mediaType, setMediaType] = useState<TextMediaType>("text/markdown");
  const [document, setDocument] = useState<SourceDocument | null>(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [level, setLevel] = useState<"novice" | "intermediate" | "advanced">("novice");
  const [language, setLanguage] = useState("en");
  const [targetMinutes, setTargetMinutes] = useState(12);
  const [learnerGoal, setLearnerGoal] = useState("Understand the key ideas and apply them without assistance.");
  const [compiling, setCompiling] = useState(false);
  const [templateId, setTemplateId] = useState<CourseTemplateId>("socratic-foundations");
  const [warningsAccepted, setWarningsAccepted] = useState(false);
  const [sourceAuthorized, setSourceAuthorized] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [job, setJob] = useState<CompilerJob | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"loading" | "empty" | "saved" | "saving" | "error">("loading");
  const activeJob = Boolean(job && ["queued", "running"].includes(job.status));

  const restoreDraft = (): boolean => {
    try {
      const saved = parseCreatorDraft(localStorage.getItem(DRAFT_KEY));
      if (!saved) return false;
      setTitle(saved.title);
      setText(saved.text);
      setMediaType(saved.mediaType);
      setTemplateId(saved.templateId);
      setLearnerGoal(saved.learnerGoal);
      setLevel(saved.level);
      setLanguage(saved.language);
      setTargetMinutes(saved.targetMinutes);
      setDocument(null);
      setSourceAuthorized(false);
      setError(null);
      return true;
    } catch {
      return false;
    }
  };

  const clearDraft = () => {
    suppressNextDraftSave.current = true;
    let storageAvailable = true;
    try {
      localStorage.removeItem(DRAFT_KEY);
      sessionStorage.removeItem(ACTIVE_RUN_KEY);
    } catch {
      storageAvailable = false;
    }
    setText("");
    setTitle("Untitled source");
    setDocument(null);
    setJob(null);
    setSourceAuthorized(false);
    setWarningsAccepted(false);
    if (fileInput.current) fileInput.current.value = "";
    setDraftStatus(storageAvailable ? "empty" : "error");
    setError(null);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const restored = restoreDraft();
      suppressNextDraftSave.current = true;
      setDraftReady(true);
      setDraftStatus(restored ? "saved" : "empty");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    if (suppressNextDraftSave.current) {
      suppressNextDraftSave.current = false;
      return;
    }
    const statusTimer = window.setTimeout(() => setDraftStatus("saving"), 0);
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, serializeCreatorDraft({ title, text, mediaType, templateId, learnerGoal, level, language, targetMinutes }));
        setDraftStatus("saved");
      } catch {
        setDraftStatus("error");
      }
    }, 350);
    return () => {
      window.clearTimeout(statusTimer);
      window.clearTimeout(timer);
    };
  }, [draftReady, language, learnerGoal, level, mediaType, targetMinutes, templateId, text, title]);

  useEffect(() => {
    const runId = sessionStorage.getItem(ACTIVE_RUN_KEY);
    if (!runId) return;
    const controller = new AbortController();
    void fetch(`/api/compiler/runs/${runId}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const payload = await response.json().catch(() => null) as CompilerJob | null;
      if (!response.ok || !payload) {
        sessionStorage.removeItem(ACTIVE_RUN_KEY);
        setError("The previous compilation is no longer available. Your text draft is still saved locally.");
        return;
      }
      if (!payload.status || payload.status === "succeeded") {
        location.assign(`/create/review/${runId}`);
        return;
      }
      setJob(payload);
      setCompiling(["queued", "running"].includes(payload.status));
      if (["failed", "cancelled"].includes(payload.status)) setError(compilerErrorMessage(payload.error));
    }).catch(() => undefined);
    return () => controller.abort();
  }, []);

  const activeRunId = job?.runId;
  const activeRunStatus = job?.status;

  useEffect(() => {
    if (!activeRunId || !activeRunStatus || !["queued", "running"].includes(activeRunStatus)) return;
    const controller = new AbortController();
    let timer: number | undefined;
    const poll = async () => {
      try {
        const response = await fetch(`/api/compiler/runs/${activeRunId}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json().catch(() => null) as CompilerJob | null;
        if (!response.ok || !payload) throw new Error("PROGRESS_UNAVAILABLE");
        setJob(payload);
        setError(null);
        if (payload.status === "succeeded") {
          sessionStorage.removeItem(ACTIVE_RUN_KEY);
          location.assign(`/create/review/${activeRunId}`);
          return;
        }
        if (["failed", "cancelled"].includes(payload.status)) {
          sessionStorage.removeItem(ACTIVE_RUN_KEY);
          setCompiling(false);
          setError(payload.status === "cancelled" ? "Compilation was cancelled. Your source and learning brief are still here." : `${compilerErrorMessage(payload.error)} No partial course was published.`);
          return;
        }
        timer = window.setTimeout(() => void poll(), 1_200);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError("Compilation progress is temporarily unavailable. Refresh to reconnect; the source draft remains saved.");
        timer = window.setTimeout(() => void poll(), 2_500);
      }
    };
    timer = window.setTimeout(() => void poll(), 400);
    return () => {
      controller.abort();
      if (timer) window.clearTimeout(timer);
    };
  }, [activeRunId, activeRunStatus]);

  const acceptDocument = (next: SourceDocument) => {
    setDocument(next);
    setSelectedPage(next.pages[0].pageNumber);
    setTitle(next.title);
    setError(null);
    setWarningsAccepted(next.warnings.length === 0);
    setSourceAuthorized(false);
    setCopyNotice(null);
    if (next.sha256 === GOLDEN_SOURCE_SHA256) {
      setLevel("novice");
      setLanguage("en");
      setTargetMinutes(12);
      setLearnerGoal("Trace inclusive binary search and justify every boundary update.");
    }
  };

  const invalidateNormalizedSource = () => {
    if (!document) return;
    setDocument(null);
    setSourceAuthorized(false);
    setWarningsAccepted(false);
    setCopyNotice(null);
    if (!activeJob) setJob(null);
  };

  const normalizePastedText = async () => {
    setBusy(true);
    setError(null);
    try {
      acceptDocument(await ingestTextSource({ title, text, mediaType }));
    } catch (cause) {
      setDocument(null);
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const normalizeFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      acceptDocument(await ingestSourceFile(file));
      setText("");
    } catch (cause) {
      setDocument(null);
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const page = document?.pages.find(
    (candidate) => candidate.pageNumber === selectedPage,
  );

  const compile = async () => {
    if (compileLock.current || !document || !sourceAuthorized || !warningsAccepted || (job && ["queued", "running"].includes(job.status))) return;
    compileLock.current = true;
    setCompiling(true);
    setError(null);
    try {
      const response = await fetch("/api/compiler/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document, audience: { level, language, targetMinutes, learnerGoal }, templateId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(`${compilerErrorMessage(payload?.error)} No partial course was published.`);
      }
      setJob(payload as CompilerJob);
      sessionStorage.setItem(ACTIVE_RUN_KEY, (payload as CompilerJob).runId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Compilation failed safely.");
    } finally {
      compileLock.current = false;
      setCompiling(false);
    }
  };

  const cancelCompilation = async () => {
    if (!job) return;
    setCancelBusy(true);
    try {
      const response = await fetch(`/api/compiler/runs/${job.runId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("The compiler had already finished or could not be cancelled.");
      setJob({ ...job, status: "cancelled" });
      sessionStorage.removeItem(ACTIVE_RUN_KEY);
      setCompiling(false);
      setError("Compilation was cancelled. Your source and learning brief are still here.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cancellation failed. Check the run status and try again.");
    } finally {
      setCancelBusy(false);
    }
  };

  const copyHash = async () => {
    if (!document) return;
    try {
      await navigator.clipboard.writeText(document.sha256);
      setCopyNotice("Hash copied.");
    } catch {
      setCopyNotice("Copy failed. Select the hash manually.");
    }
  };

  const learningBriefReady = Boolean(learnerGoal.trim() && language.trim() && targetMinutes >= 3 && targetMinutes <= 60);
  const sourceReady = Boolean(document && sourceAuthorized && warningsAccepted);
  const draftStatusLabel = draftStatus === "loading"
    ? "Loading draft…"
    : draftStatus === "saving"
      ? "Saving…"
      : draftStatus === "error"
        ? "Draft not saved"
        : draftStatus === "empty"
          ? "No local draft"
          : "Saved on this device";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="max-w-3xl">
        <p className="eyebrow">
          Source review
        </p>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
          Start with a source you trust.
        </h1>
        <p className="mt-5 max-w-[62ch] text-lg leading-8 text-ink-soft">
          Museion first normalizes the source, fixes page boundaries and hashes
          every page. Nothing is compiled until you can inspect that record.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span
            role="status"
            aria-live="polite"
            className={`inline-flex items-center gap-2 font-medium ${draftStatus === "error" ? "text-wrong" : "text-ink-soft"}`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${draftStatus === "error" ? "bg-wrong" : draftStatus === "saving" || draftStatus === "loading" ? "bg-gold" : draftStatus === "empty" ? "bg-ink/25" : "bg-correct"}`}
            />
            {draftStatusLabel}
          </span>
          <button type="button" disabled={activeJob} onClick={clearDraft} className="font-medium text-ink-soft underline underline-offset-4 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">Clear draft</button>
          <span className="text-xs text-ink-soft">Text and learning preferences save on this device. Uploaded file bytes do not.</span>
        </div>
      </div>

      <ol aria-label="Creator progress" className="mt-8 grid gap-2 rounded-2xl border border-ink/10 bg-surface/80 p-2 sm:grid-cols-3">
        {[
          { label: "1. Source", detail: document ? "Normalized" : "Add and inspect", ready: Boolean(document) },
          { label: "2. Learning design", detail: learningBriefReady ? COURSE_TEMPLATES[templateId].name : "Complete the brief", ready: learningBriefReady },
          { label: "3. Compile", detail: activeJob ? "In progress" : job?.status === "failed" ? "Ready to retry" : sourceReady ? "Ready" : "Needs review", ready: activeJob || sourceReady },
        ].map((step) => (
          <li key={step.label} className={`rounded-xl px-4 py-3 ${step.ready ? "bg-lapis-soft" : "bg-paper"}`}>
            <span className="block text-sm font-semibold">{step.label}</span>
            <span className="mt-0.5 block text-xs text-ink-soft">{step.detail}</span>
          </li>
        ))}
      </ol>

      {error && (
        <div role="alert" className="mt-7 flex items-start justify-between gap-4 rounded-xl border border-wrong/20 bg-wrong-soft px-4 py-3 text-sm text-wrong">
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)} className="shrink-0 font-semibold underline underline-offset-4">
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="premium-surface rounded-[1.6rem] border border-white/80 p-6 sm:p-7">
          <h2 className="font-display text-xl font-semibold">Add source</h2>
          <label className="mt-5 block text-sm font-medium" htmlFor="source-title">
            Source title
          </label>
          <input
            id="source-title"
            value={title}
            maxLength={200}
            disabled={activeJob}
            onChange={(event) => {
              invalidateNormalizedSource();
              setTitle(event.target.value);
            }}
            className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
          />

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <label className="min-w-44 flex-1 text-sm font-medium" htmlFor="source-format">
              Pasted text format
              <select
                id="source-format"
                value={mediaType}
                disabled={activeJob}
                onChange={(event) => {
                  invalidateNormalizedSource();
                  setMediaType(event.target.value as TextMediaType);
                }}
                className="mt-2 block w-full rounded-lg border border-ink/15 bg-surface px-3 py-2.5"
              >
                <option value="text/markdown">Markdown</option>
                <option value="text/plain">Plain text</option>
              </select>
            </label>
          </div>

          <label className="mt-5 block text-sm font-medium" htmlFor="source-text">
            Paste source text
          </label>
          <textarea
            id="source-text"
            value={text}
            disabled={activeJob}
            maxLength={MAX_NORMALIZED_CHARACTERS}
            onChange={(event) => {
              invalidateNormalizedSource();
              setText(event.target.value);
            }}
            rows={10}
            placeholder="Paste an authorized source here…"
            className="mt-2 w-full resize-y rounded-lg border border-ink/15 px-3 py-3 leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
          />
          <button
            type="button"
            disabled={busy || activeJob || !title.trim() || !text.trim()}
            onClick={() => void normalizePastedText()}
            className="mt-3 w-full rounded-lg bg-lapis px-5 py-2.5 font-medium text-white transition hover:bg-lapis-dark disabled:opacity-50"
          >
            {busy ? "Normalizing…" : "Normalize pasted source"}
          </button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-ink-soft">
            <span className="h-px flex-1 bg-ink/10" /> or upload a file
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <label
            htmlFor="source-file"
            aria-disabled={busy || activeJob}
            className={`flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-lapis/40 bg-lapis-soft px-5 py-5 text-center transition ${busy || activeJob ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-lapis"}`}
          >
            <span className="font-medium text-lapis-dark">Choose TXT, Markdown or PDF</span>
            <span className="mt-1 text-sm text-ink-soft">
              PDF must contain selectable text. OCR is intentionally unsupported.
            </span>
          </label>
          <input
            ref={fileInput}
            id="source-file"
            type="file"
            accept=".txt,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf"
            disabled={busy || activeJob}
            onChange={(event) => {
              const input = event.currentTarget;
              void normalizeFile(input.files?.[0]).finally(() => {
                input.value = "";
              });
            }}
            className="sr-only"
          />
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            Limits: {(MAX_SOURCE_BYTES / 1024 / 1024).toFixed(0)} MB, {MAX_SOURCE_PAGES}{" "}
            pages, {MAX_NORMALIZED_CHARACTERS.toLocaleString("en-US")} normalized characters.
          </p>

        </section>

        <section
          aria-live="polite"
          aria-busy={busy}
          className="premium-surface min-w-0 rounded-[1.6rem] border border-white/80 p-6 sm:p-7"
        >
          <h2 className="font-display text-xl font-semibold">Normalized record</h2>
          {!document || !page ? (
            <div className="mt-5 rounded-xl bg-paper px-5 py-8 text-center text-sm text-ink-soft">
              Add a source to inspect its canonical pages, warnings and hashes.
            </div>
          ) : (
            <>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-lg bg-paper p-3">
                  <dt className="text-ink-soft">Pages</dt>
                  <dd className="mt-1 font-semibold">{document.pages.length}</dd>
                </div>
                <div className="col-span-2 rounded-lg bg-paper p-3 sm:col-span-1">
                  <dt className="text-ink-soft">Source type</dt>
                  <dd className="mt-1 truncate font-semibold" title={document.originalFileName ?? document.mediaType}>
                    {document.originalFileName ?? (document.mediaType === "text/markdown" ? "Pasted Markdown" : "Pasted text")}
                  </dd>
                </div>
                <div className="rounded-lg bg-paper p-3">
                  <dt className="text-ink-soft">Characters</dt>
                  <dd className="mt-1 font-semibold">{document.charCount.toLocaleString()}</dd>
                </div>
              </dl>
              <div className="mt-4 min-w-0 rounded-lg border border-ink/10 px-3 py-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-ink-soft">Document SHA-256</p>
                  <button type="button" onClick={() => void copyHash()} className="font-semibold text-lapis-dark underline underline-offset-4">Copy hash</button>
                </div>
                <code className="mt-2 block overflow-x-auto font-mono">{document.sha256}</code>
                {copyNotice && <p role="status" aria-live="polite" className="mt-2 text-ink-soft">{copyNotice}</p>}
              </div>

              {document.warnings.length > 0 && (
                <div className="mt-4 rounded-lg bg-gold-soft px-4 py-3">
                  <h3 className="text-sm font-semibold">Review warnings</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {document.warnings.map((warning, index) => (
                      <li key={`${warning.code}-${warning.pageNumber}-${index}`}>
                        Page {warning.pageNumber}: {warning.message}
                      </li>
                    ))}
                  </ul>
                  <label className="mt-4 flex items-start gap-3 border-t border-gold/25 pt-3 text-sm font-medium">
                    <input type="checkbox" checked={warningsAccepted} onChange={(event) => setWarningsAccepted(event.target.checked)} className="mt-1" />
                    I reviewed these warnings and want Museion to treat the source as data, not instructions.
                  </label>
                </div>
              )}

              <label className="mt-4 flex items-start gap-3 rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm font-medium">
                <input type="checkbox" checked={sourceAuthorized} onChange={(event) => setSourceAuthorized(event.target.checked)} className="mt-1" />
                <span><span className="block">I am allowed to use this source.</span><span className="mt-1 block font-normal leading-5 text-ink-soft">Museion keeps provenance, but authorization and copyright remain the creator’s responsibility.</span></span>
              </label>

              <div className="mt-5 flex flex-wrap gap-2" aria-label="Source pages">
                {document.pages.map((sourcePage) => (
                  <button
                    key={sourcePage.pageNumber}
                    type="button"
                    aria-pressed={sourcePage.pageNumber === selectedPage}
                    onClick={() => setSelectedPage(sourcePage.pageNumber)}
                    className={`min-h-10 min-w-10 rounded-lg border px-3 py-2 text-sm font-medium ${
                      sourcePage.pageNumber === selectedPage
                        ? "border-lapis bg-lapis text-white"
                        : "border-ink/15 hover:border-lapis"
                    }`}
                  >
                    {sourcePage.pageNumber}
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-ink/10 bg-paper p-4">
                <div className="flex flex-wrap justify-between gap-2 text-xs text-ink-soft">
                  <span>Page {page.pageNumber}</span>
                  <span>{page.charCount.toLocaleString()} characters</span>
                </div>
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                  {page.text}
                </pre>
              </div>
              <div className="mt-5 rounded-xl border border-ink/10 p-4">
                <div className="flex items-baseline justify-between gap-3"><h3 className="font-semibold">2. Learning design</h3><span className="text-xs text-ink-soft">Choose a pedagogy</span></div>
                <div className="mt-4 grid gap-3">
                  {(Object.entries(COURSE_TEMPLATES) as Array<[CourseTemplateId, (typeof COURSE_TEMPLATES)[CourseTemplateId]]>).map(([id, template]) => (
                    <button key={id} type="button" aria-pressed={templateId === id} onClick={() => setTemplateId(id)} className={`rounded-xl border p-4 text-left transition ${templateId === id ? "border-lapis bg-lapis-soft shadow-[0_8px_28px_rgba(43,74,203,0.10)]" : "border-ink/10 bg-surface hover:border-lapis/40"}`}>
                      <span className="flex items-center justify-between gap-3"><span className="font-semibold">{template.name}</span>{templateId === id && <span className="rounded-md bg-surface px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-lapis-dark">Selected</span>}</span>
                      <span className="mt-1 block text-sm leading-6 text-ink-soft">{template.description}</span>
                      <span className="mt-2 block text-xs text-ink-soft">Required mix: {template.requiredKinds.join(" · ")}</span>
                    </button>
                  ))}
                </div>
                <h3 className="mt-5 border-t border-ink/10 pt-4 font-semibold">Learning brief</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="text-sm">Level<select value={level} onChange={(event) => setLevel(event.target.value as typeof level)} className="mt-1 block w-full rounded-lg border border-ink/15 bg-surface px-3 py-2"><option value="novice">Novice</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
                  <label className="text-sm">Language<input value={language} maxLength={35} onChange={(event) => setLanguage(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" /></label>
                  <label className="text-sm">Minutes<input type="number" min={3} max={60} value={targetMinutes} onChange={(event) => setTargetMinutes(Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" /></label>
                </div>
                <label className="mt-3 block text-sm">Learner goal<textarea value={learnerGoal} maxLength={600} rows={3} onChange={(event) => setLearnerGoal(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" /></label>
              </div>
              {document.sha256 === GOLDEN_SOURCE_SHA256 && <Link href="/create/review" className="mt-5 block w-full rounded-lg border border-lapis px-5 py-2.5 text-center font-medium text-lapis">Open checked golden review</Link>}
              {activeJob && job && <div className="mt-5 rounded-2xl bg-ink p-5 text-white" aria-live="polite">
                <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">3. Compile</p><p className="mt-1 font-semibold">Building a grounded course</p><p className="mt-1 text-xs text-white/55">Elapsed {elapsedLabel(job.createdAt)} · safe to refresh</p></div><span className="font-mono text-sm">{job.completedStages}/{job.totalStages}</span></div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${Math.max(7, (job.completedStages / job.totalStages) * 100)}%` }} /></div>
                <ol className="mt-4 space-y-2">{COMPILE_STAGES.map((stage, index) => { const active = job.stage === stage.id || (job.stage === "critic_after_repair" && stage.id === "critic"); const done = index < job.completedStages; return <li key={stage.id} className={`flex items-center justify-between gap-3 text-sm ${active ? "text-white" : done ? "text-white/75" : "text-white/40"}`}><span>{done ? "✓" : active ? "→" : "·"} {stage.label}</span><span className="font-mono text-xs">{stage.model}</span></li>; })}</ol>
                <button type="button" disabled={cancelBusy} onClick={() => void cancelCompilation()} className="mt-4 text-sm font-semibold text-white/75 underline hover:text-white disabled:opacity-45">{cancelBusy ? "Cancelling…" : "Cancel compilation"}</button>
              </div>}
              <button type="button" disabled={compiling || activeJob || !sourceReady || !learningBriefReady} onClick={() => void compile()} className="sticky bottom-3 mt-3 w-full rounded-lg bg-ink px-5 py-3 font-medium text-white shadow-[0_12px_32px_rgba(19,28,49,0.18)] transition hover:bg-lapis disabled:cursor-not-allowed disabled:opacity-45 lg:static lg:shadow-none">
                {activeJob ? "Compilation running…" : compiling ? "Starting compilation…" : document.sha256 === GOLDEN_SOURCE_SHA256 ? "Create verified replay run" : job?.retryable ? "Retry compilation" : "Compile this source"}
              </button>
              {!sourceAuthorized && <p className="mt-2 text-center text-xs font-medium text-ink-soft">Confirm source authorization to continue.</p>}
              {sourceAuthorized && !warningsAccepted && <p className="mt-2 text-center text-xs font-medium text-ink-soft">Review and acknowledge the source warnings to continue.</p>}
              <p className="mt-1 text-center text-xs text-ink-soft">Golden hashes use deterministic replay. Other sources require the configured live compiler; failures never publish a partial artifact.</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
