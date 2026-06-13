# Bundestag auto refresh 2026-06-13

## Goal

Refresh Machtblick Bundestag data if upstream Bundestag, DIP, or derived material has changed, then deploy only if data gates, build, visibility, and deployment gates pass.

## Status

In progress.

## Scheduler preflight evidence

Scheduler thread name: `🤖 2026-06-13 Auto`

Scheduler command `scripts/bundestag-auto-refresh-preflight` exited `0` at `20260613T072109Z`.

```text
utc=2026-06-13T07:21:09Z
root=/home/soli/projects/machtblick
branch=main
git_status_begin
?? plans/92-logo-variants.md
git_status_end
db_path=db/machtblick.sqlite
db_size_mb=208.7
votes_count=2100
votes_newest_date=2026-05-22
votes_newest_bundestag_id=1004
votes_by_type.hammelsprung=1
votes_by_type.handzeichen=250
votes_by_type.namentlich=1849
speeches_count=26624
speeches_newest_date=2026-05-22
speeches_newest_session=21-81
speeches_without_member=13879
speeches_without_vote_link=23739
antraege_count=889
antraege_newest_updated_at=2026-06-05T14:44:10+02:00
antraege_missing_descriptions=11
vote_antraege_count=169
vote_translations_count=2077
speech_translations_count=2831
antrag_description_translations_count=878
speech_xml_probe.21082=200
speech_xml_probe.21083=200
speech_xml_probe.21084=404
dip_vorgang_updated_start=2026-06-05T14:44:10+02:00
dip_vorgang_num_found=1463
```

Lead reran `scripts/bundestag-auto-refresh-preflight` at `2026-06-13T07:21:57Z` with matching counts and upstream evidence.

## Initial local state

- Branch: `main`
- Local changes before this plan: `?? plans/92-logo-variants.md`
- `plans/92-logo-variants.md` is unrelated logo selection material. It does not affect source ETL, database, build, visibility, or deploy gates for this run.
- New upstream data is present because session XML `21082` and `21083` return `200`, local newest speech session is `21-81`, and DIP reports `1463` Vorgänge updated since `2026-06-05T14:44:10+02:00`.

## Shared contracts

- Back up `db/machtblick.sqlite` under `runs/_app-server/db-backups/` before the first write.
- Use existing ETL scripts.
- Do not pass `--force` to derived jobs unless a later log entry records why.
- Publish complete slices only. Incomplete DIP rows may remain in SQLite if unrelated slices pass.
- Deploy is allowed by this scheduled prompt only if the refresh is clean, build passes, visibility passes, and data gates for published slices pass.

## Planned commands

Source refresh:

1. `npm run etl:stammdaten`
2. `npm run etl:abgeordnetenwatch`
3. `npm run etl:votes:namentlich`
4. `npm run etl:handzeichen:refresh`
5. `DIP_UPDATED_START=2026-06-05T14:44:10+02:00 npm run etl:dip`
6. `npm run etl:speeches:xml`
7. `npm run etl:affiliations`
8. `npm run db:normalize`

Derived refresh:

1. `npm run etl:titles`
2. `npm run etl:antrag-titles`
3. `npm run etl:descriptions`
4. `npm run etl:antrag-descriptions`
5. `npm run etl:party-positions`
6. `npm run etl:translations`
7. `npm run etl:antrag-description-translations`
8. `npm run etl:speech-translations`

Gates:

1. Count votes, speeches, Antraege, vote links, translations, and generated descriptions before and after.
2. Confirm speech XML fetch reaches the newest available session.
3. Confirm new non-procedural votes have titles, descriptions, translations, and party positions when eligible.
4. Confirm Antraege metadata, signatories, descriptions, and translations when eligible.
5. Run `npm run build -w @machtblick/bundestag`.
6. Confirm generated static data and route outputs.
7. Run visibility specialist.
8. Commit with scribe if tracked source changes were made.
9. Deploy with deployer if all gates pass.

## Open questions

- None.

## Log

### lead

- Verified `git status --short` matches scheduler evidence except for this plan after creation.
- Verified local database counts directly with SQLite.
- Reran scheduler preflight and confirmed upstream speech XML and DIP activity.
- Backed up `db/machtblick.sqlite` to `runs/_app-server/db-backups/machtblick-2026-06-13T0722-before-refresh.sqlite`.
- Ran source ETL through speech XML. Speech fetch downloaded sessions `82` and `83`, skipped `81`, and reported latest complete session `83`.
- Ran `npm run etl:votes:namentlich` without flags per initial command list, then verified the importer defaults to term `20`. This did not import new term `21` roll calls and must be corrected with `--term 21 --aw-period 161`.
- `npm run etl:handzeichen:refresh` inserted `2` handzeichen votes and completed its built-in public vote validation.
- `DIP_UPDATED_START=2026-06-05T14:44:10+02:00 npm run etl:dip` completed. DIP process reported `919` app Antraege, `13892` signatories, and `155` vote link rows.
- `npm run etl:speeches:xml` ingested `27383` speeches from `83` sessions and matched all non-role speakers.
- `npm run etl:affiliations` inserted `1957` affiliation rows.
- `npm run db:normalize` flipped `28` votes by existing proposer-voted-no normalization.
- `npm run etl:antrag-descriptions` failed under default `gpt-5.2` because the local Codex account rejected that model. Reran with `CODEX_MODEL=gpt-5.4-mini`; completed `28`, skipped `0`, failed `2` by timeout.
- Next corrective source step: rerun term `21` namentliche vote import, then rerun dependent normalization, materialization, derived jobs, and gates.
- Patched `etl/bundestag/votes/import-namentlich.ts` for current Bundestag list/detail matching: punctuation-insensitive detail keys, duplicate XLSX row dedupe, and no-op reruns for already-current source-ID rows.
- Corrected term `21` namentliche import. Local term `21` namentliche votes now total `56`, newest date `2026-06-11`, max Bundestag ID `1008`. No published roll-call XLSX for ID `1009` was present in the list probe; June 12 changes were speech and handzeichen data.
- Reran dependent vote normalization, polarity, procedural flagging, initiator backfill, title provenance repair, audits, DIP processing, affiliations, and `db:materialize`.
- Patched `etl/bundestag/descriptions/pickAntrag.mjs` so Verordnung votes can use Drucksachen referenced from the vote teaser text. This fixed vote `2026-06-11-1008-jahresemissions-gesamtmengen-verordnung-2031-2040`.
- Completed derived refreshes with `CODEX_MODEL=gpt-5.4-mini` for Codex-backed jobs. Motion description retries left `335837` without a German description after repeated timeouts, so it is not publishable and is absent from the sitemap. All generated motion descriptions have English translations.
- Final counts: votes `2106`, public term `21` votes `278`, speeches `27383`, Antraege `919`, vote links `159`, speech vote links `3981`, vote translations `2083`, speech translations `2831`, Antrag description translations `907`, vote descriptions `262`, Antrag descriptions `907`.
- Speech XML fetch reached session `83`; preflight and fetch confirmed `21084.xml` was unavailable.
- `npm run db:validate:votes` passed: `missing_clean_title=0`, `bad_namentlich_source_url=0`, `missing_vote_summaries_with_pdf=0`, `missing_speech_rich_party_summaries=0`.
- `npm run build -w @machtblick/bundestag` passed and prerendered the expanded route set. Static output includes new vote pages for `1005`, `1008`, and `pp21-83-0`; sitemap includes completed new vote and motion routes and omits incomplete motion `335837`.

### visibility

- 2026-06-13T09:48:40Z: Ran pre-deploy visibility verification against generated `apps/bundestag/dist/client` output only. Did not deploy and did not change app behavior.
- Sampled `votes/index.html`, `en/votes/index.html`, `votes/pp21-83-0-entschliessungsantrag-zu-aussen-und-friedenspolitik/index.html`, `en/votes/pp21-83-0-entschliessungsantrag-zu-aussen-und-friedenspolitik/index.html`, `motions/335896/index.html`, and `en/motions/335896/index.html`.
- HTML metadata passed for sampled pages: page-specific titles and descriptions, absolute self canonicals, reciprocal `de`, `en`, and `x-default` hreflang clusters, Open Graph fields including image dimensions and alt text, X card fields including image alt text, and production robots meta with `index`, `follow`, and `max-image-preview:large`.
- Structured data passed. JSON-LD parses as Schema.org `Organization`, `WebSite`, `DataCatalog`, nested `Dataset`, and `DataDownload`; dataset markup includes `name`, `description`, `distribution.contentUrl`, and `distribution.encodingFormat`.
- JSON alternates passed across `8489` generated HTML files: `8474` JSON alternate links point at existing, parseable generated JSON targets.
- Crawler access passed. `robots.txt` allows general search and retrieval, declares `Sitemap: https://machtblick.de/sitemap.xml`, preserves `Content-Signal: search=yes, ai-input=yes, ai-train=no`, allows `OAI-SearchBot`, `ChatGPT-User`, `Claude-User`, `Claude-SearchBot`, `PerplexityBot`, `Perplexity-User`, `Googlebot`, `Bingbot`, and `Applebot`, and blocks training crawlers `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, and `CCBot`.
- Current crawler policy docs checked: `https://developers.openai.com/api/docs/bots`, `https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler`, `https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers`, `https://support.apple.com/en-us/119829`, `https://docs.perplexity.ai/docs/resources/perplexity-crawlers`, and `https://commoncrawl.org/ccbot`.
- AI discovery passed. `llms.txt` describes the site, route families, JSON endpoints, sources, canonical tab strategy, and AI access policy. `.well-known/api-catalog` parses as JSON and links service docs plus `/api/votes.json`, `/api/members.json`, and `/api/parties.json`. `_headers` exposes `/.well-known/api-catalog` and `/llms.txt`.
- Sitemap passed. `sitemap.xml` has `3908` URLs, includes key German and English route families plus new routes `pp21-83-0` and motion `335896`, has no `lastmod`, duplicates, query variants, JSON URLs, redirect sources, or canonical mismatches, and every sitemap URL maps to an indexable generated HTML page.
- Favicons and manifest passed. `site.webmanifest` parses and icons exist. `og-image.png` is `1200x630`, favicons are `16x16` and `32x32`, `apple-touch-icon.png` is `180x180`, Android icons are `192x192` and `512x512`, and `favicon.ico`, `og-image.svg`, and `logo.svg` exist.
- Local HTTP smoke test passed with `python3 -m http.server` on port `8788`: sampled canonical pages, `robots.txt`, `llms.txt`, `.well-known/api-catalog`, `sitemap.xml`, `og-image.png`, and `site.webmanifest` returned `200`.
- Blocking issues found: none.
