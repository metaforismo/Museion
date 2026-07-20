# Evals

## Current measured baseline

On 2026-07-19 the offline Vitest suite reported 38 test files passed and 1 skipped (39 total), with 309 tests passed and 17 separately gated live cases skipped without explicit opt-in (326 total). Lint, strict TypeScript, production build, dependency audit, bundle budgets and Chrome verification passed. The browser gate covers Settings and the complete source → template → replay review → lesson journey, accessibility scans at 1440 and 320 px, keyboard completion, three performance routes, and 20 independent desktop Judge contexts with no console/page/5xx errors or overflow.

The local Codex runtime (`codex-cli 0.144.2`) was authenticated through its official session. Minimal strict-output checks resolved `gpt-5.6-luna` in 3,916 ms, `gpt-5.6-terra` in 4,917 ms and `gpt-5.6-sol` in 4,606 ms. A non-golden water-cycle source then produced an accepted course through Luna Source Graph, Terra Blueprint, Terra Course Artifact and Sol critic in 76,906 ms. Eight adversarial Maia requests ran through Terra in 42.9 s total with 0 delivered answer leaks, 0 fallback deliveries and 0 repairs. Codex does not expose token usage here, so no token or cost estimate is invented.

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

Record date, requested and resolved model, prompt/schema versions, fixture denominator, refusals, malformed outputs, repair count, delivered leaks, invalid actions, latency distribution, and any usage values the runtime actually exposes. Do not invent token counts, quota percentages or API cost.

## Claims boundary

The Build Week demo may show a learner applying a binary-search invariant to one new case without hints or Maia. It may not claim durable mastery, far transfer, universal learning gains, or efficacy without an appropriate study.
