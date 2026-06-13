# Namentlich Source ID Parser

## Goal

Fix the term 21 roll-call importer so current Bundestag HTML yields a stable `bundestag_id` for newly published namentliche votes.

## Status

Done.

## Scope

- Touch only the namentliche vote importer/parser path.
- Parse source IDs from current Bundestag upstream HTML.
- Do not run broad refreshes or deploy.

## Log

### plumber

- Opened the plan after `npm run etl:votes:namentlich -- --term 21 --aw-period 161` failed on `2026-06-11` with a missing source ID for `Jahresemissions-gesamtmengen-Verordnung 2031-2040`.
- Updated the importer detail-key normalization so list titles and detail-card titles still match when Bundestag changes punctuation or word breaks.
- Reused matched detail cards for duplicate XLSX rows and deduped parsed links by source ID, covering the duplicate `1008` download row in the current HTML.
- Added an existing-vote skip for the unscoped importer so reruns do not rewrite older source-ID rows when the local DB is already current.
- Verified `npm run etl:votes:namentlich -- --term 21 --aw-period 161 --source-id 1008` completed with `namentliche votes: 1; ballots: 630`.
- Verified `npm run etl:votes:namentlich -- --term 21 --aw-period 161` completed with `namentliche votes: 0; ballots: 0` because the local DB already had the `2026-06-11` votes.
