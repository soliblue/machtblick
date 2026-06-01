# Procedural Election Objection Votes

## Goal

Classify Bundestag election-objection decisions as procedural so they remain in the database but are excluded from public vote lists, stats, enrichment jobs, and prerendered public pages.

## Status

Verified locally. Commit, push, and deploy pending.

## Scope

- Extend the existing procedural vote flagger with election-objection patterns.
- Re-run the procedural flagger against the local DB.
- Verify matching rows now have `procedural = 1`.
- Rebuild the Bundestag app so public JSON, sitemap, and prerendered paths exclude those rows.

## Log

### Lead

- 2026-06-01: User flagged `Beschlussempfehlung des Wahlprüfungsausschusses zu Wahleinsprüchen...` rows as useless public votes that should not appear in stats or lists.
- 2026-06-01: Found four current rows matching election-objection wording, including two recent handzeichen rows and two older namentliche rows, all currently `procedural = 0`.
- 2026-06-01: Extended `etl/bundestag/votes/procedural/run.mjs` to match election-objection wording in `title` and `document`.
- 2026-06-01: Reran the flagger; it marked five rows, the four found rows plus a duplicate term-20 historical import for the 2022 election-objection roll-call.
- 2026-06-01: Reran materialization and public vote validation. Validation passed, and term-21 public votes dropped from `275` to `272`.
- 2026-06-01: Rebuilt the Bundestag app. The three term-21 election-objection vote pages are absent from public HTML routes, `api/votes.json`, and `sitemap.xml`.
- 2026-06-01: Found stale per-vote JSON could remain from earlier builds, so `apps/bundestag/vite.config.ts` now clears `public/votes` before regenerating current public vote JSON files.
- 2026-06-01: Rebuilt again after the JSON cleanup. The three term-21 election-objection IDs are absent from `dist/client`, `public/votes`, `api/votes.json`, and `sitemap.xml`; `public/votes` now contains `272` JSON files.
- 2026-06-01: Visibility predeploy check passed. The three election-objection IDs are absent from public discovery surfaces, and no blocking SEO, social, crawler, AI discovery, sitemap, or JSON alternate issues were found.
- 2026-06-01: After deploy, the immutable Pages deployment returned `404` for the removed routes, but the production alias still served one stale cached German HTML route. Added explicit legacy redirects for the removed election-objection vote detail URLs to the vote list.
