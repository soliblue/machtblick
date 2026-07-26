# 153 Berlin candidate portraits

## Goal

Find and include verifiable public portraits for as many Berlin 2026 candidates as possible, with source and rights metadata preserved end to end.

## Status

- source and rights audit: complete
- schema and app contract: complete
- portrait ingestion: contract and 73-record dataset complete
- candidate UI integration: complete
- coverage and rendered QA: complete

## Product contract

- Never generate or guess a candidate portrait.
- A portrait requires an identifiable candidate, an image URL, and an original source URL.
- Author, license and license URL are stored when published.
- Clearly licensed and official candidate sources are preferred.
- Unverified page preview images are rejected.
- Missing portraits keep the existing initials fallback.
- Portrait attribution is available from the candidate detail.
- The pipeline is repeatable for later Landtag elections.

## Log

- 2026-07-26 operator: Find public images for as many candidates as possible and include them in the app before the Berlin branch is committed.
- 2026-07-26 portrait-ui: Replaced the candidate monogram with a shared detail and card portrait component. It uses initials on missing or broken images, lazy loading in lists, and a source, author, and license disclosure on candidate details.
- 2026-07-26 portrait-ui: `npx tsc -p apps/berlin/tsconfig.json --noEmit` passes against the landed portrait contract.
- 2026-07-26 portrait-contract: Added the portrait table, typed input and read models, candidate and catalog queries, source unions, coverage count, ingestion, and collection rules.
- 2026-07-26 portrait-contract: Portrait ingestion rejects malformed records, unknown or duplicate candidate slugs, duplicate images, invalid URLs and dates, invalid statuses, and licensed records without a license.
- 2026-07-26 portrait-contract: Portrait tests, Berlin TypeScript and a clean temporary database ETL pass. The database reports no foreign key violations and preserves null fallbacks with no dataset present.
- 2026-07-26 portrait-contract: A seeded temporary portrait is exposed by catalog, detail, source and coverage queries with its full rights metadata intact.
- 2026-07-26 source-audit: Audited 456 unique candidates. Wikidata party matching and two reviewed identity exceptions produced 73 reusable Commons portraits, 16.0% coverage: BSW 3, FDP 4, GRÜNE 26, Die Linke 11, SPD 29.
- 2026-07-26 source-audit: Every Commons record has a unique candidate and image, author, license, license URL, original file URL, file page, Wikidata ID, and publisher. Licenses are 48 CC BY-SA 4.0, 16 CC BY-SA 3.0, two CC BY 2.0, and one each under CC BY-SA 3.0 de, FAL, CC BY 3.0, CC BY-SA 3.0 at, CC BY 4.0, CC BY-SA 2.0, and CC BY 3.0 de.
- 2026-07-26 source-audit: Party pages expose at least 147 additional portraits: SPD 78, Die Linke at least 32, Volt 21, Tierschutzpartei 11, PdF 5. Their published terms require consent or restrict reuse, so they were not ingested. The open Commons and official-page union covers at least 185 candidates.
- 2026-07-26 source-audit: Berlin parliament press portraits restrict use and social publication, while Abgeordnetenwatch has no Berlin 2026 project or reusable candidate-photo field. Both were excluded.
- 2026-07-26 source-audit: Added the sorted mapping at `research/berlin-2026/candidate-portraits.json` and its repeatable discovery command, `npm run discover:portraits -w @machtblick/berlin-etl`.
- 2026-07-26 assets: Added a throttled, cached optimizer that produces 73 local 320 by 320 JPEGs and a manifest from the licensed source records. A second run served all 73 from cache.
- 2026-07-26 rights: Preserved the original Commons page, author, license and direct license URL through ingestion and exposed them from candidate details.
- 2026-07-26 validation: Five ingestion tests, the JPEG test, foreign key checks, 73 complete rights records, TypeScript and the full 525-page Berlin prerender build pass.
- 2026-07-26 QA: Live mobile and desktop list/detail checks pass for local portraits, source attribution, clickable license terms, all three tabs, initials fallback, no detail divider rules, no overflow and no browser errors.
