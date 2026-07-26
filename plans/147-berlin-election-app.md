# 147 Berlin election app

## Goal

Add a self-contained Berlin 2026 election app to the Machtblick product. It must make provisional source coverage explicit, let voters browse candidates and programmes, and stay ready for official candidate data.

## Status

- source audit: complete in `research/berlin-2026/`
- supplied Machtblick product picker reference: accepted
- application architecture: complete
- candidate browser implementation: complete
- shared product picker integration: complete
- `berlin.machtblick.de` development tunnel: complete
- responsive and interaction verification: complete locally and through the public tunnel
- Cloudflare Pages deployment: out of scope until requested

## Product shape

- Separate app under `apps/berlin/`
- Shared design primitives under `packages/`, with independent application builds
- Separate Berlin database and ETL boundaries
- One Machtblick identity and product picker across web coverage areas
- One iOS app that can add Berlin as a feature without duplicating the app target
- Candidate discovery by district, party and name in the first release
- Postcode and constituency discovery after official direct-candidate data is published
- Clear separation between party-published and officially admitted information
- Candidate pages with biography, candidacy, personal positions, party programme and source coverage
- Programme browsing by topic without assigning party positions to candidates
- Initial demo data drawn only from the audited public sources

## Log

- 2026-07-22 lead: Started a complete desktop and mobile concept pass before implementation. The new app will reuse Machtblick typography, tokens and evidence conventions without importing from the Bundestag app.
- 2026-07-25 lead: Rebased onto `main` and started the first working Berlin app. The supplied Bundesrat picker establishes the cross-coverage navigation pattern. The Berlin app will run independently for Cloudflare Pages limits while remaining one Machtblick product.
- 2026-07-25 shared_ui: Added `@machtblick/web-ui` with shared tokens, base styles, wordmark, product picker, theme picker and generic filter pill. Integrated the Bundestag header with the shared picker and verified its links, menu interaction, console health and mobile fit.
- 2026-07-25 lead: Added an independent TanStack Berlin app, Berlin SQLite database and ETL package. The first dataset covers all 17 admitted parties and 231 source-linked party-published list profiles. Added name, party and district filtering, party and programme browsing, source-labelled candidate profiles and 234 prerendered routes.
- 2026-07-25 lead: Created the named `machtblick-berlin-dev` tunnel on port 5176, routed `berlin.machtblick.de`, and installed persistent user services for the app and tunnel. Public Playwright verification passed candidate and district filtering, profile navigation, programme and party coverage, product switching, the official admission link, 404 handling, mobile navigation, zero horizontal overflow and zero console errors.
