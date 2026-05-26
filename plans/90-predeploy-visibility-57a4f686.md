# Predeploy Visibility 57a4f686

Status: Completed

Goal: Verify the Bundestag production build at commit `57a4f6866770f2496beebecc600da8a0f7ee8469` can be found, understood, previewed, and cited by search engines, social platforms, and AI assistants before deploy.

Scope:

- Bundestag vote pages and list pages
- Generated vote data, summaries, translations, sitemap, JSON alternates
- SEO, social previews, crawler access, AI assistant discovery, favicons, manifest

Contracts:

- Do not deploy.
- Do not commit.
- Inspect generated `apps/bundestag/dist/client` output.
- Update this log with pass and fail results, exact checks, and lead attention items.

Log:

- visibility, 2026-05-26: Started pre-deploy visibility check for commit `57a4f6866770f2496beebecc600da8a0f7ee8469`.
- visibility, 2026-05-26: Confirmed checkout with `git rev-parse HEAD`; HEAD is `57a4f6866770f2496beebecc600da8a0f7ee8469`.
- visibility, 2026-05-26: Ran `npm run build -w @machtblick/bundestag`; client build, server build, and prerender completed successfully.
- visibility, 2026-05-26: Inspected generated HTML under `apps/bundestag/dist/client` for `/votes/`, `/en/votes/`, `/votes/2026-05-08-1003-ablehnung-eines-antrags-zum-mehrjahrigen-finanzrahmen-der-eu/`, and the matching English vote detail page.
- visibility, 2026-05-26: Verified sampled title, description, canonical, hreflang, Open Graph, X card, robots meta, JSON-LD parsing, and JSON alternate targets with a Cheerio script. All sampled head metadata passed. JSON-LD is site and catalog level and parses as `Organization`, `WebSite`, `DataCatalog`, nested `Dataset`, and `DataDownload`.
- visibility, 2026-05-26: Verified sampled hreflang clusters include `de`, `en`, and `x-default`; German and English targets exist and reciprocate.
- visibility, 2026-05-26: Verified all `link rel="alternate" type="application/json"` targets across generated HTML. Checked 6641 HTML files, 6627 JSON alternates, 0 missing targets.
- visibility, 2026-05-26: Verified `sitemap.xml` has 2799 URLs, includes key route families, has no `lastmod`, no query variants, no JSON or API URLs, no duplicate URLs, no redirect source URLs, and sampled every sitemap URL against its generated `rel="canonical"` with 0 failures.
- visibility, 2026-05-26: Verified `robots.txt` returns 200 locally, declares `Sitemap: https://machtblick.de/sitemap.xml`, allows search and retrieval crawlers, preserves `Content-Signal: search=yes, ai-input=yes, ai-train=no`, and uses current documented agent names for OpenAI, Anthropic, Google, Apple, Perplexity, and Common Crawl crawler controls.
- visibility, 2026-05-26: Verified `llms.txt` describes the site, route families, JSON endpoints, data sources, and AI access policy. Route examples match canonical defaults for member vote tabs and party profile tabs.
- visibility, 2026-05-26: Verified `.well-known/api-catalog` parses as JSON, has `application/linkset+json` through `_headers`, and links `llms.txt`, `sitemap.xml`, and JSON index endpoints.
- visibility, 2026-05-26: Verified `site.webmanifest` parses as JSON; manifest icons exist. Verified `og-image.png` is 1200 by 630, favicons exist at 16 by 16 and 32 by 32, Android icons exist at 192 by 192 and 512 by 512, and `apple-touch-icon.png` is 180 by 180.
- visibility, 2026-05-26: Ran local Cloudflare Pages preview with `npm exec wrangler -- pages dev dist/client --port 8788 --ip 127.0.0.1 --compatibility-date=2026-05-26`; canonical sample routes returned 200, slashless and legacy sample routes returned intended 301 redirects, and discovery assets returned expected content types.
- visibility, 2026-05-26: Blocking issues found: none.
