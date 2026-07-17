# Marble integration plan

Status: researched, not imported.

Marble exposes topic, dependency, curriculum-standard, and cluster schemas plus a manifest with hashes. Its database is licensed under ODbL 1.0 and authored content under CC BY-SA 4.0; upstream curriculum standards may carry separate terms.

An integration must pin a commit/release, verify every manifest hash, map upstream ids without rewriting provenance, run Museion graph validation, keep the derivative database separable for share-alike obligations, and add attribution/version/license information to the product and `THIRD_PARTY_NOTICES.md`. No Marble data is currently bundled, so the product must not advertise Marble coverage.
