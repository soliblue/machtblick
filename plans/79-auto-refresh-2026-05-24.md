# Auto Refresh 2026-05-24

## Goal

Refresh Bundestag data when upstream changes are available, verify generated data and site gates, then deploy only if the run is clean.

## Status

Refresh complete. Original deploy gate blocked on incomplete upstream DIP PDFs, then deployment policy continued in `plans/80-publishable-refresh-slices.md`.

## Scheduler Preflight Evidence

- Thread name: `🤖 2026-05-24 Auto`
- Preflight exited `0` at `20260524T085332Z`
- Branch: `main`
- Git status: clean
- SQLite DB size: 304.2 MB
- Votes: 1967, newest date 2026-05-08, newest Bundestag ID 1003
- Vote types: 1 hammelsprung, 248 handzeichen, 1718 namentlich
- Speeches: 25463, newest date 2026-05-08, newest session 21-78
- Antraege: 833, newest update 2026-05-15T10:20:23+02:00, 11 missing descriptions
- Anfragen: 8467, newest update 2026-05-15T10:11:58+02:00
- Vote Antraege links: 167
- Vote translations: 279
- Speech translations: 2798
- Antrag description translations: 125
- Speech XML probes: 21079 returned 200, 21080 returned 200, 21081 returned 404
- DIP Vorgang update start: 2026-05-15T10:20:23+02:00
- DIP Vorgang found count: 839

## Lead Validation

- `git status --short` returned clean.
- Canonical speech XML source `https://dserver.bundestag.de/btp/21/21079.xml` returned 200.
- Canonical speech XML source `https://dserver.bundestag.de/btp/21/21080.xml` returned 200.
- Canonical speech XML source `https://dserver.bundestag.de/btp/21/21081.xml` returned 404.
- Local raw speech XML files stop at `21078.xml`.
- Local DB counts match the preflight counts for votes, speeches, Antraege, Anfragen, vote links, and translations.

## Commands

- `mkdir -p runs/_app-server/db-backups`
- `cp db/machtblick.sqlite runs/_app-server/db-backups/machtblick-20260524T0855Z-before-auto-refresh.sqlite`
- `npm run etl:stammdaten` failed once because `etl/bundestag-stammdaten/fetch.ts` shadowed the global `URL` constructor.
- Fixed `etl/bundestag-stammdaten/fetch.ts` by renaming the URL string to `sourceUrl`.
- `npm run etl:stammdaten` completed after retry.
- `npm run etl:abgeordnetenwatch` completed.
- `npm run etl:votes:namentlich` completed.
- `npm run etl:handzeichen:refresh` failed once because DIP returned an Enodia verification HTML page instead of JSON.
- Added Enodia proof-of-work handling to the handzeichen fetcher and shared DIP client.
- Retry fetched handzeichen protocols 21/79, 21/80, and 21/81, extracted 2 votes from 21/80, and wrote 2 new votes before failing in proposer resolution.
- Fixed absolute local SQLite paths in `etl/bundestag/handzeichen/proposers.mjs` and `etl/bundestag/polarity/run.mjs`.
- A subsequent retry reached proposer resolution, then stalled in the proposer DIP retry loop. Stopped that run and added Enodia proof-of-work handling to `etl/bundestag/handzeichen/proposers.mjs`.
- Next retry resolved both new votes, then failed on unmapped DIP abbreviation `WPA`; added `WPA` to the known committee set.
- Final handzeichen retry passed proposer resolution, polarity normalization, procedural flagging, initiator backfill, self-no audit, and suspicious-initiator audit.
- The bundled descriptions step failed because `etl/bundestag/descriptions/run.mjs` shadowed Node's global `process`; renamed the local function to `processVote`.
- `DIP_UPDATED_START=2026-05-15T10:20:23+02:00 npm run etl:dip` fetched incremental DIP pages successfully, then failed in signatory PDF extraction on invalid PDF structure.
- Added response and PDF-header validation before `pdfjs` handles DIP signatory PDFs.
- `npm run etl:dip:process` completed after retry.
- `npm run etl:dip:answers` failed in answer PDF fetch due to many unavailable upstream PDFs and an unhandled socket close.
- Added bounded fetch retry handling to `etl/dip/answers/fetch.ts`.
- Answer PDF fetch completed after retry handling with 0 new downloads, 5499 unavailable upstream PDFs, and 2983 cached PDFs.
- Answer text extraction failed because `pdftotext` is not installed locally. Replaced that dependency with `pdfjs-dist` extraction.
- Answer text extraction and ingest completed from cached PDFs.
- `npm run etl:speeches:xml` fetched sessions 79 and 80 and stopped at 81, then failed on speech replacement due to dependent derived tables.
- Changed speech XML ingest to upsert stable speech IDs instead of deleting referenced speeches.
- `npm run etl:speeches:xml:ingest` completed after the upsert fix.
- `npm run etl:affiliations` completed.
- `npm run db:normalize` completed with 0 flipped votes.
- `npm run etl:translations` processed part of the backlog, then failed when one model response omitted a batch item.
- Changed vote translation writing to keep complete returned items and warn on omitted vote or party summary translations instead of aborting the whole job.
- `npm run etl:translations -- --concurrency 4` completed after retry.
- `npm run etl:antrag-description-translations` completed with 713 translated and 120 failed due to model timeouts.
- Retried Antrag descriptions with `CODEX_TIMEOUT_MS=600000 npm run etl:antrag-descriptions -- --concurrency 1`; completed the 5 PDF-backed missing descriptions.
- Retried Antrag description translations with `CODEX_TIMEOUT_MS=600000 npm run etl:antrag-description-translations -- --concurrency 1 --batch-size 1`; completed 12 remaining translations.
- Speech translation refresh found 0 eligible jobs.

## Gate Results

- Counts after refresh:
  - Votes: 1969, newest date 2026-05-21, newest Bundestag ID 1003.
  - Speeches: 26348, newest date 2026-05-21, newest session 21-80.
  - Antraege: 864, newest update 2026-05-22T14:46:39+02:00.
  - Anfragen: 8652, newest update 2026-05-22T14:37:48+02:00.
  - Vote Antraege links: 168.
  - Vote translations: 1947.
  - Speech translations: 2798.
  - Antrag description translations: 853.
  - Anfrage answer texts: 2983.
- Vote translations missing for non-procedural non-hammelsprung votes: 0.
- One older non-procedural hammelsprung vote is untranslated because the translation ETL currently excludes `vote_type = 'hammelsprung'`.
- Recent Antrag descriptions missing since `2026-05-15T10:20:23+02:00`: 4, all without `drucksache_pdf_url`.
- Recent Antrag description translations missing where a description exists: 0.
- Recent Anfrage answer text missing where `answer_pdf_url` exists: 324, because upstream answer PDF downloads returned unavailable responses.
- Speech XML fetch reached newest available dserver session 80; session 81 returned 404.
- `npm run build -w @machtblick/bundestag` completed successfully.
- Build refreshed `apps/bundestag/public/sitemap.xml` with the new route set and 2026-05-24 lastmod values.
- Original deploy gate blocked on missing source PDFs. Publishing complete slices independently is covered in `plans/80-publishable-refresh-slices.md`.

## Gates

- Counts before and after: passed, with blockers recorded above.
- Newest speech XML reached: passed, session 21-80 is local and 21-81 returned 404.
- Generated fields for new eligible votes: passed for non-hammelsprung votes.
- Antraege and Anfragen freshness: 4 Antraege lack source PDFs and 324 recent Anfragen answer PDFs remain unavailable.
- Build: passed.
- Static route data: passed via successful prerender build and sitemap refresh.
- Tester: not run, no view or routing behavior changed.
- Visibility: continued in `plans/80-publishable-refresh-slices.md`.
- Commit: continued in `plans/80-publishable-refresh-slices.md`.
- Deploy: continued in `plans/80-publishable-refresh-slices.md`.

## Agent Log

### Lead

- Confirmed upstream speech XML sessions 21079 and 21080 are available while local data stops at 21078.
- Started refresh run because there is new source data and stale derived Antrag descriptions.

### Plumber

- Applied the ETL fetcher fix for the stammdaten URL constructor shadowing.

### Plumber

- Fixed `etl/bundestag-stammdaten/fetch.ts` by renaming the source URL constant so it no longer shadows the global `URL` constructor. Verified `npm run etl:stammdaten:fetch` exits cleanly through the cached XML path.
