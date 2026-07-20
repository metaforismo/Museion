"use client";

import Link from "next/link";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

import { parseCreatorDraft, serializeCreatorDraft, type CreatorMaterialDraft } from "@/lib/client/creator-draft";
import { fetchWithTimeout, RequestTimeoutError } from "@/lib/client/fetch-with-timeout";
import type { SourceDocument } from "@/lib/source/contracts";
import { MAX_SOURCE_BYTES } from "@/lib/source/limits";
import { inferSourceReferenceKind, normalizeSourceUrl } from "@/lib/source/reference";
import type { SourcePack, SourceRightsBasis } from "@/lib/source/source-pack";
import type { CourseTemplateId } from "@/lib/compiler/templates";
const CourseArchitectPanel = lazy(() => import("./CourseArchitectPanel"));
const SourceLearningDesign = lazy(() => import("./SourceLearningDesign"));
const SourcePackEditor = lazy(() => import("./source-creator/SourcePackEditor"));

const GOLDEN_SOURCE_SHA256 = "637c098ea73b6c2d4cde1dea3accb77e8059589a11d0d2cd996b363d6b326ed0";
const DRAFT_KEY = "museion:creator-draft:v1";
const ACTIVE_RUN_KEY = "museion:active-compiler-run:v1";
const TEMPLATE_NAMES: Record<CourseTemplateId, string> = {
  "socratic-foundations": "Socratic Foundations",
  "exam-practice": "Exam Practice",
  "teach-it-back": "Teach It Back",
};

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
  { id: "source_graph", label: "Extract source graph", model: "Structure pass" },
  { id: "blueprint", label: "Design learning path", model: "Design pass" },
  { id: "course_artifact", label: "Write questions and activities", model: "Design pass" },
  { id: "critic", label: "Audit for publication", model: "Audit pass" },
  { id: "repair", label: "Repair if needed", model: "Audit pass" },
] as const;

function emptyTextMaterial(id = "draft_primary", title = "Primary material"): CreatorMaterialDraft {
  return { id, title, origin: "text", content: "", mediaType: "text/markdown", role: "primary-source", sourceUrl: "", sourceKind: "webpage" };
}

function newDraftId(): string {
  return `draft_${crypto.randomUUID()}`;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
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
  const compileRequestId = useRef<string | null>(null);
  const materialFiles = useRef(new Map<string, File>());
  const architectTrigger = useRef<HTMLButtonElement>(null);
  const normalizationSeq = useRef(0);
  const suppressNextDraftSave = useRef(false);
  const [title, setTitle] = useState("Binary Search Notes");
  const [materials, setMaterials] = useState<CreatorMaterialDraft[]>([emptyTextMaterial()]);
  const [sourcePack, setSourcePack] = useState<SourcePack | null>(null);
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
  const [rightsBasis, setRightsBasis] = useState<SourceRightsBasis>("personal-notes");
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [clearConfirmation, setClearConfirmation] = useState(false);
  const [job, setJob] = useState<CompilerJob | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"loading" | "empty" | "saved" | "saving" | "error">("loading");
  const [architectOpen, setArchitectOpen] = useState(false);
  const activeJob = Boolean(job && ["queued", "running"].includes(job.status));

  const restoreDraft = (): boolean => {
    try {
      const saved = parseCreatorDraft(localStorage.getItem(DRAFT_KEY));
      if (!saved) return false;
      setTitle(saved.title);
      setMaterials(saved.materials ?? [{
        id: "draft_primary",
        title: saved.title,
        origin: "text",
        content: saved.text,
        mediaType: saved.mediaType,
        role: "primary-source",
        sourceUrl: saved.sourceUrl ?? "",
        sourceKind: saved.sourceKind ?? inferSourceReferenceKind(saved.sourceUrl ?? ""),
      }]);
      materialFiles.current.clear();
      setRightsBasis(saved.rightsBasis ?? "personal-notes");
      setTemplateId(saved.templateId);
      setLearnerGoal(saved.learnerGoal);
      setLevel(saved.level);
      setLanguage(saved.language);
      setTargetMinutes(saved.targetMinutes);
      setDocument(null);
      setSourcePack(null);
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
    setMaterials([emptyTextMaterial()]);
    materialFiles.current.clear();
    setTitle("Untitled source");
    setDocument(null);
    setSourcePack(null);
    setJob(null);
    setSourceAuthorized(false);
    setRightsBasis("personal-notes");
    setWarningsAccepted(false);
    setClearConfirmation(false);
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
        const first = materials[0] ?? emptyTextMaterial();
        const firstReference = materials.find((material) => material.sourceUrl.trim());
        localStorage.setItem(DRAFT_KEY, serializeCreatorDraft({
          title,
          text: first.origin === "text" ? first.content : "",
          mediaType: first.mediaType,
          sourceMode: materials.some((material) => material.origin === "file") ? "files" : firstReference ? "reference" : "paste",
          sourceUrl: firstReference?.sourceUrl ?? "",
          sourceKind: firstReference?.sourceKind ?? "webpage",
          materials,
          rightsBasis,
          templateId,
          learnerGoal,
          level,
          language,
          targetMinutes,
        }));
        setDraftStatus("saved");
      } catch {
        setDraftStatus("error");
      }
    }, 350);
    return () => {
      window.clearTimeout(statusTimer);
      window.clearTimeout(timer);
    };
  }, [draftReady, language, learnerGoal, level, materials, rightsBasis, targetMinutes, templateId, title]);

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

  const acceptPack = (pack: SourcePack, next: SourceDocument) => {
    setSourcePack(pack);
    setDocument(next);
    setSelectedPage(next.pages[0].pageNumber);
    setTitle(next.title);
    setError(null);
    setWarningsAccepted(next.warnings.length === 0);
    setCopyNotice(null);
    if (next.sha256 === GOLDEN_SOURCE_SHA256) {
      setLevel("novice");
      setLanguage("en");
      setTargetMinutes(12);
      setLearnerGoal("Trace inclusive binary search and justify every boundary update.");
    }
  };

  const invalidateNormalizedSource = () => {
    normalizationSeq.current += 1;
    if (busy) {
      setBusy(false);
      setError("The source changed during normalization, so Museion discarded the outdated result. Normalize it again when ready.");
    }
    setSourceAuthorized(false);
    if (!document) return;
    setDocument(null);
    setSourcePack(null);
    setWarningsAccepted(false);
    setCopyNotice(null);
    if (!activeJob) setJob(null);
  };

  const normalizeSourcePack = async () => {
    const requestId = normalizationSeq.current + 1;
    normalizationSeq.current = requestId;
    setBusy(true);
    setError(null);
    try {
      const { createSourcePackFromDocuments, ingestPdfSource, ingestTextSource, mediaTypeForFile, sourcePackToDocument } = await import("@/lib/source");
      const documents = await Promise.all(materials.map(async (material) => {
        const normalizedUrl = material.sourceUrl.trim() ? normalizeSourceUrl(material.sourceUrl) : null;
        const reference = normalizedUrl ? { kind: material.sourceKind, url: normalizedUrl, label: material.title.trim() } : undefined;
        if (material.origin === "text") {
          return ingestTextSource({ title: material.title, text: material.content, mediaType: material.mediaType, sourceReference: reference });
        }
        const file = materialFiles.current.get(material.id);
        if (!file) throw new Error(`Reattach ${material.fileName ?? material.title} before normalization.`);
        const mediaType = mediaTypeForFile(file);
        if (mediaType === "application/pdf") {
          return ingestPdfSource({ title: material.title, bytes: new Uint8Array(await file.arrayBuffer()), originalFileName: file.name, sourceReference: reference });
        }
        return ingestTextSource({ title: material.title, text: await file.text(), mediaType, originalFileName: file.name, sourceReference: reference });
      }));
      const pack = await createSourcePackFromDocuments({
        title,
        description: "Creator Studio Source Pack",
        materials: materials.map((material, index) => ({ title: material.title, role: material.role, document: documents[index] })),
        rights: { confirmed: true, basis: rightsBasis, notes: "Confirmed in Creator Studio." },
      });
      const next = await sourcePackToDocument(pack);
      if (requestId !== normalizationSeq.current) return;
      acceptPack(pack, next);
    } catch (cause) {
      if (requestId !== normalizationSeq.current) return;
      setDocument(null);
      setError(errorMessage(cause));
    } finally {
      if (requestId === normalizationSeq.current) setBusy(false);
    }
  };

  const addFiles = (files: File[], replaceId?: string) => {
    if (!files.length) return;
    setError(null);
    invalidateNormalizedSource();
    const existingBytes = [...materialFiles.current.entries()].reduce((total, [id, file]) => id === replaceId ? total : total + file.size, 0);
    const addedBytes = files.reduce((total, file) => total + file.size, 0);
    if (existingBytes + addedBytes > MAX_SOURCE_BYTES) {
      setError(`Combined attached files exceed the ${(MAX_SOURCE_BYTES / 1024 / 1024).toFixed(0)} MB Source Pack limit.`);
      return;
    }
    if (replaceId) {
      const file = files[0];
      materialFiles.current.set(replaceId, file);
      setMaterials((current) => current.map((material) => material.id === replaceId ? { ...material, title: material.title.trim() ? material.title : file.name.replace(/\.(md|markdown|txt|pdf)$/i, ""), fileName: file.name, fileSize: file.size, needsReattach: false } : material));
      return;
    }
    const replaceEmptyInitial = materials.length === 1 && materials[0].origin === "text" && !materials[0].content.trim() && !materials[0].sourceUrl.trim();
    const remaining = Math.max(0, 8 - (replaceEmptyInitial ? 0 : materials.length));
    if (files.length > remaining) setError(`Only ${remaining} more ${remaining === 1 ? "material" : "materials"} can be added to this pack.`);
    const accepted = files.slice(0, remaining).filter((file) => {
      const duplicate = [...materialFiles.current.values()].some((existing) => existing.name === file.name && existing.size === file.size);
      if (duplicate) setError(`${file.name} is already attached to this Source Pack.`);
      return !duplicate;
    });
    const additions = accepted.map((file, index): CreatorMaterialDraft => {
      const id = newDraftId();
      materialFiles.current.set(id, file);
      return { id, title: file.name.replace(/\.(md|markdown|txt|pdf)$/i, ""), origin: "file", content: "", mediaType: file.name.toLowerCase().endsWith(".md") ? "text/markdown" : "text/plain", role: materials.length + index === 0 ? "primary-source" : "notes", sourceUrl: "", sourceKind: "webpage", fileName: file.name, fileSize: file.size, needsReattach: false };
    });
    setMaterials((current) => {
      return replaceEmptyInitial ? additions : [...current, ...additions];
    });
  };

  const updateMaterial = (id: string, patch: Partial<CreatorMaterialDraft>) => {
    invalidateNormalizedSource();
    setMaterials((current) => current.map((material) => material.id === id ? { ...material, ...patch } : material));
  };

  const addTextMaterial = () => {
    if (materials.length >= 8) return;
    invalidateNormalizedSource();
    setMaterials((current) => [...current, emptyTextMaterial(newDraftId(), `Material ${current.length + 1}`)]);
  };

  const removeMaterial = (id: string) => {
    if (materials.length === 1) return;
    invalidateNormalizedSource();
    materialFiles.current.delete(id);
    setMaterials((current) => current.filter((material) => material.id !== id));
  };

  const moveMaterial = (id: string, direction: -1 | 1) => {
    invalidateNormalizedSource();
    setMaterials((current) => {
      const index = current.findIndex((material) => material.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
  };

  const page = document?.pages.find(
    (candidate) => candidate.pageNumber === selectedPage,
  );

  const compile = async () => {
    if (compileLock.current || !document || !sourcePack || !sourceAuthorized || !warningsAccepted || (job && ["queued", "running"].includes(job.status))) return;
    compileLock.current = true;
    setCompiling(true);
    setError(null);
    try {
      compileRequestId.current ??= crypto.randomUUID();
      const response = await fetchWithTimeout("/api/compiler/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: compileRequestId.current,
          document,
          sourcePack,
          rights: { confirmed: true, basis: rightsBasis, notes: "Confirmed in Creator Studio." },
          audience: { level, language, targetMinutes, learnerGoal },
          templateId,
        }),
      });
      const payload = await response.json().catch(() => null);
      compileRequestId.current = null;
      if (!response.ok) {
        throw new Error(`${compilerErrorMessage(payload?.error)} No partial course was published.`);
      }
      setJob(payload as CompilerJob);
      sessionStorage.setItem(ACTIVE_RUN_KEY, (payload as CompilerJob).runId);
    } catch (cause) {
      setError(
        cause instanceof RequestTimeoutError
          ? "Starting the compilation timed out. Try once more: Museion will reconnect to the same request instead of creating a duplicate."
          : cause instanceof Error
            ? cause.message
            : "Compilation failed safely.",
      );
    } finally {
      compileLock.current = false;
      setCompiling(false);
    }
  };

  const cancelCompilation = async () => {
    if (!job) return;
    setCancelBusy(true);
    try {
      const response = await fetchWithTimeout(`/api/compiler/runs/${job.runId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("The compiler had already finished or could not be cancelled.");
      setJob({ ...job, status: "cancelled" });
      sessionStorage.removeItem(ACTIVE_RUN_KEY);
      setCompiling(false);
      setError("Compilation was cancelled. Your source and learning brief are still here.");
    } catch (cause) {
      setError(
        cause instanceof RequestTimeoutError
          ? "Cancellation timed out. Museion will keep checking the run; do not start a duplicate."
          : cause instanceof Error
            ? cause.message
            : "Cancellation failed. Check the run status and try again.",
      );
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
  const canNormalize = Boolean(
    sourceAuthorized
    && title.trim()
    && materials.length > 0
    && materials.every((material) => material.title.trim() && (material.origin === "text" ? material.content.trim() : !material.needsReattach) && (!material.sourceUrl.trim() || material.sourceUrl.trim().startsWith("https://"))),
  );
  const sourceReady = Boolean(document && sourcePack && sourceAuthorized && warningsAccepted);
  const readyToCompile = sourceReady && learningBriefReady;
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
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-lapis-dark">
          Source review
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em]">
          Start with a source you trust.
        </h1>
        <p className="mt-4 max-w-[62ch] leading-7 text-ink-soft">
          Museion first normalizes the source, fixes page boundaries and hashes
          every page. Nothing is compiled until you can inspect that record.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-lapis/15 bg-lapis-soft/55 px-4 py-3 text-sm">
          <span className="font-semibold text-lapis-dark">Source → validated course</span>
          <span className="text-ink-soft">When live AI is connected, Museion designs the course in staged passes and publishes only after deterministic checks pass.</span>
          <Link href="/settings" className="font-semibold text-lapis-dark underline underline-offset-4">Check connection</Link>
        </div>
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
          {clearConfirmation ? (
            <span className="inline-flex items-center gap-3">
              <button type="button" disabled={activeJob} onClick={clearDraft} className="font-semibold text-wrong underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40">Confirm clear</button>
              <button type="button" onClick={() => setClearConfirmation(false)} className="font-medium text-ink-soft underline underline-offset-4 hover:text-ink">Keep draft</button>
            </span>
          ) : (
            <button type="button" disabled={activeJob} onClick={() => setClearConfirmation(true)} className="font-medium text-ink-soft underline underline-offset-4 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">Clear draft</button>
          )}
          <span className="text-xs text-ink-soft">Text and learning preferences save on this device. Uploaded file bytes do not.</span>
        </div>
      </div>

      <ol aria-label="Creator progress" className="mt-8 grid gap-2 rounded-2xl border border-ink/10 bg-surface/80 p-2 sm:grid-cols-3">
        {[
          { label: "1. Source", detail: document ? "Normalized" : busy ? "Normalizing" : "Add and inspect", ready: Boolean(document), current: !document },
          { label: "2. Learning design", detail: !document ? "After source review" : learningBriefReady ? TEMPLATE_NAMES[templateId] : "Complete the brief", ready: Boolean(document && learningBriefReady), current: Boolean(document && !learningBriefReady) },
          { label: "3. Compile", detail: activeJob ? "In progress" : job?.status === "failed" ? "Ready to retry" : readyToCompile ? "Ready" : "Needs review", ready: activeJob || readyToCompile, current: Boolean(document && learningBriefReady && !sourceReady) },
        ].map((step) => (
          <li
            key={step.label}
            aria-current={step.current ? "step" : undefined}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${step.ready ? "bg-correct-soft" : step.current ? "bg-lapis-soft/70 shadow-[inset_0_0_0_1.5px_var(--color-lapis)]" : "bg-paper"}`}
          >
            <span
              aria-hidden="true"
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold ${step.ready ? "bg-correct text-white" : step.current ? "bg-lapis text-white" : "bg-ink/10 text-ink-soft"}`}
            >
              {step.ready ? "✓" : step.label.charAt(0)}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{step.label}</span>
              <span className="mt-0.5 block truncate text-xs text-ink-soft">{step.detail}</span>
            </span>
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
        <Suspense fallback={<section className="premium-surface rounded-[1.6rem] p-7 text-sm text-ink-soft" role="status">Loading Source Pack editor…</section>}>
          <SourcePackEditor
            title={title}
            materials={materials}
            rightsBasis={rightsBasis}
            sourceAuthorized={sourceAuthorized}
            busy={busy}
            disabled={activeJob}
            canNormalize={canNormalize}
            onTitle={(value) => { invalidateNormalizedSource(); setTitle(value); }}
            onUpdate={updateMaterial}
            onAddText={addTextMaterial}
            onRemove={removeMaterial}
            onMove={moveMaterial}
            onFiles={addFiles}
            onRightsBasis={(basis) => { invalidateNormalizedSource(); setRightsBasis(basis); }}
            onAuthorized={(confirmed) => { invalidateNormalizedSource(); setSourceAuthorized(confirmed); }}
            onNormalize={() => void normalizeSourcePack()}
          />
        </Suspense>

        <section
          aria-live="polite"
          aria-busy={busy}
          className="premium-surface min-w-0 rounded-2xl border border-white/80 p-6 sm:p-7"
        >
          <h2 className="font-display text-xl font-semibold">Normalized record</h2>
          {!document || !page ? (
            <div className="mt-5 grid place-items-center gap-3 rounded-xl bg-paper px-5 py-10 text-center">
              <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-2xl bg-lapis-soft text-lapis">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path strokeLinecap="round" d="M14 3v5h5M9.5 13h5M9.5 16.5h5" /></svg>
              </span>
              <p className="max-w-[32ch] text-sm leading-6 text-ink-soft">
                Add a source to inspect its canonical pages, warnings and hashes.
              </p>
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
              {sourcePack && <div className="mt-4 rounded-xl border border-lapis/15 bg-lapis-soft/45 p-4 text-sm">
                <div className="flex items-center justify-between gap-3"><p className="font-semibold">{sourcePack.materials.length} normalized {sourcePack.materials.length === 1 ? "material" : "materials"}</p><span className="font-mono text-[0.65rem] text-ink-soft">pack {sourcePack.sha256.slice(0, 10)}…</span></div>
                <ul className="mt-3 space-y-2">{sourcePack.materials.map((material, index) => <li key={material.id} className="rounded-lg bg-surface/80 px-3 py-2"><div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate font-medium">{index + 1}. {material.title}</span><span className="shrink-0 text-xs capitalize text-ink-soft">{material.role.replaceAll("-", " ")}</span></div>{material.document.sourceReference ? <a href={material.document.sourceReference.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs font-medium text-lapis-dark underline underline-offset-4">{material.document.sourceReference.kind.replaceAll("_", " ")} reference</a> : <span className="mt-1 block text-xs text-ink-soft">No external reference</span>}</li>)}</ul>
                <p className="mt-3 text-xs leading-5 text-ink-soft">Every material hash and reference is bound to this pack. Course claims still derive only from the normalized evidence pages shown below.</p>
              </div>}
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
              <Suspense fallback={<div role="status" className="mt-5 rounded-xl bg-paper p-5 text-sm text-ink-soft">Loading learning design…</div>}>
                <SourceLearningDesign templateId={templateId} level={level} language={language} targetMinutes={targetMinutes} learnerGoal={learnerGoal} onTemplate={setTemplateId} onLevel={setLevel} onLanguage={setLanguage} onMinutes={setTargetMinutes} onGoal={setLearnerGoal} />
              </Suspense>
              {document.sha256 === GOLDEN_SOURCE_SHA256 && <Link href="/create/review" className="mt-5 block w-full rounded-lg border border-lapis px-5 py-2.5 text-center font-medium text-lapis">Open checked golden review</Link>}
              {activeJob && job && <div className="mt-5 rounded-2xl bg-ink p-5 text-white" aria-live="polite">
                <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">3. Compile</p><p className="mt-1 font-semibold">Building a grounded course</p><p className="mt-1 text-xs text-white/55">Elapsed {elapsedLabel(job.createdAt)} · safe to refresh</p></div><span className="font-mono text-sm">{job.completedStages}/{job.totalStages}</span></div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${Math.max(7, (job.completedStages / job.totalStages) * 100)}%` }} /></div>
                <ol className="mt-4 space-y-2">{COMPILE_STAGES.map((stage, index) => { const active = job.stage === stage.id || (job.stage === "critic_after_repair" && stage.id === "critic"); const done = index < job.completedStages; return <li key={stage.id} className={`flex items-center justify-between gap-3 text-sm ${active ? "text-white" : done ? "text-white/75" : "text-white/40"}`}><span>{done ? "✓" : active ? "→" : "·"} {stage.label}</span><span className="font-mono text-xs">{stage.model}</span></li>; })}</ol>
                <button type="button" disabled={cancelBusy} onClick={() => void cancelCompilation()} className="mt-4 text-sm font-semibold text-white/75 underline hover:text-white disabled:opacity-45">{cancelBusy ? "Cancelling…" : "Cancel compilation"}</button>
              </div>}
              <button type="button" disabled={compiling || activeJob || !readyToCompile} onClick={() => void compile()} className="sticky bottom-20 mt-3 w-full rounded-lg bg-ink px-5 py-3 font-medium text-white shadow-[var(--shadow-2)] transition hover:bg-lapis disabled:cursor-not-allowed disabled:opacity-45 lg:static lg:shadow-none">
                {activeJob ? "Compilation running…" : compiling ? "Starting compilation…" : document.sha256 === GOLDEN_SOURCE_SHA256 ? "Create verified replay run" : job?.retryable ? "Retry compilation" : "Compile this source"}
              </button>
              {!sourceAuthorized && <p className="mt-2 text-center text-xs font-medium text-ink-soft">Confirm source authorization to continue.</p>}
              {sourceAuthorized && !warningsAccepted && <p className="mt-2 text-center text-xs font-medium text-ink-soft">Review and acknowledge the source warnings to continue.</p>}
              {sourceReady && !learningBriefReady && <p className="mt-2 text-center text-xs font-medium text-wrong">Complete the language, duration and learner goal before compiling.</p>}
              <p className="mt-1 text-center text-xs text-ink-soft">Golden hashes use deterministic replay. Other sources require the configured live compiler; failures never publish a partial artifact.</p>
            </>
          )}
        </section>
      </div>
      <button
        ref={architectTrigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={architectOpen}
        onClick={() => setArchitectOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-3 rounded-2xl border border-lapis/15 bg-surface px-3 py-2.5 shadow-[var(--shadow-2)] transition hover:-translate-y-0.5 hover:border-lapis/35 sm:bottom-5 sm:right-6"
      >
        <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl bg-lapis-soft font-display text-sm font-semibold tracking-[-0.04em] text-lapis-dark">CA</span>
        <span className="text-left"><span className="block font-display font-semibold">Course Architect</span><span className="block text-xs text-ink-soft">Build from my material</span></span>
      </button>
      {architectOpen && <Suspense fallback={<div role="status" className="fixed bottom-3 right-3 z-50 rounded-xl bg-surface px-5 py-4 shadow-xl">Opening Course Architect…</div>}><CourseArchitectPanel
        document={document}
        textLength={materials.reduce((total, material) => total + material.content.length, 0)}
        materialCount={materials.length}
        fileMaterialCount={materials.filter((material) => material.origin === "file").length}
        sourceUrl={materials.find((material) => material.sourceUrl.trim())?.sourceUrl ?? ""}
        sourceAuthorized={sourceAuthorized}
        warningsAccepted={warningsAccepted}
        learnerGoal={learnerGoal}
        onAddMaterial={(value) => {
          invalidateNormalizedSource();
          setMaterials((current) => {
            const empty = current.find((material) => material.origin === "text" && !material.content.trim());
            if (empty) return current.map((material) => material.id === empty.id ? { ...material, content: value } : material);
            if (current.length >= 8) return current;
            return [...current, { ...emptyTextMaterial(newDraftId(), `Material ${current.length + 1}`), content: value, role: "notes" }];
          });
        }}
        onSetGoal={setLearnerGoal}
        onSetReference={(value, kind) => {
          invalidateNormalizedSource();
          setMaterials((current) => {
            const target = current.find((material) => !material.sourceUrl.trim()) ?? current[0];
            return current.map((material) => material.id === target.id ? { ...material, sourceUrl: value, sourceKind: kind } : material);
          });
        }}
        onFiles={(files) => addFiles(files)}
        onClose={() => {
          setArchitectOpen(false);
          architectTrigger.current?.focus();
        }}
      /></Suspense>}
    </div>
  );
}
