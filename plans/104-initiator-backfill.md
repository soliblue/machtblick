# 104 Initiator Backfill

## Goal
User spotted "Sonstige/Other" as proposer on the votes home for the Vaterschaftsanerkennungen Gesetzentwurf (2026-06-12), which is a Bundesregierung bill. 1456 of 2124 votes have empty initiator. Petition bundles legitimately have none, but bills/motions imported via the namentlich importer lack initiator extraction entirely (no context_json/procedure_json either). Fix in ETL + backfill, not in the app.

## Status
- investigation: done
- importer fix: done
- backfill: done (applied 2026-07-04)

## Contracts
- votes.initiator (db/schema.ts) feeds proposingParty on the list payload (src/server/votes.ts)
- UI maps empty initiator to Sonstige (PartyBadge); after backfill only genuinely initiator-less votes remain empty
- Example broken row: votes.id = 2026-06-12-1009-gesetzentwurf-zur-verhinderung-missbrauchlicher-anerkennungen-der-vaterschaft → now `Bundesregierung`

## Open questions
(none)

RESOLVED 2026-07-04: user decided initiator-less votes keep the generic "Sonstige" label. No UI change.

## Log
- lead: created plan 2026-07-04 after user report
- plumber 2026-07-04: root causes found. (1) Genitive regex bug in both proposer parsers: `(?:es)?` misses "Gesetzentwurfs/Antrags der Bundesregierung" (the Vaterschaft example). (2) `etl/bundestag/polarity/proposer.mjs` lacked the literal `B90/Grüne` pattern that `db/partyPatterns.ts` has. (3) `initiator/run.mjs` nulled every row it couldn't resolve, so nothing could durably backfill. (4) ~1300 empty rows are the historical WP12-20 dataset whose `document` is often just `BT-Drs. N/M`, resolvable via DIP.
- plumber 2026-07-04: fixes. Parsers fixed in `db/parseProposingParty.ts`, `etl/bundestag/polarity/proposer.mjs` (genitive, Initiative:, Bundesministerium, BReg abbrev, B90/Grüne), `etl/bundestag/votes/import-namentlich.ts` (genitive at ingest). `initiator/run.mjs` now preserves existing initiators. New `db/backfill-initiators.ts` (`npm run db:backfill:initiators`): document text → vote_documents titles → DIP Drucksache (urheber, then `/vorgang/{id}` initiative; BT-herausgeber preference; `f.vorgang` list filter is broken for old ids) → Haushalt title rule. Skips petition bundles, procedural votes, MP-group motions. Chained into `etl/bundestag/handzeichen/refresh.mjs` after `initiator/run.mjs` and as source step 10 in `prompts/auto-refresh.md`. Also fixed BR-doc-shadows-BT bug in `etl/bundestag/handzeichen/proposers.mjs`.
- plumber 2026-07-04: counts. Before: 1456/2124 empty. After run.mjs recompute (xml=83 teaser=886) + backfill (voteDocs=374 dip=435 haushalt=17): **329/2124 empty = 75 petition bundles + 34 procedural + 220 unresolvable** (MP-group/free votes, committee-initiated Vermittlungsausschuss items, old rows with no structured source; 9 of the 220 are explicit MP-group skips). Vaterschaft example → Bundesregierung. Backfill surfaced one genuine missed inversion (pp21-86-0 Patientenrechte, B90/Grüne self-NO) which self-no-escalate inverted (POLARITY_PROVIDER=claude, codex quota exhausted until Aug 2); audit-self-no and audit-suspicious-initiator both clean. DB backup at runs/_app-server/db-backups/machtblick-20260704-pre-initiator-backfill.sqlite. Quirks documented in .claude/agents/plumber.md.
