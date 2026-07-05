# 107 SEO Max

## Goal
Multi-round deep SEO + AI-discoverability optimization of machtblick.de (live prod @ 61fbb14). Squeeze everything: research current best practices, run free external review/audit services against prod, optimize for both classic search AND AI assistants (crawlers, llms.txt consumers, answer engines). Rounds continue until returns diminish. User directive: "go on for multiple rounds, squeeze everything, maximize impact".

## Round structure
Each round: audit/research → findings ranked by impact → implement → verify → commit. Findings that need deploy to take effect accumulate; batch-deploy at sensible checkpoints (user pre-approved this program's deploys implicitly by "fully optimize", CONFIRM with user before each prod deploy anyway per standing rule).

| # | Focus | Status |
|---|-------|--------|
| 1 | External baseline: PageSpeed Insights/Lighthouse (free API), schema.org validator, security headers scan, plus fresh best-practices research (2025/2026 Google guidance, AI crawler standards, llms.txt spec evolution) | done |
| 2 | Implement round-1 highest-impact findings | plumber + frontend lanes done |
| 3 | Content/keyword depth: German civic search intent (how do citizens search for votes/MPs), title/description tuning against real queries, interlinking depth | todo |
| 4 | AI-assistant surface: llms.txt maximization, structured data for answer engines, API discoverability (.well-known), testing how assistants actually see the site | todo |
| 5+ | Continue while impact/effort stays favorable; each round logged here | todo |

## Constraints
- Prod deploys only at checkpoints with user confirmation; everything verifiable on dev first.
- No dark-pattern SEO, no keyword stuffing; the site's credibility IS the product.
- Free services only (PageSpeed Insights API, validator.schema.org, Bing Webmaster free tier, securityheaders.com, etc.). No paid tools, no signups that need user credentials without asking.

## Round 1 baseline (2026-07-05, live prod, Lighthouse 12 local mobile-simulated; PSI anonymous API quota was exhausted, same engine)

Lab scores (perf / a11y / best-practices / SEO):

| Page | Perf | A11y | BP | SEO | FCP | LCP | TBT | DOM nodes |
|---|---|---|---|---|---|---|---|---|
| `/` (lands on /votes/) | 49 | 91 | n/a | 92 | 4.4s | 4.6s | 1220ms | 79,422 |
| `/votes/` | 59 | 91 | n/a | 92 | 3.6s | 3.8s | 920ms | 79,422 |
| vote detail (1003 EU-Finanzrahmen) | 84 | 92 | 79 | 85 | 3.4s | 3.5s | 10ms | ok |
| `/members/` | 68 | 100 | 79 | 92 | 3.4s | **8.4s** | 30ms | ok |

Failing audits ranked by impact:

1. **`/members/` LCP 8.4s.** LCP element is a member photo hotlinked from `commons.wikimedia.org` with `loading="lazy"`, `alt=""`, no preconnect. Wikimedia also sets 3 third-party cookies (WMF-Uniq, NetworkProbeLimit) which drags best-practices to 79 on every page with member photos. Fix: eager-load above-fold photos, self-host or proxy thumbnails (also removes cookies + adds real alt text for image SEO).
2. **`/votes/` DOM = 79,422 elements, 10.3MB raw HTML (187KB gzip), main thread 5.6s, TBT 1.2s.** Entire vote list is prerendered and hydrated. Fix: virtualize or cap initial render; keep full list crawlable via sitemap + detail pages rather than one mega-DOM.
3. **Homepage is a 2-hop redirect chain** `/` 301 → `/votes` 301 → `/votes/`. Home page equity passes through two redirects; every external link to the bare domain pays this. Fix: single-hop 301 to `/votes/`, or serve content at `/`.
4. **Security headers missing:** no `Strict-Transport-Security`, no `Content-Security-Policy`, no `Permissions-Policy`, no `X-Frame-Options`/`frame-ancestors`. Present: `X-Content-Type-Options`, `Referrer-Policy`. (securityheaders.com blocks bot fetches; graded from raw headers, roughly a D.) Fix in `_headers`.
5. **Generic anchor text `hier`** on vote detail source-PDF link (SEO 85 on details, `link-text` audit). Fix: descriptive anchor ("Drucksache 21/4762 (PDF)").
6. **`color-contrast` 142 nodes on /votes/** (result badges e.g. ANGENOMMEN outline style) and **`target-size`**: party links in list rows are 28x17px, below 24px minimum.
7. **robots.txt Lighthouse warning** "Unknown directive" for `Content-Signal:` line. Cloudflare content-signals spec puts Content-Signal inside a user-agent group, ours is file-level after Sitemap. Cosmetic, verify against contentsignals.org in round 2.
8. **hreflang served as camelCase `hrefLang`** (React prop leaking into SSR output). HTML attribute names are case-insensitive so parsers treat it as valid; cosmetic only. hreflang de/en/x-default present on all sampled pages.

Verified healthy: robots.txt + sitemap (3,778 URLs, correct canonicals) serve correctly post-deploy; llms.txt 200; `.well-known/api-catalog` 200 `application/linkset+json`; `Link` header advertises both; canonical/OG/Twitter/robots meta complete and page-specific; per-vote OG images serve 1200x630 PNG; default og-image 1200x630; JSON-LD (Organization, WebSite, DataCatalog+Datasets, BreadcrumbList, Event+Legislation) parses and matches schema.org types; CLS 0 everywhere; no stale-cache inconsistencies observed.

## Round 1 research

- **AI crawlers do not execute JavaScript** (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot; only Gemini via Googlebot WRS renders). Our full prerender is exactly right; the raw-HTML completeness of detail pages is the AI-visibility asset. Action: keep every route prerendered, never move content behind client-only fetches.
- **llms.txt reality check:** ~6-10% adoption, but server-log studies show major AI crawlers essentially never fetch it (408 hits in 500M AI bot visits) and no measurable citation lift. Perplexity and Claude retrieval workflows are the confirmed consumers. Action: keep ours (cheap, correct), stop investing further; prioritize clean HTML + Datasets JSON instead.
- **Google 2026 guidance:** no separate AI algorithm; AI Overviews source selection correlates with classic E-E-A-T. Google explicitly says llms.txt/special-AI-schema not needed for its AI features. For a civic-data site E-E-A-T means: visible data sources (bundestag.de links, already have), methodology/about page, named operator, freshness dates. Action for round 3: an "Über die Daten / methodology" page, `Dataset` freshness fields, cite-able fact-shaped paragraphs (answer-engine extraction favors clear stats sentences).
- **Core Web Vitals:** INP ≤200ms replaces FID; it is the most-failed CWV industry-wide. Secondary blogs claim a March 2026 LCP tightening to 2.0s; not confirmed in Google primary docs, treat 2.5s/200ms/0.1 as thresholds but aim for 2.0s LCP anyway. Our /votes/ TBT 1.2s is an INP red flag once field data exists.
- **ChatGPT Search retrieves via Bing's index.** A page not indexed by Bing cannot be cited by ChatGPT Search. Action: Bing Webmaster Tools + IndexNow matter more than their classic traffic share suggests.
- **IndexNow** is free, no account needed for the protocol itself: host a key file, ping `api.indexnow.org` on content changes. Action for round 2: add key file + ping step to the deploy/ETL refresh flow.
- **German market:** no special google.de algorithm; standard factors (CWV, E-E-A-T, brand mentions). Local-pack/Google-Business-Profile machinery is irrelevant for us (no physical service). German-language answer-engine optimization = clear fact sentences with numbers, which our vote descriptions already do.

## Round 2 — plumber lane: self-host member photos (done 2026-07-05)

Addresses round-1 finding 1 (members LCP 8.4s from commons.wikimedia.org hotlink + third-party cookies).

- `apps/bundestag/scripts/fetch-member-photos.mjs`: downloads a 320px Wikimedia thumb (`Special:FilePath/...?width=320`) for every term-21 member with a Commons pictureUrl into `apps/bundestag/public/members-photos/{memberId}.{jpg|png}` (gitignored, like og/). Serial with 400ms spacing + Retry-After backoff (Wikimedia 429s hard on any parallel burst; concurrency 2 got 604/635 throttled). Idempotent: existing files skipped. Cold run 634 photos in 16 min; warm run 0.9s. Wired into `apps/bundestag/package.json` build before OG generation, so only the first build after a photo-set change pays the cost.
- Coverage: 634/635 term-21 Commons photos downloaded (471/634 files at or under 40KB p90, median 27KB, total 18MB; 9 PNGs stay PNG, largest 261KB, no re-encode dependency added). 1 failure: `mast-katja`, `File:Mast Portrait 2024.jpg` deleted upstream on Commons, so her existing hotlink URL is broken on prod too; re-running `npm run etl:portraits` should refresh her Wikidata image.
- Manifest: `apps/bundestag/public/members-photos/manifest.json`, memberId → `{ file, author, license, sourceUrl }`. All 634 entries carry full CC attribution (author + license + Commons file-page link), matching what the `MemberPortrait` "Foto:" credit already renders. Frontend contract: resolve pictureUrl local-first via manifest, fall back to the DB URL.
- **Attribution boundary**: only Commons-sourced photos are self-hosted. 209 sitting members have abgeordnetenwatch profile photos with NO stored author/license/source, and there is nothing to backfill: the AW API exposes no photo metadata and the profile HTML carries no copyright/Bildnachweis markup (photos are politician-supplied, rights unclear). Per the do-not-ship-incomplete-attribution rule these stay hotlinked from abgeordnetenwatch.de; the members grid will still show third-party requests for those ~209 until they gain Commons portraits.

## Round 2, frontend lane (done 2026-07-05, all verified on dev :5174; Lighthouse 12 local against vite dev, absolute values inflated vs prod, deltas are the signal)

1. **/members/ LCP**: first 12 grid photos `loading="eager"`, first 5 `fetchpriority="high"`, real `alt` (member name), preconnect to commons.wikimedia.org + upload.wikimedia.org in root head (interim; plumber's self-hosting supersedes for Commons photos, still helps the ~209 AW hotlinks). LCP 23.0s → 12.2s, Speed Index 8.3s → 6.5s (mobile-throttled dev). SSR emits camelCase `fetchPriority`, same benign React SSR quirk as round-1's `hrefLang`.
2. **/votes/ DOM cap**: first 30 votes render full cards; the rest render title-link shells (`LazyVoteCard` + `useNearViewport` IntersectionObserver, rootMargin 1500px) that upgrade on approach, mobile snap feed and desktop both. Raw HTML 10.32MB → 5.63MB, element tags 79.5k → 42.1k, TBT 8.9s → 5.7s, FCP/LCP 2.6s → 1.3/1.4s (perf preset). Remaining bulk: 30 hemicycles x 630 seat circles x 2 breakpoint lists. Detail pages + sitemap carry crawlability for shelled votes.
3. **Redirect chain**: added `/ /votes/ 301`, `/en /en/votes/ 301`, `/en/ /en/votes/ 301` to `_redirects`. BUT the first hop (`/` 301 → `/votes` without slash) is a Cloudflare zone-level redirect rule (absolute Location, no Pages `_headers` applied), not in the repo; it fires before Pages, so the chain stays 2 hops until that dashboard rule is deleted or retargeted to `/votes/`. Listed under user action.
4. **Security headers** in `_headers` `/*`: HSTS (31536000, includeSubDomains), X-Frame-Options DENY, Permissions-Policy (camera/mic/geo off), Content-Security-Policy-Report-Only (default-src 'self', inline script/style allowed, img-src self + wikimedia + abgeordnetenwatch, frame-ancestors 'none'). Report-only first; tighten in a later round after checking violations.
5. **Anchor text**: "hier" links on vote detail + motion detail now read "Drucksache NN/NNNN (PDF)" (label matched from vote_documents / antrag.drucksache; fallback "der Original-Drucksache (PDF)" / "the source document (PDF)"). `here` i18n key removed, no other generic anchors found.
6. **a11y /votes/ 91 → 100**: Stamp text `color-mix(in srgb, accent 45%, fg)`, border/outline keep the accent (worst-case contrast 4.68:1, was 2.02); hemicycle center legend opacity-m → opacity-l (2.71 → 7.6:1); party logo links in list rows `p-xs -m-xs` (hit box 36x25, was 28x17; padding not pseudo-element because axe measures the border box).
7. **IndexNow**: key file `public/5ad8cfc66abd353bfb34c0213d0f1dba.txt`, `scripts/indexnow-ping.mjs` (reads sitemap, pings api.indexnow.org for URLs with lastmod within `--days` N, default 7, or `--all`), wired as `npm run indexnow`. Not auto-run.
8. **robots.txt**: `Content-Signal:` moved inside the `User-agent: *` group (matches contentsignals.org's own robots.txt; RFC 9309 treats rules outside a group as syntax errors, unknown rules inside a group are ignored gracefully).

Dev-vs-dev scores, same machine same runs: /votes/ a11y 0.91 → 1.00, best-practices → 1.00, SEO 0.66 unchanged (only failing audit is `is-crawlable`, the intentional dev noindex). Zero console errors on votes/members/motions, both locales, mobile + desktop. tsc clean.

## Round 2 stitch: serve self-hosted photos (done 2026-07-05, verified on dev :5174)

Wires plumber's manifest into every payload that carries a member photo URL. Views untouched; resolution lives in the data layer.

- New `apps/bundestag/src/server/photoManifest.ts`: reads `public/members-photos/manifest.json` once per module load (existsSync ternary, so dev checkouts without the fetched photos fall back to DB URLs), exports `resolvePictureUrl(memberId, dbUrl)` returning `manifest[id]?.file ?? dbUrl`.
- Wired into all seven emit sites: `src/server/members.ts` (listMembers), `src/server/memberDetail.ts`, `src/server/voteDetail.ts` (defectors + memberBallots), `src/server/voteSponsors.ts`, `src/server/antraege.ts` (ballots + signatories), `vite-data/{members,votes,antraege}.ts` (the `/members/{id}.json` etc. alternate-JSON endpoints), and `vite.config.ts` speeches-people generation. Works in both module contexts (vite SSR and esbuild-bundled config; import.meta.url resolves per-file in both).
- Verified: /members/ dehydrated payload 630 members = 370 local + 209 abgeordnetenwatch (exactly the no-license set) + 1 commons (mast-katja, file deleted upstream, known plumber gap) + 50 null. speeches-people.json 540 people = 336 local / 203 AW / 1 commons. Member detail img + `<link rel="preload">` both local; "Foto:" credit unchanged (DB `picture_source_url` matches manifest sourceUrl byte-for-byte, link still points at the Commons file page). Vote detail defectors + ballot rows and static vote JSON resolved. Playwright over /members/, member detail, /speeches/, vote detail: zero console errors, all in-viewport local photos load (offscreen lazy images unfetched by design). tsc clean.
- LCP: the /members/ LCP element is now a same-origin ~27KB thumb with `loading="eager"` + `fetchpriority="high"` from the frontend lane, so the two fixes stack: no Wikimedia DNS/TLS/cookie hop on the critical path. The commons/upload preconnects in the root head no longer help /members/ above-the-fold (all eager photos are local) and can be dropped in round 3 in favor of an abgeordnetenwatch preconnect check.

## Needs user action

1. **Google Search Console**: verify machtblick.de (DNS TXT record via Cloudflare is easiest), then submit `https://machtblick.de/sitemap.xml`. Unlocks index coverage, CWV field data, query reports. ~10 min.
2. **Bing Webmaster Tools**: sign in, use "Import from Google Search Console" one-click, submit sitemap. Gateway to ChatGPT Search citations. ~5 min.
3. **PageSpeed Insights API key** (free Google Cloud key) if we want scripted PSI in later rounds; anonymous quota is globally exhausted most days. Optional, local Lighthouse works.
4. CrUX field data will only appear after sustained real-user traffic; nothing to do, just expectation-setting.
5. **Cloudflare dashboard**: delete (or retarget to `/votes/`) the zone-level redirect rule that 301s `/` → `/votes`; `_redirects` now handles `/` → `/votes/` in one hop. Same check for `/en` if a zone rule exists there.
6. **IndexNow**: after the next prod deploy run `npm run indexnow -- --all` once from apps/bundestag (key file must be live first), then `npm run indexnow` after each data-refresh deploy.

## Log
- lead: plan created 2026-07-05 after prod deploy dc92f4a8, dispatching round 1
- visibility: round 1 done 2026-07-05. Lighthouse local (PSI quota exhausted) on 4 prod pages, headers scan, JSON-LD + discovery files verified, research logged above. Top implementation targets for round 2: members LCP (Wikimedia hotlink + lazy LCP), votes DOM size, homepage redirect chain, security headers, IndexNow. No code changed.
- plumber: round 2 photo lane done 2026-07-05. fetch-member-photos.mjs + manifest shipped, 634/635 Commons photos self-hosted with full attribution, wired into build (warm re-run <1s). Gaps: mast-katja Commons file deleted upstream (etl:portraits re-run needed), 209 AW-sourced photos stay hotlinked (no license metadata upstream, must not self-host). Frontend can now switch to manifest local-first resolution. Not committed.
- frontend: round 2 frontend lane done 2026-07-05, details in "Round 2, frontend lane" above. New: hooks/useNearViewport.ts, views/votesList/LazyVoteCard.tsx, scripts/indexnow-ping.mjs, public/5ad8cfc66abd353bfb34c0213d0f1dba.txt. Edited: VotesList, MemberCard, MembersList, Stamp, VoteHemicycle, PartyBadge, DetailTab, AntragDetail, i18n, __root, _headers, _redirects, robots.txt, package.json (added indexnow script only; plumber's fetch-member-photos build step untouched). Manifest local-first pictureUrl resolution NOT done in this lane (follow-up). Not committed. Root redirect chain needs user action 5 to fully collapse.
- frontend: round 2 stitch done 2026-07-05, details in "Round 2 stitch" above. New: src/server/photoManifest.ts. Edited: src/server/{members,memberDetail,voteDetail,voteSponsors,antraege}.ts, vite-data/{members,votes,antraege}.ts, vite.config.ts. Views untouched, mock unchanged. Verified on dev :5174 (payload host counts, credit link, Playwright zero console errors), tsc clean. Not committed. Round 3 candidate: drop wikimedia preconnects from __root.
