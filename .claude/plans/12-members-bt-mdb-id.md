# 12 — members.bt_mdb_id from MdB-Stammdaten

## Goal

Replace name fuzzy-matching in the speeches ETL with a deterministic join on the Bundestag MdB-Stammdaten ID, the same id that appears in protocol XML as `<redner id="11005100">`.

Today's name matcher in `etl/bundestag-reden-xml/ingest.ts` works (12,195 of ~13k MdB-attributable rows linked) but fails on rare edge cases (Doppel-Nachnamen, marriage name changes, transliteration). Stammdaten ID join is bulletproof and removes a maintenance liability.

## Source

Bundestag MdB-Stammdaten XML feed. Plumber: locate the canonical URL — `https://www.bundestag.de/xml/mdb/index.xml` was referenced in old open-data docs; verify it still serves and covers 21. BT. If not, fall back to scraping the per-member pages or DIP `/person` endpoint.

The file should contain, per MdB: stable numeric id, vorname, nachname, party/fraktion, optional title/namenszusatz.

## Schema change

`members.bt_mdb_id: text` (or integer — match how it appears in protocol XML; safer as text to avoid leading-zero loss). Indexed. Nullable until backfill completes.

## ETL

`etl/bundestag-stammdaten/` (new):
- `fetch.ts` — download the index XML once, cache to `raw/`.
- `ingest.ts` — parse, build `(firstName, lastName) → btMdbId` map, update existing `members` rows. Print: matched, unmatched-our-side (member in DB but not in feed), unmatched-feed-side (feed has someone we don't), conflicts (same name, different ids).

Don't *create* members from the feed in v1 — our `members` table is sourced from abgeordnetenwatch and that's the source of truth for membership. We only enrich.

## Linkage update

`etl/bundestag-reden-xml/ingest.ts`:

```
1. if redner_id is in btMdbId map → use that member
2. else fall back to current name-key lookup
3. else null
```

Government IDs (`999...`) get skipped at step 1 and naturally fall through to null since they're not in members anyway.

## Acceptance

Re-run `etl:speeches:xml`. Plan-10 baseline: 12,195 MdB-linked, 2 unmatched (already excellent), but name-matcher is brittle. After: same numbers, plus `redner_id`-based hits should account for ≥95% of MdB rows. Log "linked via mdb_id" vs "linked via name" counts.

## Open questions

- Are the 21. BT XML protocols using the same id-space as the historical MdB-Stammdaten feed, or did they reset? Plumber: spot-check 3 known MdBs across both sources.
- Do we want to backport this for abgeordnetenwatch matching too (members already have an aw id)? Out of scope for this plan, just noting.

## Status

- done.

## Log

- 2026-05-13 plumber: shipped `etl/bundestag-stammdaten/{fetch,ingest}.ts`, `members.bt_mdb_id` column + index, and id-first matching in the speeches XML ingest. Result: 99.9% of MdB-linked speeches now resolved deterministically via Stammdaten ID; name fallback only fires when redner-id is missing (continuation segments).

  **Feed.** `https://www.bundestag.de/xml/mdb/index.xml` serves but only carries the 4-digit `mdbID` (e.g. `2314`) — not the 8-digit Stammdaten ID (e.g. `11005100`) used by protocol XML. The 8-digit IDs live in **`https://www.bundestag.de/resource/blob/472878/c2ee46c6dadbf6f06ee27d5618fd24e9/MdB-Stammdaten-data.zip`** → `MDB_STAMMDATEN.XML`. That's what we use. 15 MB XML, ~one root `<MDB>` per MdB ever, `<NAMEN><NAME>` with `HISTORIE_VON/_BIS` capturing marriage-name changes etc.

  **Schema.** Added `members.btMdbId: text('bt_mdb_id')` (nullable, indexed). Migration `0008_bt_mdb_id.sql` applied directly via sqlite3 (the existing `0007_anfragen_answer_text` + `0007_rare_rhino` collision needed a rename; journal updated). No `dip_person_id` drift this time — drizzle-kit did not synthesize a DROP because the column isn't in the snapshot history (separate from the `members.dip_person_id` drift documented in plumber notes, which still applies on future generates).

  **Stammdaten ingest.** Parses all MdBs with a `<WAHLPERIODE><WP>21</WP>` entry (635 in feed) and walks every `<NAME>` block per MdB (so marriage-name changes index both legal names). Two name-key indexes: primary key uses full first-name + last-name normalized; fallback key strips to first whitespace token of first-name. Also strips noble particles (`von van de der dos da di freiherr graf …`) and academic honorifics. Updates `members.bt_mdb_id` for every match; never inserts. Idempotent (re-running shows 635 already-set).

  Final numbers:
  - feed WP21 MdBs: 635
  - our members rows: 636
  - matched (bt_mdb_id populated): 635
  - conflicts: 0
  - unmatched our-side: 0
  - unmatched feed-side: 1 (`11003821 Henning Otte` — Nachrücker; abgeordnetenwatch hasn't surfaced him yet, same speaker that plan 10 logged as unmatched)

  **Speeches ingest update.** `etl/bundestag-reden-xml/ingest.ts` resolution order is now: skip `999*` government IDs → look up via `<redner id>` in `bt_mdb_id` map → fall back to name-key matcher → null. Logs `via mdb_id` vs `via name` counts.

  Re-run results (78 sessions, 25 463 speeches):
  - matched=12 196 (was 12 195 in plan-10 baseline; gain of 1 from Charlotte Antonia Neuhäuser, whose DB row has middle name `Antonia` but the protocol drops it — name-only match failed, id match succeeded)
  - via mdb_id=12 185 (99.9% of MdB-linked rows)
  - via name=11 (continuation segments parsed from inline `<name>…:</name>` markers that don't carry a `<redner id>`; these are the few cases where id-join is genuinely impossible)
  - role-based=13 266 (unchanged)
  - unmatched=1 (only `Otte, Henning` remains — was 2 with Neuhäuser, now resolved)

  **Spot-checks (open question — id-space alignment).** Confirmed three protocol `<redner id>`s map cleanly into Stammdaten:
  - `11005100` → Kaufmann, Michael (Stammdaten + protocol agree on name) ✓
  - `11003440` → Griese, Kerstin (Parl. Staatssekretärin BMAS; agree) ✓
  - `11004617` → **Schmitt → Kemmer** in Stammdaten (marriage name change with `HISTORIE_VON/BIS`), protocol uses current name `Kemmer`. Stammdaten emits both historic names per MdB so either lookup works ✓

  This third case is the headline payoff for switching to id-join: name-match would have to know the marriage history; id-match doesn't care.

  **Coverage delta vs plan-10 baseline.** No change in vote linkage (still 6082/300 — that's plan 11's territory) or role-based count (13266). Speaker linkage went from `12195+13266+2=25463` → `12196+13266+1=25463`. Tiny absolute delta, but the qualitative win is bigger: future marriage names, transliteration drift, and stray middle names no longer cause silent unmatches — only speakers genuinely missing from our `members` table do.

  **Files.** `etl/bundestag-stammdaten/{fetch,ingest,package,.gitignore}.ts`, `etl/bundestag-stammdaten/raw/MDB_STAMMDATEN.XML` (gitignored), `db/schema/members.ts`, `db/migrations/0008_bt_mdb_id.sql`, `db/migrations/meta/_journal.json` (tag rename), `etl/bundestag-reden-xml/ingest.ts`, root `package.json` (scripts).

  **Surprises / notes.**
  - The first failed run on Node 18 (better-sqlite3 ABI mismatch) silently committed nothing then errored; second run on Node 22 wrote the rows. ETL scripts in this repo need Node ≥ 22.
  - drizzle's `db.transaction(callback)` executes the callback immediately and returns its result, unlike better-sqlite3's `db.transaction(fn) → callable` pattern. Don't `tx()` afterwards.
  - The published `bundestag.de/xml/mdb/index.xml` is **not** sufficient on its own — useful for the photo/biography URLs and the 4-digit `mdbID`, but the Stammdaten ID we actually need only appears inside the per-MdB bio pages and (canonically, in bulk) in the Stammdaten ZIP. Worth noting if anyone wonders why we don't just hit the index URL.
  - Noble particles and middle-name middle-tokens are real, recurring causes of name-match misses. The new ingest handles both via its two-key strategy; same approach should be reused if/when we add a `members.aw_id` backfill.
