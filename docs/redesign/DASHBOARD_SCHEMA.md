# Dashboard schema and recommendation policy

`DashboardSnapshotSchema` is defined in `src/lib/dashboard/contracts.ts`. The server projector lives in `src/lib/dashboard/snapshot.ts`.

## Inputs

- Owner-scoped authored session events
- Learner profile completions, practice counts, and adaptive support model
- Owner-scoped generated Judge sessions and transfer observation
- Owner-scoped validated compiler runs
- Selected AI provider and persistence backend

Raw answers, answer specifications, hidden solutions, and private misconception triggers are never placed in the snapshot.

## Recommendation order

1. Finish an active independent transfer check.
2. Resume the newest incomplete generated course.
3. Resume the newest incomplete authored session.
4. Review a failed immediate transfer observation.
5. Review an unresolved registered misconception.
6. Add hint-free practice after assisted completion.
7. Launch a newly compiled course.
8. Start the first authored lesson.
9. Create from a source when no other useful action exists.

Each action contains a learner-facing reason. Stable source/event data—not model judgment—determines priority.

## Evidence states

- `observed-guided`
- `hint-free-practice`
- `immediate-transfer`

“Retained” is intentionally absent until Museion implements a delayed probe.
