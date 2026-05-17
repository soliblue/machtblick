# 42 Data Mapping Audit

## Goal

Audit Bundestag data linkages and fix obvious correctness issues in local data or ETL so pages do not miss links, show wrong parties, or expose orphaned records.

## Scope

- Check Antrag to vote links.
- Check vote documents against Antrag Drucksachen.
- Check Antrag signatories against members and party-at-date mappings.
- Check speech to vote links and obvious missing debate links.
- Check member, mandate, affiliation, party summary, and ballot consistency.
- Check generated descriptions, translations, and simplified titles for orphaned rows.
- Fix clear data or ETL issues discovered during the audit.

## Contracts

- Fix data in ETL or normalization scripts when the read path would otherwise compensate for bad source shape.
- Keep canonical URLs English-only except the `/en` locale prefix.
- Do not remove data unless it is proven generated stale data or can be regenerated.
- Record unresolved data gaps with counts and examples.

## Status

- Completed.

## Log

### lead

- Started a data-quality audit from a clean `main`.
- Found and fixed namentliche count drift by deriving vote and party totals from the same ballot-choice mapping used for `vote_members`.
- Fixed hand-vote party summary generation so it imports through project aliases, updates existing votes, and filters parties by the active term affiliation on the vote date.
- Backfilled agenda items from protocol XML with a corrected date-to-session map and conservative title fallback for term 21 hand votes only.
- Restored debate linkage for vote and Antrag detail pages by loading speeches from vote date plus agenda item, with `vote_id` fallback.
- Normalized official term 21 member replacements and merged duplicate member identities for Thomas Ladzinski and Daniel Zerbin.
- Regenerated local data through the repaired ETL scripts and refreshed the sitemap, which removed stale duplicate member URLs.
- Verified no orphan relation rows across vote, Antrag, Anfrage, member, mandate, affiliation, and speech link tables.
- Verified no duplicate `bt_mdb_id` members and no duplicate term 21 mandates.
- Verified term 21 vote member rows have a date-valid affiliation and match the recorded ballot party.
- Verified vote totals and vote party summaries match member ballots exactly.
- Verified term 21 active affiliations on 2026-05-17 total 630 members: AfD 150, B90/Grüne 85, CDU/CSU 208, Die Linke 64, SPD 120, fraktionslos 3.
- Verified speech coverage after agenda repair: namentliche 47 of 51, handzeichen 157 of 248, hammelsprung 1 of 1.
- Left 4 namentliche votes without speech linkage because the same-day protocol blocks do not contain a safe Drucksache or agenda match.
- Left 9 exact vote-document-to-Antrag Drucksache matches unlinked because they are procedural referral or committee-assignment decisions, not substantive Antrag votes.
- Left 11 term 21 Gesetzentwürfe without summaries because the DIP rows have no Drucksache source to summarize.
- Ran `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
- Ran `npx tsc --noEmit --skipLibCheck --moduleResolution Bundler --module ESNext --target ES2022 --allowImportingTsExtensions db/normalize-term21-member-replacements.ts etl/bundestag/votes/import-namentlich.ts etl/bundestag/votes/backfillAgendaItem.ts`.
- Ran `npm --workspace @machtblick/bundestag run build`.
- Ran `git diff --check`.
