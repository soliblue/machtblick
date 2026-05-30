# Auto Refresh 2026-05-30

## Goal

Refresh Bundestag public data after the scheduler found likely upstream changes, verify publishable slices, commit coherent tracked changes, and deploy only if all gates pass.

## Status

Data refreshed, validated, and built. Visibility, commit, and deploy gates pending.

## Scheduler Preflight Evidence

- Thread name: `🤖 2026-05-30 Auto`
- Preflight command: `scripts/bundestag-auto-refresh-preflight`
- Exit: `0` at `20260530T072509Z`
- Branch: `main`
- Git status: untracked `plans/92-logo-variants.md`
- DB: `db/machtblick.sqlite`, `171.0 MB`
- Votes: `1968`, newest date `2026-05-22`, newest Bundestag id `1004`
- Vote types: `hammelsprung=1`, `handzeichen=248`, `namentlich=1719`
- Speeches: `26348`, newest date `2026-05-21`, newest session `21-80`
- Speech XML probes: `21081=200`, `21082=404`, `21083=404`
- Antraege: `864`, newest update `2026-05-22T14:46:39+02:00`
- Missing Antrag descriptions: `42`
- Vote Antraege: `168`
- Vote translations: `280`
- Speech translations: `2798`
- Antrag description translations: `142`
- DIP updated start: `2026-05-22T14:46:39+02:00`
- DIP Vorgang rows found: `925`

## Lead Verification

- Local `git status --short` matches preflight: untracked `plans/92-logo-variants.md`.
- Local core counts match preflight: votes `1968`, speeches `26348`, Antraege `864`.
- Confirmed `https://dserver.bundestag.de/btp/21/21081.xml` returns `200` with `last-modified: Tue, 26 May 2026 23:45:14 GMT`.
- Confirmed DIP has updated Antraege after the local max, including id `334061`, updated `2026-05-29T09:38:42+02:00`.

## Work Plan

1. Back up `db/machtblick.sqlite`.
2. Run source refreshes in scheduler order where relevant.
3. Run derived refreshes with default stale detection.
4. Check before and after counts for votes, speeches, Antraege, vote links, translations, and generated descriptions.
5. Confirm speech XML reaches the newest available session.
6. Confirm new eligible votes and Antraege have generated metadata and translations.
7. Build `@machtblick/bundestag`.
8. Run visibility before deploy.
9. Commit tracked source changes with scribe if coherent.
10. Deploy with deployer if every gate passes.

## Counts

### Before

- Votes: `1968`
- Speeches: `26348`
- Antraege: `864`
- Vote Antraege: `168`
- Vote descriptions: `256`
- Antrag descriptions: `822`
- Vote translations: `280`
- Antrag description translations: `142`
- Speech translations: `2798`

### After

- Votes: `2100`
- Speeches: `26348`
- Antraege: `885`
- Vote Antraege: `169`
- Vote descriptions: `257`
- Antrag descriptions: `874`
- Vote translations: `2077`
- Vote party summary translations: `881`
- Antrag description translations: `874`
- Speech translations: `2798`
- Missing Antrag descriptions: `11`

## Open Questions

- Determine whether untracked `plans/92-logo-variants.md` is unrelated and should remain uncommitted.
- Visibility passed for generated static output. Commit and deploy gates remain.

## Log

### Lead

- Created the plan after independently confirming upstream speech XML session `21081` and DIP Antrag updates.
- Backed up SQLite to `runs/_app-server/db-backups/machtblick-20260530T0726-before-auto-refresh.sqlite`.
- Ran source refreshes in order: stammdaten, abgeordnetenwatch, namentliche votes, handzeichen, DIP incremental from `2026-05-22T14:46:39+02:00`, speech XML, affiliations, and normalization.
- `etl:speeches:xml` initially downloaded `21081.xml`, but ingest showed `81 sessions (parsed: 80)`. After the plumber fix, fetch identifies live `21081.xml` as a duplicate body for `sitzung-nr=80`; reran ingest from 80 valid XML sessions and restored speeches to `26348`.
- Ran derived refreshes: titles, Antrag titles, vote descriptions, Antrag descriptions, party positions, vote translations, Antrag description translations, and speech translations.
- Fixed shared PDF extraction so `dserver.bundestag.de` PDF downloads solve the Enodia proof challenge. Reran Antrag descriptions until all eligible 52 rows generated.
- Filled historical vote translation backlog selected by default stale detection: `vote_translations` increased from `280` to `2077`; reran once for the single residual missing model output.
- Filled Antrag description translation backlog selected by default stale detection: `antrag_description_translations` increased from `142` to `874`; retried timed-out batches until no eligible rows remained.
- Public vote validation initially failed with `missing_speech_rich_party_summaries=116`. Reran `etl:party-positions -- --vote-type all`, then reran `etl:translations` for the new party-summary translation inputs.
- Confirmed final public vote validation passes: `missing_clean_title=0`, `missing_vote_summaries_with_pdf=0`, `missing_speech_rich_party_summaries=0`.
- Confirmed `npm run etl:translations -- --dry-run` reports `0/0 eligible`.
- Confirmed `antrag_description_translations` has no missing English rows for generated Antrag descriptions.
- Confirmed speech XML fetch reaches the newest complete session `80`; live `21081.xml` currently exists at the URL but contains session `80`, so session `81` is not yet publishable.
- Confirmed static output exists for refreshed German and English vote routes `pp21-80-0`, `pp21-80-1`, and `2026-05-22-1004`, including JSON for German vote detail routes.
- Confirmed static output exists for refreshed German and English motion routes `335476` and `335478`, including JSON.
- Ran a fresh `npm run build -w @machtblick/bundestag` after all database writes completed. Build passed.

### Plumber

- Reproduced the `21081.xml` failure: Node `fetch()` follows a `303` into the Enodia verification page and receives `400`, while the XML is reachable after solving the page's `pow` challenge and sending the returned `enodia` cookie.
- Updated `etl/bundestag-reden-xml/fetch.ts` to solve that challenge once per run, reuse the cookie, and validate cached and downloaded XML against the expected `sitzung-nr`.
- Found live `21081.xml` is currently a duplicate body for `sitzung-nr=80`; the fetcher now removes stale cached mismatches and treats that response as missing so the eventual real session 81 is not masked. Verified `npm run etl:speeches:xml:fetch` exits `0` with `downloaded=0`, `skipped=80`, `latest complete session 80`.

### Visibility

- Did not rerun `npm run build -w @machtblick/bundestag` because lead context said a fresh build already passed and `apps/bundestag/dist/client` exists.
- Inspected generated output with `sed -n '1,220p' plans/94-auto-refresh-2026-05-30.md`, `find apps/bundestag/dist/client -maxdepth 3 -type f | sort | sed -n '1,220p'`, `find apps/bundestag/dist/client -maxdepth 2 -type f -name 'index.html' | sort`, `find apps/bundestag/dist/client -maxdepth 3 -type d | sort | sed -n '1,240p'`, `find apps/bundestag/dist/client/votes -maxdepth 2 -type f | sort | sed -n '1,80p'`, `find apps/bundestag/dist/client/en/votes -maxdepth 2 -type f | sort | sed -n '1,80p'`, `sed -n '1,220p' apps/bundestag/dist/client/robots.txt`, `sed -n '1,220p' apps/bundestag/dist/client/llms.txt`, `sed -n '1,220p' apps/bundestag/dist/client/_headers`, `sed -n '1,220p' apps/bundestag/dist/client/_redirects`, and `rg -n "1004|pp21-80|335476|335478|motions/" apps/bundestag/dist/client/sitemap.xml | sed -n '1,120p'`.
- Ran inline Node validators with `node <<'NODE'` to parse sampled HTML, JSON-LD, manifest JSON, `.well-known/api-catalog`, sitemap XML, PNG dimensions, sitemap canonical self-consistency, and JSON alternate targets.
- Sampled pages: `apps/bundestag/dist/client/votes/index.html`, `apps/bundestag/dist/client/en/votes/index.html`, `apps/bundestag/dist/client/votes/2026-05-22-1004-ablehnung-eines-antrags-zur-arzneimittelversorgung/index.html`, and `apps/bundestag/dist/client/en/votes/2026-05-22-1004-ablehnung-eines-antrags-zur-arzneimittelversorgung/index.html`.
- HTML metadata passed. Sampled titles and descriptions are page specific, canonicals are absolute production URLs, canonical targets exist in generated output, canonical paths are not redirect sources, `hreflang` has `de`, `en`, and `x-default`, alternates reciprocate, Open Graph and X card fields are complete, robots meta is indexable with large image previews, JSON-LD parses as Schema.org `Organization`, `WebSite`, `DataCatalog`, `Dataset`, and `DataDownload`, and vote detail JSON alternates point at generated JSON.
- Sharing previews passed. `og-image.png` is `1200x630`; sampled Open Graph and X image dimensions and alt text are present. Manifest and favicon assets exist with checked PNG dimensions: `android-chrome-192x192.png` is `192x192`, `android-chrome-512x512.png` is `512x512`, `apple-touch-icon.png` is `180x180`, `favicon-16x16.png` is `16x16`, `favicon-32x32.png` is `32x32`, and `mstile-150x150.png` is `150x150`.
- Crawler access passed. `robots.txt` allows public indexing and retrieval crawlers, declares `Sitemap: https://machtblick.de/sitemap.xml`, and preserves `Content-Signal: search=yes, ai-input=yes, ai-train=no`.
- Checked current primary crawler docs for named AI crawler policy: `https://developers.openai.com/api/docs/bots`, `https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler`, `https://docs.perplexity.ai/docs/resources/perplexity-crawlers`, `https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers`, `https://support.apple.com/en-us/119829`, and `https://commoncrawl.org/ccbot`.
- AI discovery passed. `llms.txt` explains the site, canonical route families, JSON endpoints, source datasets, and AI access policy. `_headers` exposes `</.well-known/api-catalog>; rel="api-catalog"` and `</llms.txt>; rel="service-doc"`. `.well-known/api-catalog` parses as linkset JSON and links service docs plus `/api/votes.json`, `/api/members.json`, and `/api/parties.json`.
- Sitemap and JSON alternates passed. `sitemap.xml` has `3830` URLs, no `<lastmod>`, no query or hash variants, includes refreshed vote URLs `2026-05-22-1004`, `pp21-80-0`, and `pp21-80-1`, includes refreshed motion URLs `335476` and `335478` in both languages, and every sitemap URL checked maps to an indexable generated page whose canonical equals the sitemap URL.
- Full generated HTML scan found `8392` pages and `8378` JSON alternate links. All JSON alternate targets exist and parse. Blocking visibility issues: none.
