# Compiler Truth Hardening

Date: 2026-07-15

Scope: P0 deterministic publication boundary for Source Graph and Course Artifact v2.

## Closed findings

| Finding | Deterministic gate |
| --- | --- |
| A warning can declare itself blocking without stopping compilation | `validateSourceGraph` emits `blocking_source_warning`; the orchestrator stops before Blueprint generation. |
| A source-grounded block can be uncited | Every source-grounded block must carry at least one citation resolved against the validated graph. |
| A source-grounded artifact can omit transfer | At least one registered `transfer-challenge` is required. Legacy-v1 adapters remain allowed to have no transfer. |
| Artifact source metadata is self-reported | Source id, document SHA-256, and canonical Source Graph SHA-256 are compared with the validated inputs. |
| The provider authors validation and provenance | The provider schema now returns `GeneratedCourseCandidate`; `validation` and `provenance` are added and finalized exclusively by the orchestrator. Provider-supplied extra fields fail strict parsing. |
| Reference validation can accept an invalid interaction | Prediction, sequence, range, and trace runtime validators run before critic acceptance and after the one allowed repair. |
| Duplicate sequence IDs can make a block unsolvable | The correct order must be an exact unique set match for the registered items. |
| A trace can stop without proving termination | State traces declare midpoint policy and terminal condition; validators check each midpoint, step, comparison, transition, and final proof. |
| A large-page-count PDF is rejected only after extraction | Page count is checked immediately after the PDF catalog loads, before any page is visited; parser and page cleanup run in `finally`. |

## Server-owned artifact envelope

The model/provider produces only the candidate learning content. The orchestrator attaches:

- validator version and final status;
- blocking and warning counts;
- validation timestamp;
- compiler and prompt-bundle versions;
- resolved model;
- deterministic source seed;
- content-addressed generation run id.

The critic remains an additional semantic review. It cannot override deterministic validator failures.

## Regression evidence

The offline suite includes explicit cases for:

- blocking source warnings;
- missing citations and transfer;
- all three provenance-binding mismatches;
- server-owned accepted validation/provenance;
- orchestrator rejection of a duplicate sequence order even when the critic reports acceptance;
- incomplete terminal trace;
- PDF page-limit rejection before `getPage` and guaranteed parser destruction.

## Remaining boundary

This hardening prevents invalid artifacts from publication, but it does not create the missing live Creator route. The current visible Creator still normalizes arbitrary sources and launches only the exact golden replay. Interactive Maia wiring, deployment-safe persistence, and live GPT-5.6 evaluation remain separate P0 workstreams.
