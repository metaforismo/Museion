# Improvement verification log

> Historical baseline only. Current candidate evidence is recorded in `docs/redesign/VERIFICATION_LOG.md`.

## Baseline — 2026-07-17

| Command or check | Result | Route / viewport | Evidence / issue |
|---|---|---|---|
| `git status --short --branch` | Pass | repository | Clean `main`, aligned with `origin/main` at `c1968fe` |
| `npm run lint` | Pass | all | No lint errors |
| `npm run typecheck` | Pass | all | No TypeScript errors |
| `npm test` | Pass | all | 157 passed, 17 skipped |
| `npm run build` | Pass with known warning | all | Turbopack NFT trace warning from local Codex runtime |
| GitHub connector README read | Pass | `metaforismo/Museion@main` | Remote positioning matches local Build Week line |
| GitHub open-item query | Connector error | repository | No external write attempted; local/remote branch state remains authoritative |
| In-app Browser DOM + screenshot | Audited | `/`, 390 x 844 | Oversized editorial hero, technical proof before learner value, `Judge` terminology |
| In-app Browser DOM | Audited | `/create`, 390 x 844 | Robust empty state; long two-panel workflow and technical record remain |
| In-app Browser DOM + screenshot | Failed visual quality gate | `/lessons/linear-equations-intro`, 390 x 844 | Title collides with step count; Maia dominates next viewport |

## Required after each coherent change

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run verify:bundle`
- Production-server browser suite
- In-app Browser screenshot inspection at affected viewports
- Axe, keyboard, reduced motion, zoom and overflow gates where applicable

## Local improvement pass — 2026-07-17

| Check | Result | Evidence |
|---|---|---|
| TypeScript | Pass | Honest font/navigation/home, responsive Maia, lesson copy, and transfer controls compile |
| ESLint | Pass | No warnings or errors after responsive coach changes |
| Focused artifact/compiler tests | Pass | Renderability and answer-spec mismatch gates covered |
| Full tests | Pass | 159 passed, 17 skipped; 28 files passed, 1 skipped |
| Production build | Pass with known warning | All 20 routes built; existing Turbopack NFT trace warning remains isolated to local Codex runtime discovery |
| Bundle budgets | Pass | 2859.7 KiB static, 492.3 KiB largest JS, 1274.3 KiB PDF worker |
| Dependency audit | Pass | `npm audit --audit-level=high`: 0 vulnerabilities |

## Scientific landing and learning-laboratory pass — 2026-07-17

| Check | Result | Evidence |
|---|---|---|
| Scientific-method landing | Pass | Expanded research narrative, animated observable protocol, bounded-claim taxonomy, generic-tutor comparison, catalog, and source-lab CTA |
| Dashboard product states | Pass | Empty ledger and populated protocol/ledger/observation-map/study-record states verified in the production browser flow |
| Semantic accessibility | Pass after correction | Axe exposed an invalid decorated definition-list group; markup now preserves strict `dt`/`dd` grouping |
| Motion and responsive behavior | Pass | Protocol motion is transform/opacity/stroke-only, disabled for reduced motion, and has no horizontal overflow at 320 or 390 px |
| README screenshots | Pass | Landing and populated laboratory images regenerated at 1440 x 1000 by the production browser suite and visually inspected |
| Full browser suite | Pass | Axe, keyboard, reduced motion, recovery, mobile drawer, compiler flow, generated transfer, and 20 clean demo contexts |
| Performance | Pass | `/welcome` 206.6 KiB / 163.7 KiB JS; `/create` 264.3 / 232.1; `/judge` 204.9 / 166.2; CLS 0.000 |
| Bundle budgets | Pass | 2867.1 KiB static, 492.3 KiB largest JS, 1274.3 KiB PDF worker |
| Dependency audit | Pass | 0 vulnerabilities at high severity threshold |
| Production browser suite | Pass | Axe, keyboard, reduced motion, recovery, compiler, 320px overflow, generated transfer, and 20 clean desktop demo contexts |
| Browser performance | Pass | `/welcome` 277.4 KiB / 234.9 KiB JS; `/create` 271.2 / 233.0; `/judge` 289.7 / 239.8; CLS 0.000 on all three |
| In-app Browser visual check | Pass | 390px homepage and lesson; 320px lesson has no horizontal overflow, title collision, or initially expanded Maia conversation |
| Screenshot review | Pass | `output/playwright/smoke/mobile-home.png`, `mobile-lesson.png`, and judge outputs inspected after final build |

## Landing and dashboard pass — 2026-07-17

| Check | Result | Evidence |
|---|---|---|
| Landing responsive inspection | Pass | In-app Browser at 390 x 844; no horizontal overflow; product preview follows the primary CTA cleanly |
| Dashboard empty state | Pass | In-app Browser at 390 x 844; active Progress navigation, two useful entry actions, no overflow |
| Dashboard populated state | Pass | Production browser flow completes a lesson, verifies recommendation/evidence key, and captures the README dashboard image |
| README screenshots | Pass | Generated from real routes by `npm run screenshots` into `docs/assets/screenshots/`; browser verification captures remain in ignored `output/` artifacts |
| Sidebar accessibility | Pass after correction | Axe caught 2.17:1 inactive step numbers; they now use the accessible secondary-text token. Drawer focuses Close, traps Tab, closes on Escape, and restores trigger focus. |
| Full browser suite | Pass | Axe, keyboard, reduced motion, recovery, 320px overflow, compiler flow, and 20 clean demo contexts |
| Performance | Pass | `/welcome` 203.6 KiB / 162.9 KiB JS; `/create` 263.3 / 231.4; `/judge` 203.9 / 165.5; CLS 0.000 |
| Bundle budgets | Pass | 2863.5 KiB static, 492.3 KiB largest JS, 1274.3 KiB PDF worker |
| Dependency audit | Pass | `npm audit --audit-level=high`: 0 vulnerabilities |
