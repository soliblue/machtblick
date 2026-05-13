# 18 — abgeordnetenwatch member enrichment

## Goal

Lift Bundestag member portrait coverage from ~48% (Wikidata-only) past 95% by pulling each MP's profile from abgeordnetenwatch.de. While we're there, **persist the full raw API response per member** so we can mine other fields later (occupation, education, year_of_birth, social links, contact, residence, etc.) without re-fetching.

## Status

| Workstream | State |
|---|---|
| Plumber: discovery + schema + ETL | todo |
| Plumber: backfill picture_url where NULL | todo |
| Backend: expose new fields if needed | deferred — only when a view asks |
| Frontend: nothing yet | deferred |

## Contracts

- **New table** `member_abgeordnetenwatch` (one row per member). Columns:
  - `member_id` PK, FK → `members.id`
  - `aw_politician_id` int — abgeordnetenwatch's internal numeric ID
  - `raw_json` text — the full politician API response as JSON
  - `picture_url` text nullable — extracted for convenience
  - `fetched_at` timestamp
- **Update** `members.picture_url` only where currently NULL, sourced from `member_abgeordnetenwatch.picture_url`. Wikidata stays primary.

## Upstream notes (plumber to verify)

- abgeordnetenwatch politicians API: `https://www.abgeordnetenwatch.de/api/v2/politicians`
- Filter by current Bundestag mandate (parliament_period id for WP21).
- The politician object includes `profile_picture_url`, `year_of_birth`, `occupation`, `education`, etc.
- Matching strategy: try `bt_mdb_id` if abgeordnetenwatch exposes it; otherwise normalized name match like we did for Wikidata (see `etl/wikidata-portraits/ingest.ts`).

## Open questions

- Which endpoint returns the richest single-call payload — `/politicians/{id}?include_information=mandates` or a separate fetch per resource? Plumber to confirm during discovery.
- Rate-limit: abgeordnetenwatch is generous but be polite (1 req/sec, concurrency ≤ 4).

## Log

- 2026-05-13 lead: plan opened. Dispatching plumber for discovery + ETL.
- 2026-05-13 plumber: discovery done.
  - WP21 `parliament_period.id = 161` (`start_date_period=2025-03-25`).
  - Mandate list returns 860 raw rows → 630 unique politicians after dedupe by `politician.id` (one MP can hold multiple mandate rows when seat type changes).
  - Sample politician (Friedrich Merz, id 118559) carries: `first_name`, `last_name`, `birth_name`, `sex`, `year_of_birth`, `party`, `party_past`, `education`, `residence`, `occupation`, `ext_id_bundestagsverwaltung` ("11002735" — the **8-digit Stammdaten ID**, identical to `members.bt_mdb_id`), `qid_wikidata`, `statistic_questions`, `statistic_questions_answered`, `field_title`. No `profile_picture_url` field in the JSON despite plan claim — pictures must be scraped from the profile HTML page (`politicians-profile-pictures/<filename>`).
  - Built: schema `db/schema/memberAbgeordnetenwatch.ts`, migration `0013_member_abgeordnetenwatch.sql`, ETL `etl/abgeordnetenwatch-members/ingest.ts`, script `etl:abgeordnetenwatch`. Source-of-truth quirks captured in `.claude/agents/plumber.md` under a new "abgeordnetenwatch politicians" section.
  - Matching: `ext_id_bundestagsverwaltung` → `members.bt_mdb_id` is the primary path and lands ~all members directly (every WP21 member already has a `bt_mdb_id` after the Stammdaten ETL). Name-key fallback exists for safety.
  - Rate-limit: AW throttles `politicians/{id}` aggressively. Concurrency 3 with 400ms delays triggered persistent 429s on individual IDs; concurrency 2 with 600ms delays is stable. Backoff is exponential `1500 × 2^attempt` capped at 60s, retries socket errors too. Mandate list and profile HTML are unthrottled. End-to-end ~30 min for 630 politicians on this rate budget.
  - Resume: ETL filters out already-ingested `aw_politician_id`s at startup, so killed/restarted runs converge. Picture backfill runs at the end and only updates `members.picture_url IS NULL`.
- 2026-05-14 plumber: fixed stray `enriched.length` reference at end of ingest (replaced with `viaId + viaName`) and re-ran for the 9 stragglers. 7 of 9 unmatched (no `bt_mdb_id` and no name hit — these are AW politicians whose Stammdaten ID isn't yet on any of our `members` rows, likely Nachrücker not in our member source). Final coverage: `member_abgeordnetenwatch` = 621 rows; `members.picture_url` populated for 581/636 (91.4%); 55 members remain without a portrait (these have no source in either Wikidata or AW).
