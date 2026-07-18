"use client";

import { useState } from "react";

import type { CreatorMaterialDraft } from "@/lib/client/creator-draft";
import { MAX_NORMALIZED_CHARACTERS, MAX_SOURCE_BYTES, MAX_SOURCE_PAGES } from "@/lib/source/limits";
import { inferSourceReferenceKind } from "@/lib/source/reference";
import type { SourcePackMaterialRole, SourceRightsBasis } from "@/lib/source/source-pack";

const ROLE_LABELS: Record<SourcePackMaterialRole, string> = {
  "primary-source": "Primary source",
  transcript: "Transcript",
  excerpt: "Authorized excerpt",
  notes: "Creator notes",
};

export default function SourcePackEditor({
  title,
  materials,
  rightsBasis,
  sourceAuthorized,
  busy,
  disabled,
  canNormalize,
  onTitle,
  onUpdate,
  onAddText,
  onRemove,
  onMove,
  onFiles,
  onRightsBasis,
  onAuthorized,
  onNormalize,
}: {
  title: string;
  materials: CreatorMaterialDraft[];
  rightsBasis: SourceRightsBasis;
  sourceAuthorized: boolean;
  busy: boolean;
  disabled: boolean;
  canNormalize: boolean;
  onTitle: (value: string) => void;
  onUpdate: (id: string, patch: Partial<CreatorMaterialDraft>) => void;
  onAddText: () => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onFiles: (files: File[], replaceId?: string) => void;
  onRightsBasis: (basis: SourceRightsBasis) => void;
  onAuthorized: (confirmed: boolean) => void;
  onNormalize: () => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const textCharacters = materials.reduce((total, material) => total + material.content.length, 0);
  const fileBytes = materials.reduce((total, material) => total + (material.origin === "file" ? material.fileSize ?? 0 : 0), 0);

  return (
    <section className="premium-surface rounded-[1.6rem] border border-white/80 p-6 sm:p-7">
      <p className="eyebrow">Your material</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Build one Source Pack</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">Each item keeps its own role and provenance. References document where material came from; only the authorized text or file becomes course evidence.</p>
        </div>
        <span className="rounded-full bg-paper px-3 py-1.5 text-xs font-semibold text-ink-soft">{materials.length}/8 materials</span>
      </div>

      <label className="mt-5 block text-sm font-medium" htmlFor="source-title">Source Pack title</label>
      <input id="source-title" value={title} maxLength={200} disabled={disabled} onChange={(event) => onTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-ink/15 bg-surface px-3 py-2.5" />

      <ol className="mt-6 space-y-4" aria-label="Source Pack materials">
        {materials.map((material, index) => {
          const label = material.title.trim() || `Material ${index + 1}`;
          return (
            <li key={material.id} className="rounded-2xl border border-ink/10 bg-paper/70 p-4 sm:p-5">
              <fieldset disabled={disabled}>
                <legend className="sr-only">{`Material ${index + 1}: ${label}`}</legend>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface font-mono text-xs font-semibold text-lapis-dark">{String(index + 1).padStart(2, "0")}</span>
                    <div><p className="text-sm font-semibold">{label}</p><p className="text-xs text-ink-soft">{material.origin === "file" ? material.fileName : "Editable text material"}</p></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(material.id, -1)} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-ink-soft hover:bg-surface disabled:opacity-30">Up</button>
                    <button type="button" aria-label={`Move ${label} down`} disabled={index === materials.length - 1} onClick={() => onMove(material.id, 1)} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-ink-soft hover:bg-surface disabled:opacity-30">Down</button>
                    <button type="button" aria-label={`Remove ${label}`} disabled={materials.length === 1} onClick={() => onRemove(material.id)} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-wrong hover:bg-wrong-soft disabled:opacity-30">Remove</button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium">Material title<input aria-label={`Material ${index + 1} title`} value={material.title} maxLength={200} onChange={(event) => onUpdate(material.id, { title: event.target.value })} className="mt-2 w-full rounded-lg border border-ink/15 bg-surface px-3 py-2.5" /></label>
                  <label className="text-sm font-medium">Evidence role<select aria-label={`Material ${index + 1} role`} value={material.role} onChange={(event) => onUpdate(material.id, { role: event.target.value as SourcePackMaterialRole })} className="mt-2 w-full rounded-lg border border-ink/15 bg-surface px-3 py-2.5">{Object.entries(ROLE_LABELS).map(([value, roleLabel]) => <option key={value} value={value}>{roleLabel}</option>)}</select></label>
                </div>

                <label className="mt-3 block text-sm font-medium">Reference link <span className="font-normal text-ink-soft">(optional provenance)</span><input aria-label={`Material ${index + 1} reference link`} type="url" inputMode="url" value={material.sourceUrl} placeholder="https://youtube.com/playlist?list=…" onChange={(event) => onUpdate(material.id, { sourceUrl: event.target.value, sourceKind: inferSourceReferenceKind(event.target.value) })} className="mt-2 w-full rounded-lg border border-ink/15 bg-surface px-3 py-2.5" /></label>
                {material.sourceUrl.trim() ? <label className="mt-3 block text-sm font-medium">Reference type<select aria-label={`Material ${index + 1} reference type`} value={material.sourceKind} onChange={(event) => onUpdate(material.id, { sourceKind: event.target.value as CreatorMaterialDraft["sourceKind"] })} className="mt-2 w-full rounded-lg border border-ink/15 bg-surface px-3 py-2.5"><option value="youtube_video">YouTube video</option><option value="youtube_playlist">YouTube playlist</option><option value="book">Book or chapter</option><option value="webpage">Web page or course page</option></select></label> : null}

                {material.origin === "text" ? (
                  <>
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <label className="min-w-44 flex-1 text-sm font-medium">Format<select aria-label={`Material ${index + 1} format`} value={material.mediaType} onChange={(event) => onUpdate(material.id, { mediaType: event.target.value as CreatorMaterialDraft["mediaType"] })} className="mt-2 w-full rounded-lg border border-ink/15 bg-surface px-3 py-2.5"><option value="text/markdown">Markdown</option><option value="text/plain">Plain text</option></select></label>
                    </div>
                    <label className="mt-3 block text-sm font-medium">Authorized evidence<textarea aria-label={`Material ${index + 1} authorized text`} value={material.content} maxLength={MAX_NORMALIZED_CHARACTERS} rows={7} onChange={(event) => onUpdate(material.id, { content: event.target.value })} placeholder="Paste an authorized transcript, bounded excerpt, exported captions, or your own notes…" className="mt-2 w-full resize-y rounded-xl border border-ink/15 bg-surface px-3 py-3 leading-relaxed" /></label>
                    <p className="mt-2 text-right font-mono text-xs tabular-nums text-ink-soft">{material.content.length.toLocaleString("en-US")}/{MAX_NORMALIZED_CHARACTERS.toLocaleString("en-US")}</p>
                  </>
                ) : (
                  <div className={`mt-4 rounded-xl border p-4 ${material.needsReattach ? "border-gold/40 bg-gold-soft" : "border-correct/20 bg-correct-soft"}`}>
                    <p className="text-sm font-semibold">{material.needsReattach ? "File must be reattached" : "File ready for normalization"}</p>
                    <p className="mt-1 text-xs leading-5 text-ink-soft">{material.fileName} · {((material.fileSize ?? 0) / 1024).toFixed(1)} KiB. File bytes are held only for this open page.</p>
                    {material.needsReattach ? <label className="mt-3 inline-flex min-h-10 cursor-pointer items-center rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white">Reattach this file<input type="file" accept=".txt,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf" className="sr-only" onChange={(event) => { onFiles(Array.from(event.currentTarget.files ?? []), material.id); event.currentTarget.value = ""; }} /></label> : null}
                  </div>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={disabled || materials.length >= 8} onClick={onAddText} className="min-h-12 rounded-xl border border-ink/15 bg-surface px-4 py-3 text-sm font-semibold hover:border-lapis/40 disabled:opacity-40">Add text material</button>
        <label aria-disabled={disabled || materials.length >= 8} onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragActive(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false); }} onDrop={(event) => { event.preventDefault(); setDragActive(false); if (!disabled) onFiles(Array.from(event.dataTransfer.files)); }} className={`flex min-h-12 items-center justify-center rounded-xl border border-dashed px-4 py-3 text-center text-sm font-semibold ${disabled || materials.length >= 8 ? "cursor-not-allowed opacity-40" : dragActive ? "cursor-copy border-lapis bg-lapis-soft text-lapis-dark" : "cursor-pointer border-lapis/35 bg-lapis-soft/50 text-lapis-dark hover:border-lapis"}`}>Add files<input id="source-file" type="file" multiple accept=".txt,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf" disabled={disabled || materials.length >= 8} onChange={(event) => { onFiles(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ""; }} className="sr-only" /></label>
      </div>
      <p className="mt-3 text-xs leading-5 text-ink-soft">Pack limits: 8 materials, {(MAX_SOURCE_BYTES / 1024 / 1024).toFixed(0)} MB source bytes, {MAX_SOURCE_PAGES} compiled pages, and {MAX_NORMALIZED_CHARACTERS.toLocaleString("en-US")} normalized characters. Current draft: {textCharacters.toLocaleString("en-US")} text characters · {(fileBytes / 1024).toFixed(1)} KiB attached files.</p>

      <div className="mt-6 rounded-2xl border border-ink/10 bg-surface p-4">
        <label className="flex items-start gap-3 text-sm font-medium"><input type="checkbox" checked={sourceAuthorized} disabled={disabled} onChange={(event) => onAuthorized(event.target.checked)} className="mt-1" /><span><span className="block">I am allowed to use every material in this Source Pack.</span><span className="mt-1 block font-normal leading-5 text-ink-soft">Authorization and copyright remain your responsibility. Museion records the declaration but does not infer permission from a URL.</span></span></label>
        <label className="mt-4 block text-sm font-medium" htmlFor="source-rights-basis">Rights basis<select id="source-rights-basis" value={rightsBasis} disabled={disabled} onChange={(event) => onRightsBasis(event.target.value as SourceRightsBasis)} className="mt-2 block w-full rounded-lg border border-ink/15 bg-surface px-3 py-2.5"><option value="personal-notes">My own notes</option><option value="creator-owned">Creator-owned material</option><option value="licensed">Licensed material</option><option value="open-licensed">Open-licensed material</option><option value="public-domain">Public domain</option><option value="authorized-excerpt">Authorized bounded excerpt</option></select></label>
      </div>

      <button type="button" disabled={busy || disabled || !canNormalize} onClick={onNormalize} className="mt-4 w-full rounded-xl bg-lapis px-5 py-3 font-semibold text-white transition hover:bg-lapis-dark disabled:cursor-not-allowed disabled:opacity-45">{busy ? "Normalizing Source Pack…" : `Normalize ${materials.length} ${materials.length === 1 ? "material" : "materials"}`}</button>
      {!sourceAuthorized ? <p className="mt-2 text-center text-xs font-medium text-ink-soft">Confirm authorization for the complete pack before normalization.</p> : null}
    </section>
  );
}
