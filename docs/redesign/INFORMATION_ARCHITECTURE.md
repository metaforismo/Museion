# Information architecture

## Route model

| Surface | Route | Shell | Purpose |
|---|---|---|---|
| Marketing | `/` | public | Explain source-to-learning and the evidence boundary |
| Workspace | `/dashboard` | app | Next action, courses, review, misconceptions, sources |
| Library | `/library` | app | Authored deterministic lessons |
| Review | `/review` | app | Ranked queue from real learning signals |
| Evidence | `/progress` | app | What was observed and what is not yet known |
| Creator | `/create` | app | Normalize a source, choose a template, compile |
| Settings | `/settings` | app | Runtime and model routing |
| Authored lesson | `/lessons/*` | focus | Distraction-free learning |
| Generated course | `/learn/*` | focus | Review/launch generated learning |
| Verified demo | `/judge` | app demo | Deterministic golden experience |

## Navigation

Desktop groups are Learn, Build, and Understand. The sidebar persists collapse preference when browser storage is available; failure leaves a fully usable expanded navigation. Mobile uses Home, Library, Review, and Create as bottom actions, while secondary destinations remain in the drawer.

## Focus policy

Authored and generated learning remove the application sidebar and global create action. A small top bar provides identity and a deliberate “Leave lesson” action. Transfer must never expose Maia, hints, or source solutions.
