# Museion refinement verification — 3 October 2026

PASS for the implemented local refinement, with the capability limits below. No push or public deployment was performed.

## Environment and product boundary

App repository: `Museion/`, branch `v2/sites`, Node 25.8.2, Next.js 16.2.11, React 19. Browser checks used the Codex in-app Browser and synthetic learner data in `/private/tmp/museion-refinement-qa.sqlite`, with separate outbox and uploads directories. The final production process runs only at `http://127.0.0.1:3000` using the normal local database; QA credentials/accounts were not copied into that database.

The entry flow is **landing → signup/login → private onboarding → dashboard → authored course**. There is no public exercise or dashboard demo. `/judge` and `/api/judge` return 404. Unauthenticated product pages redirect to login, preserving their destination; private APIs return 401. Protected/auth responses have `noindex, nofollow` and private/no-store caching.

## Design review: Before / After / Why

Applied the Emil Design Skills engineering and motion guidance while preserving the user's approved immersive landing direction.

| Area | Before | After | Why |
| --- | --- | --- | --- |
| 1. Hero word animation | Shorter changing words could feel abrupt | Four-second reading interval, ~320 ms crossfade, stable word frame, small blur/translation, no blank word between changes | Preserve the playful headline while making it easier to read |
| 2. Material cards | Horizontal cards did not follow vertical browsing | Measured scroll progress drives a native horizontal rail inside a sticky section when the panel fits | Cards travel with the learner's scroll, including backwards, without intercepting wheel/touch input |
| 3. Course arrows | Arrows sat too close to image corners | Quiet circular treatment inset 1.3 rem (20.8 px) from card edges | Clear affordance with consistent breathing room |
| 4. Method/companion cards | Sparse labels and a large empty blue area | Source-to-question illustration, explicit source/attempt/feedback steps, a Maia guidance note, and detailed practice items | Show what a learner actually does and why the next step helps |
| 5. Auth composition | Form on the right with inconsistent pale backgrounds | Form on the left; restrained white/blue surfaces and a shared field system | Put the task first, with stronger hierarchy and calmer colours |
| 6. Auth story | Flat panel with little visual detail | Original cool daylight learning landscape, real HTML headings, separate reusable Maia artwork | Add creative detail without compromising readability or baking text into images |
| 7. Signup/onboarding | Name, email and password in a single long form | Name/email → password → verification; short focused transitions; five full-screen onboarding views | Ask for one small decision at a time and preserve a clear sense of progress |
| Dashboard | Passive companion and generic starting point | Saved goal/pace, evidence-backed next action, authored course recommendation, contextual Maia opening in a lesson | Be proactive using real state, without fake achievements, memories or background model calls |
| Lesson workspace | Floating companion and crowded activity chrome | Spacious white lesson surface, slim real progress rail, activity on the right and bottom-anchored Maia conversation on the left; activity first on mobile | Apply the composition of the user's nine Koji reference frames while preserving Museion's own identity |
| Tutor attention | Generic panel feedback | A small original Maia cue at a registered question/graph/code target; coordinated parameter/formula/geometry marks and checked recursion-slot guidance | Put the explanation beside the actual work; never change or submit the learner's answer |
| Lesson transitions | Activity pane could retain the previous feedback scroll position | Reset and focus the question on a new step/variant; ordinary chat updates preserve position | Start the next learning move at its question and keep keyboard navigation predictable |
| Public navigation/pages | Limited links and separate page conventions | Shared public route inventory, responsive menu, document layout and footer; Method, Help, Accessibility, Privacy and Terms | Reuse components and keep public/private navigation consistent |
| Font delivery | Seven font subsets included in build output | Five self-hosted subsets: Latin, Latin Extended, Greek, Greek Extended and common Cyrillic | Remove 35.8 KiB of currently unused font output; other scripts keep the system-font fallback until their locale is introduced |

## Browser verification

| Check | Evidence | Result |
| --- | --- | --- |
| Hero text continuity | Sampled 321 times across the 16-second animation cycle. Sum of incoming/outgoing opacity ranged from 0.99999961 to 1.0000002; stable headline height | PASS |
| Desktop material rail | 1280×800, panel 660 px, overflow 432 px. Vertical progress 0 / .5 / 1 / .25 gave scrollLeft 0 / 216 / 432 / 108 | PASS |
| Tablet material rail | 829×763, panel 591 px, overflow 547 px. Progress 0 / .5 / 1 gave 0 / 273.5 / 547; returning backwards restored 273.5 | PASS |
| Mobile material rail | 390×844, panel 642 px, overflow 938 px. Progress 0 / .5 / 1 gave 0 / 469 / 938 | PASS |
| Short viewport | 829×500 disables sticky scroll mapping; ordinary vertical/native horizontal browsing remains available | PASS |
| Reduced motion / no JavaScript | Content stays visible, dynamic scenes fall back, materials keep native horizontal access. Emulation was reset | PASS |
| Mobile public navigation | 320 and 390 px without document overflow; native menu opens, Escape closes and returns focus | PASS |
| Signup | First name/email step, password step, wrong-code error, correct-code consumption, onboarding destination | PASS in isolated local QA |
| Onboarding | Goal, subject, familiarity, daily pace and course recommendation; preferences persisted through logout/login | PASS |
| Dashboard/course/navigation | Fresh and resumed states; all workspace screens captured; authored course detail and real lesson opened | PASS |
| Maia proactive opening | Fresh numeric lesson displays a contextual opening question without a model request or fake saved conversation | PASS |
| Maia live request | Browser received a conceptual question from the free router in ~8 seconds; provenance disclosure showed the resolved model | PASS for this turn |
| Provider unavailable state | A separate request fell back to authored hints and visibly identified lesson guidance | PASS |
| Source creator | Upfront notice accurately distinguishes available free lesson tutoring from unconnected automatic course building | PASS for rendering/capability disclosure; free compilation NOT IMPLEMENTED |
| Final production landing | 1280×800 and 390×844, zero horizontal overflow, self-hosted Latin font loaded, no captured console errors | PASS |
| Final production entry | `/dashboard` redirects to `/login?next=%2Fdashboard`; signup preserves that destination, 16 px mobile fields, no overflow | PASS |
| Shared graph workspace | Pointer drag set h=-3/k=2 correctly; numeric correction h=3 was checked by the engine. Continue opened step 3 with activity scrollTop=0 and question focus. Dismissal removed guidance and marks | PASS |
| Shared code workspace | Base/head/next slots and bounded trace run locally; checked repeated input highlighted the actual next-call slot with an authored question. Corrected next input passed sum_to(3)=6 and sum_to(5)=15, with engine-checked feedback | PASS |
| Final lesson responsive | 320×700 and 390×844 code, 390×844 graph, 829×763 tablet: zero document overflow; no input/select/textarea/button outside the viewport. Tutor stays in document flow below the activity | PASS |
| Final lesson practice | No lesson-guidance region or hint-ladder button; manual Maia affordance remains available | PASS |
| Final lesson reduced motion / console | Reduced-motion emulation removed marker transforms/entrance movement; timed opacity dismissal remains. Media emulation reset. Final test tab captured no warnings/errors | PASS |

These are desktop-browser viewport tests, not physical iOS/Android certification. Static screenshots do not prove animation smoothness; measurements above and real scrolling provide the motion evidence.

## Accessibility

axe-core with WCAG2A/AA and WCAG2.1A/AA tags reported zero violations for the final landing (25 passing rules), all five public documents, signup mobile, dashboard mobile, onboarding and a fresh lesson/Maia opening. Number-label/caption contrast and onboarding progress semantics were corrected during verification. Manual checks covered focus, Escape and native menu behaviour. This is scoped testing, not a claim of complete WCAG conformance.

The subsequent shared lesson pass also reported zero violations for checked graph and wrong-attempt recursion surfaces (28 passing rules each), and mobile recursion with a live conversation (27 passing rules). Tutor marks do not steal focus; a step change intentionally focuses the new question. Pulse cues disappear after 1.6 seconds with 200 ms transform/opacity motion; reduced motion removes movement. Highlight/focus targets remain until their scoped cue is replaced or dismissed.

## Authentication and persistence

SQLite additive version-2 migration preserves existing accounts/preferences. Pending signup stores a hashed password and hashed OTP and creates neither account nor session before accepted verification. Codes expire after ten minutes, with bounded guesses, resend cooldown/quota and protected consumption. Delivery failure rolls back; outbox files use 0600 and their directory 0700. Older delivery files are pruned on later delivery. The dedicated 17-case verification suite passes, including expiry, resend/guess limits, one-time consumption, concurrency, migration, rollback and permissions.

Local verification delivers to a **private outbox file**; no email is sent and mailbox ownership is not established. Use `npm run auth:outbox` and `npm run auth:outbox -- --open <challenge-id>` as described in the README. A real email transport and recovery workflow remain release work. SQLite/local storage assumes one Node instance with a persistent disk; serverless/multi-instance portability has not been verified.

## Maia and OpenRouter

`openrouter/free` is the only model slug used by the testing adapter. Server-side opt-in, zero-price constraints, bounded context, strict structured output, time/response limits and no paid fallback are enforced. The detailed persona lives in `src/lib/maia/prompt.ts`; state is explicitly untrusted data. Output still crosses schema, target and answer-leak gates. Fixed error classifications exclude raw upstream bodies/messages, secrets and reasoning from diagnostics.

The explicit synthetic live evaluation covered conceptual help, direct answer requests, role spoofing and private-context requests. Result: **3 accepted live turns + 1 authored fallback**, all four delivery results safe under those checks. Resolved models included `dots-studio/dots-3-note-preview:free` and `qwen/qwen3.8-27b:free`. One provider error led to fallback. This is a narrow regression check, not universal jailbreak resistance or pedagogical/mathematical quality certification.

A separate final-production Browser turn on the recursion activity received an accepted conceptual response from `qwen/qwen3.8-27b:free`. It asked how the next input could shrink, without filling a slot or exposing an answer; the About Maia disclosure identified the actual model. This additional UI turn is separate from the four-case evaluation above.

Safe evaluation metadata: [JSON report](assets/refinement-2026-10/maia-live-evaluation.json). Current free-provider mode supports Maia tutoring; course compilation still requires a separately configured compiler provider. The UI and capability endpoint expose that distinction, and global live-AI opt-out blocks compilation too.

Proactive guidance is a bounded authored lesson cue, explicitly separate from real conversation history. It introduces the current surface conceptually and can use a checked misconception's leak-gated teaching focus. It never consumes the hint ladder, calls a model automatically or creates a mastery event. Independent/practice mode suppresses these cues. Stable IDs and per-surface version watermarks reject duplicates, stale variants, late checked responses and cues cleared by the server. Existing recursion diagnoses declare their permitted attention target; those declarations remain private until the relevant checked guidance is delivered.

## Public information and indexing

Privacy and Terms have deliberately marked example operator details, per the user's instruction to replace them later. Configure `MUSEION_OPERATOR_NAME`, `MUSEION_OPERATOR_COUNTRY` and `MUSEION_OPERATOR_EMAIL` and review the actual deployment before public release. The drafts describe current local storage and optional external processing without inventing legal approval, certifications, retention guarantees or commercial terms.

`AGENTS.md` documents repository workflow and product boundaries; it is not served publicly. `llms.txt` contains public information links only. Local `robots.txt` disallows all crawling; the sitemap is empty. Public indexing needs explicit opt-in plus a suitable HTTPS origin; auth/workspace pages remain excluded. Crawling directives are not authentication.

Primary references used: [AGENTS.md](https://agents.md/), [llms.txt proposal](https://llmstxt.org/), [Next.js metadata files](https://nextjs.org/docs/app/api-reference/file-conventions/metadata), [OpenRouter free router](https://openrouter.ai/openrouter/free), [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs), [OpenRouter privacy](https://openrouter.ai/privacy), [European Commission data protection](https://commission.europa.eu/law/law-topic/data-protection_en). These inform implementation; they do not constitute legal sign-off.

## Final automated checks

- PASS: 691 tests, 18 explicitly skipped live-provider cases; 71 passing test files and 2 skipped files. Two-worker full suite, 22.99 seconds.
- PASS: TypeScript and ESLint; production build's TypeScript pass also completed after font delivery changes.
- PASS: production webpack build and 36 generated static pages.
- PASS: unchanged bundle limits: 3273.0 KiB total / 3287.0 KiB; largest JavaScript 470.4 KiB / 550 KiB; PDF worker 1193.1 KiB / 1400 KiB. Unused font subsets and unreachable former Maia drawer code were removed, without increasing a budget.
- PASS: `git diff --check`.
- PASS: production HTTP check: public pages 200, private pages 307, private APIs 401, retired hackathon paths 404. Auth/private cache and robots headers verified.
- NOT RUN: deployment, external email delivery, complete accessibility certification and long-term learning outcomes.

Production HTTP evidence: [JSON report](assets/refinement-2026-10/production-http-check.json).

## Screenshots and original artwork

[Full visual gallery — 55 real screenshots](refinement-gallery.md) · [Filterable HTML gallery](refinement-gallery.html). Thirteen new lesson screenshots capture the final production workspace; three older lesson views are explicitly labelled as previous layouts.

The new auth illustration and its exact prompt are recorded in [the asset manifest](brand/asset-manifest.md). Runtime WebP is 960×1440, 48,286 bytes. UI controls/text remain HTML. The image tool did not expose a model identifier, so no particular image-model version is asserted.
