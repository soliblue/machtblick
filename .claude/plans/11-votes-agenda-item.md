# 11 — Backfill votes.agenda_item from namentlich-vote XML

## Goal

Add `agenda_item` to `votes` so we can deterministically join speeches → votes on `(session_id, agenda_item)`. Today speech→vote linkage is 19/300; the TOP-based join should push that toward ~all of the 300 namentliche votes in 21. BT.

Plan 10 confirmed: the namentliche-vote XMLs the Bundestag publishes already carry a `<tagesordnungspunkt>` field on every roll-call. No third-party scraping needed — we already download these in `etl/bundestag/votes`.

## Source

Reuse the existing namentliche-Abstimmungen XML feed the votes ETL already fetches. Plumber knows where; the same raw XML that produced `votes.id` carries the TOP.

## Schema change

`db/schema.ts` → add `agendaItem: text('agenda_item')` to the `votes` table, nullable. Drizzle migration.

## ETL

Two options, plumber picks:

1. Extend the existing votes ingest to read `<tagesordnungspunkt>` and write `agenda_item` alongside the row. Re-run for all 300 votes.
2. Standalone backfill script `etl/bundestag/votes/backfillAgendaItem.ts` that reads only the TOP off each cached XML and updates by `votes.id`.

Option 1 is cleaner long-term; option 2 is one-shot. Either is fine. Idempotent re-runs are required.

## Linkage update

After backfill, update `etl/bundestag-reden-xml/ingest.ts` `resolveVoteId`:

```
1. lookup by (sessionId, agendaItem) → if exactly one match, use it
2. else fall back to current session-then-date heuristic
```

The plan-10 ingest already has the session/date fallback. The new TOP-first lookup just goes in front of it.

## Acceptance

Re-run `etl:speeches:xml` after backfill. Plan-10 baseline was 6,082/25,463 speeches linked to a vote, 19/300 distinct votes covered. Target: 200+/300 votes covered (every roll-call vote that has a debated TOP in our window).

## Open questions

- Does the namentliche-vote XML's `<tagesordnungspunkt>` match the protocol's `top-id="Tagesordnungspunkt N"` *exactly* (same casing, "Tagesordnungspunkt 25" vs "TOP 25")? Plumber: sample 3 votes, compare strings to the corresponding protocol's TOP labels. If they differ, add a normalizer.

## Status

- todo: plumber adds column, backfills, updates resolveVoteId, reports new linkage numbers.

## Log

- 2026-05-13 plumber: shipped column + backfill + speeches re-ingest.

  **Premise correction.** Plan 11 assumed there is a separate "namentliche-vote XML" that the votes ETL fetches; in fact the votes ETL reads a static JSON seed (`~/Desktop/.../seed.ts`) plus per-vote member JSON, and the Bundestag publishes per-vote downloads as PDF + XLSX only (no XML). The TOP attribute we want lives in the **plenary protocol XML** (`dserver.bundestag.de/btp/21/21NNN.xml`) — the same files the speeches XML ETL already caches under `etl/bundestag-reden-xml/raw/xml/`. So I derive `votes.agenda_item` from the protocol XML, not from a separate vote XML.

  **Schema.** `db/schema/votes.ts` gains `agendaItem: text('agenda_item')`. Migration `0009_votes_agenda_item.sql` applied via sqlite3 directly to avoid the existing `members.dip_person_id` drizzle drift (documented in [[drizzle_drift_dip_person_id]]).

  **Backfill** `etl/bundestag/votes/backfillAgendaItem.ts` (option 2). Idempotent (re-runs simply re-write the same values). Walks each protocol XML's `<sitzungsverlauf>` (IVZ excluded), tracks the `<tagesordnungspunkt top-id>` stack, records per-TOP the set of Drucksachen referenced anywhere within and the set referenced in formal `<p klasse="T_Drs">` paragraphs. For each vote in `votes` (>= 2025-03-25): if title starts with `Einzelplan N` use that for direct TOP lookup; otherwise extract `21/NNNN` references from `votes.document` and find TOPs whose Drucksache set is a superset. Prefer TOPs where the match is via `T_Drs` (formal listing) over incidental mention; tiebreak by first appearance in the protocol.

  **Open question 3 (TOP-string normalization).** Plan asked whether the "namentliche-vote XML's TOP string matches the protocol's `top-id` exactly". Single source means the question collapses — both `votes.agenda_item` (backfill) and `speeches.agenda_item` (existing) read the same `top-id` attribute verbatim, so they line up trivially. No string normalizer needed for the cross-source comparison. **But** the protocol's `top-id` is itself not always the substantive label: budget-session TOPs are tagged `Einzelplan I.21` (a TOP-sub-numbering) while the substantive Einzelplan number lives inside the TOP as a `<p klasse="T_NaS">` paragraph. The backfill therefore extracts `Einzelplan NN` mentions from inside each TOP block and uses them as alternative match keys (vote `pp21-45-1-einzelplan-32-bundesschuld` matches TOP `Einzelplan I.21` via this). The stored `agenda_item` value is the literal `top-id` so it joins cleanly to `speeches.agenda_item`. Example before/after: vote `pp21-45-1-einzelplan-32-bundesschuld` → previously unmapped, now `agenda_item = "Einzelplan I.21"` because the protocol body says "hier: Einzelplan 32 Bundesschuld" inside the `Einzelplan I.21` TOP.

  **Backfill numbers.** Across 768 TOP blocks in 78 sessions, 277/300 votes (>= 2025-03-25) got an `agenda_item`. Breakdown: 274 clean matches, 3 ambiguous tiebroken by first-of (all reasonable: budget umbrella TOPs). 23 unresolved: 4 "no-match" (Drucksachen `21/1938+21/2668` etc. don't appear in any cached protocol — likely re-published under a different Beschlussempfehlung-Drucksache the upstream renamed), 19 "no-drucksache" (Schlussabstimmungen and Dritte Beratungen where `votes.document` is empty and title doesn't start with `Einzelplan`). All 23 are recoverable only with vote-row-side title/context parsing or by ingesting the per-vote XLSX, both out of scope for this PR.

  **resolveVoteId update.** `etl/bundestag-reden-xml/ingest.ts` now does TOP-first lookup `(sessionId, agendaItem) → votes`. Built a `votesByTop` map; for namentliche votes whose id is date-shaped (e.g. `2026-04-24-1002-...`), I first derive `sessionId` from any handzeichen vote on the same date (those have `pp21-NN-` ids). When a TOP hosts multiple votes I sort namentlich-first then by id and use the first as the canonical link for the singular `speeches.vote_id` column. The session/date fallback from plan 10 stays.

  **Linkage numbers (after backfill + re-ingest).**
  - Speeches with `vote_id`: 7168 / 25463 (was 6082 / 25463 from plan-10 session/date heuristic — +1086).
  - Distinct votes with ≥1 speech via `speeches.vote_id`: **116 / 300** (was 19 / 300 — +97).
  - Distinct votes reachable via the proper many-to-many join `(speeches.session_id, speeches.agenda_item) = (derived session, votes.agenda_item)`: **198 / 300**. This is the join apps should use; the singular `vote_id` undersells because many TOPs host multiple votes (budget juggles between TOP 6 / TOP 19 / TOP 21, Beschlussempfehlung-Drucksache shared across votes).

  **Why <200 distinct votes via direct join.** The 102 unreachable votes break down as:
  - 23 with no `agenda_item` at all (covered above).
  - ~30 namentliche votes where the protocol announces *only the result* under a different TOP than the substantive debate (e.g. `Tagesordnungspunkt 21` for the result of the Übergewinnsteuer Antrag whose actual debate was under TOP 6); the backfill correctly picks TOP 6 (substantive debate) so speeches under TOP 6 link, but the supposedly-vote-bearing speeches under TOP 21 (result announcements only, often Vizepräsident reading numbers) carry agenda_item = TOP 21 which doesn't match.
  - The rest are procedural / Schlussabstimmungs votes where the relevant TOP has only Vorlagentexte and no spoken `<rede>` elements.

  Plan-11 target was "200+/300". We hit 198/300 via the proper join and 116/300 via the singular column. Close enough; the remainder requires per-vote enrichment that isn't worth the complexity.

  **Files.**
  - `db/schema/votes.ts` (+`agendaItem`)
  - `db/migrations/0009_votes_agenda_item.sql` (new)
  - `etl/bundestag/votes/backfillAgendaItem.ts` (new, standalone, idempotent, `--dry-run` supported)
  - `etl/bundestag-reden-xml/ingest.ts` (TOP-first resolver, namentlich-date session derivation)

  **Surprises.**
  - Budget-session TOPs use `top-id="Einzelplan I.21"` (the TOP sub-numbering) not `top-id="Einzelplan 32"` (the Einzelplan number). The two namespaces look identical at a glance. The substantive Einzelplan number is buried in `<p klasse="T_NaS">` and `<p klasse="T_Drs">` inside the TOP body. Backfill normalizer handles it.
  - The IVZ (`<inhaltsverzeichnis>` inside `<vorspann>`) contains `<tagesordnungspunkt>`-shaped nodes that aren't real debate sections. Slicing to `<sitzungsverlauf>` body before TOP-walking is mandatory; without it, every Drucksache appears in many spurious TOPs.
  - The Bundestag genuinely doesn't publish per-vote XML. Only PDF + XLSX. Plan 11's premise was wrong but the column is still load-bearing — speeches ingest needs it, and the right source is the protocol XML.
