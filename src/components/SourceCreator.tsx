"use client";

import Link from "next/link";
import { useState } from "react";

import type { SourceDocument } from "@/lib/source";
import {
  MAX_NORMALIZED_CHARACTERS,
  MAX_SOURCE_BYTES,
  MAX_SOURCE_PAGES,
  SourceIngestionError,
  ingestSourceFile,
  ingestTextSource,
} from "@/lib/source";

type TextMediaType = "text/plain" | "text/markdown";
const GOLDEN_SOURCE_SHA256 = "637c098ea73b6c2d4cde1dea3accb77e8059589a11d0d2cd996b363d6b326ed0";

function errorMessage(error: unknown): string {
  if (error instanceof SourceIngestionError) return error.message;
  return "The source could not be normalized. Check the file and try again.";
}

export default function SourceCreator() {
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

  const acceptDocument = (next: SourceDocument) => {
    setDocument(next);
    setSelectedPage(next.pages[0].pageNumber);
    setTitle(next.title);
    setError(null);
    if (next.sha256 === GOLDEN_SOURCE_SHA256) {
      setLevel("novice");
      setLanguage("en");
      setTargetMinutes(12);
      setLearnerGoal("Trace inclusive binary search and justify every boundary update.");
    }
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
    if (!document) return;
    setCompiling(true);
    setError(null);
    try {
      const response = await fetch("/api/compiler/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document, audience: { level, language, targetMinutes, learnerGoal } }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error === "LIVE_COMPILER_NOT_CONFIGURED"
          ? "Live compilation is not configured on this deployment. The normalized source is safe, but no course was published."
          : payload?.error === "COMPILATION_REJECTED"
            ? `Compilation stopped safely at ${payload.stage}. No partial course was published.`
            : "Compilation failed safely. No partial course was published.");
      }
      location.assign(`/create/review/${payload.runId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Compilation failed safely.");
    } finally {
      setCompiling(false);
    }
  };

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
      </div>

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
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
          />

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <label className="min-w-44 flex-1 text-sm font-medium" htmlFor="source-format">
              Pasted text format
              <select
                id="source-format"
                value={mediaType}
                onChange={(event) => setMediaType(event.target.value as TextMediaType)}
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
            onChange={(event) => setText(event.target.value)}
            rows={10}
            placeholder="Paste an authorized source here…"
            className="mt-2 w-full resize-y rounded-lg border border-ink/15 px-3 py-3 leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
          />
          <button
            type="button"
            disabled={busy || !title.trim() || !text.trim()}
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
            className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-lapis/40 bg-lapis-soft px-5 py-5 text-center transition hover:border-lapis"
          >
            <span className="font-medium text-lapis-dark">Choose TXT, Markdown or PDF</span>
            <span className="mt-1 text-sm text-ink-soft">
              PDF must contain selectable text. OCR is intentionally unsupported.
            </span>
          </label>
          <input
            id="source-file"
            type="file"
            accept=".txt,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf"
            onChange={(event) => void normalizeFile(event.target.files?.[0])}
            className="sr-only"
          />
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            Limits: {(MAX_SOURCE_BYTES / 1024 / 1024).toFixed(0)} MB, {MAX_SOURCE_PAGES}{" "}
            pages, {MAX_NORMALIZED_CHARACTERS.toLocaleString("en-US")} normalized characters.
          </p>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-wrong-soft px-4 py-3 text-sm text-wrong">
              {error}
            </p>
          )}
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
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-paper p-3">
                  <dt className="text-ink-soft">Pages</dt>
                  <dd className="mt-1 font-semibold">{document.pages.length}</dd>
                </div>
                <div className="rounded-lg bg-paper p-3">
                  <dt className="text-ink-soft">Characters</dt>
                  <dd className="mt-1 font-semibold">{document.charCount.toLocaleString()}</dd>
                </div>
              </dl>
              <div className="mt-4 min-w-0 rounded-lg border border-ink/10 px-3 py-2 text-xs">
                <p className="text-ink-soft">Document SHA-256</p>
                <code className="mt-1 block overflow-x-auto font-mono">{document.sha256}</code>
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
                </div>
              )}

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
                <h3 className="font-semibold">Learning brief</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="text-sm">Level<select value={level} onChange={(event) => setLevel(event.target.value as typeof level)} className="mt-1 block w-full rounded-lg border border-ink/15 bg-surface px-3 py-2"><option value="novice">Novice</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
                  <label className="text-sm">Language<input value={language} maxLength={35} onChange={(event) => setLanguage(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" /></label>
                  <label className="text-sm">Minutes<input type="number" min={3} max={60} value={targetMinutes} onChange={(event) => setTargetMinutes(Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" /></label>
                </div>
                <label className="mt-3 block text-sm">Learner goal<textarea value={learnerGoal} maxLength={600} rows={3} onChange={(event) => setLearnerGoal(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" /></label>
              </div>
              {document.sha256 === GOLDEN_SOURCE_SHA256 && <Link href="/create/review" className="mt-5 block w-full rounded-lg border border-lapis px-5 py-2.5 text-center font-medium text-lapis">Open checked golden review</Link>}
              <button type="button" disabled={compiling || !learnerGoal.trim() || !language.trim() || targetMinutes < 3 || targetMinutes > 60} onClick={() => void compile()} className="mt-3 w-full rounded-lg bg-ink px-5 py-2.5 font-medium text-white disabled:opacity-45">
                {compiling ? "Compiling grounded stages…" : document.sha256 === GOLDEN_SOURCE_SHA256 ? "Create verified replay run" : "Compile this source"}
              </button>
              <p className="mt-2 text-center text-xs text-ink-soft">Golden hashes use deterministic replay. Other sources require the configured live compiler; failures never publish a partial artifact.</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
