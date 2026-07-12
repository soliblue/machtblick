# 122 iOS English and More

## Goal

Give the native iOS app the same German and English experience as the website, defaulting from the phone language while allowing a persistent in-app override. Add a small, warm More surface for language, project links, feedback, legal links, freshness, and app information.

This plan now governs implementation of the approved product and technical contracts.

## Status

- Repository and website parity audit: done
- Recommended information architecture: drafted
- User decisions: done
- ASCII source-of-truth mocks: done
- Implementation: done
- Local data, localization, TypeScript, and production-build verification: done
- macOS build, compiled localization checks, and stored German and English relaunch smoke: done on `a8e96fc`
- Bilingual production data deployment and canonical production verification: done on `21ed415`
- Postdeployment iOS build, compiled localization, persistent relaunch, and live German and English data smoke: done in GitHub run `29180835348`
- Public TestFlight distribution and exact-build verification: in progress, build 30 uploaded successfully and transient App Store Connect verification retry is being hardened
- English App Store screenshots: deferred to the public App Store release, English metadata is done

## Existing contracts

- The website remains the source of truth for German and English wording, translated editorial content, official-source fallbacks, and localized URLs.
- German and English response shapes stay identical. Stable codes and identifiers are never translated.
- Official German records, names, Drucksache numbers, PDFs, and source links remain official source material.
- The app currently has three root tabs. Its existing Settings view already contains about copy, website, methodology, imprint, privacy, refresh time, and cache clearing, but is not reachable.
- The iOS client consumes build-generated static JSON, so English support requires locale-specific static list and detail artifacts rather than runtime server calls.
- The current worktree contains unrelated user changes. This work must remain isolated to its plan, iOS files, localization resources, and required locale-aware static-data generators.

## Recommended information architecture

Add a fourth and final root tab named `Mehr` in German and `More` in English, using `ellipsis.circle`. Keep it one level deep and show the small set of actions directly.

```text
+----------------------------------+
| Mehr                             |
|                                  |
|        [eyes] MACHTBLICK         |
| Wir schauen hin, damit du        |
| durchblickst.                    |
|                                  |
| SPRACHE                          |
| [ System | Deutsch | English ]   |
| Folgt bei System dem iPhone.     |
|                                  |
| MACHTBLICK                       |
| Website                      [>] |
| Über die Daten               [>] |
| Fragen                       [>] |
| Feedback geben               [>] |
| Mitmachen                    [>] |
| Machtblick teilen            [>] |
|                                  |
| RECHTLICHES                      |
| Impressum                    [>] |
| Datenschutz                 [>] |
|                                  |
| DATEN                            |
| Zuletzt aktualisiert     [Datum] |
|                                  |
| Keine Konten. Kein Tracking.     |
| Version [Version und Build]      |
+----------------------------------+
| Votes | Members | Parties | ... |
+----------------------------------+
```

The surface uses a native grouped `List` or `Form`, a native three-option picker, monochrome SF Symbols, the existing eyes mark, and existing tokens. It does not introduce a custom navigation hierarchy or decorative color.

## Proposed language contract

- Preference values: `system`, `de`, `en`.
- First launch value: `system`.
- System resolves to German when German is preferred and English otherwise.
- Explicit German or English choice persists locally.
- Switching updates interface copy, formatters, content endpoints, share URLs, and website links immediately.
- Switching resets the other three tab stacks while leaving the user on More, preventing stale mixed-language screens.
- Locale-specific URL paths also isolate cached German and English payloads.
- The More screen displays the resolved language when `system` is selected.
- The website's translation and fallback policy is reused rather than recreated for iOS.

## Proposed More contents

### Direct controls

- Language picker
- Website
- About the data
- Questions email
- Feedback email
- Contribute email
- Share Machtblick
- Imprint
- Privacy
- Last successful refresh
- App version and build
- Short privacy statement
- Quiet font licence credit

### Deliberately omitted

- Accounts, appearance, and notifications, because the app has none
- Motions and speeches indexes, because More is not secondary content navigation
- Native copies of legal and methodology pages, because localized website pages open inside the app and remain authoritative
- A prominent cache deletion action, because pull to refresh already exists and deletion is a diagnostics action
- App rating until the public App Store release is live

## Product decisions

- Add a fourth direct `Mehr` / `More` tab using `ellipsis.circle`.
- Keep every action on one screen rather than adding a toolbar sheet or nested settings hub.
- Use text choices `System`, `Deutsch`, and `English`, not flags.
- In System mode, select German when German is preferred and English otherwise.
- Apply language changes immediately and reset the other tab stacks to prevent stale mixed-language screens.
- Open the localized website, About the data, imprint, and privacy pages inside the app.
- Show all three contact actions from the website: Questions, Feedback, and Contribute.
- Prefill contact drafts with the relevant recipient and subject. Feedback also includes app version, build, selected language, and iOS version locally in the draft.
- Include `Machtblick teilen` and share the app itself through `https://testflight.apple.com/join/r7RVrgtr` for now. Replace this with the public App Store URL when the user supplies it.
- Use the warm header line `Wir schauen hin, damit du durchblickst`, followed by short factual project copy.
- Remove visible cache clearing and retain the last refresh time.
- Keep font licensing as quiet footer text.
- Include English App Store metadata and screenshots as the final release workstream.
- Do not add Motions or Speeches indexes, Open Source, GitHub, operator, or rating rows to this first More surface.

## Planned workstreams

1. Finalize and save the ASCII source-of-truth mock beside the iOS Settings view.
2. Add German and English String Catalog resources, full-message plurals, localized accessibility labels, and locale-aware formatting.
3. Add the persisted three-state language preference and install it as shared app configuration.
4. Generate locale-specific static JSON for vote, member, party, motion, and speech surfaces using the website translation tables and fallback rules.
5. Make iOS stores, detail loading, speech loading, cache keys, share links, and web destinations locale-aware.
6. Add the fourth root tab and refactor the existing Settings view into the approved direct More surface.
7. Add localization completeness tests, German and English formatter and mapping tests, API schema parity checks, and bilingual accessibility checks.
8. Verify German, English, System mode, language switching, offline cache behavior, Dynamic Type, VoiceOver labels, compact layout, and localized App Store assets.

## Verification contract

- German and English catalogs have no missing production strings.
- System mode resolves deterministically and an explicit override survives relaunch.
- A language switch cannot display German UI around English app content or the reverse.
- German and English endpoints decode through the same DTOs and preserve stable identifiers.
- Every outbound app or website URL uses the selected language where an equivalent localized route exists.
- Missing translated source content follows the website policy and is clearly identified.
- Feedback metadata is visible in the draft and is never transmitted automatically.
- The fourth tab remains usable at supported Dynamic Type sizes and has complete accessibility labels.
- The macOS iOS build gate and bilingual simulator or device smoke checks pass before TestFlight.
- The exact uploaded build reaches the enabled public-link beta group with a valid processed state and is available for external testing.

## Log

- 2026-07-11 user: requested planning for website-parity English support, phone-language detection, a definite in-app picker, and a useful, charming settings or More surface. Explicitly requested no implementation yet.
- 2026-07-11 lead: audited the current three-tab shell, unreachable Settings view, website locale contract, localized footer, legal pages, contact addresses, static JSON generation, and Apple localization guidance.
- 2026-07-11 designer: recommended a fourth direct More tab over a nested hub or toolbar sheet, with the language picker first, localized web and legal destinations, one feedback action, refresh time, privacy statement, and version footer.
- 2026-07-11 user: accepted the recommendations with English as the System fallback, in-app website presentation, all Questions, Feedback, and Contribute actions, TestFlight app sharing for now, and the warm header line.
- 2026-07-11 lead: found the live website TestFlight target `https://testflight.apple.com/join/r7RVrgtr` and recorded it as a replaceable contract for the future App Store URL.
- 2026-07-11 user: authorized full implementation, commit, push, and TestFlight dispatch after the website overhaul is committed and pushed.
- 2026-07-11 lead: verified the website handoff at `d37533a4`, with local `HEAD` and GitHub `main` equal, before starting implementation.
- 2026-07-11 backend: generated complete German legacy and `/en` static mirrors for lists, vote, member, party, motion, and speech data from one preloaded translation context. Member output now has 639 current files per locale, proposer and party summaries, education, and no initiatives. DE members total 43.13 MiB raw and 5.87 MiB summed gzip, EN totals 42.95 MiB raw and 6.40 MiB summed gzip, and the largest file is 191,632 bytes. TypeScript, final static generation, a 1,930-artifact schema comparison, stable member-code comparison, speech fallback coverage, and the production web build passed.
- 2026-07-11 ios: added a persisted System, Deutsch, and English language contract, selected-language formatting and sorting, locale-isolated cache and content paths, localized share and web URLs, 187 live bilingual catalog keys, and an immediate language switch that resets data navigation stacks.
- 2026-07-11 ios: added the fourth direct More tab with the approved warm header, in-app website, methodology and legal pages, three contact drafts, TestFlight sharing, freshness, privacy, version, font credit, and complete localized accessibility labels.
- 2026-07-11 ios: added English App Store metadata. English screenshots remain a public App Store release asset and are not part of the requested TestFlight binary.
- 2026-07-11 lead: added a visible English fallback notice to speech and debate surfaces because untranslated official speech text and party summaries intentionally remain in German.
- 2026-07-11 lead: strengthened build gates to reject catalog drift, format-placeholder drift, unused Copy declarations, German and English schema or primitive-type drift, stable identifier drift, missing member proposer fields, and missing or malformed party summaries.
- 2026-07-11 visibility: initial audit found English pages advertising German JSON, incomplete machine-readable endpoint catalogs, and stale structured-data wording about member motions. Lead fixed all three and added them to the durable build check.
- 2026-07-11 visibility: final predeploy rerun passed 4,484 affected pages, 1,886 localized JSON alternates, five bilingual structured datasets, both machine catalogs, sitemap, social metadata, crawler rules, and Cloudflare file limits with no blockers.
- 2026-07-11 tester: final Cloudflare Pages preview smoke passed German and English member detail at desktop and 390 by 844 mobile, neighboring vote and party routes, six English endpoints, redirects, and zero browser or console errors.
- 2026-07-11 lead: extended the macOS workflow with executable Swift checks for System resolution, explicit overrides, persistence, localized paths, formatters, legacy and enriched member payload decoding, plus real German and English simulator launches with retained screenshots.
- 2026-07-11 lead: simulator evidence exposed that `String(localized:locale:)` does not select a string-table language. Replaced it with explicit selected-language bundle lookup, then verified German labels including Ja, Nein, Nicht abgegeben, Grüne, and Linke in the Xcode 26.2 simulator.
- 2026-07-11 lead: added a compiled app-bundle contract that resolves representative German and English strings through the same lookup used by production code.
- 2026-07-11 lead: strengthened simulator smoke to install a fresh app per explicit language, persist the same `appLanguage` key used by the picker, terminate, relaunch without launch overrides, and retain the second-launch screenshot.
- 2026-07-11 lead: completed a final plan audit, replaced accessibility-only tab icons with visible localized labels, and retained token-compliant donut labels while preserving the member highlight contract.
- 2026-07-11 lead: hardened TestFlight delivery to pin Fastlane 2.237.0, resolve the exact enabled public beta group, capture one build number, supply bilingual test notes, wait for processing, distribute externally, and verify iOS 1.0, valid processing, group membership, and external state `IN_BETA_TESTING`.
- 2026-07-11 lead: verified the public TestFlight invitation remains live and not full. The production English JSON remains undeployed, so final public TestFlight dispatch stays paused until the user explicitly authorizes the required production web deployment.
- 2026-07-12 lead: GitHub run `29173216628` passed catalog, language, member DTO, release-script, Xcode, compiled-bundle, persistent relaunch, screenshot, and cleanup gates on `a8e96fc`. German rendered the complete localized feed and visible Abstimmungen, Abgeordnete, Fraktionen, and Mehr labels. English rendered localized Votes, Members, Parties, More, and the expected load error because production English data is still 404.
- 2026-07-12 user: explicitly authorized the required production web deployment.
- 2026-07-12 deployer: built and deployed exact source `21ed415` to Cloudflare Pages. The build prerendered 6,456 pages, passed the 1,930 bilingual artifact gate, and published at `https://d0b5ebb7.machtblick-bundestag.pages.dev` with production alias `https://machtblick.de`.
- 2026-07-12 lead: verified canonical German and English vote, member, party, motion, and speech artifacts at `https://machtblick.de`, including stable identifiers, matching schemas, 639 members, 37,165 enriched member histories, education, and no initiatives.
- 2026-07-12 tester: canonical production QA passed 46 of 46 desktop, compact mobile, interaction, data, navigation, console, network, and overflow checks in German and English.
- 2026-07-12 visibility: canonical production visibility passed reciprocal locale alternates, five bilingual structured datasets, all 20 machine-catalog endpoints, robots, and a 3,856 URL bilingual sitemap.
- 2026-07-12 lead: postdeployment GitHub run `29180835348` passed every iOS gate on exact source `21ed415`. Fresh German and English installs retained their explicit language across a relaunch and rendered live localized content. Original-resolution screenshot review confirmed the compact English title, date, summary, chart, party rows, and visible localized tabs render without clipping.
- 2026-07-12 lead: TestFlight run `29181146533` built and uploaded Machtblick 1.0 build 30 from `9338a06`, resolved the enabled public group, and verified the invitation remained live and open. The final read-only state poll later received one transient App Store Connect HTTP 500 from `buildBetaDetail`, so the run correctly remained red without implying an app or upload failure. Added bounded GET retries for connection failures, HTTP 429, and transient HTTP 5xx responses while preserving every exact-build assertion.
