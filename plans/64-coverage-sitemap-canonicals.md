# Coverage sitemap canonicals

Goal: Use the Google Search Console Coverage export to remove avoidable non-canonical URLs from the sitemap while keeping prerendered routes available.

Status: complete

Scope:
- Keep redirect and tab routes prerendered.
- Exclude redirect home routes from the sitemap.
- Exclude redirecting member and party parent routes from the sitemap.
- Keep the default member and party tab routes as the canonical sitemap URLs.
- Point internal member and party links at those default tab URLs instead of redirecting parent URLs.
- Teach the visibility agent to verify that canonical URLs resolve as indexable pages and match sitemap strategy.
- Keep AI discovery files aligned with canonical routes and current crawler names.
- Remove sitemap `lastmod` until the app can provide per-page significant update dates.

Log:
- 2026-05-20 - lead: Inspected the Coverage export. It reports 42 redirect pages, 4 canonical alternates, and 53 crawled but not indexed pages.
- 2026-05-20 - lead: Verified the live sitemap has 8,626 URLs and includes `/` plus `/en/`, while live `/` redirects to `/votes/` and `/en/` resolves with canonical `/en/votes/`.
- 2026-05-20 - lead: Verified member and party tab URLs are in the sitemap while canonicalizing to their parent detail pages.
- 2026-05-20 - lead: Filtered those redirect and tab URLs out of sitemap generation. Regenerated `apps/bundestag/public/sitemap.xml`; it now has 3,516 URLs.
- 2026-05-20 - lead: Found the parent member and party URLs redirect to their default tabs, so canonicalizing tabs back to the parent was not a clean final state. Adjusted canonical targets toward the 200 OK default tabs instead.
- 2026-05-20 - visibility: Audited generated output. Core canonical sitemap URLs passed; follow-ups were `llms.txt` route drift, build-date `lastmod`, Perplexity-User, and stricter agent checks.
- 2026-05-20 - lead: Pointed internal member and party links to the canonical default tabs.
- 2026-05-20 - lead: Updated `llms.txt`, `robots.txt`, and visibility agent checks. Removed generated sitemap `lastmod` values until per-page dates are available.
- 2026-05-20 - lead: Verified `npm run build -w @machtblick/bundestag`, TypeScript, `git diff --check`, and generated output checks for sitemap URL classes, canonical tags, JSON alternates, internal links, `robots.txt`, and `llms.txt`.
