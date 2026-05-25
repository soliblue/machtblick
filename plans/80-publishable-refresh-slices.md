# Publishable Refresh Slices

## Goal

Allow complete refreshed data to ship even when unrelated newly fetched DIP rows are incomplete.

## Status

Implemented. Build, browser smoke, and visibility passed.

## Policy

- Votes publish when vote data and vote-derived fields are complete.
- Speech sessions publish when the newest available XML session is fetched and ingested.
- Motions publish only when a generated description exists.
- English motion pages publish only when the English description translation exists.
- Incomplete motion rows can remain in SQLite but do not get static JSON, prerendered pages, or sitemap URLs.
- Questions without extracted answer text should be reported as incomplete DIP data, but they do not block vote or speech publishing.

## Implementation

- Filter motion prerender paths and static JSON to publishable rows.
- Make motion detail server loading return not found for unpublished rows.
- Filter member motion lists to rows with a publishable detail page.
- Leave question rows as metadata lists for now, since there are no question detail pages or answer-text views.

## Log

### Lead

- Confirmed `vite.config.ts` prerenders and writes JSON for every current-term motion.
- Confirmed votes are already scoped away from procedural and hammelsprung routes.
- Added publishable motion filters for prerender paths and static JSON.
- Made motion detail loaders return not found when a motion has no generated description, or no English translation on English pages.
- Filtered member motion lists to avoid linking unpublished motion detail pages.
- Updated the auto-refresh prompt so incomplete DIP rows are reported without blocking unrelated complete votes, speeches, or motions.
- Verified `npm run build -w @machtblick/bundestag` passes.
- Verified incomplete recent motion IDs `332795`, `334134`, `334375`, and `334864` have no motion JSON and no sitemap URLs.

### Visibility

- Used the fresh build under `apps/bundestag/dist/client`; did not rebuild, deploy, or commit.
- Sampled `votes/index.html`, `en/votes/index.html`, `motions/318555/index.html`, and `en/motions/318555/index.html`.
- Verified sampled titles, descriptions, absolute canonicals, indexable robots meta, Open Graph fields, X card fields, hreflang alternates, reciprocal alternates, and JSON-LD parse.
- Verified sampled motion JSON alternates resolve to generated files, and all generated JSON alternates in HTML resolve to files.
- Verified `og-image.png` is 1200 by 630, manifest JSON parses, manifest icons exist, and favicon assets exist.
- Verified `robots.txt` declares `https://machtblick.de/sitemap.xml`, allows search and retrieval crawlers, blocks training crawlers, and matches current primary docs for OpenAI, Anthropic, Google, Apple, Perplexity, and Common Crawl user-agent names:
  - `https://developers.openai.com/api/docs/bots`
  - `https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler`
  - `https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers`
  - `https://support.apple.com/en-au/119829`
  - `https://docs.perplexity.ai/docs/resources/perplexity-crawlers`
  - `https://commoncrawl.org/ccbot`
- Verified `llms.txt` explains the site, route families, JSON endpoints, sources, AI access policy, default tabs, and canonical tab behavior.
- Verified `.well-known/api-catalog` parses as JSON and `_headers` exposes both `/.well-known/api-catalog` and `/llms.txt`.
- Verified publishable motion filtering in generated output: German motion HTML, English motion HTML, German motion JSON, English motion JSON, German sitemap motion URLs, and English sitemap motion URLs all contain the same 853 motion IDs.
- Verified incomplete motion IDs `332795`, `334134`, `334375`, and `334864` are absent from German and English motion HTML, JSON, and sitemap URLs.
- Blocking: `sitemap.xml` contains 5,110 URLs whose generated page canonical points elsewhere: 2 home redirect URLs, 1,268 member parent URLs, 3,804 member noncanonical tab URLs, 12 party parent URLs, and 24 party noncanonical tab URLs.
- Blocking: `sitemap.xml` sets `<lastmod>2026-05-25</lastmod>` on all 8,670 URLs, which appears to be build-time stamping rather than a verifiable significant page update timestamp.

### Lead

- Changed sitemap generation to use canonical sitemap paths only.
- Removed build-date `lastmod` stamping from sitemap entries.

### Visibility

- Reran visibility against the fresh build under `apps/bundestag/dist/client`; did not rebuild, deploy, commit, or push.
- Verified `sitemap.xml` now has 3,560 URLs, no `<lastmod>`, no query or hash URLs, no duplicate URLs, no missing generated HTML, and no canonical mismatches.
- Verified sitemap motion URLs remain publishable-only: German motion HTML, English motion HTML, German motion JSON, English motion JSON, German sitemap motion URLs, and English sitemap motion URLs all contain the same 853 motion IDs.
- Verified incomplete motion IDs `332795`, `334134`, `334375`, and `334864` are still absent from German and English motion HTML, JSON, and sitemap URLs.
- Verified every generated HTML JSON alternate resolves to a local generated JSON file, and generated JSON files plus `.well-known/api-catalog` and `site.webmanifest` parse as JSON.
- Sampled `votes/index.html`, `en/votes/index.html`, `motions/318555/index.html`, `en/motions/318555/index.html`, `members/ataoglu-tijen/votes/index.html`, and `parties/spd/profile/index.html`; titles, descriptions, absolute canonicals, indexable robots meta, Open Graph, X card, hreflang alternates, reciprocal alternates, and JSON-LD passed.
- Verified `robots.txt`, `llms.txt`, `.well-known/api-catalog`, and `_headers` are present and preserve crawler, AI discovery, service-doc, and API-catalog signals.
- Verified `og-image.png` is 1200 by 630, `site.webmanifest` icons exist at 192 by 192 and 512 by 512, and favicon assets exist.
- Result: PASS, no blocking visibility issues found.

### Tester

- Ran local browser smoke at `http://localhost:3001` against the final deploy-candidate build.
- Verified incomplete motion `/motions/332795/` renders the German not-found state.
- Verified complete motion `/motions/335133/` renders the detail page with `Drs. 21/6033`.
- Functional behavior: PASS.
- Strict tester result: FAIL because Chromium reports the expected `/motions/332795/` main document 404 as a console error.
- Reran adjusted strict browser smoke at `http://localhost:3001`.
- Verified unpublished motion `/motions/332795/` is not publicly served via HTTP 404 response status, outside the browser console regression gate.
- Verified complete motion `/motions/335133/` loads normally as a published page and renders `Drs. 21/6033`.
- Result: PASS, no unexpected console errors on published pages.
