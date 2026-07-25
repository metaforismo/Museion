<!--
  PR 1 of 4 — the stack's base. Open via:
    gh pr create --base main --head v2/sites-runtime \
      --title "Sites runtime: run Museion as a private ChatGPT Site" \
      --body-file docs/pr/1-sites-runtime/PR_BODY.md
  See docs/pr/README.md for the stack and docs/pr/EXECUTE.md for the runbook.
-->

> **Stack: PR 1 of 4** — base `main`. The three PRs above this one (`v2/design-system`, `v2/energy`, `v2/lesson-canvas`) build on it in order; merge this first. See [the stack map](https://github.com/metaforismo/Museion/blob/v2/sites/docs/pr/README.md) for the whole picture.

Museion becomes deployable as a **private ChatGPT Site**: a Worker entry via vinext, D1 for state, R2 for uploads, and a real multi-user story — per-owner isolation, Sign in with ChatGPT as the account boundary, daily quotas, and security headers on every response. Three commits; 66 files; the whole thing sits under the app, so nothing here changes a pixel.

## What it adds

**The Worker target.** `worker/index.ts` wraps vinext's app-router handler: it installs the Sites runtime bindings per request, serves `/_vinext/image` through the platform image service, and stamps every response with a fixed security-header set (CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, camera/microphone/geolocation denied). `.openai/hosting.json` declares the project and its two bindings: D1 as `DB`, R2 as `UPLOADS`.

**Persistence.** A Drizzle schema and a single migration create the ten owner-scoped tables — accounts, guest claims, lesson sessions, session events, concept evidence, generated courses, compiler runs, uploads, daily usage, audit events — every one carrying `owner_id NOT NULL`, sessions carrying an optimistic `revision` and a `lease_until` for write leases, and account deletion cascading. The engine keeps working without D1 (local dev falls back to in-memory durable state), so nothing about lessons, verification, or evidence changed to accommodate the database.

**Identity and isolation.** Every request resolves to an *actor*: a cookie-scoped guest, or an account derived from the Sign in with ChatGPT headers — the e-mail is never stored; the owner id is an HMAC of it under a server pepper. When a guest signs in, their whole record migrates once to the account (sessions, events, evidence with max-merge, compiler runs, generated courses) and the guest rows are retired. Compiler runs — the only surface that spends real model tokens on arbitrary input — require an account actor outright.

**Quotas.** 20 Maia turns and 2 compiler builds per owner per day, enforced in D1 by a single conditional upsert (`... DO UPDATE SET n=n+1 ... WHERE n < limit RETURNING`), so two concurrent requests cannot both take the last slot. Hosted-AI unavailability surfaces as explicit retryable codes (`LIVE_AI_DISABLED`, `LIVE_COMPILER_NOT_CONFIGURED`), not silent degradation.

Plus two small follow-ups: the PDF.js worker URL is resolved lazily so the Sites bundle doesn't pull it at module load, and a dependency security-patch pass (`package.json`/lockfile only).

## Verification

- `npm test` at this tip: **387 passed / 17 skipped** (up from 381 / 17 on `main`). The new `tests/sites-v2.test.ts` pins the persistence contract — every table, `owner_id`, `revision`, `lease_until` and the cascades are asserted against the committed migration SQL — plus quota enforcement to exhaustion and per-owner independence, session round-trips preserving the optimistic revision, upload expiry, and the retryable compiler codes.
- Lint clean at this tip.
- `npm run verify:sites` (bundle gate: server-bundle shape, no Node-only Codex imports) passes at the stack tip; at *this* tip it still trips over the dangling `build/sites-vite-plugin` import noted below.

## Known-open at this tip (both fixed later in this stack, in PR 4)

- `vite.config.ts` imports `./build/sites-vite-plugin`, which was never committed (`/build` is gitignored) — in a fresh clone the import dangles and typecheck reports it. PR 4 (`7a4a456`) proves nothing depended on it and removes it.
- CI Typecheck has been red on `main` since Build Week because the root tsconfig sweeps `video/` (whose deps CI never installs) into the app project. PR 4 (`dd47c0e`) excludes it. Until PR 4 lands, expect this PR's Typecheck check to be red for exactly these two known causes — see `docs/pr/EXECUTE.md`.

## No screenshots

Deliberately none: this PR is runtime and infrastructure. The visual work starts in PR 2, which carries the captures.
