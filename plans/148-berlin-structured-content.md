# 148 Berlin structured content

## Goal

Replace link-first Berlin election coverage with source-backed structured content rendered directly inside Machtblick.

## Status

- candidate source crawl: complete
- programme crawl and topic model: complete
- official document catalogue: complete
- database expansion: complete
- candidate detail enrichment: complete
- party and programme detail pages: complete
- document detail and embedded reading: complete
- coverage improvement pass: complete
- usability improvement pass: complete
- evidence and mobile improvement pass: complete
- public tunnel verification: complete

## Scope

- Crawl every usable party-published Berlin 2026 candidate directory.
- Store factual biography, profession, candidacy, district, constituency, public contact and profile fields when published.
- Store programme summaries and topic positions for all admitted parties with usable material.
- Catalogue official programmes, short programmes and brochures with in-app document pages and original-file fallbacks.
- Render substantive candidate, party and programme content directly in the app.
- Keep source links as field-level evidence rather than the primary user experience.
- Preserve missing information as missing and never assign party positions to individual candidates.
- Summarize copyrighted prose and programmes instead of mirroring full text or unlicensed portraits.
- Keep the Berlin database, ETL and web app independent from Bundestag pipelines.

## Data shape

- parties
- candidates
- candidate_candidacies
- candidate_profiles
- candidate_links
- programmes
- programme_topics
- programme_topic_categories
- programme_documents
- sources
- metadata

## Log

- 2026-07-25 lead: Started the full structured-content pass after the operator rejected link-only coverage. Parallelized candidate crawling, programme extraction and schema design.
- 2026-07-25 berlin_schema: Added source-backed profiles, links, multiple candidacies, programmes, topics and documents. Kept the root catalog compact and added candidate, programme and document detail queries.
- 2026-07-25 lead: Added an official document layer and three improvement passes after the first complete build: coverage, usability, then evidence and mobile QA.
- 2026-07-25 candidate_crawl: Completed 456 unique people and 646 candidacies across 10 admitted parties, including 180 biographies, 150 occupations and 174 profiles with personal priorities. Documented the seven admitted parties whose names are still unavailable in the dataset.
- 2026-07-25 programme_crawl: Completed 17 programme records, 104 structured topics, 180 topic-category links and 30 official documents. All document URLs returned HTTP 200 during the final audit.
- 2026-07-25 lead: Shipped in-app candidate, party, programme, comparison, election-guide and document views. Fixed a mobile comparison-card sizing defect found during visual QA.
- 2026-07-25 lead: Final database integrity and foreign-key checks passed. TypeScript passed, 525 routes prerendered, desktop and mobile browser flows passed without console errors or horizontal overflow, and the public test tunnel returned expected 200 and 404 responses.
- 2026-07-25 final_app_audit: Found six publisher-blocked PDF embeds, stale optional profile links and party metadata, ambiguous source labels, and the missing Wahlkreis filter.
- 2026-07-25 lead: Marked blocked PDF previews in structured data with an honest original-file fallback, kept 11 embeddable PDF previews, repaired or removed seven stale optional links, reconciled BSW and SGP metadata, deduplicated programme evidence by URL, and added district-aware Wahlkreis filtering.
- 2026-07-25 lead: Repeated the full build, database, public-route and browser suite after the independent-audit fixes. All 525 prerendered routes, both document states, source drawers, desktop and mobile layouts, and the persistent test tunnel passed.
