# Museion

**An interactive learning platform with Maia — a Socratic AI tutor that never gives away the answer.**

Museion (the Mouseion of Alexandria, "seat of the Muses") pairs a millennia-old idea — the great house of knowledge — with a personal guide inside it: **Maia**, named after maieutics, the Socratic art of helping ideas be born rather than handing them over.

> The deterministic engine owns truth. The LLM owns pedagogy. Neither can do the other's job.

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
│                       Maia (LLM layer)                     │
│  Socratic coaching only. Receives: verified solution,      │
│  learner attempts, detected misconception, allowed help    │
│  level. Hard-forbidden from stating the final answer.      │
└──────────────────────────▲─────────────────────────────────┘
                           │ structured lesson-state snapshot
┌──────────────────────────┴─────────────────────────────────┐
│                  Deterministic engine (truth)              │
│  • Verifier — grades answers against authored specs        │
│  • Misconception matcher — names the specific wrong path   │
│  • Mastery model — per-concept EMA, discounts assisted     │
│    success                                                 │
│  • Fading policy — hint-ladder depth shrinks with mastery  │
│  • Session state machine — step-based progress + event log │
└──────────────────────────▲─────────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────────┐
│                  Content (authored ground truth)           │
│  Lessons as structured data: steps, answer specs, worked   │
│  solutions, misconception libraries, hint ladders          │
└────────────────────────────────────────────────────────────┘
```

The key inversion versus a chatbot wrapper: Maia doesn't start from an empty prompt box. Every turn she sees the exact lesson state — what the step asks, the author-verified solution (marked *do not reveal*), every attempt the learner made, which misconception their last mistake matches, and how much scaffolding the fading policy currently allows. The LLM cannot make a math error because it never does the math; it cannot become an answer machine because the answer is the one thing it is forbidden to say.

## Project layout

```
src/museion/
├── content/          # Ground truth: lesson schema, loader, bundled lessons (JSON)
├── engine/           # Deterministic core: verifier, mastery + fading, session
├── maia/             # LLM layer: guardrailed prompt builder, tutor client
├── api/              # FastAPI surface for a frontend
└── cli.py            # Interactive terminal demo
tests/                # Engine, prompt, and API tests (no network needed)
```

## Getting started

Requires Python 3.11+.

```bash
pip install -e ".[dev]"

# Live tutoring needs an Anthropic API key; everything else works without it.
cp .env.example .env   # then set ANTHROPIC_API_KEY

# Interactive demo in the terminal
museion

# Or run the HTTP API
uvicorn museion.api.app:app --reload
```

In the demo, type an answer, `hint` for the next rung of the hint ladder, or `ask <question>` to talk to Maia. Without an API key Maia falls back to the deterministic hint ladder, so the whole loop is testable offline.

```bash
pytest   # 27 tests, no network required
```

## Design notes

- **Hint ladder with contingent fading.** Each step ships an authored ladder (orienting question → conceptual hint → procedural hint). The depth a learner may descend is capped by their mastery of the step's concept: novices get the full ladder, proficient learners get one Socratic nudge and are then expected to push through. Maia's tone follows the same signal.
- **Misconception library.** Wrong answers are matched deterministically against known wrong paths (e.g. answering `2` to "what do we subtract from both sides of 2x + 6 = 14?" means the learner confused coefficient with constant). Maia is told *which* confusion to address, not left to guess.
- **Mastery discounts assisted success.** Solving on a later attempt or after hints moves mastery half as much as clean first-attempt success — performance with a crutch is weak evidence of learning.
- **Event log first.** Every answer, hint, and tutor turn is recorded, because the metric that validates Museion is delayed, unassisted transfer — not how many problems were solved with Maia present. See `TODO.md` for the retention-probe roadmap.
- **Prompt caching by construction.** Maia's persona (stable, cacheable) is separated from the per-turn lesson state (volatile), so the guardrails ride the prompt cache.

## Roadmap

See [`TODO.md`](TODO.md) for the full, prioritized list — highlights: interactive lesson blocks (the drag-the-tangent moat), persistence, retention probes for measuring delayed transfer, voice, and content authoring tools.

## License

[MIT](LICENSE)
