# 108 iOS App

## Goal
Native SwiftUI iOS app for machtblick, consuming the website's EXISTING static JSON endpoints (no new backend). Conventions ported from ~/projects/cloude (user's blueprint project). End-to-end implementation including GitHub Actions TestFlight pipeline; user adds the signing secrets. TestFlight is the app's dev.machtblick.de: user tests every build on his phone.

## Architecture decisions
- Location: apps/ios/ in this monorepo (self-contained per repo rules).
- Data: prerendered-data analog of the website's prerendered pages. Sources (all already live, build-time generated, weekly refreshed):
  - https://machtblick.de/api/votes.json, /api/members.json, /api/parties.json (DataCatalog datasets)
  - per-entity alternates: /votes/{id}.json, /members/{id}.json, /parties/{id}.json, /motions/{id}.json
  - photos: /members-photos/{id}.jpg (self-hosted), OG cards /og/votes/{id}.png for sharing
  - /votes.xml Atom feed (freshness probe: cheap HEAD/lastmod check)
- No runtime server. Push notifications explicitly OUT of v1 (needs a worker + APNs; later plan).
- Offline-first: SwiftData cache of decoded payloads, background refresh, stale-while-revalidate.
- Locale: German v1 (site's primary), architecture keeps strings centralized for later en.
- Fonts: bundle Fraunces (OFL license, same file the web embeds) for display/poster numerals.

## Conventions (from cloude, see Explore summary in session)
- Xcode project apps/ios/iOS.xcodeproj, scheme/target Machtblick, bundle id soli.Machtblick, team Q9U8224WWM.
- src/{MachtblickApp.swift, Info.plist, Assets.xcassets}, src/Core/{Networking,Storage,Theme,UI}, src/Features/<Name>/{UI,Logic}.
- ThemeTokens enum pattern; machtblick web tokens ported (text 24/22/16/14/12, spacing 4/8/12/16/24, radius 0 + pill exception, opacity 0.15/0.4/0.7, palette + party accents, success/danger/yellow result colors).
- View files: no logic. Logic files: no SwiftUI. One type per file. No comments. Happy path. swift-format with cloude's .swift-format.
- HTTPClient enum + URLSession, Codable models mirroring the JSON contracts exactly.

## v1 scope (feature parity where the data allows)
| Feature | Contents |
|---|---|
| Votes | Vertical paging feed (native TabView .page rotated or paging ScrollView) = the snap feed done natively; card anatomy identical to web (kicker logo+stamp+date, serif title, summary, hemicycle, party donuts); detail = result tab (hemicycle + donut grid + notice), summary, debate thread + reader |
| Members | Photo grid + demographics donuts, search/filters, member detail (header stats, vote rows with ballot chips, speeches, motions) |
| Parties | Hemicycle + party cards, party detail (stats, donations, demographics, votes) |
| Motions | Detail views reachable from votes (timeline, linked votes); no index tab (mirrors web nav) |
| Settings/About | Data sources, methodology, imprint links, refresh control |
- Speeches tab: judged by implementer; the speech shards are web-optimized, include only if cheap, else log as v2.
- Custom drawing: hemicycle (Canvas, one dot per seat), donuts (Canvas arcs), stamps (bordered text, straight), duel numerals.

## CI/CD (copied from cloude)
- .github/workflows/ios-build.yml: signing-free xcodebuild build on macos runner, runs on apps/ios/** pushes = compile feedback loop (no Mac locally, this is how we iterate).
- .github/workflows/ios-testflight.yml: cloude's testflight.yml adapted (fastlane beta_local lane, manual cert install, ASC API key, asc_certs.py snapshot/revoke pattern, cleanup-certs workflow).
- Secrets user must add: DISTRIBUTION_CERTIFICATE_BASE64, DISTRIBUTION_CERTIFICATE_PASSWORD, PROVISIONING_PROFILE_BASE64, APP_STORE_CONNECT_API_KEY_ID, APP_STORE_CONNECT_API_ISSUER_ID, APP_STORE_CONNECT_API_KEY_CONTENT.
- User must also create the App ID (soli.Machtblick) + provisioning profile + App Store Connect app entry.

## Constraints
- No local Mac: Swift cannot be compiled on this machine. Iterate via the ios-build.yml workflow (gh run watch) after pushing.
- Do NOT touch apps/bundestag beyond reading JSON contract shapes. If a contract gap blocks the app (missing field in a .json), log it here; web-side additive fixes are a separate lane.

## Implementation decisions
- pbxproj authored by hand (not xcodegen): cloude uses objectVersion 77 with PBXFileSystemSynchronizedRootGroup, so the whole src/ folder is auto-synced and no per-file registration exists. Adding a Swift file under apps/ios/src/ never requires touching the project file.
- Deployment target iOS 26.0, Xcode 26.2 on macos-15 runners (same as cloude). SWIFT_DEFAULT_ACTOR_ISOLATION=MainActor, SWIFT_APPROACHABLE_CONCURRENCY=YES.
- Zero SPM dependencies. Markdown rendered by a small line-based renderer (Core/UI/MarkdownText.swift: headings, bullets, inline via AttributedString). Hemicycle/donuts/seat map are Canvas drawings porting the web geometry exactly (lib/hemicycle.ts algorithm incl. Hamilton largest-remainder row distribution).
- Fonts: Fraunces Regular/SemiBold/Bold static TTFs from Google Fonts (OFL.txt bundled), registered via UIAppFonts plus runtime CTFontManager fallback. Body serif is Charter (built into iOS, same as web's SERIF stack). UI font is system.
- Offline: SwiftData model CachedPayload(key, payload, fetchedAt) stores raw JSON per path; ApiCache decodes on read, stale-while-revalidate (1h catalogs, 24h details). Views render cache instantly, refresh in background.
- Feed: ScrollView + LazyVStack + scrollTargetBehavior(.paging) + containerRelativeFrame = native snap feed. Cards lazy-fetch /votes/{id}.json for summary + party donuts (see contract gaps).
- Motions: fully implemented (models, store, detail view) but reachable only via machtblick://motions/{id} deep link because no public JSON links votes to antrag ids (see contract gaps).
- Speeches tab: deferred to v2; the search shards (4x full-text maps) are web-optimized and too heavy for the phone as-is. Vote-detail debate excerpts and member speech excerpts ARE included (they are inline in the detail JSONs).
- swift-format: not installable on this Linux box (no Swift toolchain, no apt/npm package); cloude's .swift-format copied to apps/ios/.swift-format and code hand-formatted to its rules (4-space indent, 120 cols, ordered imports, no comments).
- Strings centralized in Core/Copy.swift (German), ready for later EN.

## Contract gaps
- No vote -> motion linkage in public JSON: web gets antragIds + sponsors from getVoteSponsors, a build-time server fn dehydrated into HTML; /api/motions.json and /motions/index.json 404. App consequence: motion detail unreachable from vote detail. Additive web fix: include antraege [{antragId, type, drucksache}] in fullVote or ship /api/motions.json.
- /api/votes.json (lean) has no summary text and no party breakdown, but the web card shows both; app lazy-fetches /votes/{id}.json (~80KB incl. memberBallots the card does not need) per visible card. Additive web fix: add summarySimplified + per-party counts to leanVotes.
- Member proposals (Antraege tab on web member detail) missing from /members/{id}.json; app skips the proposals tab.
- /parties/{slug}.json data quirks in production: members[] has garbled entries (id "750-abdi", name "Abdi 750", state ""), cohesion/attendance disagree with /api/parties.json (0.19 vs 0.99 for SPD), successRate/proposals look wrong. App uses lean /api/parties.json for stats, skips the member list, renders donations/votes/alignments from detail. Fix belongs in vite-data/parties.ts (plumber lane).

## User setup (Soli, one-time, before TestFlight works)
1. Apple Developer portal (team Q9U8224WWM): create App ID soli.Machtblick (iOS, no special capabilities).
2. App Store Connect: create the app entry for soli.Machtblick (name Machtblick).
3. Create an App Store distribution provisioning profile for soli.Machtblick and download it.
4. Repo secrets (Settings -> Secrets and variables -> Actions), same names as cloude:
   - DISTRIBUTION_CERTIFICATE_BASE64: base64 of the Apple Distribution .p12
   - DISTRIBUTION_CERTIFICATE_PASSWORD: its password
   - PROVISIONING_PROFILE_BASE64: base64 of the .mobileprovision from step 3
   - APP_STORE_CONNECT_API_KEY_ID / APP_STORE_CONNECT_API_ISSUER_ID / APP_STORE_CONNECT_API_KEY_CONTENT: ASC API key (App Manager role), key content is the raw .p8 text
5. Run the "Deploy iOS to TestFlight" workflow (workflow_dispatch or push an ios-v* tag). cleanup-certs.yml exists to revoke orphaned "Created via API" dev certs.

## Status
- blueprint: done (cloude explored)
- data contracts: done (grounded against live machtblick.de JSON + vite-data generators, validated field-by-field)
- implementation: done (63 Swift files, apps/ios/, zero deps)
- CI compile loop: ios-build.yml
- TestFlight: pipeline in place (ios-testflight.yml + fastlane beta_local + asc_certs.py), blocked on user secrets

## Log
- lead: plan created 2026-07-05 after user picked native SwiftUI end-to-end with cloude conventions
- claude: 2026-07-05 explored cloude blueprint (pbxproj format, testflight.yml, Fastfile, asc_certs.py, theme/feature conventions); fetched and validated all live JSON contracts incl. per-entity samples (vote 2026-06-25 unifil, member ahmetovic-adis, party spd, motion 318555); wrote apps/ios end to end (Core theme/networking/SwiftData cache, Votes paging feed + detail, Members grid + detail, Parties seat map + detail, Motions detail, Settings); ported web visuals (light-only palette, party colors, Fraunces/Charter, Canvas hemicycle 11 rows r54-145 dots 2.4, wedge donuts r46 hole 22, double-border stamps); app icon rendered from public/logo.svg; CI workflows + fastlane adapted from cloude; contract gaps above logged instead of touching the web app
