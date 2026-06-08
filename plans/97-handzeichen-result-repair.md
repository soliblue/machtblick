# Handzeichen Result Repair

## Goal

Fix the vote page for `pp21-80-1-modernisierung-der-nationalen-umsetzung-europaischer-regelungen-zum-okodesign-un`, which renders `abgelehnt` although the extracted protocol vote was accepted.

## Evidence

- User reported `https://machtblick.de/votes/pp21-80-1-modernisierung-der-nationalen-umsetzung-europaischer-regelungen-zum-okodesign-un/` says rejected.
- `etl/bundestag/handzeichen/extracted/21-80.json` has this vote as `outcome: "angenommen"`, with CDU/CSU and SPD voting yes.
- The local DB row has `result: "abgelehnt"` and `document: "Antrag der Fraktion der AfD (Drucksache 21/6051, 21/5141)"`.
- DIP cache for Drucksache `21/6051` says it is a committee recommendation for the government bill on Drucksache `21/5141`.
- `db/normalize-results.ts` flips accepted votes to rejected when the parsed proposing party voted no. The bad document label made the later normalization flip this government bill.

## Plan

1. Patch handzeichen proposer resolution to ignore committee recommendations as direct proposers and resolve through underlying Antrag or Gesetzentwurf documents.
2. Back up the SQLite DB before any write.
3. Regenerate handzeichen proposer labels, normalization, and static Bundestag data.
4. Verify the affected public JSON says `angenommen`, keeps the linked government bill, and the app builds.

## Log

- Lead created this plan after tracing the bad result to normalization after a wrong document proposer label.
- Lead patched `etl/bundestag/handzeichen/write.mjs` so existing handzeichen vote rows refresh their extracted result and document fields.
- Lead patched `etl/bundestag/handzeichen/proposers.mjs` so committee recommendations resolve through their underlying Antrag or Gesetzentwurf text and same-vorgang documents.
- Lead backed up SQLite to `runs/_app-server/db-backups/machtblick-20260608T203944Z-before-handzeichen-result-repair.sqlite`.
- Lead reran handzeichen write, proposer resolution, and `npm run db:normalize`.
- The affected vote now has `result: "angenommen"` and `document: "Gesetzentwurf der Bundesregierung (Drucksache 21/6051, 21/5141)"`.
- `npm run build -w @machtblick/bundestag` passed and regenerated the page with `Angenommen`.
- `npm run db:validate:votes` passed with the existing `missing_vote_summaries_total=19`.
