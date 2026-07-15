# Decision Log

## D001 — Narrow the claim

**Decision:** describe Museion as producing inspectable evidence of what a learner applied independently, not proof of understanding or mastery.
**Alternatives:** retain the stronger marketing line; display an EMA mastery percentage.
**Rationale:** one immediate near-transfer task cannot establish durable or far transfer, and the EMA is a product heuristic.
**Consequences:** completion and submission copy must use evidence statements and assistance context.
**Revisit:** after validated delayed-retention and multi-task evidence.

## D002 — One golden vertical slice

**Decision:** protect the six-page binary-search path and keyless replay before breadth.
**Alternatives:** arbitrary PDF chat, many generated courses, broad content catalog.
**Rationale:** provenance, deterministic interaction, bounded Maia, and transfer are the differentiator and the highest technical risk.
**Consequences:** OCR, crawling, dashboards, auth, voice, and broad localization are excluded.
**Revisit:** after the full judge path passes 20/20.

## D003 — Freeze canonical contracts in code

**Decision:** resolve planning-schema conflicts in strict Zod schemas before compiler prompts or renderers.
**Alternatives:** implement directly from example TypeScript files; let model output drive the shape.
**Rationale:** planning sources disagree on source fields, span IDs, artifact layout, tutor actions, and evidence observations.
**Consequences:** generated output, reducers, UI actions, and evidence all depend on one versioned contract.
**Revisit:** only through an explicit schema version and migration.

## D004 — Buffer tutor output

**Decision:** the judged tutor path returns only a complete validated structured turn; no raw token streaming.
**Alternatives:** keep streaming and scan chunks; stream into a hidden buffer protocol.
**Rationale:** a post-delivery scan cannot enforce answer non-revelation, and structured validation is simpler before delivery.
**Consequences:** slightly higher perceived latency; UI needs a good thinking/loading state.
**Revisit:** after an event protocol can prove that no unsafe field is rendered before validation.

## D005 — Replay is a first-class mode

**Decision:** checked-in golden replay must work with no API key and be visibly different from live compilation.
**Alternatives:** require live GPT-5.6 for judging; silently fall back to canned content.
**Rationale:** judging reliability and honest disclosure matter more than a fragile live-only demo.
**Consequences:** artifact, seed, event log, and resolved model/compiler provenance must be versioned.
**Revisit:** never remove keyless replay; live may become default after measured reliability.

## D006 — Source ingestion is a deterministic browser boundary

**Decision:** normalize authorized text, Markdown, and selectable-text PDF locally into versioned page records before any model or compiler stage.
**Alternatives:** upload raw files to a model; add OCR or URL crawling during the judged slice.
**Rationale:** stable hashes and exact spans require deterministic page text, while raw-file model ingestion weakens provenance and the prompt-injection boundary.
**Consequences:** 10 MB, 30-page, and 140,000-character limits; OCR and textless PDFs fail recoverably; instruction-like prose is preserved as source data and flagged rather than executed.
**Revisit:** after Source Graph and artifact replay prove the canonical text contract end to end.

## D007 — Runtime truth stays server-side

**Decision:** public blocks are data-only and dispatch typed actions to pure server-side reducers; correct orders, expected traces, answer specs, and misconception rules never enter the judge payload.
**Alternatives:** grade in the browser; let Maia decide correctness.
**Rationale:** deterministic replay, leak resistance, and evidence integrity require one authoritative transition function.
**Consequences:** judge sessions are owner-bound server state and in-memory until durable persistence lands.
**Revisit:** storage may change; the public/private contract does not.

## D008 — One attempt means one observation

**Decision:** transfer is locked until all interactive blocks complete, accepts one artifact-bound attempt, stores only the answer hash, and emits a narrowly worded observation.
**Alternatives:** multiple retries; a mastery score; Maia-assisted transfer.
**Rationale:** retries or help would make the independence claim ambiguous, while one task cannot justify mastery.
**Consequences:** evidence copy must always include assistance counts, event references, citations, and limitations.
**Revisit:** after multiple delayed and far-transfer measures exist.

## D009 — Offline production builds are a release invariant

**Decision:** remove runtime Google Font downloads and pin the patched transitive PostCSS version through a scoped override.
**Alternatives:** require network during build; force npm's proposed Next 9 downgrade.
**Rationale:** the judge replay is keyless and should build reproducibly; the forced downgrade is incompatible and destructive.
**Consequences:** typography uses local system stacks; dependency overrides are revalidated on every Next update.
**Revisit:** when self-hosted font assets or a Next release with patched nested PostCSS is adopted.
