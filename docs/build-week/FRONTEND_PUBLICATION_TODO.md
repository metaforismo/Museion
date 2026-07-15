# Frontend and Publication Checklist

This ledger covers the final visual-quality pass and the authorized GitHub consolidation. A checked publication item requires proof against the remote, not just a local command.

## A. Repository safety

- [x] Identify the current branch, remote branches, baseline commit, and remote URL.
- [x] Confirm all existing remote branches currently point to the same baseline commit.
- [x] Confirm the entire dirty worktree belongs to the Museion Build Week scope.
- [x] Move the dirty worktree to local `main` without losing changes.
- [x] Re-run containment checks immediately before branch deletion.

## B. Navigation and accessibility

- [x] Add a keyboard-visible skip link to the main content.
- [x] Give the primary content a stable skip target.
- [x] Show the active route in navigation with `aria-current`.
- [x] Make narrow navigation deliberate rather than a compressed desktop row.
- [x] Preserve 44 px touch targets and visible focus rings.
- [x] Verify semantic landmarks and heading order.
- [x] Verify reduced-motion behavior and keyboard-only navigation.
- [x] Run automated WCAG 2 A/AA, 2.1 A/AA, and 2.2 AA scans across every public route.
- [x] Complete the full judge, locked transfer, and evidence flow using keyboard activation only.
- [x] Keep every mobile primary-navigation destination visible without horizontal discovery.

## C. Visual system

- [x] Refine the paper, ink, lapis, and gold palette into consistent surface tokens.
- [x] Add restrained texture and ambient depth without an AI-gradient aesthetic.
- [x] Strengthen serif/sans hierarchy using offline-safe font stacks.
- [x] Balance display headings and prevent orphaned lines.
- [x] Add tabular figures for hashes, steps, progress, and evidence counts.
- [x] Standardize hover, pressed, focus, disabled, loading, success, and error states.
- [x] Vary container radii and elevation by hierarchy.

## D. Homepage narrative

- [x] Replace the generic centered/equal-card composition with an asymmetric hero.
- [x] Lead with the deterministic-truth product thesis.
- [x] Provide direct primary entry to the verified judge experience.
- [x] Provide a secondary entry to source review.
- [x] Visualize the source-to-evidence workflow without decorative stock imagery.
- [x] Explain the Maia boundary in concrete language.
- [x] Surface measured local verification without overstating learning outcomes.
- [x] Preserve the authored lesson catalog as a useful secondary path.

## E. Product routes

- [x] Polish source ingestion and canonical-record hierarchy.
- [x] Polish creator review stage status, provenance, and launch CTA.
- [x] Polish judge progress, locked transfer, evidence, and reset affordances.
- [x] Keep hidden truth and answers server-side through every redesign.
- [x] Preserve lesson, practice, progress, onboarding, 404, and error behavior.
- [x] Add composed loading, empty, and failure states where applicable.

## F. Trust and release completeness

- [x] Add concise privacy and terms pages appropriate to the current local/in-memory product.
- [x] Add legal links without building a footer link farm.
- [x] Update metadata and social-preview readiness.
- [x] Keep replay visibly labelled and live-model claims explicit.
- [x] Keep transfer claims limited to one immediate near-transfer observation.

## G. Verification

- [x] Pass lint and strict TypeScript.
- [x] Pass every offline Vitest suite; keep live tests honestly skipped without credentials.
- [x] Pass the offline production build.
- [x] Pass dependency audit with zero known vulnerabilities.
- [x] Pass the full existing judge path 20/20.
- [x] Pass homepage/header/legal-route checks at desktop and 320 px.
- [x] Pass console, page-error, HTTP 5xx, refresh, reset, and overflow checks.
- [x] Pass axe-core with zero detected violations on desktop routes and critical 320 px routes.
- [x] Inspect final desktop and mobile screenshots visually.
- [x] Pass `git diff --check`.

## H. GitHub consolidation

- [x] Review the complete staged diff and exclude generated runtime output.
- [x] Create one intentional consolidated implementation commit on `main`.
- [x] Push `main` to `metaforismo/Museion`.
- [x] Verify remote `main` resolves to the new commit.
- [x] Set the GitHub default branch to `main`.
- [x] Delete remote `build-week/gpt56-course-compiler` only after containment proof.
- [x] Delete remote `claude/eloquent-allen-d54lbo` only after containment proof.
- [x] Delete corresponding local non-main branches only after containment proof.
- [x] Fetch/prune and prove local and remote branch listings contain only `main`.
- [x] Leave the final worktree clean and tracking `origin/main` after recording this publication result.
