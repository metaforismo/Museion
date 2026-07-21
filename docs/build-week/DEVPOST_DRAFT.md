# Museion Devpost Draft

Prepared against the live OpenAI Build Week requirements and announcements on 2026-07-21. Museion is a separate **Education** submission from IntentForm. The official rules allow one entrant to submit more than one project when the submissions are unique and substantially different.

## Deadline and required deliverables

- Deadline: 2026-07-22 00:00 UTC (July 21, 5:00 PM Pacific; July 22, 2:00 AM CEST).
- Working project built with Codex and GPT-5.6.
- Education category.
- Public YouTube demo under three minutes.
- Voiceover must explicitly cover what was built, how Codex was used, and how GPT-5.6 was used.
- Public repository with a relevant open-source license and a reproducible README, or a private repository shared with the two judging addresses.
- `/feedback` Session ID from the primary build task.
- Website and ZIP are not required.

## Devpost project fields

- **Name:** Museion
- **Tagline:** AI can solve the problem. Museion helps you learn to solve it.
- **Submitter type:** Individual (confirm before submission)
- **Country:** Italy (confirm before submission)
- **Category:** Education
- **Repository:** https://github.com/metaforismo/Museion
- **Testing path:** Open https://museion-beta.vercel.app/judge for the complete keyless replay. No account or API key is required. To run from source, clone the repository, run `npm ci`, copy `.env.example` to `.env.local`, start the app, and open `/judge`.
- **Video:** `[public YouTube URL required]`
- **/feedback Session ID:** `[provided privately for the Devpost field; do not commit the value]`
- **Built with:** Codex, GPT-5.6, Next.js, React, TypeScript, Zod, Playwright, Vitest, Tailwind CSS

## One-line description

Museion is a source-grounded learning environment where deterministic code owns truth and Maia guides reasoning without giving away the answer.

## Draft description

AI can make practice feel easy while quietly doing the thinking for the learner. Museion is built around the opposite contract: the source keeps a course grounded, deterministic code checks every learning move, and Maia asks the next useful question without owning the answer.

Learners move through seven visible stages: Ground, Predict, Interact, Diagnose, Explain, Transfer, and Revisit. They shape a function, trace recursion, reason from evidence, and commit to predictions before explanations appear. When a known misconception occurs, the environment highlights only the relevant on-screen element and Maia offers bounded Socratic guidance. During the final transfer task Maia, hints, and solution reveal are disabled. Museion records one immediate independent observation and states clearly what it does not prove.

Museion includes ten authored paths and 37 deterministic lessons across mathematics, physics, biology, computer science, and research methods. Creator Studio also accepts up to eight authorized materials as one Source Pack. Each material keeps its role and provenance; the server re-verifies document, material, rights, and complete-pack hashes before a generated course can reach publication review.

Codex was the primary engineering collaborator across product design, implementation, audits, tests, browser stress runs, and release integration. Museion also supports a server-only Codex device flow for local subscription-backed model access. GPT-5.6 is routed by responsibility: Luna extracts source structure, Terra designs courses and powers Maia, and Sol performs the publication critic and bounded typed repair. Model outputs cross strict schemas and deterministic gates; answer grading, source binding, leak detection, runtime transitions, and publication authority stay outside the model.

The repository includes a complete keyless judge path so reviewers can test the central experience without credentials. The checked replay is labelled honestly; arbitrary live compilation still requires an explicitly configured local provider.

## Current verification evidence

- 377 offline tests passed across 42 test files; 17 live-only cases remain explicitly skipped without opt-in.
- ESLint, strict TypeScript, the Next.js production build, and bundle budgets passed.
- Full Playwright flows passed across desktop and 320 px layouts, including axe/WCAG scans, keyboard flows, file-draft recovery, multi-material Creator Studio, and multi-tab concurrency.
- All 20 product screenshots were regenerated from the integrated production build.
- `npm audit` reports zero known vulnerabilities at the release lockfile.
- A bounded live lesson turn was delivered by the authenticated Codex runtime through GPT-5.6 Terra with no repair and no answer leakage; the hosted judge path remains keyless and deterministic.

## Claim boundary

Museion records performance on authored interactions and one immediate near-transfer observation. It does not claim durable mastery, far transfer, or a measured learning effect. The research motivates the product constraints; it is not evidence that Museion itself improves outcomes.

## Before submitting

- [ ] Francesco rewrites the description in his own natural voice; the organizers explicitly advise against submitting AI-assisted copy unchanged.
- [ ] Confirm Individual and Italy.
- [x] Receive the primary `/feedback` Session ID privately; paste it only into Devpost.
- [ ] Record, edit, and upload the public YouTube demo under three minutes.
- [ ] Verify the final YouTube URL and audio in a signed-out browser.
- [ ] Verify `main`, README setup, public repository visibility, and license from a clean browser.
- [ ] Add the best project thumbnail manually or through the Devpost upload flow.
- [ ] Submit Museion as a separate Education entry; do not modify the existing IntentForm submission.
