# V2 verification log

## Baseline — 2026-07-17

- `npm ci`: pass (401 packages)
- lint/typecheck: pass
- tests: 163 passed, 17 live skipped
- production build: pass; known Turbopack tracing warning through local Codex runtime
- bundle: pass (static 2856.0/3072 KiB; largest JS 492.3/550; PDF worker 1274.3/1400)
- UI gate: pass; CLS 0.000

## Incremental V2

- Focused dashboard/leak/tutor/runtime/curriculum tests: 34 pass
- Typecheck and lint: pass
- In-app Browser semantic/visual review: landing and dashboard pass. The React development CSP `unsafe-eval` warning did not reproduce in the production gate.

## Final candidate — 2026-07-17

- `npm run lint`: pass with zero warnings
- `npm run typecheck`: pass
- `npm test -- --run`: 170 passed, 17 live-only skipped across 31 files
- `npm run build`: pass; known non-blocking Turbopack NFT trace warning through the local Codex runtime remains
- `npm run verify:bundle`: pass (static 2874.0/3072 KiB; largest JavaScript 492.3/550; PDF worker 1274.3/1400)
- `npm audit --audit-level=high`: 0 vulnerabilities
- `npm run verify:ui` against the production build: pass
  - axe WCAG 2.0/2.1/2.2 A/AA route scans
  - desktop and 320 px mobile flows, with 375/768/1440 responsive coverage in the scripted matrix
  - keyboard-only interaction and focus restoration
  - offline, delayed, cancelled, duplicate and resumed actions
  - no console errors, unhandled page errors, unexpected 5xx responses or horizontal page overflow
  - 20 clean-context Judge reliability runs
  - performance: `/welcome` 188.2 KiB total, 169.4 KiB JS, CLS 0.000; `/create` 254.6 KiB total, 238.7 KiB JS, CLS 0.000; `/judge` 268.2 KiB total, 245.6 KiB JS, CLS 0.000
- `npm run screenshots`: 14 canonical product screenshots regenerated from the same production candidate

Live ChatGPT/Codex conformance and quota evidence remain account-dependent and are not claimed by this log.
