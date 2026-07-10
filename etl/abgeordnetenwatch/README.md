# etl/abgeordnetenwatch

Landtage (state parliaments) ingest into the parliament-scoped `mp_*` tables. Currently Bayern (`parliament = 'by'`) and Berlin (`parliament = 'be'`).

## Source

- **abgeordnetenwatch.de v2 API** (`www.abgeordnetenwatch.de/api/v2`), CC0 1.0, no key. It is the unified aggregator for all German Landtage: full member/mandate lists plus genuine per-member roll-call ballots for the *namentliche Abstimmungen* it editorially selects. See `plans/109-landtage.md` for the data-landscape research.

Only namentliche Abstimmungen exist here; most Landtag votes are by show of hands and have no per-member record anywhere, so the feed is thin by nature (tens of votes per term, not hundreds). No speeches, no motion full-texts, no photos.

## Run

```
npm run etl:landtage    # fetch + load both parliaments into mp_* (idempotent)
```

Prints per-parliament row counts. Idempotent: deletes and rewrites all `parliament in ('by','be')` rows each run, never touches `eu` or the Bundestag tables. API responses cache under `raw/cache/` (gitignored) keyed by URL hash, so re-runs skip the ~90 detail calls.

Target DB: `MACHTBLICK_DB` env or `db/machtblick.sqlite` (better-sqlite3, WAL). Reuses `etl/europarl/schema.mjs` `ensureSchema()` — the `mp_*` DDL is shared byte-for-byte with the EU ETL.

## Period selection

Current legislative period is discovered live per parliament via `parliaments/{id}.current_project`. Bayern uses only the current period (149, "Bayern 2023 - 2028", 64 polls). Berlin's current period (133, "Berlin 2021 - 2026") has only 3 polls, so the previous period (107, "Berlin 2016 - 2021", 9 polls) is auto-appended whenever the current period has `< 10` polls. Berlin members/votes are therefore a **mix of two terms**; `mp_members` dedupes by politician id preferring the current-term fraction, and `mp_parties` for `be` is the union across both terms (so FDP appears from 107 even though it is not in the current Abgeordnetenhaus).

## Mapping

- Member id = abgeordnetenwatch **politician id** (`mandate.politician.id`), stable across terms. `first_name`/`last_name`/`national_party`/`country`/`state` are NULL (API gives only a combined `label`). `picture_url`/`picture_license` NULL — the API serves no photos; portraits would need a Wikidata P18 → Commons resolution step (deferred, licensing per image).
- Ballot choice: `yes → ja`, `no → nein`, `abstain → enthalten`, `no_show → nicht_abgegeben`.
- Result: `poll.field_accepted` (`true → angenommen`, `false → abgelehnt`); falls back to `yes > no` when null.
- `mp_votes`: `id` = poll id, `title`/`title_de` = poll `label` (already German), `date` = `field_poll_date`, `source_url` = the poll's `abgeordnetenwatch_url`. `description`/`reference`/`procedure_reference` NULL.
- `mp_vote_party_summaries.party` = fraction slug **at vote time** (`vote.fraction.label`); `mp_members.party` = the member's latest fraction slug.
- Fraction label → slug in `parties.mjs`: strips the `(Land YYYY - YYYY)` suffix and the soft hyphen (U+00AD) inside `BÜNDNIS 90/DIE GRÜNEN`, then maps to `{cdu, csu, spd, gruene, afd, linke, fdp, freie-waehler, bsw, fraktionslos}`. Colors are muted German-convention brand hexes. An unmapped label logs `⚠ unmapped party slug` and is skipped — add it to `parties.mjs`.

## Roster convention (matches EU ETL)

Members who left mid-term still cast ballots on older polls; their mandate is not in the current-period mandate list. Those are resolved on demand via `candidacies-mandates/{id}` and added to `mp_members`, so `mp_parties.seats`/`member_count` count **every distinct member who holds a current mandate or cast a ballot in a loaded period**, running slightly above live seat totals (same semantics as the EU roster). Not a live seat count.

## Rate limit

API allows 30 req/min. The client (`client.mjs`) serializes requests with a 1.6s floor and exponential backoff on 429/5xx. First cold run is a couple of minutes; cached runs are seconds.
