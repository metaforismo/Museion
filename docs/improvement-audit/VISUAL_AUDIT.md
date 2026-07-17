# Museion visual audit

Audit date: 2026-07-17. Baseline revision: `c1968fe`. This audit uses the production build, the in-app Browser at 390 x 844, and existing Playwright screenshots under `output/playwright/smoke/`.

## Priority summary

- **P1:** Make the learning task visually dominant; collapse Maia on mobile until requested.
- **P1:** Replace the editorial serif-everywhere hierarchy with an honestly named, restrained sans-serif system.
- **P1:** Simplify homepage and navigation language for learners; move engineering proof out of the primary path.
- **P1:** Reduce oversized headings, large rounded panels, decorative shadows, and repeated eyebrow labels.
- **P2:** Convert Creator and review into denser progressive workflows with technical data disclosed on demand.

## `/`

- **Purpose:** Explain Museion and help a learner start.
- **Primary user/action:** New learner; create a course or try an interactive lesson.
- **Strengths:** Clear trust boundary, direct CTAs, searchable lesson catalog.
- **Problems:** The hero is editorial and oversized; `Judge`, `artifact v2.0`, test counts, dependency counts, and `keyless replay` precede learner value. The truth-boundary panel consumes most of the mobile first screen. Serif headings and repeated large cards make the product feel like a museum publication.
- **Typography/layout/density:** 5xl-7xl serif hero, extreme tracking, long paragraphs, tall full-width proof sections.
- **Mobile/interactions:** The next useful learning action falls below technical explanation. Full-page captures expose repeated sticky-header stitching and excessive page length.
- **Copy/accessibility:** Internal Build Week terms are understandable to judges, not learners. Semantics and focus states are otherwise strong.
- **Recommended change:** Sans-first type system; `Create a course` primary CTA; `Try the interactive lesson` secondary CTA; compact four-step product preview; engineering proof in a disclosure/About.
- **Implemented in this pass:** honest sans-first token, learner-first CTA order, technical metrics removed, and a concrete source → activity → Maia trace without a generic card grid.
- **Second pass:** public navigation and the application workspace were separated. Operational routes now use a persistent desktop sidebar and a focus-managed mobile drawer; the production screenshot is a reproducible README asset.
- **Third pass:** the homepage now presents Museion as a learning experiment rather than an e-learning catalog: observable protocol animation, evidence-discipline section, bounded-claim taxonomy, generic-tutor comparison, and a source-lab CTA. Motion is transform/opacity based and disabled under reduced motion.
- **Priority:** P1.

## `/welcome`

- **Purpose:** Explain the core learning contract once.
- **Primary user/action:** First visitor; continue or skip.
- **Strengths:** Short carousel, keyboard-visible controls, truthful tutor boundary.
- **Problems:** The ancient-Mouseion introduction delays the product benefit and repeats homepage positioning.
- **Typography/layout/density:** Display-heavy introduction; copy could be shorter.
- **Mobile/interactions:** Fits the viewport, but the learner should reach the catalog in fewer words.
- **Recommended change:** Lead with “you reason before Museion explains”; keep history as optional context.
- **Priority:** P2.

## `/create`

- **Purpose:** Normalize a source, define a learning brief, and compile.
- **Primary user/action:** Creator; add and review a source.
- **Strengths:** Autosave, drag/drop, stale-result protection, authorization, warnings, idempotent jobs.
- **Problems:** The page still becomes one long form after normalization. Hashes and advanced settings are too visible. Two large rounded panels create a compressed-desktop mobile layout.
- **Typography/layout/density:** Oversized serif title; repeated 1.6rem panels; learning design is nested deeply inside source review.
- **Mobile/interactions:** Long vertical journey and sticky action risk; progressive steps need stronger disclosure.
- **Recommended change:** Smaller header, five-step workflow, compact sticky readiness rail, technical source record in details, split networking into hooks.
- **Priority:** P1.

## `/create/review`

- **Purpose:** Demonstrate the checked golden compilation.
- **Primary user/action:** Judge/creator; understand and launch the course.
- **Strengths:** Honest validation, source graph, blueprint, course sequence.
- **Problems:** It remains the older visual language and shows concepts, hashes, and claims too early.
- **Typography/layout/density:** Many large serif section titles and rounded cards.
- **Mobile/interactions:** Extremely long; advanced data is not progressively disclosed.
- **Recommended change:** Align with the run-specific review, summarize coverage first, put hashes and model traces in advanced details.
- **Priority:** P2.

## `/create/review/[runId]`

- **Purpose:** Decide whether a generated course is safe, grounded, and launchable.
- **Primary user/action:** Creator; inspect evidence and launch.
- **Strengths:** Block-adjacent citations, real validation state, responsive provenance table, launch gate.
- **Problems:** The first viewport still lacks a persistent launch action and compact coverage summary. Technical provenance remains visually prominent on mobile.
- **Typography/layout/density:** Better grouping than the golden page but still display-heavy and highly carded.
- **Mobile/interactions:** No horizontal overflow at 390px; page remains very long.
- **Recommended change:** Sticky launch bar, compact source-coverage metrics, advanced provenance disclosure.
- **Priority:** P1.

## `/judge`

- **Purpose:** Run the checked interactive binary-search lesson and independent check.
- **Primary user/action:** Learner/judge; complete the current activity.
- **Strengths:** Strong runtime constraints, visible progress, deterministic misconception intervention.
- **Problems:** Visible `Judge`, `verified replay`, `deterministic runtime`, raw citation IDs, and large course header frame the lesson as a technical demo. One-column layout does not create a primary learning canvas.
- **Typography/layout/density:** Large serif course title repeats above each activity; technical badges compete with the prompt.
- **Mobile/interactions:** Sticky continue works, but long technical preamble delays the task.
- **Recommended change:** Rename visible surface to `Interactive demo`; compact course identity after start; add activity-path labels; source access on demand.
- **Priority:** P1.

## `/learn/[runId]`

- **Purpose:** Run a generated course.
- **Primary user/action:** Learner; complete one authored block at a time.
- **Strengths:** Same guarded runtime as the demo and owner-bound launch.
- **Problems:** Inherits all `/judge` presentation issues; unsupported blocks fail before rendering but the learning shell remains demo-oriented.
- **Recommended change:** Share a learner-first shell and move run/provider metadata into details.
- **Priority:** P1.

## `/lessons/[lessonId]`

- **Purpose:** Complete an authored deterministic lesson with optional tutoring.
- **Primary user/action:** Learner; answer the current question.
- **Strengths:** One question at a time, safe retries, focused feedback, accessible focus recovery.
- **Problems:** At 390px the title collides with `Step 1 of 4`. Maia renders as a 36rem chat panel immediately after the task and visually competes with the lesson. “Grounded tutor” resembles support-chat status.
- **Typography/layout/density:** Serif course title and card-heavy task/tutor stack; question area is strong but could be denser.
- **Mobile/interactions:** Maia consumes the next viewport even when unused; title/progress header lacks a resilient grid.
- **Copy/accessibility:** Practice says “unassisted” while Maia remains available. Tutor semantics are good.
- **Recommended change:** Robust compact lesson header; activity-first 70/30 desktop layout; collapsed mobile coach; replace precise mastery emphasis with evidence wording.
- **Implemented in this pass:** collision-safe grid header, collapsed-by-default mobile Maia with automatic open on explicit Maia actions, and provider/model details moved into a disclosure.
- **Priority:** P1.

## `/lessons/[lessonId]/practice`

- **Purpose:** Retrieve without the hint ladder.
- **Primary user/action:** Returning learner; finish hint-free practice.
- **Strengths:** Hints are correctly removed and scoring stays deterministic.
- **Problems:** `Unassisted practice` is inaccurate because Maia remains present.
- **Recommended change:** Use `Hint-free practice` and explicitly state that Maia is optional.
- **Implemented in this pass:** badge, guidance, and completion claims now consistently say `Hint-free`; independence remains exclusive to locked transfer.
- **Priority:** P1.

## `/progress`

- **Purpose:** Choose what to do next from prior activity.
- **Primary user/action:** Returning learner; continue or practice.
- **Strengths:** Recommended next action and honest limitation copy.
- **Problems:** Percentage bars remain the primary representation even though they are support heuristics; evidence hierarchy and recent misconceptions are absent.
- **Typography/layout/density:** Large editorial title and rounded record container.
- **Recommended change:** Evidence states (`Seen`, `Guided`, `Independent`, `Near transfer`) and concise next-practice queue.
- **Implemented in the second pass:** exact percentages are no longer learner-facing; the dashboard shows session-evidence bands, expected guidance, completed activity, hint-free runs, a recommended next action, and an explicit evidence key. Empty and loading states use the same information architecture.
- **Implemented in the third pass:** the route is now a learning laboratory rather than a progress report. Today’s protocol, an activity-only ledger, lowest-evidence-first observation map, research note, explicit zero-data state, and richer sidebar replace generic LMS rewards. No streak, XP, or readiness value is invented.
- **Priority:** P1.

## `/settings`

- **Purpose:** Choose offline, local Codex, or future API runtime.
- **Primary user/action:** Creator; understand and check the provider.
- **Strengths:** Explicit billing/privacy boundaries, complete failure states, sanitized diagnostics.
- **Problems:** Model routing is too prominent for ordinary learners and the page remains technical by default.
- **Recommended change:** Plain-language provider cards first; model table and diagnostics in advanced disclosure.
- **Priority:** P2.

## `/about`, `/privacy`, `/terms`

- **Purpose:** Carry architecture, limitations, and legal truth.
- **Primary user/action:** Evaluator or careful user; verify claims.
- **Strengths:** Honest evidence boundaries and local-runtime disclosures.
- **Problems:** About repeats homepage marketing; legal pages inherit oversized editorial headings.
- **Recommended change:** Move technical homepage proof here, shorten repeated prose, keep legal copy scannable.
- **Priority:** P2.

## `/missing-route`

- **Purpose:** Recover from an invalid URL.
- **Primary user/action:** Any user; return to a useful route.
- **Strengths:** Branded not-found route exists.
- **Problems:** Needs regression coverage at all compact widths.
- **Recommended change:** Keep one clear action to Learn and one to Create; verify no navigation overflow.
- **Priority:** P2.
