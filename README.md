# Museion

**An interactive learning platform with Maia — a Socratic AI tutor that never gives away the answer.**

Museion (the Mouseion of Alexandria, "seat of the Muses") pairs a millennia-old idea — the great house of knowledge — with a personal guide inside it: **Maia**, named after maieutics, the Socratic art of helping ideas be born rather than handing them over.

> The deterministic engine owns truth. The LLM owns pedagogy. Neither can do the other's job.

Built with Next.js (App Router), React, Tailwind, and the Anthropic API.

## Why

Generic LLM chatbots harm learning not by being wrong, but by being right **too early**: they hand over answers and skip the cognitive work that produces learning. A field experiment with ~1,000 high-school students (Bastani et al., *PNAS* 2025) found that unrestricted GPT access boosted in-session performance by 48% — and **lowered** unassisted exam scores by 17%. The "crutch effect" is real. A guardrailed tutor that gives hints instead of answers eliminated that harm.

Museion is built around that finding, plus the rest of the learning-science stack:

| Design principle | Evidence |
|---|---|
| Tutor must not reveal answers; it scaffolds reasoning | Bastani et al. 2025 (crutch effect); Kestin et al. 2025 (well-designed AI tutor ≈ 2× learning gains vs. active classroom) |
| Step-based tutoring, not answer-based | VanLehn 2011: step-granularity ITS reach *d* = 0.76, close to human tutors (*d* = 0.79); answer-based systems lag far behind |
| Help must fade as mastery grows | Scaffolding & fading (Wood, Bruner & Ross 1976); expertise reversal effect (Kalyuga & Sweller): guidance that helps novices hurts experts |
| Some help is necessary — pure discovery fails | Kirschner, Sweller & Clark 2006; the "assistance dilemma" (Koedinger & Aleven 2007): the question is *how much help, when* |
| Measure learning, not performance | Soderstrom & Bjork: in-session success with help is performance; what counts is delayed, unassisted transfer |

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Browser (lesson player + Maia panel)                      │
│  Sees prompts and options only — answers, solutions and    │
│  hints NEVER leave the server.                             │
└──────────────────────────▲─────────────────────────────────┘
                           │ Next.js API routes
┌──────────────────────────┴─────────────────────────────────┐
│  Maia (LLM layer, server-only)        src/lib/maia         │
│  Socratic coaching only. Receives: verified solution,      │
│  learner attempts, detected misconception, allowed help    │
│  level. Hard-forbidden from stating the final answer.      │
│  Streams replies token-by-token.                           │
└──────────────────────────▲─────────────────────────────────┘
                           │ structured lesson-state snapshot
┌──────────────────────────┴─────────────────────────────────┐
│  Deterministic engine (truth)         src/lib/engine       │
│  • Verifier — grades answers against authored specs        │
│  • Misconception matcher — names the specific wrong path   │
│  • Mastery model — per-concept EMA, discounts assisted     │
│    success                                                 │
│  • Fading policy — hint-ladder depth shrinks with mastery  │
│  • Session state machine — step-based progress + event log │
└──────────────────────────▲─────────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────────┐
│  Content (authored ground truth)      src/lib/content      │
│  Lessons as type-checked TypeScript data: steps, answer    │
│  specs, worked solutions, misconception libraries, hint    │
│  ladders                                                   │
└────────────────────────────────────────────────────────────┘
```

The key inversion versus a chatbot wrapper: Maia doesn't start from an empty prompt box. Every turn she sees the exact lesson state — what the step asks, the author-verified solution (marked *do not reveal*), every attempt the learner made, which misconception their last mistake matches, and how much scaffolding the fading policy currently allows. The LLM cannot make a math error because it never does the math; it cannot become an answer machine because the answer is the one thing it is forbidden to say.

## Getting started

Requires Node.js 20+.

```bash
npm install

# Live tutoring needs an Anthropic API key; everything else works without it.
cp .env.example .env.local   # then set ANTHROPIC_API_KEY

npm run dev                  # http://localhost:3000
```

Pick a lesson, answer step by step. Take rungs of the hint ladder, or talk to Maia in the side panel — she sees the step you're on, what you tried, and which misconception you hit. Without an API key Maia falls back to the deterministic hint ladder, so the whole loop works offline.

```bash
npm test        # engine + prompt tests (vitest, no network)
npm run build   # production build
```

## Project layout

```
src/
├── app/                  # Pages: catalog, lesson player, practice, about, welcome
│   └── api/sessions/     # create+resume / answer / hint / maia (streaming)
├── components/           # LessonPlayer, MaiaPanel, OnboardingTour (client)
└── lib/
    ├── api-types.ts      # Wire contracts shared by routes and components
    ├── client/           # Browser-only helpers (storage keys, onboarding flag)
    ├── content/          # Ground truth: types, validation, lessons as checked TS data
    ├── engine/           # Deterministic core: verifier, mastery, session, practice
    ├── maia/             # LLM layer: guardrailed prompt builder, tutor
    └── store.ts          # In-memory session store (persistence on roadmap)
tests/                    # Vitest suite: engine, content validation, prompt, sanitization
```

## Design notes

- **The browser never sees the truth.** Lesson pages ship a sanitized lesson (prompts and options only). Verification, hints, misconceptions, and solutions live server-side — there is a test asserting no ground truth survives serialization to the client.
- **Hint ladder with contingent fading.** Each step ships an authored ladder (orienting question → conceptual hint → procedural hint). The depth a learner may descend is capped by their mastery of the step's concept: novices get the full ladder, proficient learners get one Socratic nudge. Maia's tone follows the same signal.
- **Misconception library.** Wrong answers are matched deterministically against known wrong paths (e.g. answering `2` to "what do we subtract from both sides of 2x + 6 = 14?" means the learner confused coefficient with constant). Maia is told *which* confusion to address, not left to guess.
- **Mastery discounts assisted success.** Solving on a later attempt or after hints moves mastery half as much as clean first-attempt success — performance with a crutch is weak evidence of learning.
- **Event log first.** Every answer, hint, and tutor turn is recorded, because the metric that validates Museion is delayed, unassisted transfer — not how many problems were solved with Maia present.
- **Prompt caching by construction.** Maia's persona (stable, cacheable) is separated from the per-turn lesson state (volatile), so the guardrails ride the prompt cache.
- **Practice mode is unassisted on purpose.** Each lesson can ship an exercise bank served shuffled with no hint ladder — retrieval practice (the testing effect) is what turns in-session performance into durable learning. Maia stays available, still under the guardrail.
- **The name is the thesis.** `/about` tells the story: the Mouseion of Alexandria as the house of knowledge, and Maia — from maieutics, Socrates' midwifery of ideas — as the guide who asks instead of telling. First-time visitors get a short onboarding tour that sets the same expectation: she will never give you the answer.

## Roadmap

See [`TODO.md`](TODO.md) — highlights: persistence and accounts, interactive lesson widgets (the drag-the-tangent moat), retention probes for measuring delayed transfer, Maia red-teaming, voice.

## License

[MIT](LICENSE)
