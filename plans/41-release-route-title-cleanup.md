# 41 Release Route Title Cleanup

## Goal

Finish the current Bundestag change set for release: English-only URL segments, Antrag simplified titles, project warning cleanup, verification, commit, push, and deploy.

## Scope

- Rename visible route segments to English for both German and English locales.
- Keep German UI labels where the locale is German.
- Add Antrag simplified titles as stored data, generated from existing titles and summaries.
- Show simplified Antrag titles first, with official titles below when they differ.
- Fix build/type/project warnings discovered during verification.
- Commit, push, and deploy after tests pass.

## Contracts

- Locale difference in URLs is only the optional `/en` prefix.
- Antrag detail paths use `/motions/:id/`.
- Speech search paths use `/speeches/`.
- Member tabs use `/votes/`, `/speeches/`, `/questions/`, `/motions/`.
- Party tabs use `/votes/`, `/profile/`, `/history/`.
- Old German segments are not the canonical links.
- `antraege.clean_title` stores the simplified display title.

## Status

- Done.

## Log

### lead

- Started from release request after plan 40 completion.
- Canonicalized visible route segments to English: `/motions`, `/speeches`, member `/votes` `/speeches` `/questions` `/motions`, party `/profile` `/votes` `/history`, `/imprint`, and `/privacy`.
- Added `antraege.clean_title`, migration `0025_antraege_clean_title.sql`, Codex batch ETL, server/static wiring, and UI display with official title below when it differs.
- Backfilled 822 term-21 Antrag titles from summaries and official titles. 804 differ from the official title.
- Verified `npm --workspace @machtblick/bundestag run build`, `npx tsc -p apps/bundestag/tsconfig.json --noEmit`, `git diff --check`, changed-file dash scan, and dev URLs including `/motions/334637/`, `/members/amtsberg-luise/motions/`, `/speeches/`, `/imprint/`, and `/privacy/`.
- Added Cloudflare Pages redirects from legacy German segments to the new English segments and a static 404 page for genuinely missing static paths.
- Aligned canonical metadata, language-switch links, and sitemap entries with the slash-terminated canonical URLs served by Cloudflare Pages.
