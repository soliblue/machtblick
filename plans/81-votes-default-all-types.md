# Votes Default All Types

## Goal

Show all visible Bundestag votes on the votes list by default instead of applying the named-vote filter automatically, and let long German vote titles hyphenate cleanly.

## Status

Implemented. Build, browser smoke, and visibility passed.

## Scope

- German and English votes index routes.
- Preserve explicit `type=` URL filters.
- Keep the type filter control available for narrowing to named votes or show-of-hands votes.
- Apply native hyphenation to vote row titles with language metadata.

## Verification

- Build the Bundestag app.
- Browser smoke the German and English votes list default state.

## Log

### Lead

- Found the default named-vote filter in both votes index route components.
- Changed both votes index routes to pass no vote type filter by default.
- Added native hyphenation and normal word breaking to vote row titles.
- Updated the German votes page description so it no longer describes the default list as named votes only.

### Tester

- Ran local browser smoke at `http://localhost:3001` against the final deploy-candidate build.
- Verified `/votes/` and `/en/votes/` default lists show recorded and show-of-hands rows with no type pill selected.
- Verified `/votes/?type=namentlich` and `/en/votes/?type=namentlich` narrow to recorded rows.
- Verified vote row title computed CSS: `hyphens: auto`, `overflow-wrap: break-word`, and `word-break: normal`.
- Verified German vote row titles use `lang="de"` with document `lang="de"`, and English vote row titles use `lang="en"` with document `lang="en"`.
- Verified German votes meta description contains `Alle Abstimmungen` and does not contain `namentlich`.
- Result: vote-list cases PASS, no vote-list console errors.
- Reran adjusted strict browser smoke at `http://localhost:3001` with the deliberate unpublished-motion 404 outside the console regression gate.
- Reverified default `/votes/` and `/en/votes/` show recorded plus show-of-hands rows with no type pill selected.
- Reverified German and English `?type=namentlich` lists narrow to recorded rows.
- Reverified vote row title computed CSS and `lang` metadata.
- Reverified the German votes meta description does not say named-only.
- Result: PASS, no unexpected console errors on published pages or vote-list interactions.

### Visibility

- Reran visibility against the final deploy-candidate build under `apps/bundestag/dist/client`; did not rebuild, commit, push, or deploy.
- Verified `/votes/` metadata now describes all Bundestag votes: `Alle Abstimmungen des Deutschen Bundestags mit Antragsteller, Ergebnis und Fraktionsverhalten.`
- Sampled `votes/index.html`, `en/votes/index.html`, `motions/318555/index.html`, `en/motions/318555/index.html`, `members/ataoglu-tijen/votes/index.html`, and `parties/spd/profile/index.html`; titles, descriptions, absolute canonicals, indexable robots meta, Open Graph, X card, hreflang alternates, reciprocal alternates, and JSON-LD passed.
- Verified `sitemap.xml` has 3,560 URLs, no `<lastmod>`, no root redirect URL, no query or hash URLs, no duplicates, no missing generated HTML, and no canonical mismatches.
- Verified every generated HTML JSON alternate resolves to a local generated JSON file, and generated JSON files plus `.well-known/api-catalog` and `site.webmanifest` parse as JSON.
- Verified publishable motion output is unchanged: German motion HTML, English motion HTML, German motion JSON, English motion JSON, German sitemap motion URLs, and English sitemap motion URLs all contain the same 853 motion IDs.
- Verified incomplete motion IDs `332795`, `334134`, `334375`, and `334864` remain absent from German and English motion HTML, JSON, and sitemap URLs.
- Verified `robots.txt`, `llms.txt`, `.well-known/api-catalog`, and `_headers` are present and preserve crawler, AI discovery, service-doc, and API-catalog signals.
- Verified `og-image.png` is 1200 by 630, `site.webmanifest` icons exist at 192 by 192 and 512 by 512, and favicon assets exist.
- Result: PASS, no blocking visibility issues found.
