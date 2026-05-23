# 57 Derived Data Read Path Audit

## Goal

Review the Bundestag app for derived public-data fields that are computed in app read paths instead of being materialized through ETL or SQL.

## Scope

- Audit `apps/bundestag/src`, `apps/bundestag/vite-data`, and `apps/bundestag/vite.config.ts`.
- Identify likely violations of the durable data guidance.
- Propose concrete fixes without implementing them in this pass.

## Status

Completed.

## Findings

1. Agenda titles are extracted in app code.
   - `apps/bundestag/src/server/speechAgendaTitles.ts` reads raw speech XML, parses `T_fett` and `T_NaS`, cleans text, and keeps an in-memory map.
   - Used by `apps/bundestag/vite.config.ts`, `apps/bundestag/vite-data/members.ts`, `apps/bundestag/src/server/members.ts`, and `apps/bundestag/src/server/speeches.ts`.
   - Fix: add a materialized agenda item table keyed by date, session, and agenda item. Populate it from the speech XML ETL with source title, cleaned title, and review status. App reads the stored title only.

2. Speech to vote links are inferred repeatedly in app queries.
   - `apps/bundestag/vite.config.ts`, `apps/bundestag/vite-data/members.ts`, `apps/bundestag/src/server/members.ts`, and `apps/bundestag/src/server/speeches.ts` use a same-day agenda item fallback with vote type ordering.
   - Fix: materialize canonical speech vote links in SQL, either by writing deterministic links to `speeches.vote_id` or by adding a `speech_vote_links` table with source, confidence, and review status. App queries should join that result.

3. Vote and motion debate rows are inferred from agenda item fallbacks in detail loaders.
   - `apps/bundestag/src/server/votes.ts`, `apps/bundestag/src/server/antraege.ts`, and `apps/bundestag/vite-data/votes.ts` choose speeches by date plus agenda item, then fall back to direct `vote_id`.
   - Fix: reuse the materialized speech vote link or create a materialized debate group table keyed by agenda item, vote, and source.

4. Antrag source document selection still falls back to app heuristics.
   - `apps/bundestag/src/server/votes.ts` imports the ETL picker and `apps/bundestag/vite-data/votes.ts` has a duplicate picker for primary Antrag PDFs when `vote_description_decisions` is missing.
   - Fix: materialize document roles or a primary document choice during ETL for every vote document set. App reads `vote_description_decisions` or a future `vote_document_roles` table only.

5. Party name normalization is scattered through app and static data generation.
   - Speech party aliases and Antrag initiator aliases appear in `apps/bundestag/src/server/speeches.ts`, `apps/bundestag/src/server/members.ts`, `apps/bundestag/src/server/votes.ts`, `apps/bundestag/src/server/antraege.ts`, `apps/bundestag/vite.config.ts`, `apps/bundestag/vite-data/members.ts`, `apps/bundestag/vite-data/votes.ts`, `apps/bundestag/vite-data/antraege.ts`, and `apps/bundestag/src/lib/parties.ts`.
   - Fix: normalize upstream party names into canonical DB values during ingestion, with a small alias table or ETL map. Keep `src/lib/parties.ts` for display labels, colors, logos, and slugs only.

6. Member speech grouping has become a product-facing definition of "Reden".
   - `apps/bundestag/src/hooks/memberSpeechGroups.ts` groups by date plus agenda item or vote id and classifies short followups with a word threshold.
   - Fix: after agenda titles and speech vote links are materialized, consider adding a `speech_debate_groups` or `member_speech_appearances` table. The app can still filter and search client-side, but counts should come from the materialized grouping if they remain top-level facts.

7. Antrag abstract cleanup is duplicated in read paths.
   - `apps/bundestag/src/server/antraege.ts` and `apps/bundestag/vite-data/antraege.ts` strip HTML with regex before display.
   - Fix: materialize a plain-text abstract in ETL or normalize the stored abstract itself. Lower priority because this is text cleanup, not a cross-entity mapping.

## Proposed Order

1. Materialize agenda item titles.
2. Materialize speech vote links and debate group membership.
3. Remove app-side vote and motion debate fallbacks.
4. Materialize primary vote document roles.
5. Move party alias normalization into ingestion.
6. Decide whether "Reden" grouping is a UI grouping or a persisted public metric.
7. Normalize Antrag abstracts in ETL.

## Log

### lead

- Started after adding durable guidance that reviewable derived titles, mappings, classifications, and labels should be materialized before app reads.
- Audited static data generation, server loaders, hooks, and shared party utilities for read-path derivations.
- Recorded seven candidate fixes, with agenda titles and speech vote links as the highest priority.
