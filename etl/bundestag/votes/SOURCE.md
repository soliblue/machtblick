# Bundestag votes import source

## Inputs

- `~/Desktop/CODING/German-Politics/app/src/apps/bundestag/votes/data/seed.ts` exports `rollCallVotes: RollCallVote[]` (51 entries). Type definitions live in the same file. Top-level import `voteDataUpdatedAt` from `~/platform/data/freshness` (`2026-05-10T14:12:04.423Z`).
- `~/Desktop/CODING/German-Politics/app/public/data/votes/<vote-id>.json` exposes `{ memberVotes: [{ id, name, party, state, vote }, ...] }`. The per-row `id` is a vote-scoped ordinal and is discarded.

## Loader

`read/seedFile.mjs` reads seed.ts as text, removes all `export type` blocks (brace-balanced), strips the freshness import, inlines `votesUpdatedAt`, drops the `: RollCallVote[]` annotation, writes the result to a temp `.mjs`, and dynamic-imports it.

## Member identity

`transform/memberId.mjs` derives a stable `member.id` from `slug("<last>-<first-token>")`, where first-token is the first whitespace-delimited token of the first-name component. Slug rules: NFD + diacritic strip, `ß -> ss`, lowercased, non-alphanumerics collapsed to `-`. Hyphenated first names like `Hans-Peter` stay intact (we only split on whitespace, not on `-`).

Middle names are dropped from the slug on purpose: upstream is inconsistent about whether it includes them (e.g. `Kempf, Martina` in 49 votes, `Kempf, Martina Rose-Marie` in 2 others — same person). Using only the first first-name token keeps the ID stable across that drift.

Collision rule: per base slug we track the set of states observed. The first state seen for a base slug keeps the bare slug; any later distinct state with the same base slug is suffixed with the two-letter state code (`-BW`, `-BY`, `-BE`, `-BB`, `-HB`, `-HH`, `-HE`, `-MV`, `-NI`, `-NW`, `-RP`, `-SL`, `-SN`, `-ST`, `-SH`, `-TH`).

Cross-vote name variants (e.g. `Ahmetović` vs `Ahmetovic`, `Prof.` vs `Prof`) collapse to the same id because diacritics and punctuation are removed before slugging; `members.name` keeps the first-seen variant via `ON CONFLICT DO NOTHING`. As of this initial 51-vote import: 0 real collisions.

This is stable so long as the seed file is processed in deterministic order (51 votes iterated newest-first as exported), which it is.

## Mapping

- `RollCallVote.context[]` -> `votes.contextJson` JSON-encoded.
- `RollCallVote.procedure[]` -> `votes.procedureJson` JSON-encoded.
- `votesUpdatedAt` -> `votes.fetchedAt` for every row in this initial import.
- `documentLinks[]` -> `vote_documents` rows.
- `partySummaries[]` -> `vote_party_summaries` rows.
- `memberDataUrl` and the per-row `id` from member JSON are not persisted.

## Quirks

- `name` is `"Last, First"`. Compound first names (`Hans-Peter`) and titled members (`Dr. Foo Bar, Baz`) are preserved verbatim in `members.name`; the slug strips punctuation.
- `state` values are full names (`Baden-Württemberg`, etc.); they are written to `vote_members.state` as-is.
