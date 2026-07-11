# Faster gates and speech audit

## Goal

Make pre-deploy tester and visibility gates proportional to the changed surface, audit whether currently available Bundestag speeches are missing locally or from vote links, and remove the date from web vote-detail headers.

## Status

Implementation verified and ready for release. A separate data-linking follow-up is identified below.

## Scope

- Tester covers the changed behavior plus the nearest regression flow, not a full app matrix.
- Visibility runs only checks affected by the diff while retaining a full build requirement before production deploys.
- Current upstream speech XML is compared with local sessions and vote linkage without writing the database.
- Vote-detail dates are removed from web headers at all viewport sizes. iOS is unchanged.

## Verification

- Sync agent definitions after editing their source instructions.
- Run TypeScript and the Bundestag production build for source changes.
- Browser-check a vote detail at desktop and mobile widths.
- Record local speech session and vote-link counts plus current upstream XML availability.

## Log

- User: requested faster, diff-aware pre-deploy gates, a current audit of potentially missed vote speeches, and removal of the web vote-detail date.
- Lead: completed the preceding release at commit `cd09e491`; web production returned 200, iOS TestFlight upload passed, and IndexNow returned 200 for 1,338 URLs.
- Lead: changed tester guidance to classify the diff first, cap browser work at the changed behavior plus one neighboring flow, avoid `networkidle`, and never take full-page screenshots of unbounded feeds.
- Lead: changed visibility guidance to classify visibility impact first, check only affected categories and route families, and report unrelated categories as skipped. Full production builds remain required before deployment.
- Lead: synchronized the Codex agent definitions from their Claude source instructions.
- Lead: removed the date from web vote-detail headers at every viewport size. TypeScript passed; targeted 390px and 1440px browser checks found no date, overflow, console errors, or page errors.
- Lead: backed up SQLite to `runs/_app-server/db-backups/machtblick-before-speech-audit-20260711T130500Z.sqlite` before running the existing agenda backfill and materialization.
- Lead: official XML probes found sessions 88 and 89 available and sessions 90 through 93 absent. Local raw XML and SQLite already contain sessions 88 and 89.
- Lead: the July 8 and July 9 votes have 30 and 71 linked speeches. No currently available session was missed by collection.
- Lead: five named votes have no debate link because `votes.agenda_item` is empty. Three appear to have no plenary speech debate. Two have earlier-reading debates already in SQLite but not linked to the later vote: 15 speeches for the June 26 railway-land vote from session 21-10, and 17 speeches for the November 13 transmission-grid-cost vote from session 21-32.
- Lead: the existing agenda backfill left those older rows unresolved, so durable cross-session document-based debate linkage is a separate ETL task rather than a one-off database edit.
- Lead: production web build passed. Targeted browser checks passed at 390px and 1440px against the fresh production preview: no visible header date, controls intact, no overflow, and no console or page errors.
- Visibility: fresh build and representative generated vote detail metadata passed. Sharing previews, crawler access, AI discovery, favicons, and unrelated sitemap checks were skipped because the diff does not affect them.
