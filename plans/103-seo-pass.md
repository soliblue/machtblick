# 103 SEO Pass

## Goal
Optimize SEO and discoverability for the bundestag app after the votes home redesign (plan 102). Audit then fix: metadata, social previews, structured data, crawler access, AI assistant discoverability. No deploy; user verifies on dev first.

## Status
- audit: done
- fixes: done (verified against :5174; needs deploy to take effect)

## Contracts
- App: apps/bundestag; every route must prerender (vite.config.ts prerenderPaths), spa: false on Cloudflare Pages
- Dev server on :5174 (note: dev injects robots noindex, judge prod behavior from code paths, not dev headers)
- Redesigned home: /votes/ with Im Fokus hero; view code in src/views/votesList
- Do not touch src/views/votesList/FilterPill.tsx or src/views/partiesList/Hemicycle.tsx (frontend is fixing bugs there concurrently)

## Findings / fixes

### Critical, fixed
- `/votes/` and `/en/votes/` returned 307 to `/votes/?type=namentlich`: the recent default-filter commit put the default in `validateSearch`, so TanStack Start redirected the canonical home URL (listed in sitemap, target of `/`) to a query variant whose canonical points back, a redirect loop for indexing. Fixed with `stripSearchParams({ type: 'namentlich' })` search middleware in `apps/bundestag/src/routes/votes/index.tsx` and `en/votes/index.tsx`; behavior unchanged, URL stays clean.

### Quality, fixed
- Vote detail meta descriptions used raw ISO dates ("am 2026-06-25"); now `formatDateLong` ("am 25. Juni 2026" / "on 25 June 2026") in `votes/$id.tsx` and `en/votes/$id.tsx`.
- Motion meta descriptions leaked Markdown (`**bold**`, `*italic*`) from `summarySimplified` and ran 500+ chars; new `plainDescription()` in `src/lib/seo.ts` strips markup and truncates at 260 chars, used in both motion routes.
- BreadcrumbList JSON-LD added to vote, member, and party detail routes (de+en) via new `breadcrumbJsonLd()` in `src/lib/seo.ts`.
- `Legislation` JSON-LD added to motion routes (de+en): name, legislationType (Antrag/Gesetzentwurf), legislationIdentifier (Drucksache), legislationDate, creator (initiativeFraktion).
- `article:published_time` added to vote detail pages (og:type article was set without it).
- `llms.txt` updated to note `/votes/` defaults to namentlich.

### Audited, already good
- Per-route titles/descriptions specific and localized on all list, static, and detail routes; canonical absolute, hreflang de/en/x-default reciprocal everywhere; og:url == canonical.
- OG + Twitter cards complete incl. image dims and alt; static `og-image.png` is 1200x630.
- Root JSON-LD: Organization, WebSite, DataCatalog with three Dataset entries; Person on members, PoliticalParty on parties.
- robots.txt (search + user-requested AI allowed, training bots disallowed, Content-Signal), sitemap.xml (regenerated at build, lists only canonical URLs: member `/votes/` tab, party `/profile/` tab, no redirecting `/`), `.well-known/api-catalog` + mcp + agent-skills, `_headers` links, `_redirects` for legacy German paths, JSON alternates on detail pages.
- Verified via curl against :5174 (SSR head equals prerendered head): all 18 sampled page types pass title/desc/canonical/hreflang/og/twitter/JSON-LD-parse checks; `/votes/` and `/en/votes/` now 200.

### Follow-ups (L effort, not done)
- Per-page OG image generation (e.g. vote result cards with party bars) instead of the single static og-image.png.
- English motion pages keep German titles: `cleanTitle` is untranslated in the data; needs ETL translation of antrag titles, not a head fix.
- Pre-existing tsc error in `src/lib/voteTitles.ts` (concurrent frontend work, not touched here).
- Deploy needed: production currently serves the prerendered redirect artifact for `/votes/`.

## Open questions
(none)

## Log
- lead: plan created 2026-07-04, dispatched visibility
- visibility 2026-07-04: audit + fixes done. Critical: /votes/ 307-redirected to /votes/?type=namentlich (default filter in validateSearch); fixed via stripSearchParams middleware. Added BreadcrumbList (vote/member/party), Legislation (motions), article:published_time, formatted dates in vote descs, markdown-stripped motion descs, llms.txt note. Verified 18 page types via curl :5174, all pass. Did not touch FilterPill.tsx / Hemicycle.tsx. tsc clean except pre-existing voteTitles.ts error from concurrent work. No build, no deploy, no commit.
