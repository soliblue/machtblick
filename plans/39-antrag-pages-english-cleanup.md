# 39 Antrag Pages And English Cleanup

## Goal

Make Antrag pages first-class, keep vote pages as the place for vote-specific data, and make English route behavior consistent enough that language switching does not lead to missing pages.

## Scope

- Add Antrag-level description storage.
- Backfill Antrag descriptions from existing vote descriptions where the source Drucksache matches an Antrag.
- Add German and English Antrag detail routes.
- Link member Antrag rows to the vote page when a linked vote exists, otherwise to the Antrag page.
- Add missing English route counterparts for current German pages or redirect them deliberately.
- Include Antrag pages in prerendering, sitemap, and static JSON output.

## Contracts

- `votes` remains the source of vote results, ballots, party summaries, and vote debate data.
- `antraege` remains the source of Antrag metadata from DIP.
- `antrag_descriptions` stores simplified German descriptions for Antrag pages.
- `antrag_description_translations` stores English description overlays.
- Antrag detail reads Antrag descriptions first, then falls back to `antraege.abstract`.
- Existing vote summaries are duplicated into Antrag description tables only when `vote_description_decisions.drucksache_id` exactly matches `antraege.drucksache`.

## Open Questions

- Full generation for all missing Antrag descriptions still needs a long-running ETL pass through a local agent CLI. This change wires the tables and safe backfill, but does not regenerate hundreds of new summaries during app implementation.

## Status

- Complete.

## Log

### lead

- Created the implementation plan.
- Added Antrag description tables, migration, and backfill script.
- Backfilled 111 German and 110 English Antrag descriptions from existing vote summaries.
- Added German and English Antrag detail routes, views, prerender paths, sitemap entries, and static JSON output.
- Linked member Antrag rows to vote pages when a linked vote exists, otherwise to Antrag pages.
- Added missing English route counterparts and localized the speech, member Antrag, and Anfrage surfaces touched by this work.
- Added friendly not-found handling to dynamic vote, member, party, and Antrag pages.
- Verified typecheck, production build, route parity, diff whitespace, and Antrag-vote link integrity.
