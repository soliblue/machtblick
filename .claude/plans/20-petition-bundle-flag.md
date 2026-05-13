# 20 — Surface Sammelübersicht semantics + vote-type list cleanup

## Goal

Sammelübersicht votes are special: one plenary vote bundles the Petitionsausschuss recommendations for *dozens* of unrelated petitions. A `result = angenommen` row means "the bundle of recommendations was accepted as a whole", not "every petition won". Individual petitions inside may have been recommended for closure, referral, material, or rejection.

The votes list and detail pages need to (a) make this distinction visible without title-string-matching at render time, and (b) stop defaulting to `namentlich`-only and stop showing the experimental `hammelsprung` type.

This plan is backfilled after the work landed — it captures the contract so future iterations don't have to re-derive intent from the diff.

## Status

| Workstream | State |
|---|---|
| Schema: `votes.is_petition_bundle` boolean + migration | done |
| ETL: set flag at ingest for namentlich + handzeichen | done |
| Read path: disclaimer banner on Sammelübersicht detail | done |
| List UX: drop `namentlich` as default filter, hide hammelsprung | done |

## Contracts

### Schema

`db/schema/votes.ts`:

```ts
isPetitionBundle: integer('is_petition_bundle', { mode: 'boolean' }).notNull().default(false),
```

Migration `db/migrations/0015_votes_is_petition_bundle.sql` adds the column and backfills existing rows via `UPDATE votes SET is_petition_bundle = 1 WHERE title LIKE 'Sammelübersicht %'`. Journal entry idx=13.

### ETL write paths

Both ingest writers set the flag at row-write time so we never rely on a backfill in steady state:

- `etl/bundestag/votes/write/votes.mjs` (namentlich source)
- `etl/bundestag/handzeichen/write.mjs` (handzeichen source)

Rule: `isPetitionBundle: title.startsWith('Sammelübersicht ')`. Single rule, both writers, identical literal. If the detection criteria ever expand (e.g. `Petitionsausschuss: Bündel ...`), update both.

### Hammelsprung visibility toggle

`apps/bundestag/src/lib/voteTypes.ts`:

```ts
export const SHOW_HAMMELSPRUNG = false
export const VISIBLE_VOTE_TYPES: VoteTypeFilter[] = SHOW_HAMMELSPRUNG
  ? ['namentlich', 'handzeichen', 'hammelsprung']
  : ['namentlich', 'handzeichen']
```

Single boolean flips visibility across:

| Surface | Behavior when `SHOW_HAMMELSPRUNG = false` |
|---|---|
| `VotesList.tsx` filter pill | Hammelsprung option not rendered |
| `server/votes.ts > listVotes` | Hammelsprung rows filtered out of the list response |
| `server/votes.ts > getVote` | Hammelsprung row throws `vote not found` (same error path as a missing ID) — keeps direct links from leaking the type |

Flip to `true` to surface them again as a single edit.

### Default vote-type filter

`apps/bundestag/src/routes/votes/index.tsx`: `voteType = type ?? null` (previously `?? 'namentlich'`). Default view shows all visible types; users opt into a single type via the pill.

### Disclaimer banner

`apps/bundestag/src/views/voteDetail/VoteDetail.tsx` renders a `bg-surface p-m text-s` banner above the `<h1>` when `vote.isPetitionBundle` is true. Copy:

> Diese Abstimmung bündelt mehrere Petitionen in einer Sammelübersicht. Das Plenum stimmt über alle enthaltenen Empfehlungen des Petitionsausschusses gemeinsam ab. Ein "angenommen" bedeutet, dass die Empfehlungen so beschlossen wurden, die einzelnen Petitionen können dabei sehr unterschiedlich behandelt worden sein (z.B. an die Bundesregierung weitergeleitet, als Material überwiesen, oder abschließend behandelt).

The list row stays compact — no badge — to keep the list scan-friendly.

## Open questions

- Should the list row show a small Sammelübersicht badge so users can spot bundles without opening each? Defer until we see how the disclaimer reads in practice.
- Do we want a per-petition breakdown view inside the bundle? Out of scope — would require ETL extraction of individual petition recommendations from the Sammelübersicht PDF.

## Log

- 2026-05-14 lead: plan backfilled after `ce5dedc` landed. Captures the schema, ETL, frontend, and UX edges so future iterations don't re-derive intent from the commit diff. No code changes here.
