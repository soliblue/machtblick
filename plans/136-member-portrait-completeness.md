# Member portrait completeness

## Goal

Mirror every current Bundestag member portrait that has a reusable upstream source as a real JPEG, deploy the refreshed web assets, and give the iOS member grid a remote portrait fallback before its existing colored initials placeholder.

## Status

- Lead: in progress
- Plumber: completed
- Backend: completed
- iOS: completed
- Visibility: completed
- Tester: completed
- Deployer: pending
- Scribe: pending

## Scope

- Current-term member portrait import and JPEG normalization
- Portrait manifest and generated member list picture URLs
- iOS member-grid portrait fallback
- Focused web and iOS verification
- Web production deployment only

## Contracts

- Every mirrored portrait is decoded and encoded as actual JPEG bytes at `public/members-photos/<member-id>.jpg`, regardless of its source format.
- PNG transparency is flattened safely during JPEG encoding.
- The importer is idempotent, source-format agnostic, and cannot reintroduce mixed local extensions.
- The manifest contains only current members with successfully mirrored portraits, and every `file` value ends in `.jpg`.
- Author, licence, and source URL metadata remain unchanged for mirrored portraits.
- Portraits without reproducible reuse metadata are not copied into the repository or falsely attributed.
- Generated web and iOS list data expose the resolved portrait URL needed for a two-stage fallback.
- The iOS member grid loads the local JPEG first, then the approved remote portrait URL, then the existing deterministic colored initials.
- Member detail portraits and unrelated member data remain unchanged.
- Web assets are deployed after verification. iOS is committed and verified but not uploaded or deployed.

## Verification

- Report current-member totals for local JPEGs, remote-only portraits, and members with no portrait source.
- Verify every manifest entry ends in `.jpg`, decodes as JPEG, exists locally, and returns HTTP 200 after deployment.
- Verify all mirrored source formats, including transparent PNG input, produce valid JPEG output.
- Verify representative member grid and detail routes locally and in production, including local, remote-fallback, and initials-fallback cases.
- Run focused web contracts, TypeScript checks, production build, and iOS contract or simulator build checks.

## Open questions

- None.

## Log

- 2026-07-14 Lead: Audited 639 current member list entries. Production has 376 current local JPEG portraits, 209 additional abgeordnetenwatch portrait URLs, and 54 members without any portrait URL. The current iOS grid already falls back to colored initials, but it never receives or attempts the remote portrait URL used by web.
- 2026-07-14 Lead: Verified the abgeordnetenwatch API data is CC0, but its portrait files are not API fields. Its official copyright notice says member-photo permission was granted to abgeordnetenwatch, while only photos authored by abgeordnetenwatch are generally CC BY-NC 4.0. Therefore the 201 portrait URLs without author, licence, and source metadata cannot be copied into Machtblick as if they were freely licensed. The pipeline will maximize lawful local JPEG coverage and retain remote rendering as the functional fallback.
- 2026-07-14 iOS: Added optional `pictureUrl` decoding for member-list payloads. Member cards now try the canonical local JPEG, then a distinct resolved remote URL after local failure, then the existing deterministic colored initials. The image and placeholder layouts, name overlays, party marks, and accessibility label remain unchanged. Extended the member payload contract in both iOS workflows to cover present and absent list portrait URLs. Local static checks passed, but this Linux host has no Swift or Xcode toolchain, so the iOS workflow build remains the compiler verification.
- 2026-07-14 Backend: Added nullable `pictureUrl` to the lean German and English member-list API contract through the existing portrait-manifest resolver. Mirrored members receive `/members-photos/<member-id>.jpg`, remote-only members retain their absolute database URL, and members without a source receive `null`. Added a focused contract test covering all three cases and included it in the web build. The test passed, and a direct database check produced 639 entries split into 376 local, 209 remote, and 54 without a source before the final portrait refresh. Root will regenerate the checked-in endpoint files during the final build after the manifest refresh.
- 2026-07-14 Backend: Made the member API contract test independent of ignored generated assets by allowing an explicit manifest fixture to flow through the production resolver. The build keeps the test before portrait fetching, so fresh clones verify local override, remote passthrough, and null without relying on an existing manifest or network refresh.
- 2026-07-14 Plumber: Expanded the checked-in mirror from a picture-host filter to metadata-backed current-term sources. Every local byte now comes from the exact Commons file named by `picture_source_url`, so the eight rows with an abgeordnetenwatch display URL and Commons attribution do not attach Commons metadata to different abgeordnetenwatch bytes. Every decoded source is flattened onto white and encoded as JPEG. Cache reuse requires the prior manifest to name the same source URL, and cleanup removes every non-manifest file outside the successful current target set regardless of extension.
- 2026-07-14 Plumber: Added a shared 2.1-second abgeordnetenwatch request interval, below the official 30 requests per minute fair-use ceiling. The member ingest now revisits profiles whose member row is missing a picture or uses an abgeordnetenwatch URL, synchronizes removed abgeordnetenwatch pictures without touching Commons rows, and updates newly current politician records idempotently. The refresh found new remote portraits for Mirze Edis and Heinrich Koch, restored the stored remote portrait for Katja Mast, and wrote one newly current matched politician row.
- 2026-07-14 Plumber: Regenerated the ignored production portrait directory. Final current-term coverage is 384 local JPEGs, 204 remote-only portraits, and 51 members without a portrait source, totaling 639. The first run reused 376 source-matched JPEGs, downloaded and normalized eight exact Commons sources, and removed 252 stale or mixed files. The second run was idempotent with 384 cache hits and zero removals. Verification found 384 manifest entries, 384 physical JPEGs, no other asset files, no alpha channels, and exact author, licence, and source URL parity with the database. `npx tsc --noEmit` and the transparent-PNG JPEG contract test passed.
- 2026-07-14 Lead: The full production web build passed. Both generated member APIs contain 639 rows split into 384 local JPEGs, 204 remote portraits, and 51 null portraits. Every one of the 384 manifest files ends in `.jpg`, exists in source and built output, and has JPEG start and end markers. The build also passed the transparent-PNG conversion, member placeholder, member API, theme, prerender, and iOS static-locale contracts.
- 2026-07-14 Lead: The built preview returned HTTP 200 with `image/jpeg` and JPEG bytes for all 384 manifest files. Each of the nine previously mixed-format member IDs has a `.jpg` manifest and API reference, a JPEG asset, and an HTTP 200 member detail route. Manifest author, licence, and source URL values exactly match all 384 database rows.
- 2026-07-14 Visibility: Focused review passed on the fresh production build. German and English `/api/members.json` each parse with 639 entries split into 384 built local JPEGs, 204 absolute HTTPS remote portraits, and 51 null portraits; every local API reference exists in `dist/client` with JPEG bytes. The German and English canonical member pages for local `blos-dr-michael`, remote `edis-mirze`, and null `arndt-dr-michael` retain specific titles and descriptions, indexable robots metadata, absolute canonical and reciprocal hreflang targets, complete 1200 by 630 Open Graph and X previews, parseable JSON-LD, and valid per-member JSON alternates. Person structured data carries the matching local or remote image and omits `image` for the null case; the sampled remote image returned HTTP 200 as `image/jpeg`. Crawler-policy files, sitemap generation, favicons, manifest, and AI discovery documents are `SKIP` because this diff does not change them. No blocking visibility issues found.
- 2026-07-14 Tester: Browser plugin was unavailable, so Playwright 1.60.0 tested the fresh production-style build through the preview owned by this checkout at `http://127.0.0.1:3001`. All six desktop and iPhone 13 grid-to-detail cases passed for local JPEG `blos-dr-michael`, remote fallback `edis-mirze`, and initials fallback `arndt-dr-michael`. Each case filtered the grid, verified the card portrait state, visible name and bounds, clicked through to the voting detail, and verified the detail portrait state, heading, main content, title, and absence of framework overlays. Local and remote images decoded with positive dimensions and returned HTTP 200. There were no console errors, warnings, page errors, or relevant failed requests. Twelve screenshots are under `/tmp/tester-member-portraits-{desktop,mobile}-{blos-dr-michael,edis-mirze,arndt-dr-michael}-{grid,detail}.png`.
