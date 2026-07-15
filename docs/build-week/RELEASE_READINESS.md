# Release Readiness

## Ready locally

- Keyless `/create/review` and `/judge` paths.
- Exact golden artifacts and regeneration scripts.
- Offline lint, typecheck, tests, and production build.
- 20/20 desktop judge runs plus 320 px verification.
- Zero-vulnerability npm audit at the recorded lockfile.
- Demo script, shot list, Devpost draft, eval report, build log, decision log, and change map.

## Product gaps that remain before the full promise is ready

- Arbitrary-source compilation is wired to a run/review/learn path, but has not completed a dated live provider run.
- Judge builds runtime snapshots and renders deterministic bounded interventions; live runtime-provider wiring remains.
- Compiler and Judge state have a Supabase-capable adapter; authored lesson/profile state remains process-local, and no live cold-start result exists.
- The golden replay is presentation-ready as a technical demo; the general upload-to-course product is not yet complete.

## Requires explicit authorization or external state

- Configure deployment and deploy the verified `main` tree.
- Apply `supabase/migrations/20260715130000_create_museion_state.sql` and configure server-only state variables.
- Verify the hosted route, headers, logs, cold start, and anonymous-cookie behavior.
- Optionally provide server-side credentials and run the eight live GPT-5.6 red-team fixtures; record model, usage, latency, cost, repair, refusal, and leak counts.
- Change deployment/repository access settings, publish Devpost content, or submit.

Do not convert skipped live tests into a pass and do not describe the local replay as a live compilation.
