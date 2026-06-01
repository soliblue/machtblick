# Namentliche Vote 1004

## Goal

Import Bundestag roll-call vote `1004` from `2026-05-22` into SQLite with member ballots, party summaries, source documents, speech links, generated summaries, titles, party positions, and English translations where the existing ETL supports them.

## Status

Imported and enriched where upstream data is available. Reopened on `2026-06-01` after Bundestag published the real session `21081` PDF while the XML URL still returned a duplicate session `80` body.

## Scope

- Fix the namentliche importer so it can match the current Bundestag XLSX download list to Bundestag detail IDs.
- Back up `db/machtblick.sqlite` before writing.
- Import term 21 namentliche votes with Abgeordnetenwatch period `161`.
- Run the existing downstream normalization and enrichment jobs needed for the new vote.
- Verify vote `1004` has DB rows across `votes`, `vote_members`, `vote_party_summaries`, `vote_documents`, descriptions, translations, and linked speech context when available.

## Notes

- Current local DB has term 21 namentliche votes through `bundestag_id = 1003`.
- Bundestag published `bundestag_id = 1004`, dated `2026-05-22`, title `Ablehnung eines Antrags zur Arzneimittelversorgung`.
- The current importer parses downloads from `abstimmung/liste`, which provides XLSX and PDF links but no reliable `abstimmung?id`.
- The current detail feed at `abstimmung/abstimmungen` provides IDs, dates, titles, and result counts.

## Log

### Lead

- Confirmed the missing namentliche vote is `1004`.
- Found the importer needs a durable source-ID match before it is safe to rerun for term 21.
- Updated the importer to join the XLSX download feed to the Bundestag detail feed and added `--source-id` so this refresh can touch only vote `1004`.
- Extended the matched detail import to store the Bundestag teaser text and inferred initiator, then refreshed vote `1004` only.
- Verified vote `1004` now has 628 member ballots, 6 party summaries, 2 source document rows, `initiator = AfD`, and Drucksachen `21/6076` and `21/2553` in `votes.document`.
- Ran normalization, polarity, initiator, DIP linkage, speech XML refresh, agenda backfill, materialization, description generation, scoped title cleanup, scoped translations, scoped party positions, scoped speech translations, and public vote validation.
- Linked vote `1004` to Antrag `21/2553`, generated German summaries from the Antrag PDF, generated English vote and Antrag translations, and validated public vote data.
- Confirmed Bundestag speech XML fetch stops at session `21081` with no download, so vote `1004` currently has no speech links, party position summaries, speech translations, or agenda item.
- User requested commit, push, and deploy after confirming the missing speech XML explanation.
- 2026-06-01: Confirmed `21081.xml` returns `200` but still contains `sitzung-nr="80"` and date `21.05.2026`; confirmed `21081.pdf` is the real session `81` protocol from `22.05.2026`.
- 2026-06-01: Added a checked-in PDF fallback importer for `Zusatzpunkt 10`, inserted 11 direct debate speech segments for vote `1004`, set `votes.agenda_item = Zusatzpunkt 10`, and materialized the debate group.
- 2026-06-01: Generated German party-position summaries for AfD, B90/Grüne, CDU/CSU, Die Linke, and SPD, plus English party-summary and speech translations.
- 2026-06-01: Fixed the party-position runner to use canonical party labels after materialization, which lets B90/Grüne summaries find normalized speech rows.
- 2026-06-01: `npm run db:validate:votes` passed with `missing_speech_rich_party_summaries=0`; `npm run build -w @machtblick/bundestag` passed and generated vote `1004` with 11 direct debate speeches.

### Visibility

- 2026-05-26 predeploy check for commit `362fbe33a3930a2e5de975155313c88a50a8a972` used the fresh build in `apps/bundestag/dist/client`; no build was run.
- PASS: German and English vote `1004` detail HTML exists at `/votes/2026-05-22-1004-ablehnung-eines-antrags-zur-arzneimittelversorgung/` and `/en/votes/2026-05-22-1004-ablehnung-eines-antrags-zur-arzneimittelversorgung/`.
- PASS: both detail pages have specific titles and descriptions, `index, follow` robots with large image preview, absolute canonicals, reciprocal `de`, `en`, and `x-default` hreflang alternates, Open Graph and X card metadata, parseable JSON-LD, and a real JSON alternate at `/votes/2026-05-22-1004-ablehnung-eines-antrags-zur-arzneimittelversorgung.json`.
- PASS: `sitemap.xml` lists both vote `1004` canonical URLs, the local generated pages exist, canonicals self-match, there is no sitemap `lastmod`, no query URL, and no non-trailing `/votes` parent route.
- PASS: `robots.txt`, `_headers`, `llms.txt`, `.well-known/api-catalog`, `site.webmanifest`, favicon files, and `og-image.png` are present; API catalog and manifest parse as JSON, listed endpoints and icons exist, and `og-image.png` is `1200x630`.
- PASS: no stale production `noindex` found on generated HTML except the intended `404.html`.
- Blocking visibility issues: none.
