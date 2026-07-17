# Verification Log

## 2026-07-15 03:20–03:33 CEST — Baseline

| Command | Result | Feature / notes |
| --- | --- | --- |
| `git clone https://github.com/metaforismo/Museion.git Museion` | Pass after network approval | Checkout at `c70d594`; remote default remains legacy branch |
| `npm ci` | Pass after cache/network approval | 400 packages; npm reported 2 moderate vulnerabilities; no automatic fix applied |
| `npm run lint` | Pass, exit 0 | Baseline static lint |
| `npm run typecheck` | Pass, exit 0 | Baseline TypeScript |
| `npm test` | Pass, exit 0 | 10 files; 55 passed; 8 live red-team tests skipped; 63 total |
| `npm run build` | Pass, exit 0 | All routes compiled; warning that Next selected `/Users/francescogiannicola/bun.lock` as workspace root |
| Package ZIP SHA-256 check | Pass | Archived planning distribution matches sidecar |

No live model call, browser journey, mobile viewport, console/network audit, E2E, or deployment check has been completed yet. These remain unverified and must not be reported as passing.

## 2026-07-15 03:43–03:52 CEST — Local changes

| Command | Result | Feature / notes |
| --- | --- | --- |
| `npm run lint` | Pass, exit 0 | Provider/gate/config/docs static checks |
| `npm run typecheck` | Pass, exit 0 | Strict tutor contracts and Responses integration |
| `npm test` | Pass, exit 0 | 12 files; 60 passed; 8 GPT-5.6 live cases skipped; 68 total |
| `npm run build` | Pass, exit 0 | All routes compiled; prior external-lockfile root warning removed |
| `npm run verify:ui` | Pass, exit 0 | Chrome: onboarding, catalog, wrong/correct answer, hint, deterministic Maia fallback, completion, progress, 404, desktop 1440×1000 and mobile 320×700; no unexpected console/page/5xx errors or horizontal overflow |
| `npm audit --omit=dev` | Fail, exit 1 | 2 moderate PostCSS advisories through Next; npm proposes a breaking downgrade to Next 9, so no automatic force-fix was applied |

Screenshots were generated under ignored `output/playwright/smoke/`. No live GPT-5.6 call or deployed-route check was performed.

One later sandboxed build attempt failed because `next/font` could not resolve Google Fonts. The required rerun with network access passed; this was an environment/network failure, not a code failure.

## 2026-07-15 04:04–04:09 CEST — Source ingestion and provenance

| Command | Result | Feature / notes |
| --- | --- | --- |
| `npm run lint` | Pass, exit 0 | Source modules, creator UI, session regression fix, and smoke script |
| `npm run typecheck` | Pass, exit 0 | Strict versioned source/page/span contracts and browser PDF integration |
| `npm test` | Pass, exit 0 | 13 files; 67 passed; 8 live GPT-5.6 cases skipped; 75 total |
| `npm run build` | Pass, exit 0 | `/create` statically compiled; bundled PDF worker resolved. One sandbox-only font fetch failed before the allowed-network rerun passed |
| `npm run verify:ui` | Pass, exit 0 | Chrome desktop/mobile plus pasted instruction-like source warning, SHA-256 preview, real six-page PDF extraction, disabled future compiler action, and zero horizontal overflow |

The first expanded browser run failed on a 404 after React development-mode effect replay created two anonymous sessions concurrently. The client now shares one in-flight creation per lesson/mode, and the full lesson path passed afterward. A second run extracted all six PDF pages but reported global 320 px overflow after the Create link was added; the responsive two-row header fixed all three affected routes. These failed runs are retained here because they were useful regressions, not hidden as passing attempts.

No live GPT-5.6 call, Source Graph compile, deployment, or learning-outcome check was performed.

## 2026-07-15 04:13 CEST — Compiler contract foundation

| Command | Result | Feature / notes |
| --- | --- | --- |
| `npm run lint` | Pass, exit 0 | Source Graph, Blueprint, canonical serialization |
| `npm run typecheck` | Pass, exit 0 | Strict schema and validator types |
| `npm test` | Pass, exit 0 | 14 files; 70 passed; 8 live GPT-5.6 cases skipped; 78 total |
| `npm run build` | Pass, exit 0 | Production routes compile with the new contract modules |

At this checkpoint only the contract foundations were verified; the following checkpoint adds Course Artifact v2 and the v1 adapter. Model compilation and a checked-in golden graph remain unimplemented.

## 2026-07-15 04:16–04:18 CEST — Course Artifact v2 boundary

| Command | Result | Feature / notes |
| --- | --- | --- |
| `npm run lint` | Pass, exit 0 | Private/public schemas, registry, adapter, validators |
| `npm run typecheck` | Pass, exit 0 | Exhaustive public block transformation |
| `npm test` | Pass, exit 0 | 15 files; 78 passed; 8 live GPT-5.6 cases skipped; 86 total |
| `npm run build` | Pass, exit 0 | Production build includes the completed contract boundary |

All five authored lessons adapt without mutation. Public serialization rejects unknown block kinds and contains none of the restricted answer, solution, hint, misconception, expected-state, or diagnostic-rule fields. Source-grounded compilation and replay remain unverified.

## 2026-07-15 11:45–12:05 CEST — Complete golden judge slice

| Command / check | Result | Feature / notes |
| --- | --- | --- |
| `npm test` | Pass, exit 0 | 21 files; 118 passed; 8 live GPT-5.6 cases skipped; 126 total |
| `npm run lint` | Pass, exit 0 | Compiler, runtime, evidence, judge APIs and UI |
| `npm run typecheck` | Pass, exit 0 | Strict public/private and route contracts |
| `npm run build` | Pass, exit 0 | Next 16.2.10; all routes compiled fully offline |
| `npm run verify:ui` | Pass, exit 0 | Complete journey, 20 independent desktop runs and one 320×700 run, refresh persistence, no overflow, console/page errors, or HTTP 5xx |
| Visual screenshot inspection | Pass | Desktop and 320 px evidence ledger readable and claim-limited |
| `npm audit --omit=dev --audit-level=high` | Pass, 0 vulnerabilities | Scoped transitive PostCSS override to 8.5.19; no forced downgrade |
| `git diff --check` | Pass | No whitespace errors |

The first complete judge browser attempt exposed cross-block React state reuse: SequenceBuilder inherited an empty array from PredictionChoice. Keying the interactive renderer by block id fixed it; the full 20/20 run then passed. `.next/static` measured 2.8 MB. No live model call, hosted deployment, or learning-outcome study was performed.

## 2026-07-15 12:23–12:29 CEST — Frontend and GitHub publication

- Redesign gate: lint, strict TypeScript, 118 offline tests, production build, zero-vulnerability audit, and `git diff --check` passed.

## 2026-07-15 — revised model routing gate

| Check | Result | Evidence |
|---|---|---|
| `npm run typecheck` | Pass | Strict TypeScript, including Codex/job/template boundaries |
| `npm run lint` | Pass | No ESLint findings |
| `npm test` | Pass | 147 offline passed; 17 live-gated skipped |
| `npm run verify:ui` (production) | Pass | Settings + full Creator/Judge paths, a11y, keyboard, mobile, budgets, 20 clean Judge contexts |
| Luna/Terra/Sol check | Pass | 3,916 / 4,917 / 4,606 ms; requested model equals resolved model |
| Non-golden compile | Pass | Water-cycle source accepted in 76,906 ms through Luna/Terra/Terra/Sol |
| Terra Maia red-team | Pass | 8/8 Codex deliveries, 0 leaks, 0 fallback, 0 repair |

Codex did not expose token counts or quota percentages, so none are reported. Deployment and external submission remain unverified.
- Production Chrome gate: redesigned homepage/header, skip navigation, active-route state, Privacy/Terms, reduced motion, legacy lesson/source path, 20/20 judge runs, and 320 px path passed with no overflow, console/page errors, or HTTP 5xx.
- Consolidated implementation commit: `cb669f1b0ad76a9817a05082cf47028aec1d02a6`.
- Remote `main` was fast-forwarded to that commit and set as the GitHub default branch.
- Both removed remote branches (`build-week/gpt56-course-compiler`, `claude/eloquent-allen-d54lbo`) were proven ancestors of `main` before deletion.
- After fetch/prune, local and remote branch listings contained only `main` and `origin/main`.
- The first publication CI passed but warned that checkout/setup-node v4 action runtimes used deprecated Node 20; both actions were updated to their official current v7 releases and re-verified.

## 2026-07-17 — Authored courses, source sets, and Maia reasoning rail

| Check | Result | Evidence |
|---|---|---|
| `npm run typecheck` | Pass | Course-path contracts, eleven registered lessons, linked-source records, and updated UI types |
| `npm run lint` | Pass | No ESLint findings |
| `npm test` | Pass | 216 offline passed; 17 live-gated skipped |
| Focused course/source tests | Pass | 46 checks across both authored courses, source references, file sets, draft migration, misconception triggers, and public DTO privacy |
| `npm run build` | Pass | Both course pages statically generated; one known non-blocking Turbopack tracing warning remains for the local Codex runtime |
| `npm run verify:bundle` | Pass | Static 2885.9 KiB / 3072 KiB; largest JS 492.3 KiB / 550 KiB; PDF worker 1274.3 KiB / 1400 KiB |
| `npm audit --omit=dev` | Pass | 0 vulnerabilities |
| `npm run verify:ui` (production) | Pass | Added both course pages, course-aware lesson return/position, mobile course layout, linked YouTube-playlist record, file upload, Maia rail, accessibility scans, existing 20-context Judge gate, and no unexpected console/page/5xx failures |
| `npm run screenshots` | Pass | 17 route-backed product images, including Library, course detail, linked-source Creator, and docked Maia rail |

The Creator records webpage, YouTube video/playlist, and book links only as sanitized hash-bound provenance paired with authorized transcript, excerpt, or notes. It does not fetch protected content, transcribe video automatically, or claim that a URL alone was compiled. The two new course paths are source-informed and Museion-authored; their completion evidence remains bounded to the checked items and one immediate near-transfer observation.
