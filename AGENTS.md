# Museion engineering guide

This directory contains the Museion application. Use Node >=22.13; the local runtime depends on native `node:sqlite`. Start by inspecting the current branch, working tree, and relevant code. Preserve existing work. User instructions take precedence over this guide.

## Product boundaries

- Public entry is the immersive landing and information pages, followed by signup/login and a private learning workspace. Do not restore hackathon `/judge` access or an unauthenticated dashboard/demo.
- Public paths are declared in `src/lib/site/public-routes.ts` and used by the shell, proxy, and content index. Adding a protected feature must not expand that allowlist.
- Account, learning, source, compiler, and upload APIs require the learner session and ownership checks. Keep the same-origin guard on mutations.
- Local signup delivers an OTP to a private outbox. It does not send email or prove mailbox ownership. Do not claim external email delivery until a real transport is configured.

## Architecture and content

- Keep authored activity checks deterministic. Tutor output crosses the structured response, UI-target, and answer-leak gates; never let a model grade its own output or supply the final answer before the learner's attempt.
- The OpenRouter testing adapter uses `openrouter/free` only. Preserve explicit opt-in, price limits, bounded context/timeouts, and authored guidance fallback. Never introduce implicit paid-provider fallback.
- Do not expose model reasoning, private provider errors, credentials, OTPs, raw uploads, or unrelated learner data to the UI or logs.
- Prefer shared components and small domain modules. Keep source-based generated courses reviewable and distinct from authored Originals. Progress means observed activity, not certified mastery.
- SQLite migrations are additive and versioned. Preserve existing accounts, progress, and preferences. Keep QA databases/outboxes/uploads separate from personal data.
- This runtime assumes one Node instance and a persistent disk. Do not claim an ephemeral serverless or multi-instance deployment is verified without implementing and testing its persistence model.

## Design and validation

- Preserve the approved immersive landing direction: soft daylight, blue/periwinkle/mint, original Maia, clouds, and scroll-led discovery. Refine inconsistency rather than replacing the visual identity.
- Use transform/opacity for motion, short control transitions, hover only where supported, and complete reduced-motion/no-JavaScript fallbacks. Keep text readable throughout word changes.
- Test real UI flows with the Browser plugin: desktop, tablet, mobile, keyboard, reduced motion, sign-in boundaries, signup/verification/onboarding, dashboard, and lessons. Capture screenshots for review in `docs/assets/`.
- Record original image-generation prompts and source/runtime asset paths in `docs/brand/asset-manifest.md`. Keep shared character proportions consistent.

From this directory, run appropriate checks:

```sh
npm test -- --maxWorkers=2
npm run typecheck
npm run lint
npm run build
npm run verify:bundle
```

Stop a dev server before a production build to avoid `.next` contention. Live AI evaluation requires explicit opt-in and synthetic material. Clearly distinguish live acceptance, hint fallback, skipped checks, and unavailable features.

## Configuration and release

- `.env.local`, `data/`, private database/outbox files, and API keys stay ignored. Server credentials must never use `NEXT_PUBLIC_*` variables.
- Legal operator details are intentional placeholders until configured; do not invent a real company/contact or claim legal sign-off. Indexing stays off for local development.
- Complete authorized local work before asking for any final release approval. Do not commit, push, merge, deploy, or message others without user authorization.

## GitHub CLI authentication in Codex

- `~/.config/gh/hosts.yml` intentionally holds the CLI credential because sandboxed macOS commands cannot read Keychain credentials.
- Treat sandbox authentication/network failures as inconclusive. Prefer an installed GitHub connector; otherwise retry only the necessary `gh` command with scoped network escalation.
- Verify with scoped `gh auth status` / `gh api user` when needed. Do not run login, logout, or refresh unless the user requests an authentication change.
- Never print tokens, use `--show-token`, expose `gh auth token`, copy `hosts.yml`, or migrate the credential without explicit user approval.
