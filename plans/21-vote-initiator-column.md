# 21 — Vote initiator column, sourced from plenarprotokoll XML

## Goal

Stop deriving the proposing party from the scraped bundestag.de teaser via runtime regex. Promote it to a first-class normalized `votes.initiator` column, populated by ETL from the authoritative plenarprotokoll XML (`etl/bundestag-reden-xml/raw/xml/<period><sitzung>.xml`), with the teaser only as fallback.

Trigger: 9 votes currently mislabeled as `Bundesregierung` because the bundestag.de teaser misattributes opposition Anträge. The XML has the correct `Antrag/Gesetzentwurf der … Fraktion …` strings.

## Status

| Step | Owner | State |
|---|---|---|
| 1. Add `initiator` column to `db/schema/votes.ts` + migration | plumber | done |
| 2. Write XML extractor: given vote's Drucksache(n), return the `Antrag der …` clause from the matching plenarprotokoll XML | plumber | done |
| 3. Normalize the clause to the existing party set via `parseProposingParty()` (it already handles `Fraktion der …` / `der Bundesregierung` / `des Bundesrates`) | plumber | done |
| 4. Backfill `initiator` for all 300 votes; XML primary, teaser via `parseProposingParty(document)` fallback when XML has nothing | plumber | done |
| 5. Verify the 9 known-bad votes now read correctly (table in Log section) | plumber | done |
| 6. Switch read path: `server/votes.ts`, `views/voteDetail/VoteDetail.tsx`, `VoteRow.tsx`, `useVoteListFilters.ts`, `server/parties.ts` to use `vote.initiator` directly; remove runtime calls to `parseProposingParty()` | backend → frontend | done |
| 7. Keep `parseProposingParty()` exported for ETL use only, move it under `etl/bundestag/votes/` or `db/` | plumber | done |
| 8. Fix extractor for bundled-Drucksachen Tagesordnungspunkte: match by title within the same `<tagesordnungspunkt>` block instead of walking back N chars from a Drucksache number | plumber | done |
| 9. Audit all 115 XML-resolved votes: any `<tagesordnungspunkt>` containing >1 distinct Fraktion phrase is suspect; list and re-verify | plumber | done |
| 10. Re-backfill, re-verify the original 9 + pp21-76-0 + pp21-76-0-zuruckweisung | plumber | done |

## Contracts

- New column: `initiator text` on `votes`. Values restricted to the same set `parseProposingParty()` already returns: `CDU/CSU`, `B90/Grüne`, `Die Linke`, `AfD`, `SPD`, `FDP`, `BSW`, `Bundesregierung`, `Bundesrat`, or `null` if truly unknown. Multi-Fraktion Anträge (rare) get the first matched party for now; revisit if it bites.
- XML source path: `etl/bundestag-reden-xml/raw/xml/<plenarprotokoll-id>.xml` where the plenarprotokoll-id is derivable from the vote id prefix `pp<period>-<sitzung>-…` → `<period><sitzung padded to 3>.xml`.
- Drucksache lookup: each vote has a `document` string containing `Drucksache 21/NNNN[, 21/MMMM]`. The SECOND Drucksache (when present) is the original Antrag; the FIRST is the Beschlussempfehlung. Extract from XML by searching for the second Drucksache number near phrases `Antrag der`, `Gesetzentwurf der`, `Entwurf eines … der Abgeordneten … und der Fraktion …`.

## Open questions

- Should we keep `document` as-is (raw teaser) for provenance, or also store the cleaned XML clause as `initiatorRaw`? Default: keep `document` untouched, no second raw column unless needed for audit.
- Worth adding a CHECK constraint on `initiator` values? SQLite doesn't enforce well; skip.

## Known bad rows (for verification in step 5)

| id | current `document` says | expected `initiator` |
|---|---|---|
| pp21-37-2 | Bundesregierung | AfD |
| pp21-37-3 | Bundesregierung | AfD |
| pp21-40-19 | Bundesregierung | AfD |
| pp21-68-16 | Bundesregierung | AfD |
| pp21-68-17 | Bundesregierung | AfD |
| pp21-68-18 | Bundesregierung | AfD |
| pp21-71-0 | Bundesregierung | B90/Grüne |
| pp21-71-1 | Bundesregierung | Die Linke |
| pp21-74-15 | Bundesregierung | AfD |

## Log

### 2026-05-14 — plumber

Steps 1–5 + 7 complete. Step 6 (read-path switch) left for backend/frontend.

**Shared parser location.** Moved `parseProposingParty()` to `db/parseProposingParty.ts` and added a `./parseProposingParty` export to `@machtblick/db`. The old `apps/bundestag/src/server/proposingParty.ts` is now a one-line re-export so existing imports keep working until step 6 deletes them. `db/normalize-results.ts` imports the shared one; the duplicated PARTY_PATTERNS block in that file is gone. `etl/bundestag/polarity/proposer.mjs` is unchanged — it's a .mjs ETL-internal file and its consumer (`polarity/run.mjs`) doesn't import TS. The initiator runner reuses that same .mjs so we don't introduce a third copy.

**Schema + migration.** Added `initiator text` to `db/schema/votes.ts`. `npm run db:generate` produced a migration that also re-added `is_petition_bundle` (drizzle's snapshot vs DB drift — migration 0015 was applied manually but the snapshot wasn't refreshed). Dropped the bogus line, renamed the file to `0016_votes_initiator.sql`, updated `meta/_journal.json` tag, renamed `meta/0014_snapshot.json` → `0016_snapshot.json`. Applied via `sqlite3 db/machtblick.sqlite < db/migrations/0016_votes_initiator.sql`. Note: this is the same flavor of drift documented in [drizzle_drift_dip_person_id]; the snapshot is divergent from the DB on multiple columns now.

**XML extractor.** `etl/bundestag/votes/initiator/extract.mjs`. Given a vote id, derives `<period><sitzung:03d>.xml`, parses Drucksachen out of `document`, picks the last one (when ≥2 it's the original Antrag, when 1 it's the only doc), then scans the XML for every occurrence of that Drucksache number and walks 800 chars backward. Looks for `(Antrag|Gesetzentwurf|Entwurf eines …) der|des … Fraktion …` first; falls back to `Bundesregierung`/`Bundesrates` patterns when no Fraktion phrase is in range. Returns the clause text; the runner feeds it to `parseProposingParty()`.

**Backfill.** `etl/bundestag/votes/initiator/run.mjs`. Single transaction over all 300 votes. Result: `xml=115 teaser=151 null=34`. 151 fell back to the teaser (`document` parses fine — Bundesregierung Gesetzentwürfe, Bundesrat, single-Drucksache Anträge where the teaser already names the Fraktion). 34 ended up NULL — all are votes with empty/non-parseable `document` (Haushalt Einzelpläne, Schlussabstimmungen, Wahlvorschläge, the Wahlprüfungs-Beschlussempfehlung). Distribution: Bundesregierung 150, AfD 54, B90/Grüne 29, CDU/CSU 22, Die Linke 10, SPD 1, NULL 34.

**9 known-bad verification.**

| id | initiator | expected | ok |
|---|---|---|---|
| pp21-37-2-grundlegende-steuerreform-… | AfD | AfD | yes |
| pp21-37-3-ehegattensplitting-… | AfD | AfD | yes |
| pp21-40-19-beschlussempfehlung-afd-antrag-stromsteuer-… | AfD | AfD | yes |
| pp21-68-16-ablehnung-des-afd-antrags-uberprufungsverfahren-… | AfD | AfD | yes |
| pp21-68-17-ablehnung-des-afd-antrags-gefalschte-… | AfD | AfD | yes |
| pp21-68-18-ablehnung-des-afd-antrags-obligatorische-… | AfD | AfD | yes |
| pp21-71-0-fahren-ohne-fahrschein-entkriminalisieren-b90-grune | B90/Grüne | B90/Grüne | yes |
| pp21-71-1-straffreiheit-fur-fahren-ohne-fahrschein-die-linke | Die Linke | Die Linke | yes |
| pp21-74-15-anderung-des-bundesrechnungshofgesetzes-afd-gesetzentwurf | AfD | AfD | yes |

All 9 now resolve correctly. XML clauses for the AfD votes correctly extract `Antrag der Abgeordneten … und der Fraktion der AfD`; for pp21-71-0/1 the period-71 XML names both Anträge separately with `Gesetzentwurf der Fraktion Bündnis 90/Die Grünen` and `Gesetzentwurf der Fraktion Die Linke`, picked by their respective second Drucksache (2722, 1757).

**Cron wiring.** Added `npm run etl:initiator` and chained into `handzeichen/refresh.mjs` after polarity, before descriptions. Idempotent: just rewrites the column from current data.

**Step 6 contract for backend/frontend.** Read `votes.initiator` directly from the DB. Drop calls to `parseProposingParty(v.document)` in `server/votes.ts` (lines 70/95/194), `server/parties.ts` (line 248), and any downstream view consumers. The shared parser stays at `db/parseProposingParty.ts` for ETL only.

### 2026-05-14 — plumber (steps 8–10)

**New extractor.** Title-first lookup added to `etl/bundestag/votes/initiator/extract.mjs`. Parses every `<p klasse="…">` in the XML into ordered paragraph blocks, then for a given vote: strips the trailing `(Fraktion)` suffix off the title, finds the `T_fett` whose normalized text (whitespace-collapsed, lowercased) equals it, then walks backward through preceding paragraphs looking for a `T_ZP_NaS`/`T_NaS` whose text contains an `Antrag/Gesetzentwurf … der Fraktion …` (or `… der Bundesregierung`/`… des Bundesrates`) clause. Stops at the previous `T_fett` so we never cross into another agenda item's proposer. Falls back to the old Drucksache-window walk when no `T_fett` matches (e.g. Wahl/Wahlvorschlag titles, Schlussabstimmungen) so we don't regress anything. Runner now passes `title` through.

**Audit.** `etl/bundestag/votes/initiator/audit.mjs` lists every XML-resolved vote whose `<tagesordnungspunkt>` block contains >1 distinct Fraktion or mixes Fraktion with Bundesregierung/Bundesrat. 51 suspects flagged of 266 non-null initiators (many false-positive Sammelübersicht groupings where consecutive petition entries in one TOP each name a different proposer — those are correct as is, the audit just doesn't model petition rows). The actual change set after re-running is much smaller.

**Backfill result.** Same totals as before: `xml=115 teaser=151 null=34`. Three rows changed initiator vs prior run:

| id | old | new | reason |
|---|---|---|---|
| pp21-76-0-europarecht-einhalten-… | Die Linke | B90/Grüne | bundled-Drucksachen TOP, target fix |
| pp21-45-6-finanzplan-des-bundes-2025-bis-2029 | SPD | Bundesregierung | Haushalt Einzelplan; title now matches `T_fett` of the Bundesregierung-eingebrachte Entwurf |
| pp21-40-15-wahl-von-mitgliedern-des-beirates-der-stiftung-datenschutz | AfD | CDU/CSU | Wahlvorschlag preamble names CDU/CSU first in `Wahlvorschläge der Fraktionen der CDU/CSU, AfD und SPD …`; previously the Drucksache-walk picked AfD |

All 9 original known-bad votes remain correctly attributed (AfD ×7, B90/Grüne ×1, Die Linke ×1). The second pp21-76-0 vote (`zuruckweisung-von-schutzsuchenden-beenden`) is now also correct at `Die Linke` instead of accidentally-also-Die-Linke-but-via-wrong-Drucksache.

### 2026-05-14 — backend (step 6)

Switched the read path off `parseProposingParty(v.document)` and onto the `votes.initiator` column. Kept the server contract field name as `proposingParty` so frontend (VoteDetail, VoteRow, useVoteListFilters, VotesList, routes/votes/$id.tsx for SEO description, routes/votes/index.tsx for the party filter) is untouched. No view changes needed.

Files changed:
- `apps/bundestag/src/server/votes.ts` — dropped the `./proposingParty` import; lines 70/95/194 now read `v.initiator` / `vote.initiator` from the row (full `select()` already includes it).
- `apps/bundestag/src/server/parties.ts` — dropped the import; replaced the partial select's `document` column with `initiator` and the proposer filter loop now compares `v.initiator !== party` directly.
- `apps/bundestag/src/server/proposingParty.ts` — deleted (was a one-line re-export of `@machtblick/db/parseProposingParty`). No remaining app-code imports of the parser; ETL keeps using the shared `db/parseProposingParty.ts`.

Pre-existing typecheck error in `parties.ts` (PartyVoteRow.cohesion typed `number` but assigned `number | null`) is unrelated and predates this change — confirmed by stashing.

Curl verification against `http://localhost:3000` (the `192.168.8.62` IP wasn't reachable from the agent shell; the dev server is the same process, just bound on a different interface):

| URL slug | proposingParty in SSR payload |
|---|---|
| pp21-71-0-fahren-ohne-fahrschein-entkriminalisieren-b90-grune | B90/Grüne |
| pp21-76-0-europarecht-einhalten-schutzbedurftige-schutzen-zuruckweisungen-an-den-binnengre | B90/Grüne |
| pp21-76-0-zuruckweisung-von-schutzsuchenden-beenden | Die Linke |
| pp21-40-15-wahl-von-mitgliedern-des-beirates-der-stiftung-datenschutz | CDU/CSU |
| pp21-45-6-finanzplan-des-bundes-2025-bis-2029 | Bundesregierung |

(The task's shorthand slug `pp21-40-15-wahl-stiftung-datenschutz` fell through to the SPA-fallback index.html — that's not a real prerendered path; the actual slug is the full title-derived one above.)

`useVoteListFilters.ts` eyeballed: it reads `v.proposingParty` only, no parser reference. Party filter chip on `/votes` keeps working since the field name is unchanged and values still come from the same closed set.
