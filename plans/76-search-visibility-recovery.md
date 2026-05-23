# Search Visibility Recovery

## Goal

Find why searching for Machtblick no longer surfaces the production site and fix any broken indexing signal in the app or deployment artifacts.

## Status

- Lead: production investigation complete. Focused sitemap and motion JSON redirect fix prepared for release.

## Shared Contracts

- Treat live production indexing signals as source of truth.
- Check robots, meta robots, canonical, sitemap, headers, and Cloudflare deployment output.
- Do not change unrelated UI or data work.
- If the issue is external search indexing latency, document evidence instead of making speculative code changes.

## Open Questions

- Is the production domain being served with any `noindex` signal? No. Sampled live pages send `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1`, and no sampled response includes `X-Robots-Tag`.
- Are canonical URLs pointing at `machtblick.de` consistently? Yes for sampled list, detail, member, party, motion, and English pages. Root redirects to `/votes/`, whose canonical is `https://machtblick.de/votes/`.
- Are search engines able to discover the homepage and sitemap? Production exposes `robots.txt`, `sitemap.xml`, `llms.txt`, and `Link: </.well-known/api-catalog>; rel="api-catalog", </llms.txt>; rel="service-doc"`. Public search checks still did not surface the domain.

## Log

- 2026-05-23 lead: Created plan after user reported that searching `machtblick` no longer shows the page.
- 2026-05-23 lead: Live search for `machtblick` and `site:machtblick.de machtblick` did not return `machtblick.de` in the sampled results. Live robots and page headers did not show a noindex blocker.
- 2026-05-23 lead: Found broad commit changed sitemap generation to remove `/`, `/en/`, base member pages, member tab pages, base party pages, party tab pages, and `lastmod`. Restoring the prior broader sitemap behavior as the first visibility fix.
- 2026-05-23 visibility: Live production audit passed HTML metadata, crawler access, sharing previews, favicons, manifest, and sitemap format. Search samples still did not surface the domain. Found motion JSON alternates broken because `_redirects` sends `/motions/:id.json` to a slash URL that 404s.
- 2026-05-23 lead: Added motion JSON pass-through rules before the dynamic motion trailing-slash redirects.
- 2026-05-23 visibility: Checked live production only. `https://machtblick.de/` returns 301 to `https://machtblick.de/votes`, then 301 to `/votes/`, then 200 HTML. The final page has Cloudflare headers, cache headers, CORS, nosniff, referrer policy, and service discovery `Link` headers. No `X-Robots-Tag` was present.
- 2026-05-23 visibility: `robots.txt` returns 200 `text/plain`, allows `*`, Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-User, Claude-SearchBot, PerplexityBot, and Applebot. It blocks training tokens GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, and CCBot, and declares `Sitemap: https://machtblick.de/sitemap.xml`. This matches current crawler split guidance from OpenAI, Anthropic, Google, Perplexity, and Apple.
- 2026-05-23 visibility: Fetched `/votes/`, `/en/votes/`, one vote detail, one member detail, one party detail, and one motion detail from production. Titles and descriptions are page specific. Canonicals are absolute, resolve 200, and match sampled sitemap URLs. `hreflang` alternates include `de`, `en`, and `x-default`, and sampled language pairs reciprocate.
- 2026-05-23 visibility: Production robots meta allows indexing and large previews. Open Graph and X card metadata include title, description, URL or image, image alt, and 1200 by 630 share image dimensions. `/og-image.png`, `site.webmanifest`, manifest icons, favicons, and Apple touch icon return 200.
- 2026-05-23 visibility: JSON-LD parses on sampled pages as an Organization, WebSite, and DataCatalog graph. It describes the site and datasets rather than each detail entity, which is acceptable for eligibility but not a rich detail signal.
- 2026-05-23 visibility: `sitemap.xml` returns 200 `application/xml`, contains 3516 URLs across votes, members, parties, speeches, motions, static pages, and English equivalents. It has no query URLs, no non-trailing HTML URLs, and no `lastmod`. Sampled sitemap URLs returned indexable 200 pages with matching canonicals.
- 2026-05-23 visibility: `llms.txt` returns 200 and describes the site, route families, JSON endpoints, sources, and access policy. `.well-known/api-catalog` returns parseable `application/linkset+json` and links `llms.txt`, `sitemap.xml`, `/api/votes.json`, `/api/members.json`, and `/api/parties.json`.
- 2026-05-23 visibility: Found a concrete AI and data discovery defect, motion pages advertise JSON alternates such as `/motions/318555.json` and `/en/motions/318555.json`, but those URLs 301 to slash variants and the slash variants return 404. Vote, member, and party JSON alternates returned 200.
- 2026-05-23 visibility: Tested live access with Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Applebot, GPTBot, and ClaudeBot user agents. All received 200 HTML for `/votes/`; robots policy, not edge blocking, is the active crawler control.
- 2026-05-23 visibility: Current public search checks did not find `machtblick.de` for `machtblick`, `"Machtblick"`, `"machtblick.de"`, `Machtblick Bundestag`, or `site:machtblick.de` in sampled web search results. DuckDuckGo returned no results for `site:machtblick.de` and `"machtblick.de"`. Bing HTML checks did not show a credible `machtblick.de` result for `site:machtblick.de`. Direct Google scraping was inconclusive because Google returned a script/support shell.
- 2026-05-23 lead: Rechecked after the user saw search results again. Sampled search from this environment still did not surface the domain, while production robots and `/votes/` headers remained indexable. Ran `npm --workspace @machtblick/bundestag run build`, which passed and prerendered 8630 pages with restored sitemap coverage.
- 2026-05-23 visibility: Assessment: no live production indexing blocker was found for HTML pages. The missing search result is more consistent with the domain or canonical URL not being indexed yet, a stale prior noindex or robots state in search indexes, weak brand ranking signals, or Search Console/Bing Webmaster submission lag. Recommended next fixes are submit or inspect `https://machtblick.de/votes/` and `https://machtblick.de/sitemap.xml` in Google Search Console and Bing Webmaster Tools, repair motion JSON alternates, and consider whether `/` should be a real brand homepage or whether `/votes/` should remain the canonical entry point.
