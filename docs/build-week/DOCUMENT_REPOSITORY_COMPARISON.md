# Planning Document / Repository Comparison

Planning sources are archived read-only in `../docsdoneforplanning/` outside this checkout. Repository and runtime evidence take precedence.

| Capability | Planned state | Current implementation | Evidence | Gap | Priority |
| --- | --- | --- | --- | --- | --- |
| Deterministic truth boundary | Code owns correctness | Verified for three authored answer kinds | `src/lib/engine/verifier.ts`, `tests/verifier.test.ts` | Generated artifacts need broader validators | P0 |
| Learner sessions | Replayable versioned events | Mutable in-process class and loose event objects | `src/lib/engine/session.ts` | No versions, hashes, sequence, replay, or concurrency guard | P1 |
| Mastery and fading | Evidence-aware assistance | Heuristic EMA shown as percentage | `src/lib/engine/mastery.ts` | Not psychometric; no task distance or delayed evidence | P1 |
| Practice mode | Unassisted retrieval | Hint UI hidden; Maia available; step hints retained | `src/lib/engine/practice.ts`, `LessonPlayer.tsx` | Must not be called independent evidence | P0 claim fix |
| Self-explanation | Targeted formative prompt | Asked after every correct lesson step and sent to Maia | `LessonPlayer.tsx` | Not targeted or deterministically assessed | P2 |
| Source ingestion / PDF | Text, Markdown, selectable PDF | Implemented and browser-verified | `src/lib/source/**`, `/create`, `tests/source.test.ts` | OCR and cloud storage intentionally excluded | P0 done |
| Provenance / Source Graph | Canonical spans, hashes, cited graph | Strict cited graph schema and cross-reference/span validation implemented | `src/lib/compiler/schemas/source-graph.ts` | Model extraction and golden graph artifact remain | P0 partial |
| Course Blueprint / Artifact v2 | Strict versioned IR | Blueprint, private/public Artifact v2, closed block registry, canonical hashing, and v1 adapter implemented | `src/lib/compiler/**`, `tests/course-artifact.test.ts` | Produce and replay the source-grounded golden artifact | P0 contract done |
| GPT-5.6 provider | Responses API, strict output | Implemented offline; live behavior unverified | `src/lib/maia/openai-provider.ts`, `contracts.ts` | Run recorded live conformance/latency eval | P0 verify |
| Hard leak gate | Buffer, validate, repair once, fallback | Implemented and unit-tested | `src/lib/maia/tutor.ts`, `tests/tutor.test.ts` | Expand frozen adversarial fixtures and live run | P0 verify |
| Interactive DSL | Four registered pure reducers | Missing | Three answer input kinds only | Registry, reducers, public/private config | P0 |
| Maia snapshots / UI actions | Typed state plus allow-list | Text lesson snapshot; no actions | `session.ts`, `prompt.ts` | Untrusted data isolation and target validation | P1 |
| Misconception counterexample | Minimal local intervention | Authored text remediation only | Content lesson files | No typed counterexample or visual targeting | P1 |
| Transfer / evidence ledger | Locked near transfer and factual evidence | Missing; EMA only | No transfer/evidence types | Separate locked runtime and immutable observations | P0 |
| Creator / review UX | Compile and inspect citations/issues | Source ingestion and canonical preview implemented | `/create`, `SourceCreator.tsx` | Compile/review/publish stages remain disabled and missing | P1 |
| Judge / replay | Keyless deterministic replay | Missing | Current offline mode covers authored lessons only | Golden artifact, reset, visible live/replay label | P0 |
| Evals / E2E | Fixtures, Playwright, release gates | 78 offline tests pass; 8 live skipped; local Chrome smoke covers lesson and source ingestion | `tests/`, `scripts/verify-ui.mjs` | Add compiler replay and full judge path | P0 |
| CI / deployment | lint, typecheck, test, build, deployed path | Local CI config includes typecheck; deployment absent | `.github/workflows/ci.yml`, `TODO.md` | Verify hosted CI, then deployment evidence | P0 |
| README / provenance | Reproducible Build Week story | Local README and delta describe GPT-5.6 path; final compiler story missing | `README.md`, `docs/BUILD_WEEK_DELTA.md` | Add measured compiler/eval/deploy results only after implementation | P0 |

## Revised decisions

- Say “shows what the learner applied independently,” not “proves understanding” or “proves mastery.”
- Build for the judge and an independent technical learner first; creator review exists to make the compilation trustworthy.
- Cite every source-derived claim, not every piece of UI or pedagogical copy.
- Treat GPT-5.6 as proposing pedagogy inside typed deterministic and human-review bounds.
- Ship only retention eligibility metadata; delayed scheduling and broad adaptive spacing are post-hackathon.
- Canonicalize one schema per boundary before compiler work. Planning examples conflict on field names, versions, actions, and evidence shapes.
- The demo PDF is six pages unless the artifact is intentionally regenerated and revalidated.

## Intentionally excluded from the Build Week slice

Authentication, durable multi-user database persistence, OCR, crawling, video/audio ingestion, LMS integration, voice, teacher/parent dashboards, broad multilingual support, far-transfer claims, and arbitrary model-generated UI.
