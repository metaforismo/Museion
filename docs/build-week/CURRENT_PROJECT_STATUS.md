# Current Project Status

Verified on 2026-07-15 against baseline commit `c70d594` plus the local, uncommitted Build Week changes mapped in `UNCOMMITTED_CHANGE_MAP.md`.

## Product boundary

Museion is currently a small authored-lesson platform with a deterministic answer verifier, session engine, misconception matching, heuristic mastery/fading, and a GPT-5.6 Maia path with deterministic fallback. It is not yet a source-grounded learning compiler.

The Build Week vertical slice is one binary-search source compiled into a cited, typed, replayable course with a deterministic interactive activity, a leak-gated GPT-5.6 intervention, and one locked near-transfer observation.

## Verified working

- Five authored lessons and practice banks render through the Next.js App Router.
- Numeric, multiple-choice, and allow-listed expression answers are graded by code.
- Lesson content is sanitized before reaching the browser; answer specs, solutions, hints, and misconceptions are withheld.
- Misconception triggers are tested against the real verifier and rejected if they count as correct.
- Sessions record attempts and hints, share an in-memory mastery model, and support localStorage-based resume while the server process survives.
- Missing OpenAI credentials produce a deterministic hint-ladder fallback.
- GPT-5.6 Responses integration now uses a strict Zod turn contract, buffers output, checks answer leaks and UI targets, repairs once, and falls back deterministically.
- Session read/mutation routes now enforce anonymous-cookie ownership.
- Practice lesson steps are stripped of deterministic hints on the server.
- Pasted text, Markdown, and selectable-text PDFs can be normalized in the browser into versioned pages with stable SHA-256 hashes, limits, and instruction-like-content warnings.
- Exact unique source spans use an explicit UTF-16 offset policy and validate their page slice and hash.
- `/create` previews canonical pages and hashes before compilation; the future Source Graph action remains visibly disabled.
- Strict Source Graph, Course Blueprint, private/public Course Artifact v2, closed block registry, reference validation, canonical JSON/SHA-256, and a non-mutating v1 adapter now define the compiler boundary.
- The public artifact strips answer specs, solutions, hints, misconception details, expected traces, and evaluator rules before browser serialization.
- Baseline commands pass: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

## Partial or unverified

- Live red-team coverage is skipped without `OPENAI_API_KEY`; no dated live report is checked in.
- Progress persists across sessions only inside one server process, not across restarts or instances.
- Practice has no deterministic hint ladder, but Maia remains available; it is not valid independent-transfer evidence.
- Accessibility has useful foundations, but dynamic feedback, focus movement, small-screen forms, contrast, and progress semantics need a focused pass.
- The historical baseline/delta is diffable, but pre-Build-Week provenance is partly self-attested by a consolidation commit.

## Broken or unsafe behavior

- Learner, lesson, and source state is treated as untrusted data; later compiler stages must preserve that boundary.
- Malformed JSON and oversized learner inputs are not handled consistently.
- A failed client session create/resume, answer, or hint request can appear as an endless loading state or a no-op.
- Completed lesson sessions cannot be restarted from the UI.

## Missing submission-critical path

- Compiler-produced Source Graph/Blueprint/Course Artifact instances and their checked-in binary-search replay.
- Typed interactive registry and the binary-search RangeExplorer/StateTrace flow.
- Maia environment snapshots and allow-listed UI actions.
- Locked transfer mode and immutable evidence ledger.
- Creator compile/review UI, deterministic replay, judge reset, and Playwright judge-path coverage.
- Deployment evidence, live GPT-5.6 evals, final README, demo video, and Devpost artifacts.

## Submission risks

1. The planning headline “prove you understood it” is stronger than a single near-transfer observation supports.
2. The default GitHub branch is still `claude/eloquent-allen-d54lbo`, although it points to the same commit as `main`.
3. The six-page demo PDF is described as five pages in one planning document.
4. Build Week rules and dates in the archive are a secondary snapshot and must be rechecked before submission.
5. No live GPT-5.6 structured-output, latency, cost, refusal, or leak-rate result exists yet.
