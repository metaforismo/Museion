# Product interface refinement

The signed-in home page gives the learner one next action, then their courses, review signals and sources. It uses real account names and the existing dashboard snapshot. No points, streaks or mastery claims are invented.

| Before | After | Why |
| --- | --- | --- |
| A method strip and engine terminology above the learner's courses | One clear next action with a short explanation | The learner can decide what to do without learning internal terminology |
| Several empty panels and six competing course suggestions | A meaningful personal-library empty state and three starter courses | Keeps the first visit focused and useful |
| Evidence limitations repeated in the main flow | Expandable progress explanation with the complete existing limitations | Keeps the boundary available without interrupting learning |
| Source-generated courses resumed the public `/judge` fixture | Only real compiler-backed courses appear, linking to their `/learn/[runId]` route | Removes dead hackathon entry points from recommendations |
| Course action visible only on hover | Course action always visible | Touch users and keyboard users get the same information |
| Five long welcome slides and demographic choices | One goal selection with native radio buttons and a short Maia introduction | Reduces onboarding friction and avoids unnecessary personal information |
| Browser-local tour status forcibly redirected every app entry | Signup enters `/welcome`; normal app navigation stays direct | Authentication and deep links have predictable destinations |
| The auth pages inherited dashboard navigation | Dedicated auth surface; protected welcome surface | The sign-in flow has appropriate chrome |
| Generic transitions on frequent sidebar actions | Brief color transitions, no decorative movement | Navigation responds immediately and honors Emil's frequency rule |
| Mobile navigation was an unlabeled overlay with limited focus return | Modal dialog semantics, focus trap, Escape support, background inertness and focus return | Keeps navigation usable with assistive technology and keyboards |

`product.module.css` scopes the dashboard surfaces and layout; shared course cards, buttons, progress rails and the Maia component are reused. No duplicate learning record or recommendation engine was added.

Validation: TypeScript and scoped ESLint passed. The dashboard, runtime-contract and path-selection suites passed. Authenticated desktop dashboard visual verification passed during the integration pass; desktop and mobile integration checks are recorded in product-qa.md.


The integration follow-up makes onboarding goals account-persistent with a saving/error state. SQLite snapshots explicitly report `local-durable`. Source creation and tutor settings explain the learning action instead of the retired replay vocabulary. The static hackathon review redirects to `/create`; reviews for real compiler runs remain available. Account export, reset and deletion have clear formats, consequences and reversible confirmation steps before destructive requests.


| Before | After | Why |
| --- | --- | --- |
| Public interactive landing example | Informational landing and account-gated lessons | Makes landing → auth → dashboard the single product flow |
| The simplified draft lost the original clouds and scroll scenes | Restored the original floating objects, clouds, rotating headline and sticky storytelling | Preserves the immersive direction requested by the user |
| Mixed old illustration palettes and an abstract Maia | Original pocket-notebook Maia with five expressions and coordinated course artwork | Gives the companion a recognizable identity across the product |
| Three complete catalogs on one library page | Course-first library with optional lesson search and prerequisite map | Reduces scrolling while preserving detailed exploration |
| 320px header overflow | Compact brand below360px | Keeps account actions within the viewport |
| Tiny input/body text | Shared14/16px body scale and16px auth inputs | Improves readability and avoids mobile input zoom |

The original content engine and answer boundaries remain the source of learning behavior. New artwork is presentation; it does not claim an animated voice tutor or a new adaptive intelligence model.

## Immersive landing restoration

The original cloud landing is the visual baseline. Its scroll scenes and material rail remain; the public interactive exercise is replaced by an informational illustration and account entry. The existing dashboard, authentication and SQLite work is preserved.

| Before | After | Why |
| --- | --- | --- |
| Subject and chapter phases used a fixed assumed scroll span | Phases use the actual stage and sticky-element heights, with the header offset | Forward and reverse scrolling reach the intended scene at different viewport sizes |
| Some content began hidden before the motion controller ran | Content is visible by default; only offscreen elements receive a one-time entrance | The page stays readable before hydration and without JavaScript |
| Reduced motion or a short viewport could leave chapters arranged outside the screen | Static mode stacks all three chapters and shows every reveal; preference changes apply immediately | Keeps the complete story accessible on short screens and with reduced motion |
| The rotating headline left a blank subject between words | Incoming and outgoing words crossfade continuously | Keeps the sentence complete throughout the animation |
| Inline charms collided with adjacent words | Smaller illustration bounds and explicit spacing | Preserves playful typography with readable text |
| Two subject illustrations remained pending in the checked browser state | Six existing illustrations delivered as compact transparent WebP files | All subject images load reliably without changing their original artwork |
| A tall sticky scene clipped the subject row on a 720px desktop viewport | Height-aware typography and spacing | Keeps the title and subject row together within the scene |
| The cloud finale used the previous mascot identity | Same cloud landscape with the notebook Maia | Gives landing, authentication and dashboard a consistent companion |

Applied Emil Design Skills to timing, transform/opacity transitions, visible fallbacks and reduced-motion behavior. Browser proof and current validation are recorded in product-qa.md.

## Authored curriculum follow-up

The catalog has 37 lessons: 32 belong to 10 authored courses, with five standalone foundations. These are real authored learning paths, with private deterministic answer specifications, registered misconception paths and practice banks. Completion is a record of performance on those exercises; it does not certify comprehensive school-curriculum coverage or retained mastery. Course duration remains an authored estimate rather than measured learner telemetry.

The focused pedagogical audit covered Algebra as Balance (15 guided items and 18 practice items), the three Probability as Evidence lessons, and the standalone fractions lesson. Algebra already progresses from equality, through inverse operations, to substitution checks and contextual modeling. Fractions now has five guided steps and four practice items, including a common-whole check and ribbon/walking transfer tasks. Equivalent correct fractions use the existing numeric checker instead of a short literal accepted-form list.

Probability practice questions now include their own full count scenario, because practice order is shuffled. The complement example uses an event whose probability differs from its complement. This lets the checker identify the actual event/complement confusion. The conditional-probability distractor and its diagnosis now use the same reference-group calculation.

A further mechanical audit across the catalog normalized 162 multiple-choice trigger arrays in 21 lesson files. Numeric aliases that did not name an option were converted to actual option text, and duplicate aliases were removed. Questions, correct choices, mathematical answers, misconception identities and the grading engine were preserved. A whole-catalog test verifies that each registered misconception fires when the learner submits its actual UI choice index, and that all authored lessons remain structurally valid.

Course-specific authored lessons retain their unique course trail when resumed from the dashboard. Practice resumes use `/lessons/[id]/practice` instead of leaking the internal `::practice` lesson identifier into a dead route. Standalone foundations remain standalone. Success feedback describes the next learning move without a score-like token or internal scaffolding terminology.

Validation: TypeScript and scoped ESLint passed. Eight content, curriculum, progression, practice and dashboard suites passed (106 tests), including a real five-step fractions completion, equivalent-answer acceptance, shuffled-question completeness and course/practice resume regressions.


Progress and review now use plain learner language. Adaptive support percentages no longer appear as progress scores; the genuine learning observations remain visible, with their complete limitations behind disclosure. Review timing has the same recorded-work logic, with its explanation available on demand. Global search uses lesson descriptions instead of internal concept identifiers. The obsolete `/judge` page source and public landing exercise component were removed; real generated learning uses `GeneratedCoursePlayer`.

## Shared lesson and companion direction

The user's nine supplied Koji frames (0:36–1:36 of the reference video) establish a composition and teaching sequence: a spacious activity, a compact companion conversation beside it, attention on the student's current work, and feedback after a real check. The frames are visual references, not application instructions. Museion keeps its own notebook Maia, blue/periwinkle palette, authored exercises and deterministic checks.

The companion can point at registered question, graph and code surfaces; it cannot operate answer fields or submission controls. An opening cue is conceptual and does not spend a hint or manufacture a conversation. A checked misconception can select an authored, leak-gated attention target. Practice does not receive proactive cues. New graph marks describe the learner's displayed curve; they do not draw hidden answer geometry.

The visual and interaction proof for this pass is recorded in [refinement-qa.md](refinement-qa.md). The reference sequence's voice conversation, freely generated intermediate exercises and arbitrary canvas drawing are not claims about the current implementation.
