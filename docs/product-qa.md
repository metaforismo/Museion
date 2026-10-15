# Local product verification — 3 October 2026

## Scope and environment

Next.js Node application, tested through the Codex in-app Browser. Browser tests used synthetic accounts and `/private/tmp/museion-product-qa.sqlite`, separate from the normal `data/museion.sqlite`. Live AI remained disabled; no paid provider calls or public deployment were performed.

The product flow is **landing → registration/login → personal dashboard → real course**. The public landing exercise was removed after the user clarified that no public demo should exist. `/judge` page source is removed, and the proxy returns 404 for retired `/judge` and `/api/judge` paths. Product pages and APIs require a real session.

## Browser results

| Check | Result | Evidence |
| --- | --- | --- |
| Restored immersive landing at 320×568, 390×700, 768×1024, 1024×768, 1440×960 | PASS | Actual viewport dimensions checked; no horizontal overflow or visible clipped text; all six subject images loaded; no public lesson controls |
| Desktop and mobile scroll scenes | PASS | Subject cluster/story/resolved and Create/Think/Transfer phases reached in both directions; checked at 1440×720 and 390×844 |
| Informational entry and FAQ | PASS | Footer Start learning reaches the real signup form; FAQ opens with Enter |
| Reduced motion and short screens | PASS | All reveals visible and chapters stacked; resetting the preference restores the dynamic scene |
| JavaScript disabled | PASS | Text remains visible, chapters stack, no horizontal overflow; JavaScript restored after testing |
| Rotating headline | PASS | 97 points across its 12-second cycle show continuous incoming/outgoing opacity, with no blank subject |
| Signup and onboarding | PASS | Real local account created; exam goal saved before dashboard navigation |
| Login | PASS | Incorrect credentials produce clear generic error; password show/hide and Enter submission work; inputs 16px at 320px |
| Protected entry and logout | PASS | Unauthenticated dashboard request redirects to login; logout returns to landing |
| Fresh dashboard | PASS | Real name/goal, honest empty personal library and Algebra as Balance as the first course action |
| Existing dashboard | PASS | Real unfinished step, guidance history and review signal displayed |
| Lesson progression | PASS | Wrong response, misconception-specific hint, correct response, next step and saved return |
| Resume after logout/login | PASS | Browser references cleared by logout; reopening Continue recovers the second step from the account’s SQLite record |
| Mobile navigation | PASS | Modal drawer, Escape closes it, focus returns to navigation button; no overflow |
| Global search | PASS | Querying Progress and pressing Enter opens the progress page; descriptions use learner text rather than concept identifiers |
| Library | PASS | Course-first layout, optional lesson/map disclosure, empty search/reset, Biology filter returns three real lessons |
| Course detail | PASS | Natural Selection shows its 3-lesson sequence, prerequisites, learning aims and source basis |
| Create/Settings/Account | PASS for rendering/navigation | Mobile fields and states render without overflow; disabled live-provider setup is explained; account data controls are present |
| Maia mobile | PASS in offline mode | Contextual lesson hint delivered, no answer giveaway in checked response, accurate Lesson guidance state; blocked microphone control hidden |

Responsive checks are viewport tests in the desktop browser, not a physical iOS/Android certification. All 37 lessons were validated by automated content tests; they were not each completed manually in the Browser.

## Accessibility

axe-core checks using WCAG2A/AA and WCAG2.1A/AA tags reported **zero violations** on the restored immersive landing (25 passing rules). Earlier integration checks also reported zero violations on login, signup, authenticated dashboard, progress and mobile lesson/tutor states, which were unchanged in this landing follow-up. Native keyboard/menu behavior was checked manually. Automated checks do not establish complete accessibility conformance across every possible state.

## Curriculum and persistence

Inventory: 10 authored courses containing 32 lessons, plus 5 foundation lessons, 37 total. The focused audit covered algebra progression, probability diagnoses and shuffled practice context, and equivalent fractions. Fraction lessons now include same-whole reasoning and contextual practice. Across the catalog, numeric multiple-choice misconception aliases were normalized to option text so real UI selections trigger the intended diagnoses; regressions check that correct answers never trigger those diagnoses.

Auth/persistence integration covers password hashing, generic login failures, expiry, revocation, durable throttling, owner isolation, SQLite reopen, preference persistence, generated course artifacts after temporary compiler-state expiry, sanitized exports, retired routes, and recovery of unfinished lessons after browser references are lost. Explicit Restart creates fresh work; failed lookup does not silently create another lesson session.

## Build checks

- PASS: 626 tests, 17 explicitly skipped live-provider cases; 63 passing test files and 1 skipped file. Full suite rerun with two workers after the immersive landing restoration. Two assertions prescribing the discarded static visual layout were removed; auth/public-entry checks remain.
- PASS: TypeScript.
- PASS: ESLint.
- PASS: production webpack build, including TypeScript and page generation. The SQLite adapter now imports Node's built-in module statically so webpack preserves it in the server bundle.
- PASS: bundle budgets after landing restoration: 3265.8 KiB static assets (3287 KiB budget), 470.4 KiB largest JavaScript chunk, 1193.1 KiB PDF worker.
- PASS: production restart with the separate QA database. The Browser reopened the saved second lesson step and accepted the next correct answer.
- PASS: normal database startup at `http://127.0.0.1:3000`. Unauthenticated dashboard entry redirects to login. QA accounts remain in the separate temporary database. `MUSEION_COOKIE_SECURE=0` is used only for this loopback HTTP session; deployed HTTPS must retain secure cookies.
- PASS: restored landing on the final production build at1280×720 and390×844, with no overflow and all six subject images loaded. Direct dashboard navigation redirects to `/login?next=%2Fdashboard`. Temporary Browser viewport and motion overrides were reset.

## Visual proof

- [Restored landing desktop](assets/landing-immersive-2026-10/hero-desktop.png)
- [Restored landing mobile](assets/landing-immersive-2026-10/hero-mobile.png)
- [Subject scroll scene](assets/landing-immersive-2026-10/subjects-desktop.png)
- [Scroll chapter desktop](assets/landing-immersive-2026-10/chapter-think-desktop.png)
- [Scroll chapter mobile](assets/landing-immersive-2026-10/chapter-think-mobile.png)
- [Cloud finale](assets/landing-immersive-2026-10/cloud-finale-desktop.png)
- [Dashboard desktop](assets/product-2026-10/dashboard-desktop.jpg)
- [Dashboard mobile](assets/product-2026-10/dashboard-mobile.jpg)
- [Signup mobile](assets/product-2026-10/signup-mobile.jpg)

Remaining product work: email verification and recovery, continuous voice tutoring, broader curriculum/editorial review, localisation and a chosen public hosting environment. Optional live-provider behavior was not exercised in this local redesign. The interface remains English. Local persistence is implemented; deployment and learning effectiveness are separate, unverified outcomes.

## Subsequent refinement pass

The [refinement verification](refinement-qa.md) records the later progressive signup/OTP/onboarding, five information pages, native scroll-linked materials, real free-router tutor evaluation and final production checks. Its [42-screen gallery](refinement-gallery.md) shows the current UI. The original report above remains a record of its earlier offline pass; it does not describe the later live-provider evaluation.
