# Vote Waffle Faction Dividers

## Goal

Tighten the vote detail faction breakdown so party labels take only the widest needed logo width, the waffle uses remaining width, and faction rows are separated by a subtle divider.

## Status

Done.

## Shared Contracts

- Scope implementation to the vote detail waffle and its mock.
- Keep the total result donut unchanged.
- Keep `Fraktionslos` out of the faction breakdown.
- Use dynamic grid columns: logo column max-content, cell column fills the remaining space.
- Divider should be lighter and tighter than vote list row dividers.
- Do not touch unrelated dirty worktree changes.

## Open Questions

- None.

## Log

- 2026-05-23 lead: Created plan after user clarified the divider belongs between faction vote breakdown rows.
- 2026-05-23 lead: Changed `PartyWaffle` to `max-content minmax(0, 1fr)` columns and added a subtle `h-px bg-elevated` separator between faction rows.
- 2026-05-23 visibility: PASS pre-deploy check on `main` at `43e04f1`; `npm run build -w @machtblick/bundestag` completed and prerendered 8630 pages.
- 2026-05-23 visibility: PASS HTML metadata in `apps/bundestag/dist/client/votes/index.html`, `apps/bundestag/dist/client/en/votes/index.html`, `apps/bundestag/dist/client/votes/2026-05-08-1003-ablehnung-eines-antrags-zum-mehrjahrigen-finanzrahmen-der-eu/index.html`, and matching English detail page. Titles and descriptions are page-specific, canonicals are absolute and self-consistent, hreflang has `de`, `en`, and `x-default`, production robots allows indexing, OG and X metadata are complete, JSON-LD parses as `Organization`, `WebSite`, and `DataCatalog`.
- 2026-05-23 visibility: PASS sharing and static discovery. `apps/bundestag/dist/client/og-image.png` is 1200x630, manifest icons exist, favicon assets exist, `robots.txt`, `llms.txt`, `.well-known/api-catalog`, `_headers`, and `site.webmanifest` parse or expose the expected discovery signals.
- 2026-05-23 visibility: PASS sitemap and JSON alternates. `apps/bundestag/dist/client/sitemap.xml` has 3516 preferred canonical URLs, no query or hash variants, no `lastmod`, no missing generated targets, and no canonical mismatches; all generated `application/json` alternates point at existing JSON files.
- 2026-05-23 visibility: PASS crawler policy checked against current primary docs: `https://developers.openai.com/api/docs/bots`, `https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler`, `https://docs.perplexity.ai/docs/resources/perplexity-crawlers`, `https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers`, `https://support.apple.com/en-ph/119829`, `https://blog.commoncrawl.org/ccbot`, `https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/`. Blocking issues: none.
- 2026-05-23 lead: Marked plan done after visibility passed and the follow-up hydration mismatch fix landed separately.
