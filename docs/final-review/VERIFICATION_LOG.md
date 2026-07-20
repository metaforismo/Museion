# Verification Log — Final Review Pass

Dated entries; every claim below was executed in this workspace, not assumed.

## 2026-07-18 — baseline (commit `29a9152`)

- `npm run lint` ✓ · `npm run typecheck` ✓ · `npm test`: 288 passed / 17 live-gated skipped
- `npm run build` ✓ · `npm run verify:bundle` ✓ (static 2923.5/3072 KiB, largest JS 492.3/550 KiB)
- Before-screenshots captured for 12 routes at 390×844, 768×1024, 1280×900, 1440×1000 (31 shots)
- Six parallel read-only audits (UI, UX, bugs/security, architecture, learning science, hackathon)
  completed; load-bearing findings re-verified by hand (dead `OnboardingRedirect`, unused
  preferences, sticky-CTA collision, leak-gate gap for spelled numbers > 12, unbounded
  compiler-jobs/Maia-cache/rate-limit maps).

## 2026-07-19 — after the redesign and fixes

Commands (all green unless noted):

- `npm run lint` ✓
- `npm run typecheck` ✓
- `npm test` — 309 passed / 17 live-gated skipped (graph verifier suite added; leak-gate,
  bounded-cache, rate-limit-prune, MCP rate-limit, warnings-recompute suites added)
- `npm run build` ✓ (pre-existing Turbopack NFT warning on `codex-runtime.ts` unchanged)
- `npm run verify:bundle` ✓
- `npm run verify:ui` ✓ — full browser gate against the production build: onboarding redirect →
  dashboard, landing, library/catalog, course → lesson → practice flows, judge keyless path
  (including 20× desktop + 320 px runs and two-tab concurrency), creator Source Pack flows,
  Course Architect dialog, settings (advanced disclosure opened for routing checks), axe/WCAG
  serious-level checks, keyboard flows, CLS 0.000 on measured routes.
- `npm run screenshots` ✓ — 18 real product screenshots regenerated from the running build,
  including the new `transformation-lab-desktop.png`.

Browser verification (production build, Chromium):

- Landing at 1440/1280/768/390: new hero, interactive method-trace demo (clickable options,
  correct/incorrect branches, reduced-motion static mode), method grid, Maia section, Originals,
  comparison table (focusable scroll region after axe finding), final CTA.
- Dashboard: mission card with real next action, live method strip (move derived from the
  recommendation), review-queue/evidence line, quieter rails; empty states verified for a fresh
  profile; personalized greeting verified with a preferences cookie.
- Transformation Lab driven end-to-end in the browser: MC predict step → graph step; parameter
  buttons to a=1,h=3,k=2 → "Correct"; engine tests cover the misconception triples.
- Judge: sample-lesson chrome (focus shell), completion bridge to dashboard/library present.
- Maia panel: 409 resync path implemented; plain-language runtime labels; technical detail only
  inside the disclosure.

Fixed in this pass (with tests where applicable): leak-gate spelled-number gap (en 0–999 + fr/es/de/pt
0–20), bounded compiler-jobs map, bounded Maia idempotency cache, rate-limiter key pruning, MCP
rate limiting, server-side warnings recomputation, Maia 409 retry loop, sticky mobile CTA
collisions, onboarding mounted + preferences actually used, judge dead-end, learner-facing
codename removal, in-app type-scale correction.

Known-good limitations still documented (not regressions): process-local learner sessions in
keyless mode; Revisit not implemented at runtime; fading scope limited to authored lessons.
