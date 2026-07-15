# Accessibility Audit

Audit date: 2026-07-15

Target: Museion web application, local production-equivalent UI

Standardized command: `npm run verify:ui`

## Outcome

The automated WCAG scan reports zero detected violations for the audited states. The full judge replay, including locked transfer and the evidence ledger, is also completed once using keyboard activation only. This is strong regression evidence, not a claim of formal WCAG certification.

## Automated coverage

`scripts/verify-ui.mjs` runs axe-core rules tagged for WCAG 2 A/AA, WCAG 2.1 A/AA, and WCAG 2.2 AA against:

- catalog
- onboarding
- source creator
- verified compilation review
- judge replay
- lesson and practice
- progress
- about
- privacy and terms
- not-found page

The catalog, source creator, and judge are scanned again at a 320 by 700 viewport. The test also asserts that every primary-navigation link remains inside the viewport.

## Keyboard and motion coverage

- The skip link is the first tab stop and moves focus to `main`.
- The active primary route is exposed with `aria-current="page"`.
- All onboarding slide targets meet the WCAG 2.2 minimum target size.
- The judge replay is completed from explanation through evidence using focus plus Enter or Space, including radio selection, numeric fields, sequence reordering, and the one-attempt transfer.
- Reduced-motion emulation disables the onboarding and feedback animations.
- Focus-visible styling remains global and high contrast.

## Issues found and fixed

1. Onboarding pagination exposed 8 by 8 pixel click targets. The visual dots now sit inside semantic 24 by 24 pixel buttons and expose the current step.
2. The success foreground/background pair measured 4.48:1. The success token was darkened to clear the 4.5:1 threshold.
3. Source-limit text used environment-dependent number formatting, producing a server/client hydration mismatch in an Italian browser locale. It now uses an explicit `en-US` presentation locale.
4. Mobile navigation hid later destinations behind horizontal scrolling. It now uses a visible three-column layout below the small breakpoint, with 44 pixel link targets.
5. Initial contrast scans could sample entrance animations at partial opacity. Accessibility scans now emulate reduced motion so they measure the stable rendered state; reduced-motion behavior is independently asserted.

## Manual and structural checks

- Native links, buttons, labels, radios, selects, textareas, and number inputs are used instead of clickable generic elements.
- Status, error, progress, tutor log, and busy states expose appropriate ARIA semantics.
- Success and failure states include text, not color alone.
- Desktop and mobile flows are checked for horizontal document overflow.
- The final screenshots remain available under the ignored `output/playwright/smoke` directory for visual review.

## Honest boundary

Automation cannot prove usability with every screen reader, zoom configuration, cognitive profile, browser extension, or operating-system contrast mode. A release targeting formal conformance should add human testing with VoiceOver and NVDA, 200% and 400% zoom review, and a documented accessibility statement and feedback channel.
