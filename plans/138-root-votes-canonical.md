# Root votes canonical

## Goal

Make the German and English vote lists the canonical root pages so humans, search engines, and AI agents receive meaningful prerendered HTML without a homepage redirect.

## Status

- Lead: complete
- Frontend: complete
- Visibility: complete
- Tester: complete
- Scribe: complete
- Deployer: pending

## Scope

- Serve the German vote list at `/` and the English vote list at `/en/`
- Permanently redirect `/votes/` to `/` and `/en/votes/` to `/en/`
- Serve member voting records at `/members/{id}/` and `/en/members/{id}/`
- Permanently redirect member `/votes/` tabs to their simpler member roots
- Align canonical, hreflang, sitemap, feed, manifest, and AI discovery URLs
- Preserve vote detail URLs and list search parameters
- Commit, push, and deploy the verified Bundestag web app

## Contracts

- `/` and `/en/` are prerendered indexable 200 pages with the existing vote-list UI and data.
- `/votes` and `/votes/` redirect in one permanent hop to `/`, preserving query strings.
- `/en/votes` and `/en/votes/` redirect in one permanent hop to `/en/`, preserving query strings.
- Vote detail and JSON URLs remain under `/votes/{id}/` and `/en/votes/{id}/`.
- Member root pages retain the existing voting-record UI, data, filters, and metadata.
- Member speech routes remain under `/members/{id}/speeches/` and `/en/members/{id}/speeches/`.
- Canonical, reciprocal hreflang, sitemap, Atom feed, web manifest, structured data, and `llms.txt` identify `/` and `/en/` as the vote-list URLs.
- Internal vote-list navigation uses the canonical root route.

## Verification

- Run the production build.
- Inspect generated root HTML metadata and meaningful vote content in both languages.
- Verify redirects and query preservation through a production-style local server.
- Verify the sitemap excludes redirecting vote-list URLs.
- Run focused desktop browser checks for both locales and a neighboring vote-detail route.

## Open questions

- None.

## Log

- 2026-07-14 Lead: Confirmed production currently redirects `/` directly to `/votes/`. The user chose the inverse canonical strategy so the vote list is the main page and can later grow into a broader homepage.
- 2026-07-14 Frontend: Moved the localized vote-list loaders, search validation, and UI to `/` and `/en/`. Added permanent redirects from the former list routes while preserving their query strings.
- 2026-07-14 Lead: Two full builds rendered the new root pages successfully but later hit local prerender-server `ECONNRESET` failures on different member pages at concurrency four. Reduced prerender concurrency to two before the verification build.
- 2026-07-14 Lead: Extended the canonical simplification at the user's request so member voting records live at the member root and the former `/votes/` tabs become compatibility redirects.
- 2026-07-14 Frontend: Moved both localized member voting-record tabs to the member root routes. The former member `/votes/` routes now permanently redirect to those roots while preserving search parameters.
- 2026-07-14 Visibility: PASS on the fresh production output. Sampled `/`, `/en/`, `/members/abdi-sanae/`, and `/en/members/abdi-sanae/`: specific prerendered content, indexable robots, absolute self-canonicals, reciprocal `de`/`en`/`x-default`, complete Open Graph and X cards, valid JSON-LD with root vote and member URLs, and valid member JSON alternates. The four canonical targets return 200 on the dev tunnel. Former vote-list and member `/votes/` pages are absent from prerender output; their German and English URLs return one-hop 301s with query strings preserved. `sitemap.xml` contains the new roots and member roots and excludes the sampled legacy URLs; its sampled entries match generated canonicals. The Atom feed, `llms.txt`, API catalog, manifest, and internal discovery references use the new canonical roots. `robots.txt`, discovery headers, crawler policy, JSON endpoints, favicons, manifest icons, and the 1200x630 share image pass. No blocking issues.
- 2026-07-14 Tester: Playwright against a tester-started local server passed six desktop cases. German and English vote roots rendered meaningful content, legacy vote lists returned 301 and preserved `?q=Ukraine`, localized member roots rendered voting records, legacy member vote tabs returned 301 and preserved `?line=abw`, and a neighboring vote detail rendered. No console or page errors.
- 2026-07-14 Lead: Full production build passed at prerender concurrency two, including route generation, all focused contracts, 10,000-plus prerenders, theme checks, and 1,930 German and English iOS static artifact checks. Generated root and member HTML, sitemap, feed, manifest, redirects, and discovery files match the canonical contract. `git diff --check` passes.
- 2026-07-14 Scribe: Committed the verified root vote-list and member-route canonicalization as one logical change.
