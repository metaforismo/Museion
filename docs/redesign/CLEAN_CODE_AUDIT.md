# Clean-code audit

V2 adds strict curriculum contracts and separates graph validation/recommendation from catalog data. Dashboard evidence derives from events rather than lesson presence. Maia safety is directly testable and scans one learner-visible payload. Browser preferences are centralized and versioned.

Remaining debt: shared wire schemas should replace response casts; `JudgeExperience` should be split into session/lesson/transfer controllers; authored state should move off global maps; live Maia targets should share one registry; schema failures deserve a dedicated curriculum issue code; repeated style compositions should become primitives only where repetition is proven.

No broad UI dependency was added. Existing tokens and bundle gates remain authoritative.
