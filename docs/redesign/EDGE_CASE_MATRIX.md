# Edge-case matrix

| Area | Case | Expected behavior | Status |
|---|---|---|---|
| Source | Empty/textless | Clear recovery; no compile | Existing |
| Source | Forged hash/id/count | Server rejects before provider selection | Added |
| Source | Instruction-like content | Warning and explicit acknowledgement | UI exists; server binding pending |
| Dashboard | No learner cookie | Honest first-action state | Added |
| Dashboard | Wrong-only attempt | Session and misconception remain visible | Added |
| Dashboard | Partial generated backend failure | Other sections remain usable | Added via section fallback; explicit state pending |
| Review | No signal | Empty queue; no invented schedule | Added |
| Sidebar | Storage unavailable | Expanded navigation remains usable | Added |
| Sidebar | Mobile route change | Drawer closes and bottom nav updates | Added |
| Lesson | Refresh | Existing session recovery path | Existing |
| Maia | Cancel while provider runs | No hint, version, event, or transcript mutation | Added |
| Maia | Timeout/invalid output | Verified deterministic guidance only | Existing |
| Transfer | Double submit | Must score once | Partial; atomic CAS pending |
| Compiler | Server restart during job | Mark interrupted/retryable | Pending |
| Persistence | Multi-instance authored session | Resume consistently | Pending |
| Accessibility | Reduced motion | Decorative animation disabled | Existing |
| Accessibility | 200% zoom | No hidden action/overflow | Browser gate pending |
