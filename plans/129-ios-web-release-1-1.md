# 129 iOS and Web Release 1.1

## Goal

Prepare and ship version 1.1 with a light-first default, discoverable storefront copy, legible party speech colors in dark mode, and clearer website appearance and language controls.

## Status

- Audit current version, theme, speech color, metadata, release, and deployment paths: completed
- Define updated navigation and dark-theme contracts: completed
- Centralize the iOS marketing version at 1.1: completed
- Make light the default on iOS and web while preserving explicit user choices: completed
- Update discoverability copy and localized store metadata: completed
- Restore party identity in dark speech surfaces on iOS and web: completed
- Restore dark verdict stamps and neutral hemicycle seats on iOS and web: completed
- Clarify selected states in website theme and language controls: completed
- Stabilize the mobile website menu geometry: completed
- Verify local static contracts, browser behavior, production build, and visibility: completed
- Verify the pushed iOS build and TestFlight release: waiting for build 34 Beta App Review
- Commit and push the verified release: pending
- Deploy the website and iOS release: pending

## Contracts

- A fresh install or visit resolves to Light even when the operating system is Dark.
- Explicit iOS System, Light, and Dark choices persist. System remains available in the app but is never the implicit default.
- Website appearance choices are Light and Dark only. Legacy System and unknown stored values resolve to Light.
- The compact desktop website picker uses Sun and Moon icons with localized accessible names and Tooltips. Its selected segment has an inverse fill, so selection never relies on icon interpretation alone.
- The mobile website picker pairs the Sun and Moon icons with localized Light and Dark labels.
- Website language choices visibly identify the active locale and remain keyboard and screen-reader accessible.
- The shared mobile web filter sheet has a persistent X close control at the upper-left. It does not expose a drag handle or respond to downward drag or swipe dismissal. Vertical touch movement scrolls filter content only; backdrop tap and Escape remain available.
- Dark speech surfaces retain a restrained but unmistakable party tint with readable text and borders.
- Light Stamp and VoteHemicycle rendering remains unchanged. In Dark, Stamp uses normal compositing instead of multiply on both web and iOS while retaining its semantic color, existing per-variant opacity, texture, and geometry.
- In an unselected Dark hemicycle, Ja remains success and Nein remains danger. Enthalten uses `fg @ opacity-l`; Abwesend and synthetic Ohne Daten use `fg @ opacity-m`. The faint neutral state therefore exceeds 3:1 against black while remaining distinct from Enthalten. Selected-choice dimming remains an intentional interactive exception.
- The supplied 150 Ja, 477 Nein, 3 Ohne Daten case confirms the hard-to-see center seats are the synthetic no-data bucket, not a Ja or Nein shade. Ohne Daten continues to share the Abwesend neutral channel.
- Party marks and semantic vote colors keep their existing meaning.
- The mobile website nav retains its collapsed 54px sticky geometry while open. Its opaque menu panel is anchored below the bar outside document flow, with no height or translate transition, so open and close never alter scroll or snap position and the bar remains visible continuously.
- The public German slogan targets Bundestag vote discovery and fits the App Store subtitle limit.
- The English subtitle remains natural and localized.
- The iOS marketing version has one repository source of truth and is 1.1 for this release.
- Build numbers remain automatic and independent of the marketing version.
- Web deployment follows a successful visibility review.
- iOS deployment uploads and verifies the 1.1 build through the established TestFlight workflow.
- App Store metadata is uploaded for 1.1, but final App Review submission remains with the user.

## Open Questions

- Confirm repository Actions secrets and signing still pass when the 1.1 TestFlight workflow runs.

## Verification

- Production web build and static theme, locale, and metadata contracts pass.
- Browser QA covers fresh light default under a dark OS preference, removal of the System choice, explicit Dark persistence, inverse selected control states, localized icon names and Tooltips, keyboard radio behavior, German and English, desktop and mobile, and party speech colors.
- Dark result QA covers accepted and rejected stamps plus hemicycles on web and iOS list and detail surfaces. At rest, the 630-seat 150 Ja, 477 Nein, 3 Ohne Daten case shows all three neutral center seats at phone scale, Ja and Nein retain success and danger, and Light screenshots remain unchanged.
- Mobile Safari QA repeatedly opens and closes the website menu from a scrolled vote card. The 54px bar, wordmark, and toggle remain visible on every frame; scroll position and snap card do not move; the page never flashes above the bar; and long menu content scrolls inside the anchored panel.
- Mobile browser QA confirms every `FilterSheet` host closes through its upper-left X, backdrop, and Escape, returns focus to its trigger, and never translates or dismisses during vertical content scrolling.
- iOS static contracts, unit tests, build, and targeted appearance UI checks pass where the local simulator supports them.
- Generated production HTML passes the visibility specialist's affected-category review.
- Production URLs and uploaded iOS version/build are recorded after deployment.

## Log

- 2026-07-12 user: requested version 1.1 centralization, light-first defaults, search-oriented slogan copy, a cross-platform dark-theme repair, clearer website selectors, commit, push, and production deployment for web and iOS.
- 2026-07-12 lead: opened the combined release plan and began auditing the current implementation and release paths.
- 2026-07-12 user: confirmed the existing GitHub Actions TestFlight deployment is sufficient and will handle final App Review submission personally.
- 2026-07-12 designer: replaced icon-only and flag-only web preferences with named segmented choices, specified inverse selected fills and accessible mobile rows, kept System as an explicit stored option while Light remains the fresh default, and defined the shared dark speech surface as opaque `surface` plus party opacity-s with a party stroke-s border at opacity-m on web and iOS.
- 2026-07-12 visibility: App Store copy audit recommends `Abstimmungen & Abgeordnete` (26 characters) for de-DE and `Bundestag Votes & Members` (25 characters) for en-US. Apple indexes name, subtitle, keywords, and category, and advises against repeating subtitle words in keywords, so pair them with de-DE `Bundestag,Politik,Fraktionen,Anträge,Demokratie,Parlament,Transparenz,Reden,Gesetze,Politiker` (94 bytes) and en-US `politics,MPs,parties,motions,democracy,parliament,transparency,speeches,bills,legislation,Germany` (97 bytes). The `/votes/` titles and descriptions already target the primary search intent. Align only generic website metadata with de `Bundestag-Abstimmungen, Abgeordnete, Fraktionen, Anträge und Reden verständlich erklärt, mit Ergebnissen und offiziellen Quellen.` and en `German Bundestag votes, members, parties, motions, and speeches clearly explained, with results and links to official sources.` in `apps/bundestag/src/lib/seo.ts`, the WebSite description in `apps/bundestag/src/routes/__root.tsx`, and `apps/bundestag/public/site.webmanifest`; use `Bundestag verstehen.` with the existing content-type subline for the default share image if the visual slogan is refreshed. Store sources are `fastlane/metadata/de-DE/subtitle.txt`, `fastlane/metadata/en-US/subtitle.txt`, and the matching `keywords.txt` files.
- 2026-07-12 designer: replaced the shared mobile web filter sheet's drag handle and swipe-down dismissal with a sticky upper-left X close Button, retained backdrop and Escape dismissal plus trigger focus restoration, and reserved all vertical touch movement for scrolling filter content.
- 2026-07-12 user: reduced the website appearance picker to Sun for Light and Moon for Dark, removing System to save header space.
- 2026-07-12 designer: specified a compact two-icon desktop radiogroup with inverse selected fill, localized accessible names and Tooltips, standard arrow-key radio behavior, and a clearer mobile variant that pairs each icon with its localized label. Kept the iOS System setting unchanged.
- 2026-07-12 frontend: reduced the web theme model to Light and Dark, made legacy System and unknown values resolve to Light, added compact Sun and Moon desktop radios with localized hover and focus Tooltips, paired icons with labels on mobile, retained inverse selected contrast, and restored the standard desktop gaps after the compact picker fit at 700px.
- 2026-07-12 frontend: unified web speech identity surfaces around the Light quiet wash and Dark semantic surface plus party opacity-s tint, opacity-m border, and opacity-l member highlight. Replaced the shared filter sheet drag affordance with a sticky upper-left X while retaining internal scroll, backdrop, Escape, and trigger focus restoration.
- 2026-07-12 frontend verification: `check-theme-contract.mjs` and TypeScript passed. Playwright passed dark-OS Light fallback, Dark persistence, legacy System fallback, hover and focus Tooltips, wrapping arrows, Space, single-Tab radio traversal, 44px labeled mobile controls, exact-700 navigation fit with the language group ending at 684px, dark party surfaces, and filter X, Escape, backdrop, focus-return, sticky-scroll, and no-transform behavior.
- 2026-07-12 user: reported that verdict stamps disappear in Dark, the small dark hemicycle bucket is hard to see, and closing the mobile website menu can briefly hide the sticky navbar.
- 2026-07-12 designer: traced the missing stamps to multiply compositing against black and the dark hemicycle gap to the three-seat Ohne Daten bucket. Specified Dark-only normal Stamp compositing, a token-only neutral ladder of opacity-l for Enthalten and opacity-m for Abwesend or Ohne Daten across web and iOS, and a fixed 54px mobile sticky shell with an out-of-flow anchored menu panel.
- 2026-07-12 frontend: reproduced the mobile menu regression as mandatory vote-feed snap reacting to the in-flow sticky nav growing from about 54px to 328px, forcing scroll from 2px to 276px at the top. Moved the opaque, padded mobile menu panel out of document flow and anchored it below the unchanged sticky bar.
- 2026-07-12 frontend: kept Stamp multiply compositing in Light and switched it to normal in Dark. Mapped Dark hemicycle Enthalten to foreground opacity-l and Abwesend or synthetic Ohne Daten to foreground opacity-m without changing semantic Ja or Nein colors.
- 2026-07-12 frontend verification: Chromium touch QA with an iPhone Safari user agent kept scroll, document height, nav geometry, card position, and wordmark dimensions invariant through repeated open and close cycles at the top and at scrollY 747. Computed Dark stamps used normal blending with success or danger borders, Dark neutral fills resolved to 0.7 and 0.4, Light remained multiply with 0.4 and 0.15 neutrals, the supplied three Ohne Daten seats were visible, and the anchored panel had 16px vertical padding with no transform or transition.
- 2026-07-12 visibility pre-deploy: used the lead-provided fresh production build at `apps/bundestag/dist/client` with 6456 prerendered pages. Generated `/votes/` and `/en/votes/` HTML passed page-specific title and description, absolute self-canonical, reciprocal de, en, and x-default alternates, complete Open Graph and X cards, indexable robots metadata, and parseable JSON-LD. The updated WebSite JSON-LD description is present in both languages; no generated page consumes the updated generic `seoMeta` fallback because every prerendered route head supplies a more specific description. Generated `site.webmanifest` parses with the updated description, both declared icons exist at their declared 192 and 512 pixel sizes, favicons and touch assets exist, and `og-image.png` remains 1200 by 630. Crawler policy, AI discovery files, sitemap generation, JSON alternate generation, and sharing-image content were unchanged by this diff and skipped. No visibility blockers.
- 2026-07-12 lead: applied the Dark Stamp and hemicycle neutral mapping to SwiftUI, expanded the iOS static contract, and updated localized release notes to cover the full Dark contrast repair.
- 2026-07-12 iOS review: found and fixed a Fastlane parse-time path that would have resolved the version config below `fastlane/`. Confirmed the `__dir__`-relative path, Xcode config inheritance, automatic build numbering, version-scoped App Store build selection, workflow YAML, metadata limits, localization, and Linux-safe contracts with no remaining local blockers.
- 2026-07-12 tester: definitive Playwright QA passed 8 of 8 cases with no console errors. Exact 700px navigation, theme persistence and keyboard behavior, party speech surfaces, all filter close paths, Dark stamps and neutral seats, and 10 touch menu cycles across 200 sampled frames passed without geometry drift or panel reappearance.
- 2026-07-12 lead verification: the production build completed with 6456 prerendered pages. Website theme, TypeScript, iOS release, More UI, localization, Settings parity, Python syntax, and diff checks passed locally. The pushed macOS workflow remains responsible for Swift, Xcode, Ruby, signing, and simulator verification.
- 2026-07-13 user: Explicitly authorized the TestFlight upload workflow for commit `df87872` after the build-only workflow passed.
- 2026-07-13 lead: TestFlight run 29237647437 built and uploaded build 35, then external distribution failed because build 34 is already in Beta App Review.
- 2026-07-13 lead: App Store Connect reports build 34 as valid, assigned to the public group, and waiting for Beta App Review. Build 35 is valid and ready for beta submission, but is not assigned to the public group.
