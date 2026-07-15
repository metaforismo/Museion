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
