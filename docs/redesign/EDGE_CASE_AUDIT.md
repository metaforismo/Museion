# Edge-case audit

| Boundary | Status | Handling |
|---|---|---|
| Opened lesson with no answer | Fixed + test | No evidence until `answer_submitted`. |
| Partial Supabase persistence | Fixed | UI distinguishes generated sync from local authored records. |
| Spelled/translated numeric answer | Hardened | Leak gate recognizes small English, Italian and Chinese forms. |
| MC answer by letter/ordinal | Hardened | Assertive “choose B/seconda” forms are blocked. |
| Answer inside UI annotation | Fixed + test | Every learner-visible tutor string is scanned collectively. |
| Empty search interval (`high = -1`) | Fixed + test | Typed runtime accepts the explicit sentinel. |
| Authoritative state changes | Fixed | Interactive controls remount from server state. |
| Tutor target without DOM node | Improved | Options, items and range controls expose registered ids. |
| Tutor annotation discarded | Fixed | Labelled annotation callout is rendered. |
| Chat reader scrolls upward | Fixed | Auto-follow stops; jump-to-latest appears. |
| Corrupt preference storage | Fixed | Validation returns safe defaults. |
| Cross-tab judge mutation | Open P0 | Needs durable compare-and-swap. |
| Younger live chat | Release blocker | Supervised mode is not implemented. |
| Model/quota/offline failure | Existing safe path | Deterministic guidance; no automatic paid fallback. |
