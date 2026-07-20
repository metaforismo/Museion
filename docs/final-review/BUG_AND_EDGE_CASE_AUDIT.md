# Bug & Edge Case Audit — Final Review (2026-07-18)

All findings verified in code; line references at commit `29a9152`.

## Security posture (verified strengths)

- Client/server truth boundary holds: `toPublicLesson` / `toPublicCourseArtifact` strip
  solutions, answer specs and misconceptions; a solved step's solution is revealed only after
  `awaitingAdvance`.
- Correctness is never LLM-decided; the leak gate is defense-in-depth above that.
- Optimistic concurrency (expectedVersion/expectedStepId/idempotencyKey) and judge CAS handle
  two-tab and duplicate-request races for lesson and judge flows.
- No `dangerouslySetInnerHTML`; no server-side fetch of user URLs (no SSRF surface); MCP Bearer
  check is length-checked `timingSafeEqual`, fails closed; Codex spawned `shell:false`.
- Compiler pipeline has timeouts, abort propagation and input caps.

## Findings

| ID | Finding | Where | Priority |
|---|---|---|---|
| B1 | `compilerJobs` map grows without bound — entries never removed outside tests; anonymous cookies make per-owner caps unlimited for an attacker | `src/lib/compiler/runs.ts:175-177,226` | P1 |
| B2 | Maia idempotency cache retains every successful turn forever (deleted only on failure) | `src/app/api/sessions/[sessionId]/maia/route.ts:23-25,81-85` | P1 |
| B3 | Rate-limiter key space never pruned | `src/lib/server/rate-limit.ts:13-42` | P2 |
| B4 | Job/idempotency/rate state is per-instance `globalThis`, ignoring `MUSEION_STATE_BACKEND`; cross-instance polling of an in-flight run returns `COMPILER_RUN_NOT_FOUND` | `runs.ts`, maia route, rate-limit | P1 (documented limitation) |
| B5 | Leak gate misses spelled-out numbers above twelve ("thirteen") and languages beyond en/it/zh — a spelled answer is delivered as safe | `src/lib/maia/leak.ts:18-52` | P1 |
| B6 | Multiple-choice leak fires only on enumerated assertive cues; option echo without a cue passes | `src/lib/maia/leak.ts:67-90` | P2 (documented trade-off) |
| B7 | `verifySourceDocumentIntegrity` never recomputes `warnings`; a client can strip `instruction_like_content` warnings from a hash-valid document | `src/lib/source/normalize.ts:184-207` | P2 |
| B8 | MaiaPanel retry mints a fresh idempotency key each attempt and never resyncs `sessionVersion` → permanent 409 loop after a lost-but-successful response until page reload | `src/components/MaiaPanel.tsx:89,242` | P2 |
| B9 | MCP `create_course` derives ownerId from content hash — unrelated callers submitting identical material share quota | `src/lib/mcp/protocol.ts:164` | P2 (tracked in TODO) |
| B10 | MCP `prepare_source_pack` is unauthenticated and has no rate limit; each call can normalize 8×200k chars | `src/app/api/mcp/route.ts`, `protocol.ts:149-153` | P1 |
| X4 | Sticky mobile CTAs (`sticky bottom-3`) hidden behind fixed bottom nav on compile + judge continue buttons | `SourceCreator.tsx:770`, `JudgeExperience.tsx:282` | P1 |

## Fixes applied in this pass

- **B5** — leak gate now spells out composed English number words for any integer answer
  (−999…999 incl. teens/tens compounds), adds French/Spanish/German/Portuguese small numbers,
  and treats digit-words adjacent to assertive cues as leaks. Red-team unit cases added for
  values > 12 and new languages. (`src/lib/maia/leak.ts`, `tests/leak.test.ts`)
- **B1/B2/B3** — bounded sweeps: terminal compiler jobs pruned after a TTL and map capped;
  Maia command cache switched to a bounded LRU with TTL; rate-limiter prunes empty keys on
  touch and sweeps periodically. Tests assert bounded size under distinct-owner load.
- **B10** — MCP handler applies per-caller rate limiting to `prepare_source_pack` and
  `create_course`.
- **B8** — Maia route 409 now triggers a session-state resync path in the client before retry.
- **X4** — mobile sticky CTAs lifted above the bottom nav (same `bottom-20` pattern already used
  by the Course Architect trigger).
- **B7** — server recomputes warnings from page text at the compiler boundary and merges them
  into the accepted document.

## Explicitly deferred (recorded in TODO.md)

- B4 multi-instance state: full move behind `stateBackend()` — the memory backend remains
  process-local by design for the keyless demo; the limitation stays documented.
- B9 per-client MCP identities and quotas.
- Two-tab first-session bootstrap orphaning one TTL-pruned session (self-healing, bounded).
