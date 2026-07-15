# Evals

## Current measured baseline

On 2026-07-15 after compiler truth hardening and session protocol v2, the offline Vitest suite passed 137 tests in 22 files. Eight live GPT-5.6 red-team cases were skipped because no API key was configured. Lint, TypeScript, the offline production build, dependency audit, and Chrome verification passed. The complete judge journey passed in 20 independent desktop contexts and once at 320 px, including refresh persistence, clean console/page/5xx monitoring, and overflow checks. Coverage includes the real six-page PDF, early page-limit rejection, exact Source Graph replay, blocking source warnings, source/hash binding, server-owned validation/provenance, citation and transfer gates, compiler timeout and one-repair behavior, runtime validator execution, terminal trace proof, duplicate-order rejection, public/private truth stripping, explicit post-solve advance, stale-command rejection, mutation idempotency, stale Maia-turn rejection, four deterministic reducers, replay hashes, runtime tutor targets, transfer lock, owner isolation, one-attempt scoring, and evidence reconciliation. This is engineering evidence, not evidence of learning outcomes or live GPT-5.6 behavior.

## Required release suites

1. Deterministic source normalization, page/span hashes, exact slice round-trips, limits, and malformed/textless input.
2. Strict Source Graph, Course Artifact, public/private serialization, reference integrity, unknown-block rejection, and v1 compatibility.
3. Reducer state closure, reachability, bounded termination, correct/incorrect traces, target validation, and replay hashes.
4. Tutor schema/refusal/error handling, answer-leak gate, one repair maximum, invalid actions, prompt injection, and deterministic fallback.
5. Locked transfer scoring, assistance invariants, evidence/event reconciliation, and precise evidence copy.
6. Playwright judge path on desktop and narrow mobile, including live/replay labels, reset, refresh, missing key, console, and network failures.

## Release thresholds for the golden slice

- 100% schema, citation, hash, answer, runtime, transfer-lock, and replay checks.
- Zero tutor text delivered when the gate marks it unsafe.
- Zero illegal UI actions applied.
- 100% deterministic fallback availability.
- 20/20 clean-browser judge-path runs before recording the final demo.

## Live-model report requirements

Record date, requested and resolved model, prompt/schema versions, fixture denominator, refusals, malformed outputs, repair count, delivered leaks, invalid actions, latency distribution, token usage, and cost. Do not label a skipped suite as a passing live eval.

## Claims boundary

The Build Week demo may show a learner applying a binary-search invariant to one new case without hints or Maia. It may not claim durable mastery, far transfer, universal learning gains, or efficacy without an appropriate study.
