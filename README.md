# Museion

Museion is a personal learning workspace. Maia helps learners reason through a problem with questions and hints; the learner makes the move and the lesson checks it.

The local product starts at the landing page, continues through registration or login, and opens a private dashboard. Public hackathon access through `/judge` and `/api/judge` is retired. The landing explains the product and presents the catalog; it does not run a public lesson.

## Run locally

Requires **Node.js 22.13 or newer** with native `node:sqlite` support.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). Registration asks for name/email, then password, then a verification code. This local build delivers the code to a private outbox file; it does not send email or establish mailbox ownership. After verification, the full-screen onboarding saves interests, familiarity, and a daily pace before recommending an authored course. For a production build on your own machine:

```bash
npm run build
npm run start
```

Production cookies require HTTPS. Only for a local production build served over plain HTTP, set `MUSEION_COOKIE_SECURE=0`; keep secure cookies enabled on a public HTTPS installation.

## Local verification delivery

Run `npm run auth:outbox` to list message references and expiry times without displaying codes. On the verification screen, expand **Local message reference**, then run `npm run auth:outbox -- --open <challenge-id>` to open the private message locally. Enter its six-digit code in Museion. Codes expire after ten minutes; retry and resend limits apply. Delivery files use directory mode 0700/file mode 0600 and files older than 24 hours are pruned on the next delivery.

SQLite schema migrations are additive; existing accounts and preferences are preserved. A pending signup does not create an account or session until its code is accepted. Connect a real implementation of `AuthDeliveryTransport` before external registration; the local outbox is a development delivery method.

## Product

- Landing with original artwork, clear account entry, course previews and accessible motion.
- Registration, login and logout with hashed passwords and private account sessions.
- Personal dashboard with one next action, unfinished work, real progress, reviews and personal sources.
- Ten authored Museion Originals across mathematics, computing, physics, biology and research methods, plus foundational lessons. Course pages explain audience, prerequisites and learning outcomes. Content and authoring notes live in [`docs/course-authoring`](docs/course-authoring/README.md).
- Interactive lessons, misconception-specific feedback, hint ladders, graph and recursion labs, and independent practice. Progress is evidence from recorded attempts; completion is not a claim of durable mastery.
- Source-based course creation, review and personal course playback. An arbitrary source requires an explicitly configured live AI provider and must pass publication checks. The offline sample source is an authenticated authoring fixture, not an unauthenticated product entry.
- Account preferences, data export, learning-record reset and account deletion.

## Local data and portability

The Next.js **Node runtime** uses SQLite and local files by default. It creates the database and applies schema migrations automatically.

| Configuration | Default | Stores |
| --- | --- | --- |
| `MUSEION_DATABASE_PATH` | `./data/museion.sqlite` | Accounts, hashed sessions, learning sessions, attempts, evidence, progress, preferences, quotas and saved courses |
| `MUSEION_UPLOADS_PATH` | `./data/uploads` | Uploaded source files and generated course artifacts |
| `MUSEION_AUTH_OUTBOX_PATH` | `./data/auth-outbox` | Private local verification messages |

The `data/` directory is excluded from Git. Use an absolute path on a persistent disk when hosting the Node app. Back up **both** the database and upload directory; with the server stopped, copying these paths gives a consistent snapshot. If backing up a running SQLite database, use SQLite's online backup mechanism rather than copying only its main file while WAL writes are in progress.

Account sessions expire after 30 days and can be revoked by signing out. Saved progress, evidence and course artifacts survive a server restart. Temporary compiler jobs may expire; published personal courses remain available from their saved artifacts. Tests run with separate test databases and do not need personal data.

This is a single Node instance with a persistent filesystem. A future deployment must provide HTTPS, writable persistent storage, backups and suitable operating controls. Ephemeral serverless disks and multiple app instances with independent local databases are not equivalent deployments. Legacy Sites/Cloudflare scripts remain historical integration paths; the new native SQLite runtime is not verified there.

## Maia and optional AI

By default, live AI is disabled. Maia uses the lesson's authored guidance and verified hint ladder; authored courses and local account flows work without a paid API call.

Optional provider configuration is documented in `.env.example`, [`docs/CODEX_USAGE.md`](docs/CODEX_USAGE.md) and [`docs/MCP_COURSE_ARCHITECT.md`](docs/MCP_COURSE_ARCHITECT.md). Enabling a provider is explicit. Museion does not silently switch from plan usage to API billing. The public MCP endpoint is disabled by default.

Correctness belongs to the lesson verifier. Model replies cross schema, UI-target and answer-leak gates with a bounded repair and a safe fallback. These reduce risk; they are not a proof that every possible model response is safe or pedagogically correct.

The interface currently uses English. Continuous voice tutoring, external email delivery and password recovery are not implemented. No public deployment or educational efficacy claim is established by the local checks.

## Free tutor testing

For the requested OpenRouter testing mode, set these values in the ignored `.env.local`:

```dotenv
MUSEION_AI_PROVIDER=openrouter-free
MUSEION_LIVE_AI_ENABLED=1
OPENROUTER_API_KEY=your-private-key
```

The adapter uses only `openrouter/free`, requests zero-priced providers, excludes returned reasoning, and validates the structured completion before delivery. There is no paid model fallback. If a compatible free endpoint is unavailable, lessons use their authored hints. Source-course compilation uses the same free-only transport when this connection is explicitly selected. Structured stages, exact source citations, deterministic validators, critic review and creator review still gate launch; provider unavailability fails closed without publishing a partial course. Generated courses open the same lesson workspace and Maia session APIs as Originals. Their answer specifications are source-based generated content, not independently authored truth.

Run the synthetic opt-in evaluation with:

```bash
MUSEION_RUN_OPENROUTER_LIVE_EVAL=1 node --env-file=.env.local node_modules/vitest/vitest.mjs run tests/openrouter.live.test.ts
```

This test reports actual accepted live replies separately from authored-hint fallback. Keep the API key server-side; never put it in a `NEXT_PUBLIC_*` variable, screenshots, logs, or committed files. See the [official free-router documentation](https://openrouter.ai/docs/guides/routing/routers/free-router).

## Public information and indexing

Shared information pages cover the method, Help, Accessibility, Privacy Policy, and Terms of Service. The legal drafts deliberately use example operator details until `MUSEION_OPERATOR_NAME`, `MUSEION_OPERATOR_COUNTRY`, and `MUSEION_OPERATOR_EMAIL` are supplied; review the drafts against the actual deployment before publication.

`robots.txt` disallows crawling and the sitemap stays empty by default. For a public HTTPS origin, configure `NEXT_PUBLIC_SITE_URL` and explicitly set `MUSEION_PUBLIC_INDEXING=1`, then rebuild. Auth and personal routes remain excluded and protected by authentication. `llms.txt` is a public information index following an open proposal, not an access-control mechanism. Repository instructions are in `AGENTS.md` and are not served to visitors.

## Verification

```bash
npm test -- --maxWorkers=2
npm run typecheck
npm run lint
npm run build
```

The suite includes lesson validation, tutoring boundaries, compiler publication gates, dashboard recommendations, account isolation, session expiry/revocation, durable preferences, SQLite reopen, and saved-course persistence. Live-provider tests require explicit opt-in.

Current browser evidence and responsive checks are recorded in [`docs/product-qa.md`](docs/product-qa.md). The historical `verify:ui` and screenshot scripts predate the authenticated flow and are not the acceptance gate for this revision.

Design decisions and the Before/After/Why review are in [`docs/design-product.md`](docs/design-product.md). Original imagery and reusable briefs are recorded in [`docs/brand/asset-manifest.md`](docs/brand/asset-manifest.md).
