# Search by Halving — private evaluator notes

This file is evaluator truth, not learner-visible course copy. Do not include it in public DTOs, prompts shown before a locked response, hints, or solution-reveal paths.

## Final near-transfer answer

Expected midpoint sequence: `4, 6, 5`.

Expected final earliest index: `5`.

Author verification:

1. `[low, high] = [0, 8]`; `mid = 4`; year `1948 < 1950`, so `[low, high] = [5, 8]`.
2. `mid = 6`; year `1984 >= 1950`, so record candidate `6` and update `[low, high] = [5, 5]`.
3. `mid = 5`; year `1961 >= 1950`, so replace the candidate with `5` and update `[low, high] = [5, 4]`.
4. Bounds crossed. Index `5` is the earliest qualifying section; index `4` does not qualify, which verifies minimality.

Accept only a response that contains both the midpoint sequence in order and final index 5. Punctuation and surrounding explanatory prose may vary, but the ordered integers may not. A correct final index with an incorrect or missing trace is incomplete. A second attempt after any correctness feedback is not unassisted first-attempt evidence.

Common diagnostic traces:

- `4, 6` with final index `6`: stops at the first qualifying year instead of continuing left for the earliest qualifying index.
- `4, 5` with final index `5`: updates `high` incorrectly after the first comparison and reaches the answer through an invalid interval.
- `4, 6, 5` with final index `4`: confuses the last rejected index with the best qualifying candidate.

Even a fully correct locked response supports only: “The learner answered one immediate near-transfer item correctly without assistance.” It does not support durable mastery, far transfer, retention, or a causal learning claim.
