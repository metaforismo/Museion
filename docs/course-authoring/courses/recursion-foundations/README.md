# Recursion: Trust the Smaller Case

## Course contract

- **Learner band:** ages 14+; intro programming. Suitable for secondary learners, and equally for adults or university students taking a first data-structures-adjacent course. No specific programming language is assumed — all tracing is hand-done against pseudocode-style definitions.
- **Prerequisites:** can define and call a simple function with parameters; can use an `if`/`else` conditional to make a choice; can evaluate a whole-number arithmetic expression by hand (addition, multiplication).
- **Placement:** a three-lesson conceptual path into recursion within the Computer Science track. It is independent of `binary-numbers` and `search-by-halving`; either could reasonably follow it as a next enrichment step, but neither is required first.
- **Authorship:** Museion-authored and source-informed. It is not official CS50, MIT OpenCourseWare, or Runestone Academy curriculum, and no passage from any source is reproduced.

## Objectives

By the end of the sequence, a learner should be able to:

1. explain why every correct recursive definition needs a base case, and why every recursive call must make measurable progress toward it (not just have a base case present);
2. hand-trace a recursive function's return value and its stack depth, and identify precisely when computation happens — during the calls going down, or during the unwind coming back up;
3. diagnose an off-by-one error in a base case's returned value by re-running the same trace with the changed value;
4. apply the base-case-plus-progress pattern to a fresh recursive definition they have not seen before, predicting its output, identifying its correct base case among plausible distractors, and explaining why a flawed variant fails to terminate.

These are instructional objectives, not claims that completing the sequence proves durable mastery or general programming fluency.

## Concept and prerequisite graph

```text
functions + if/else + arithmetic by hand
                |
                v
   recursion needs a base case  --->  a base case alone is not enough:
                |                     every call must progress toward it
                v                            |
        counting calls to the base case <----+
                |
                v
     unwind order: work happens on the
     way back up, not on the way down
                |
                v
   trace a return value    trace maximum stack depth
                |                     |
                +----------+----------+
                           v
              off-by-one in a base case's
                   returned value
                           |
                           v
        transfer: identify the base case,
        predict the value, and diagnose
        non-termination in a NEW definition
```

## Sequence rationale

1. **Base Case and Progress** (`recursion-base-case`) separates two distinct failure modes that learners conflate: having no base case at all, and having a base case that is never reached because the recursive call does not move the input toward it. Learners diagnose both from broken `countdown` definitions, count how many calls `factorial(n)` makes down to its base case, and write the recursive case as an expression.
2. **Tracing the Call Stack** (`recursion-tracing`) makes the previously abstract idea of "a call happens" concrete: learners hand-trace `sumToN(n)` to a numeric result, count maximum stack depth, and pin down that combination (the `+` or `*`) happens during the unwind, not while calls are still descending. A final step changes only a base case's returned value and asks learners to re-trace the consequence — an off-by-one error isolated from everything else.
3. **Near Transfer: A New Recursive Definition** (`recursion-transfer`) hands learners `power(b, e)`, a definition with the same shape but a new domain (two parameters, only one of which changes). They pick the correct base case from plausible-looking distractors, predict a value, diagnose why a "same argument" non-termination bug (the lesson 1 pattern, transferred) breaks a new function, and finish by predicting a small doubling-growth recursion (`cells(n)`) in a fresh context.

The order deliberately separates three ideas that are usually taught tangled together: that a base case must exist, that reaching it requires progress, and that combination happens during the return path rather than the call path. Each idea gets its own diagnosed failure before the sequence asks learners to recognize the same pattern in unfamiliar code.

## Lesson inventory

| Lesson ID | Core steps | Practice items | Primary depth |
| --- | ---: | ---: | --- |
| `recursion-base-case` | 4 | 3 | base case existence, progress toward it, call counting, recurrence relation (expression answer) |
| `recursion-tracing` | 4 | 3 | unwind order, traced result, stack depth, off-by-one base case |
| `recursion-transfer` | 4 | 3 | base case identification, value prediction, termination diagnosis, near-transfer application |

Core steps carry a two-stage hint ladder (orienting question, then a conceptual or procedural nudge); hints never state the final answer. Practice items are retrieval-practice, served in random order, with their own short hint ladder.

## Source basis

Facts and pedagogical framing are informed by the following open, reputable sources. No passage, code sample, or figure is reproduced; all prompts, functions, numbers, and distractors are newly authored by Museion.

| Label | Publisher | Facts used |
| --- | --- | --- |
| NIST Dictionary of Algorithms and Data Structures — "recursion" | National Institute of Standards and Technology | Defines recursion as a technique where a function calls itself with part of the task, and states that every recursive solution has base case(s), where the problem is simple enough to solve directly, and recursive case(s) that reduce the problem and combine subresults. Basis for this course's "base case plus progress" framing. |
| Runestone Academy, *Problem Solving with Algorithms and Data Structures* (Miller & Ranum) — "The Three Laws of Recursion" | Runestone Interactive / Franklin Beedle & Associates (CC BY-NC-SA 4.0) | States the three laws: a recursive algorithm must have a base case, must change state and move toward that base case, and must call itself. Basis for distinguishing "no base case" from "no progress" as separate, independently diagnosable failure modes. |
| MIT OpenCourseWare 6.0001, *Introduction to Computer Science and Programming in Python* — "Recursion and Dictionaries" | Massachusetts Institute of Technology (CC BY-NC-SA) | Uses `factorial` as the canonical worked example of a base case (`n == 0` or `n == 1`) combined with a recursive case that multiplies by a smaller subproblem's result. Basis for using `factorial` and a `power`-style function as this course's worked and transfer examples. |

Access and permission status were reviewed on 2026-07-19. NIST states that works by U.S. government employees outside the Standard Reference Data program are generally not copyright-protected domestically; foreign copyright may still apply. The Runestone and MIT OpenCourseWare materials are used under their stated Creative Commons Attribution-NonCommercial-ShareAlike terms as sources of paraphrased facts and pedagogical structure, not as reproduced text. This course is not sponsored, reviewed, or endorsed by NIST, Runestone Interactive, or MIT.

## Misconception map

| Lesson | Misconception | Diagnostic evidence | Response focus |
| --- | --- | --- | --- |
| `recursion-base-case` | Assumes automatic stop | Believes recursion halts once values look "small," with no explicit check. | A call only stops where code tests a condition and chooses not to recurse. |
| `recursion-base-case` | Single-call-only | Treats a recursive call as if it never actually executes again. | Every call runs its full body, including its own recursive call. |
| `recursion-base-case` | Assumes implicit halt | Believes the function runs out of valid input and stops on its own. | Nothing halts calls at zero or negative values unless the code checks for it. |
| `recursion-base-case` | Reorders base case | Blames the base case's position in the code rather than the unchanged argument. | Where the check sits matters for timing; the defect here is an argument that never changes. |
| `recursion-base-case` | Blames unrelated statement | Attributes non-termination to `print` rather than to the recursive call's argument. | Only the value passed to the recursive call affects termination. |
| `recursion-base-case` | Wants two base cases | Assumes the fix is more stopping conditions rather than a changed argument. | One correct base case suffices if every call strictly progresses toward it. |
| `recursion-base-case` | Excludes the base-case call | Omits the call that hits the base case when counting total calls. | The base-case call still counts; it just doesn't recurse further. |
| `recursion-base-case` | Reports the computed value instead of a count | Answers with the function's result (for example 24) instead of a call count. | Separate "how many calls" from "what value is returned." |
| `recursion-base-case` | Drops the multiplier in a recurrence | Returns `factorial(n - 1)` unchanged, without combining it with `n`. | The recursive case must combine the subproblem's result with the current input. |
| `recursion-base-case` | No progress in a written recurrence | Writes a recursive call with the same argument (`n`, not `n - 1`). | The recursive call's argument must strictly decrease toward the base case. |
| `recursion-base-case` | Assumes wraparound termination | Believes an ever-growing argument eventually cycles back to the base value. | Ordinary numbers do not wrap around; progress must be explicit. |
| `recursion-tracing` | Adds/combines on the way down | Believes the combining operation executes before the recursive call returns. | A pending operation needs both operands; it must wait for the recursive call's return. |
| `recursion-tracing` | Single final combination | Believes only the outermost call performs the combining operation. | Every call with a non-base argument performs its own combination once its call returns. |
| `recursion-tracing` | Precomputed batch | Imagines all combinations happening together before any call runs. | Each call must obtain its smaller result first; nothing is computed in advance. |
| `recursion-tracing` | Multiplies instead of adding (or vice versa) | Applies the wrong operator from a different, superficially similar function. | Reread the actual recursive case being traced. |
| `recursion-tracing` | Drops the top-level term | Traces as if the call one level in were the one requested. | The requested call's own value must appear in its own result. |
| `recursion-tracing` | Excludes the base frame from depth | Omits the base-case frame when counting open stack frames. | The base-case frame is open until it returns; include it. |
| `recursion-tracing` | Confuses depth with result | Reports the computed value instead of a frame count. | Stack depth counts open calls, not their eventual return value. |
| `recursion-tracing` | Ignores a changed base-case value | Re-traces the original (unmodified) version, missing that the base case's return value changed. | Substitute the actual, modified base-case value into the unwind. |
| `recursion-tracing` | Assumes total breakage from one changed value | Assumes a wrong base case invalidates the entire trace. | Only the base case's own contribution changes; retrace with that one substitution. |
| `recursion-transfer` | Wrong identity value in a new base case | Picks a base case returning 0 instead of the multiplicative identity 1. | Any number to the power 0 is 1; the base case must preserve later multiplications. |
| `recursion-transfer` | Off-by-one base case in a new definition | Sets the base case one step later than the smallest value actually reached. | Check the base case against the smallest value the recursive calls actually produce. |
| `recursion-transfer` | Tests the wrong variable in a new base case | Bases the check on the argument that never changes instead of the one that does. | The base case must test the variable the recursive calls actually modify. |
| `recursion-transfer` | Multiplies/adds parameters directly | Computes `b * e` or a similarly collapsed shortcut instead of tracing repeated multiplication. | Unwind the actual chain of recursive multiplications. |
| `recursion-transfer` | Swaps base and exponent | Computes the reversed expression (exponent raised to base). | Keep the fixed factor and the decreasing count straight. |
| `recursion-transfer` | Blames a missing base case that is present | Claims no base case exists in a definition that has a correct one. | Confirm the base case first; look upstream in the recursive call for the real defect. |
| `recursion-transfer` | Blames the wrong operator or variable for non-termination | Attributes non-termination to multiplication, or to a variable that is actually unchanged. | Identify exactly which variable the recursive call fails to move toward its base case. |
| `recursion-transfer` | Off-by-one generation in a transferred context | Reports one fewer step of a doubling-style recursion than requested. | Recount generations from the base case up through the requested value. |

## Accessibility notes

- All code is presented as short, plain-language pseudocode in the prompt text, not as an image; nothing depends on syntax highlighting or color.
- Function bodies are shown with explicit indentation described in words where relevant, and every branch (`if`/`else`) is spelled out rather than implied.
- Numbers are kept small (factorial up to 5, powers up to the low hundreds) so tracing stays within comfortable working memory and mental arithmetic.
- Hints orient before they instruct, and never state the final numeric or expression answer.
- No item depends on timed response, drag-and-drop, or fine pointer control. Multiple-choice options are full sentences, not bare letters, so they read sensibly with a screen reader.

## Evidence boundary

Completion of this sequence records performance on the authored trace-and-predict items in these three lessons, plus one immediate near-transfer response on a fresh recursive definition (`power`/`cells`) the learner has not seen traced before. It does **not** establish durable mastery, retention beyond the session, general programming ability, or that a learner can write original recursive code unaided. "Near transfer" here means a structurally similar definition encountered once, immediately after instruction — not independent transfer to an unrelated problem, and not evidence of any lasting learning gain.
