# Explore Historical Data Support

## Goal

Choose an SEO-friendly architecture for full historical Bundestag support across old Wahlperioden, while keeping each historical term as a mirror of the current term 21 app.

## Status

Exploratory. No implementation started.

## Current Context

- `apps/bundestag/vite.config.ts` and `apps/bundestag/vite-data/*` currently build around `CURRENT_TERM = 21`.
- The current local `apps/bundestag/dist/client` output is about 8,655 files and 751 MB.
- The local database has 1,718 namentlich votes total, including 1,667 old namentlich votes for terms 12 through 20.
- Term 20 alone has 1,511 distinct members with vote ballots, so fully mirrored member pages are the main file-count risk.
- SEO-friendly means important archive URLs return complete HTML on first request, not only client-rendered JSON.

## Options

### 1. Cloudflare Pages Project Per Wahlperiode

Same `apps/bundestag` codebase, parameterized by build env:

- `BUNDESTAG_TERM=21`, `SITE_URL=https://machtblick.de`
- `BUNDESTAG_TERM=20`, `SITE_URL=https://wp20.machtblick.de`
- `BUNDESTAG_TERM=19`, `SITE_URL=https://wp19.machtblick.de`

Pros:

- Strongest fit for the current prerendered app.
- Static asset requests are free and unlimited on Cloudflare Pages.
- Each Pages project gets its own file budget.
- No runtime database, no VPS origin load, no SSR failure mode.
- Clean SEO, sitemaps, canonicals, and social previews.

Cons:

- More Cloudflare Pages projects to manage.
- Needs build matrix and per-term deployment configuration.
- Cross-term navigation and canonical policy must be explicit.
- Free Pages caps each project at 20,000 files and 500 builds per month.
- Paid Pages raises each project to 100,000 files with `PAGES_WRANGLER_MAJOR_VERSION=4`.

Current source references:

- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Pages Functions pricing: https://developers.cloudflare.com/pages/functions/pricing/

### 2. Static HTML In R2 With Worker Routing

Generate static HTML and JSON for all terms, upload artifacts to R2, route requests through a Worker.

Pros:

- Avoids Cloudflare Pages file-count limits.
- Still SEO-friendly because URLs return static HTML.
- One deployment surface can serve all terms.
- R2 has no egress fee and a useful free tier.

Cons:

- We own routing, cache headers, 404s, sitemap publication, deploy cleanup, and invalidation.
- Worker requests are metered once every HTML request invokes the Worker.
- R2 object reads are metered when Cloudflare cache misses.
- More custom infrastructure than Pages.

Pricing notes:

- R2 Standard free tier: 10 GB-month storage, 1 million Class A operations, 10 million Class B operations per month.
- R2 Standard paid: $0.015 per GB-month, $4.50 per million Class A operations, $0.36 per million Class B operations.
- Workers Free: 100,000 requests per day, 10 ms CPU per invocation.
- Workers Paid: $5 per month base, 10 million requests and 30 million CPU-ms included, then $0.30 per million requests and $0.02 per million CPU-ms.

Source references:

- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/

### 3. Cloudflare Worker SSR With D1 Or R2 Data

Render historical pages dynamically at the edge, backed by D1, R2 JSON, or another Worker-accessible data shape.

Pros:

- SEO-friendly if SSR returns complete HTML.
- No per-page static file count.
- Cloudflare-native, no VPS required.
- Can cache full HTML responses for popular routes.

Cons:

- Larger app architecture change.
- Current app reads SQLite at build time, not runtime.
- Would need a Worker-compatible data layer.
- Runtime bugs affect crawlers and users directly.
- CPU and D1 row scans must be kept tight.

Pricing notes:

- Workers pricing is the same as option 2.
- D1 Free: 5 million rows read per day, 100,000 rows written per day, 5 GB total storage.
- D1 Paid: first 25 billion rows read per month included, then $0.001 per million rows read. First 50 million rows written per month included, then $1 per million rows written. First 5 GB storage included, then $0.75 per GB-month.

Source reference:

- Cloudflare Workers and D1 pricing: https://developers.cloudflare.com/workers/platform/pricing/

### 4. VPS SSR Behind Cloudflare Cache

Run SSR on a VPS and put Cloudflare in front with cache rules for anonymous HTML.

Pros:

- Familiar server model.
- Full control over SQLite, local files, and Node runtime.
- SEO-friendly if the origin returns full HTML.
- Cloudflare cache can absorb most repeat traffic.

Cons:

- Origin health becomes our responsibility.
- Bot crawls and cache misses hit the VPS.
- Cache purging, warming, monitoring, and scaling become operational work.
- Less attractive than Cloudflare-native static hosting for public archive pages.

Pricing notes:

- DigitalOcean lists a $6/month Droplet with 1 TB included bandwidth.
- Hetzner EU cloud products commonly include 20 TB outgoing traffic, with current post-April 2026 entry prices around $4.99 to $9.49/month depending on server family.
- At 500 KB uncached HTML, 1 TB is roughly 2 million origin page views and 20 TB is roughly 40 million origin page views. A 95 percent Cloudflare cache hit rate multiplies public traffic capacity by about 20.

Source references:

- DigitalOcean Droplets: https://www.digitalocean.com/products/droplets
- Hetzner traffic docs: https://docs.hetzner.com/de/robot/general/traffic/
- Hetzner 2026 price adjustment: https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/

### 5. SPA With JSON Only

Serve one shell and fetch archive data client-side.

Pros:

- Easiest file-count story.
- Minimal backend needs.

Cons:

- Weakest SEO.
- Less reliable for social previews, non-Google crawlers, AI crawlers, and long-tail archive discovery.
- Not a good fit for public historical records.

Decision:

- Reject for canonical archive pages.

## Recommendation

Use option 1 first: one codebase, one mirrored app per Wahlperiode, one Cloudflare Pages project per term subdomain.

Keep option 2 as the fallback if project sprawl or file limits become painful. Avoid option 3 unless runtime behavior becomes necessary. Avoid option 4 unless the project already needs a persistent server for other reasons.

## Required Design Decisions

- Subdomain naming: `wp20.machtblick.de`, `wp19.machtblick.de`, etc.
- Root experience: whether `machtblick.de` is term 21 only or includes an archive switcher.
- Cross-term navigation placement.
- Canonical and hreflang policy per subdomain.
- Per-term sitemap generation and optional sitemap index.
- Route ID collision policy across terms.
- Data completeness labels for older terms with missing speeches, motions, translations, or party metadata.
- Build cleanup for term-specific JSON and prerendered files.
- Cloudflare project naming and deployment matrix.

## Implementation Sketch

1. Add a single app-local build config module that exposes `BUNDESTAG_TERM` and `SITE_URL`.
2. Replace hard-coded term constants in Vite data generation, server functions, and sitemap generation.
3. Ensure every generated public JSON artifact is term-scoped by build output, not shared across terms.
4. Add a Wahlperiode switcher with explicit links to the equivalent route on other term subdomains when possible.
5. Generate per-term sitemap XML and metadata using that term's `SITE_URL`.
6. Add deploy commands or CI matrix entries for each term Pages project.
7. Verify one historical term end to end before adding the full matrix.

## Append-Only Log

- 2026-05-25 lead: Created the exploratory plan after comparing Pages projects, R2 static hosting, Worker SSR, VPS SSR, and SPA-only options. Current recommendation is parameterized Pages projects per Wahlperiode.
