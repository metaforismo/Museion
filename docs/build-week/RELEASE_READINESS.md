# Release Readiness

## Ready locally

- Keyless `/create/review` and `/judge` paths.
- Exact golden artifacts and regeneration scripts.
- Offline lint, typecheck, tests, and production build.
- 20/20 desktop judge runs plus 320 px verification.
- Zero-vulnerability npm audit at the recorded lockfile.
- Demo script, shot list, Devpost draft, eval report, build log, decision log, and change map.

## Product gaps that remain before the full promise is ready

- Creator normalization is visible, but arbitrary-source compilation is not wired to a course run/review/learn path.
- Runtime Maia contracts are implemented, but the Judge does not yet build snapshots or render bounded interventions.
- Session and Judge state is process-local and is not safe across serverless cold starts or multiple instances.
- The golden replay is presentation-ready as a technical demo; the general upload-to-course product is not yet complete.

## Requires explicit authorization or external state

- Configure deployment and deploy the verified `main` tree.
- Verify the hosted route, headers, logs, cold start, and anonymous-cookie behavior.
- Optionally provide server-side credentials and run the eight live GPT-5.6 red-team fixtures; record model, usage, latency, cost, repair, refusal, and leak counts.
- Change deployment/repository access settings, publish Devpost content, or submit.

Do not convert skipped live tests into a pass and do not describe the local replay as a live compilation.
