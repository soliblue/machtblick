# Web member placeholder colors

## Goal

Bring the iOS missing-photo card treatment to the Bundestag website so member cards without a portrait use a stable, varied accent background with readable initials.

## Status

- Lead: complete
- Designer: complete
- Frontend: complete
- Visibility: complete
- Tester: complete
- Deployer: complete
- Scribe: complete

## Scope

- Web member-list placeholder cards
- The member-list ASCII layout contract
- Focused component and browser verification
- Production Cloudflare Pages deployment

## Contracts

- Members with portraits remain visually unchanged.
- Members without portraits receive a deterministic color derived from the member ID.
- Placeholder colors come from the existing web accent palette.
- The palette order mirrors iOS: blue, purple, orange, cyan, pink, teal, indigo, rust.
- The member ID UTF-8 hash mirrors iOS: `(hash * 31 + byte) % 8`, starting at zero.
- Placeholder backgrounds mix 60% accent with 40% theme background in oklab.
- Placeholder initials and names use full-opacity theme foreground with no black gradient.
- Placeholder tint signals a missing portrait and is unrelated to party identity.
- Initials remain readable in light and dark themes.
- The same member keeps the same placeholder color across renders and refreshes.
- No iOS, data, API, or unrelated route changes.
- No new image assets or generated previews enter Git.

## Verification

- Focused unit or contract coverage proves deterministic palette selection.
- The Bundestag production build passes.
- Desktop and mobile browser QA covers a missing-photo member and a neighboring photographed member.
- Light and dark themes show readable initials without clipping, overlap, layout shift, framework errors, or console errors.
- Production verification repeats the targeted browser flow after deployment.

## Open questions

- None.

## Log

- 2026-07-13 Lead: Fast-forwarded `main`, confirmed it is current, and created this focused plan before implementation.
- 2026-07-13 Designer: Updated the member-list mock with the iOS palette order, deterministic member-ID tint, adaptive foreground, unchanged tile anatomy, and an explicit photographed-card non-regression contract.
- 2026-07-13 Frontend: Added the exact iOS UTF-8 member-ID hash and ordered eight-token palette, applied a 60/40 oklab accent/background mix only to missing-photo cards, removed their gradient and muted text, and kept photographed cards unchanged. Added the deterministic contract test to the normal build. Placeholder tests, TypeScript, diff checks, and the full Bundestag production build passed.
- 2026-07-13 Visibility: PASS. The diff from `1c68846` changes presentation and its build gate only, with no route metadata, canonical, localization, crawler, discovery, sitemap, JSON alternate, sharing, favicon, or manifest changes. The fresh production build is newer than the implementation and contains the new member-list bundle and prerendered output.
- 2026-07-13 Visibility: PASS. Generated `/members/` and `/en/members/` both include the server-rendered deterministic blue placeholder, `DA` initials, foreground name, and no photo gradient for `arndt-dr-michael`. Generated German and English detail routes for that member remain present and indexable with localized titles and descriptions, absolute canonicals to their default vote tabs, and reciprocal `de`, `en`, and `x-default` alternates.
- 2026-07-13 Visibility: SKIP. Sharing previews, crawler access, AI discovery, favicons and manifest, sitemap, and JSON alternate sweeps are unaffected. Blocking issues: none.
- 2026-07-13 Frontend: Fixed the browser QA blocker where Tailwind pruned palette variables referenced only through a dynamic inline style. The hash now selects one of eight static member-placeholder classes, each maps to an existing accent token, and one scoped base class applies the exact 60/40 oklab mix. Focused coverage now requires every class and token mapping. Tests passed 4/4, TypeScript and diff checks passed, the compiled CSS contains all eight palette variables and classes including indigo, and the full production build passed.
- 2026-07-13 Visibility recheck: PASS. The final production build postdates the static CSS mapping fix. Generated `/members/` and `/en/members/` both emit `member-placeholder-blue`, `DA`, foreground text, no portrait, and no gradient for `arndt-dr-michael`; the neighboring photographed card retains its image, black gradient, and white name. Compiled CSS contains the base placeholder rule, the 60/40 oklab mix, and all eight static accent mappings.
- 2026-07-13 Visibility recheck: PASS. The German and English `arndt-dr-michael` detail routes remain generated and indexable with localized titles, absolute default-tab canonicals, and reciprocal `de`, `en`, and `x-default` alternates. Sharing previews, crawler access, AI discovery, favicons and manifest, sitemap, and JSON alternate sweeps remain SKIP because the final fix does not affect them. Blocking issues: none.
- 2026-07-13 Tester: PASS on the local member list with the real search interaction. Isabel Cademartori rendered a stable indigo placeholder on desktop and iPhone 13 in both themes, with no black gradient, clipping, overlap, or layout shift. Light mode resolved to `rgb(192, 200, 248)` with `rgb(10, 10, 10)` foreground at 12.12:1 contrast. Dark mode resolved to `rgb(74, 79, 121)` with white foreground at 7.82:1. Card dimensions matched the production baseline at 175 by 233.33 CSS px on desktop and 114 by 152 CSS px on iPhone 13. Katja Mast proved visible palette diversity with a teal `rgb(173, 220, 209)` placeholder at 13.14:1 contrast. Sanae Abdi retained the photographed-card layout, `/members-photos/abdi-sanae.jpg` at 320 by 226 source pixels, white name, and one black gradient. All six cases had zero console errors, page errors, failed requests, and HTTP error responses. Screenshots stayed under `/tmp` and the temporary Playwright spec was removed.
- 2026-07-13 Tester production: PASS on `https://machtblick.de/members/`, which already served the deployed change so the per-deploy URL was not needed. The real search interaction verified Isabel Cademartori on desktop and iPhone 13 in light and dark themes, Katja Mast as a second palette bucket, and Sanae Abdi as the photographed-card regression. Isabel remained indigo at `rgb(192, 200, 248)` with 12.12:1 contrast in light mode and `rgb(74, 79, 121)` with 7.82:1 contrast in dark mode. Katja remained teal at `rgb(173, 220, 209)` with 13.14:1 contrast. Missing-photo cards had zero gradients, stable backgrounds, full names and initials, no clipping or overlap, and baseline dimensions of 175 by 233.33 CSS px on desktop and 114 by 152 CSS px on iPhone 13. Sanae retained `/members-photos/abdi-sanae.jpg`, its 320 by 226 source dimensions, white name, and one black gradient. All six cases passed with zero console errors, page errors, failed requests, and HTTP error responses. Final screenshots are `/tmp/machtblick-production-*.png`; the temporary Playwright spec and result file were removed.
- 2026-07-13 Scribe: Committed the scoped implementation and plan as `fdcfb0f` (`fix(bundestag): color missing member portraits`); lead pushed it to `origin/main`.
- 2026-07-13 Deployer: PASS. Built 6,456 prerendered pages and deployed production to `https://7412f65c.machtblick-bundestag.pages.dev`. The first bare `wrangler` invocation was unavailable on PATH, then the repository-supported npm invocation uploaded the unchanged build successfully. Cloudflare usage is 19 of 500 deployments this month and 11,160 of 20,000 files.
