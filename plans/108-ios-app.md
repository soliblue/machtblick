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
- CI compile loop: GREEN (ios-build.yml run 28749944347; single fix iteration, a type-checker timeout in PartySeatMapView)
- TestFlight: pipeline in place (ios-testflight.yml + fastlane beta_local + asc_certs.py), blocked on user secrets (see User setup)

## Log
- lead: plan created 2026-07-05 after user picked native SwiftUI end-to-end with cloude conventions
- claude: 2026-07-05 explored cloude blueprint (pbxproj format, testflight.yml, Fastfile, asc_certs.py, theme/feature conventions); fetched and validated all live JSON contracts incl. per-entity samples (vote 2026-06-25 unifil, member ahmetovic-adis, party spd, motion 318555); wrote apps/ios end to end (Core theme/networking/SwiftData cache, Votes paging feed + detail, Members grid + detail, Parties seat map + detail, Motions detail, Settings); ported web visuals (light-only palette, party colors, Fraunces/Charter, Canvas hemicycle 11 rows r54-145 dots 2.4, wedge donuts r46 hole 22, double-border stamps); app icon rendered from public/logo.svg; CI workflows + fastlane adapted from cloude; contract gaps above logged instead of touching the web app

## Iteration 2 (2026-07-05, user directive)
Goal: come as close as possible to the web app's design while using Apple-native functionality everywhere. Known gaps from user testing on TestFlight build 1: vote detail has no tabs (web: Ergebnis/Details/Reden), no filters on the votes feed (web: type/proposer/result/topic + namentlich default auto-applied), and more. Process: opus subagents implement in slices, lead verifies at high level (conventions, no slop), ios-build.yml compile loop gates every push, user verifies on TestFlight per slice batch.

### Iteration 2 workstreams
| # | Lane | Status |
|---|------|--------|
| A | Gap audit: systematic web-vs-iOS comparison, prioritized spec written below | todo |
| B | Web JSON enrichment (additive, invisible): leanVotes gains summarySimplified + per-party counts + whatever the audit flags; fixes /parties/{slug}.json data bugs (round-108 contract gaps) | todo |
| C | Votes parity: feed filters + namentlich default, card anatomy exact, vote detail tabs (Ergebnis/Details/Reden with summary strip, debate thread, reader) | done (build green, branch ios-lane-c-votes-parity, commit c884943) |
| D | Members/parties/motions parity: detail tabs, filters, demographics, motion reachability | done (build green, run 28755027492, on main commit fccbc32) |
| E | Polish: navigation transitions, haptics, share sheet with OG cards, app-wide typography audit vs web | done (build green, on main) |
| F | Light up the three parity features unblocked by lane B2 (member card attendance/loyalty + sort, motion linked-vote hemicycle/donut, party Verlauf chart via Swift Charts) | done (build green, on main) |

### Log (iteration 2)
- lead: iteration 2 opened
- lead: 2026-07-05 lane A done. Full web-vs-iOS audit below (read every apps/ios/src file and every apps/bundestag/src/views + hooks source). Confirmed against vite-data/votes.ts that /api/votes.json is lean (id, title, cleanTitle, date, result, initiator, yes/no/abstain/absent) with no voteType/topic and mixes namentlich + handzeichen, so the namentlich default and topic filter are lane-B-blocked.
- claude (lane C): 2026-07-05 shipped C1-C5. ios-build.yml GREEN first try (run 28754088185) on branch ios-lane-c-votes-parity (commit c884943); could not push main (auto-mode guard), lead to merge. Work:
  - Vote detail rewritten with a native segmented Picker (Ergebnis/Details/Reden; Details only if summaryDetail, Reden only if debate). Ergebnis: source-notice card + interactive VoteHemicycleView (legend toggles dim non-matching seats via new VoteChoice enum) + VoteDonutGrid dimming + donut->party nav (PartyStyle.slug) + DefectorsSection folded in. Header renders official-title/topic/inverted/petition notices + simplified summary + motion-link rows (AppRoute.motion, closes the dead route; wired to lane B fullVote.antraege).
  - New shared Features/Speeches (reused by lanes D members/parties): SpeechSummary, DebateThreadBuilder (isPresidium + floor-tracking port), DebateThreadView (spine, system/turn/compact/nested rows), SpeechEntry, CompactTurnRow, SpeechSystemRow, SpeakerAvatar, PartySummaryStrip (horizontal openers), ReaderView (.sheet with detents + prev/next), DebatePanel (strip + inline-excerpt search + thread + two readers). VoteDebateAdapter maps the vote payload to SpeechSummary/PartySummaryReader (speaker photo via /members-photos/{id}.jpg, choice via memberBallots).
  - Feed: VotesStore gains filter fields + filtered/available/activeFilterCount; VotesFeedView floating filter button -> .sheet([.medium,.large]) of native VotesFilterSheet Pickers (type/proposer/result/topic), auto-apply, namentlich default read defensively (only filters when items carry voteType). Empty state "Keine Treffer".
  - Contract alignment with lane B (verified against vite-data/votes.ts working tree): VoteListItem + PartyVoteSummary decode voteType/topic/summarySimplified/partySummaries off lean JSON; card prefers lean, only fetches /votes/{id}.json when absent. NB: lean partySummaries omit `members`, so PartyVoteSummary.members is optional (memberCount fallback) or the whole feed decode fails. Deleted DebateSection/PartySummarySection/VoteDocumentsSection. Peek-inset on the paging feed deferred (drift risk under .paging). SponsorStrip facepile still blocked (antraege has no signatories). Party donut label now emphasizes .split too (audit flag).

- claude (lane D): 2026-07-05 shipped D1-D5 on main (commits 3f2ef09 members, 1bd92f5 parties, ca85f71 motions, fccbc32 cos fix); ios-build.yml GREEN (run 28755027492) after one fix (ambiguous cos in the PieDonut trig). Reused lane C's Speeches (DebateThreadBuilder/DebateThreadView/ReaderView/SpeechSummary) unchanged.
  - Grounding: fetched live machtblick.de JSON and confirmed PRODUCTION SERVES NONE OF LANE B'S ENRICHMENT YET (votes lean has no voteType/topic/summarySimplified/partySummaries, /api/motions.json 404, vote detail has no antraege, member detail has no initiatives, /parties/spd.json still garbled cohesion 0.19 + 750-abdi members). So every new field is decoded as OPTIONAL; features degrade to hidden now and light up on the next web deploy. No app crash on either state.
  - D1 Members list: MembersStore gains sex/ageBucket/mandate filters + name sort + available-option lists + activeFilterCount; MembersFilterSheet (party/state/sex/age/mandate + A-Z/Z-A) as a .sheet; toolbar filter button; DemographicsStrip of PieDonut donuts (Geschlecht/Alter/Fraktion, tap-to-cycle slice pull-out) computed over the filtered set (AgeBucket buckets ported: <30/<40/<50/<60/<70/else); Personen count row; empty state. Richer card (attendance bar + Linie value) is DATA-BLOCKED: /api/members.json lean lacks attendance/loyalty/pictureUrl (web listMembers has them, the iOS lean shard does not), so the card stays photo+name+party and Anwesenheit/Linie SORT is dropped (only Name available). Contract gap for a follow-up: add attendance/loyalty to the leanMembers shard.
  - D2 Member detail: header round portrait + photo credit + meta (party/state/mandate Landesliste/constituency/"{age} Jahre"/education) + two PosterStatBar poster numerals (Anwesenheit with "{missed} von {n} verpasst", Linientreue with defection sub or the null-loyalty explainer Keine Abstimmungsdaten/Keine Fraktionslinie). Three native tabs Abstimmungen/Reden/Anträge, each shown only when its count > 0. MemberVotesPanel: Linie + Stimme filter menus, rows lead with the ballot pill (or "Nicht abgegeben" caption) + "Abweichend von Linie {majority}" + ResultChip. MemberSpeechesPanel: memberSpeechGroups grouping + search + 5/page pager + expandable rows that render DebateThreadView and open the shared ReaderView. MemberInitiativesPanel + MemberInitiativeRow render the new initiatives[] (search, status/result chips, Sachgebiet chips) when it deploys.
  - D3/D4 Parties: PartyStyle.isGoverning (['CDU/CSU','SPD']). List groups Regierung/Opposition with seat-sum captions ("Regierung · N von M Sitzen", "Opposition · N Sitze") + fraktionslos footnote row -> party detail; cards flat (border removed). Detail header with cohesion/attendance poster stats (Geschlossenheit sub "{n} Abstimmungen") using the correct lean /api/parties.json values; Profil/Abstimmungen native tabs. PartyProfilePanel: SuccessRateBar (sub lights up if successMatched/successDecided ship), ProposalsBar segmented, AlignmentList with per-row nav + "{pct} bei {n} gemeinsamen Abstimmungen", DonationsBar proportional Großspenden bar + named donors, and Geschlecht/Alter demographics COMPUTED CLIENT-SIDE from /api/members.json filtered by party (the payload members[] is garbled and has no demographics; this is faithful and works now). PartyVotesPanel: PartyLineFingerprint (toggle-to-filter) + Fraktion-stimmte/Ergebnis filters + PartyVoteRow (stance pill + cohesion callout < 0.95 + ResultChip). Verlauf tab OMITTED (no history payload; data-blocked).
  - D5 Motion detail: proposer glyph (Landmark for Länder initiatives via Bundeslaender set, PartyBadge otherwise), outlined type chip, Offizieller Titel subline, Drs., MotionTimelineView (Eingebracht/Ausschuss/Abstimmung/Verkündet derived from motionStatusBucket + first linked vote, status stamp when no vote), Sachgebiet chips, Antrag summary (summarySimplified -> abstract fallback + AI notice), signatory face-pile, MotionLinkedVoteCard (verdict chip + top border + date/voteType; renders a hemicycle + PartyDonutGrid only when linkedVotes carry counts/partySummaries, which the current payload lacks -> DATA-BLOCKED, cards fall back to header rows). Reachability from vote detail was wired by lane C (AppRoute.motion via antraege[]) and lights up on deploy; member Anträge rows also push AppRoute.motion.
  - Shared primitives added to Core/UI: PosterStatBar, ChoicePill, ResultChip, TopicChip, FilterPillLabel, PieSlice/PieDonutView, plus MemberAvatar circle option and BallotChoice/PartyPosition pill-color helpers.

## Iteration 2 gap spec

Source of truth is the web (apps/bundestag). "iOS now" is the shipped state after iteration 1. "Native close" is the Apple-native idiom to reach parity. Web design invariants that must carry over: radius 0 everywhere except pills and avatars, party color only on logos + hemicycle seats + history line, success/danger/yellow strictly ballot semantics, success bars for positive metrics (cohesion, attendance, success rate, alignment), fg-opacity ladder for everything else.

### Cross-cutting SLOP / drift flags
- No empty or error states anywhere. Feed and every detail render a bare ProgressView for both loading and empty; no "keine Treffer", no retry. Web has explicit empty copy per surface. (lane E)
- Vote card fetches the full /votes/{id}.json (~80KB incl. memberBallots it never uses) per visible card just to show summary + donuts. Fixed by lane B (summarySimplified + partySummaries on leanVotes). (lane B, then C)
- AppRoute.motion is dead: nothing in-app pushes it, motions reachable only via the machtblick://motions/{id} deep-link sheet. Structural navigation hole, unblocked only when lane B ships vote/member/party -> antrag linkage. (lane B + D)
- No party logos. Web renders real party SVG logos (17-26px) in badges, kickers, donut-grid labels, member cards, party cards. iOS PartyBadge is text + color only. Pervasive visual delta. (lane E, bundle the SVG set)
- ThemeTokens.Radius (8/14/20) is defined but unused; every primitive renders square, which is correct for web parity. Delete or document the token as reserved. (lane E)
- Members filter Menu: the state Picker uses Copy.allStates as both its title and its "all" tag (MembersGridView), minor mislabel. (lane D)
- PartyDonutRow emphasizes only position == .mixed, not .split, though both map to the same fg color/label elsewhere. Latent inconsistency. (lane C)
- Stamp has no grunge texture; web applies an SVG turbulence/displacement filter + mixBlendMode multiply. iOS is a clean double border. (lane E)

### Screen 1: Votes feed (VotesFeedView / VoteCardView)
| Aspect | Web | iOS now | Delta | Native close |
|---|---|---|---|---|
| Snap feed | mobile CSS scroll-snap, one card per viewport, ~96px peek | ScrollView + LazyVStack + scrollTargetBehavior(.paging) + containerRelativeFrame | Parity. | Keep. Add a small bottom inset so the next card peeks like web. |
| Filters | 4 dims: type (default namentlich), Antragsteller (proposer), Ergebnis (result), Kategorie (topic). Mobile = floating "Filter · n" FAB + bottom sheet with bordered chip groups; auto-apply, no confirm | NONE. Raw server order, no filter UI, VotesStore has no filtered state | Entire filter system missing | Floating filter button (bottom-center, safe-area) opening a native .sheet with .presentationDetents([.medium, .large]) and a drag handle. One Section per dim, chips as a wrapping selectable row or inline Picker. Selection mutates store state immediately (auto-apply). Add VotesStore.filtered computed + @Published filter fields. |
| result filter | angenommen / abgelehnt | absent | Buildable now (result present in lean JSON) | ship in first pass |
| proposer filter | distinct initiator values | absent | Buildable now (initiator present) | ship in first pass |
| type filter + namentlich default | default hides handzeichen | absent, feed mixes both silently | BLOCKED: leanVotes has no voteType | lane B adds voteType, then default-select namentlich and add the Typ group |
| topic filter | distinct topic, freq-sorted | absent | BLOCKED: leanVotes has no topic | lane B adds topic |
| Card kicker | 3-col grid: PartyBadge/logo (proposer) | Stamp (un-rotated) | short date | PartyBadge(initiator) | StampView | short date | Parity in structure; iOS badge lacks logo | logo via lane E |
| Card title | font-display xl, line-clamp-4 | display xl, lineLimit(4) | Parity | keep |
| Card summary | summarySimplified via markdown, fitted line clamp | lazy from full detail fetch | Works but heavy per-card fetch | lane B moves summary onto lean JSON |
| Card hemicycle + donut row | VoteHemicycle + PartyDonutRow | VoteHemicycleView + PartyDonutRow | Parity (static on both) | keep |

### Screen 2: Vote detail (VoteDetailView), priority gap (a)
Web = header (kicker, h1, official-title line, topic line, inverted + petition notices, SponsorStrip, summary) then a 3-tab segmented bar: Ergebnis / Details (only if summaryDetail) / Reden (only if debate non-empty).
iOS = one long scroll: header, hemicycle, donut grid, summary(simplified+detail), PartySummarySection, DefectorsSection, DebateSection, VoteDocumentsSection. No tabs.

| Section | Web | iOS now | Delta | Native close |
|---|---|---|---|---|
| Tabs | segmented Ergebnis/Details/Reden, URL-driven, panels hidden not unmounted | none, single scroll | The headline gap | Reuse the MemberDetailView pattern: a Picker(.segmented) bound to an enum, three @ViewBuilder panels. Show Details only when summaryDetail present, Reden only when debate non-empty. Header stays above the picker. |
| Ergebnis: source notice | bg-surface note + "Originaldaten ansehen" link to sourceUrl | shown only inside documents section | Move/add the notice atop Ergebnis | small surface card + Link |
| Ergebnis: hemicycle | hero + interactive legend: tap Ja/Nein dims non-matching seats and the donut grid | static VoteHemicycleView(hero) | Interactivity missing | add @State selected: BallotChoice?; legend numerals become toggle Buttons; pass selection into seat fill + VoteDonutGrid to dim non-matching |
| Ergebnis: donut grid | 3-col, per-party donut links to party votes, tooltip with 4 counts | VoteDonutGrid (3-col) | Parity minus interactivity/link | add tap-to-party nav + selection dim |
| Details tab | summaryDetail markdown + AI notice + antrag PDF link | summaryDetail rendered inline in summary() | Exists but not tabbed; needs the notice + PDF link | move into Details panel |
| Reden tab: party summary strip | horizontal "Debatte im Überblick" cards, each opens a Reader | PartySummarySection = vertical cards, no reader | Restructure to horizontal openers + reader | horizontal ScrollView of tappable cards presenting a Reader sheet |
| Reden tab: debate thread | DebateThread timeline: system (presidium) vs turn vs compact rows, floor tracking, nested Zwischenfrage, per-turn choice stamp, tap opens speech Reader | DebateSection = flat rows sorted by position, 4-line excerpt, no thread structure, no reader | Thread model + reader missing | port buildDebateThread (floor tracking, isPresidium, nested within 2 turns, compact = short && !nested) into a Logic file; render rail with 3 row types; tap -> Reader sheet |
| Reden tab: search | inline speech search box, lazy full-text | none | Buildable but excerpts are inline; full text needs shards | ship search over inline excerpts now; full-text is v2 (shards heavy) |
| Reader modal | shared full-screen/bottom-sheet, prev/next, speaker header, choice stamp, full body | none | New shared component | native .sheet with detents; a Reader Logic type mirroring useReader (index, openAt, prev, next, count) |
| Header: SponsorStrip | face-pile of Antrag co-signers | none | BLOCKED: no antraege/sponsors in /votes/{id}.json | lane B adds antraege[{...signatories}] |
| Header: official title / topic / inverted / petition notices | rendered when present | fields decoded (title, topic, inverted, isPetitionBundle) but never shown | Buildable now | render the 4 conditional blocks |
| Defectors (Abweichungen) | present in JSON but NOT rendered on web (dead component) | iOS DOES render DefectorsSection | iOS shows more than web | keep (real data) but note divergence; optionally fold under Ergebnis |

### Screen 3: Members list (MembersGridView), priority gap (b) analog
| Aspect | Web | iOS now | Delta | Native close |
|---|---|---|---|---|
| Search | substring on name | .searchable | Parity | keep |
| Filters | 5 pills: Fraktion, Bundesland, Geschlecht, Alter (6 buckets), Mandat | toolbar Menu with 2 Pickers (party, state) | Missing sex, age, mandate | expand the Menu (or a .sheet) with Pickers for Geschlecht, Alter, Mandat; all fields present in /api/members.json (sex, yearOfBirth, mandateType) |
| Sort | SortControl: Name / Anwesenheit / Linie, asc/desc | none (fixed order) | Missing entirely | a sort Menu with the 3 keys + direction toggle |
| Demographics strip | 3 PieDonuts (Geschlecht, Alter, Fraktion) over the filtered set | none | Missing | Canvas donuts (reuse VoteDonutView geometry) recomputed from filtered members |
| Card | photo + name + party logo + attendance bar + value + loyalty value | photo + name + party dot + label | Missing attendance bar + loyalty value | add StatBar-style attendance + loyalty line (data in list JSON) |

All member-list gaps are buildable now (existing JSON).

### Screen 4: Member detail (MemberDetailView)
Web = 3 tabs: Abstimmungen / Reden / Anträge. iOS = segmented Picker with 2 tabs: Votes / Speeches.
| Aspect | Web | iOS now | Delta | Native close |
|---|---|---|---|---|
| Anträge tab | member initiatives with status/vote/topic filters | absent | BLOCKED: initiatives[] not in /members/{id}.json | lane B adds initiatives[] |
| Votes tab filters | 2 pills: Linie (linie/abw), Stimme (ja/nein/enthalten/nicht_abgegeben) | none | Missing | FilterPillRow analog (segmented or Menu); filter store on history |
| Vote row | ballot chip + title + date + red "Abweichend von Linie {majority}" + result chip (colored square + Angenommen/Abgelehnt) | ballot chip + generic "Abweichler" + date + title, no result chip | Missing result chip + majority wording (partyMajority, result decoded but unused) | render result chip + use partyMajority in the defection line |
| Speeches tab | grouped (memberSpeechGroups), expandable, search, snippets, DebateThread context, Reader, 5/page | flat MemberSpeechRow list, no grouping/search/reader | Restructure | port memberSpeechGroups grouping; expandable rows; reuse the Reader + DebateThread from lane C |
| Header | photo credit, richer meta (education, constituency), attendance "missed" sub, loyalty "n Abweichungen" link, null-loyalty explainer | avatar + meta + attendance/loyalty StatBars | Missing subs + credit + explainer | add stat subs (missed = count nicht_abgegeben; defections link), photo credit line |

Speeches/votes gaps buildable now; Anträge tab waits on lane B.

### Screen 5: Parties list (PartiesView)
| Aspect | Web | iOS now | Delta | Native close |
|---|---|---|---|---|
| Seat map | Hemicycle, edge spread, seating order | PartySeatMapView (edge spread) | Parity | keep |
| Grouping | Regierung vs Opposition sections with "n von N Sitzen" captions | flat 2-col grid | Missing gov/opp split | classify via a portable isGoverning/hasPartyLine helper (party-name based); two Sections |
| fraktionslos row | footnote row linking to members?party=fraktionslos | none | Missing | a caption row -> members filter deep nav |
| Card | logo + name + seat numeral + share + cohesion + attendance bars | dot + label + seat numeral + share + cohesion + attendance | Parity minus logo | logo via lane E |

Grouping buildable now.

### Screen 6: Party detail (PartyDetailView)
Web = 3 tabs: Profil / Abstimmungen / Verlauf. iOS = single scroll (header, stats, donations, alignments, votes), no tabs.
| Section | Web | iOS now | Delta | Native close |
|---|---|---|---|---|
| Tabs | Profil/Abstimmungen/Verlauf segmented | none | Missing | Picker(.segmented) like member detail |
| Profil: success rate | ERFOLGSQUOTE bar + "n von N Ergebnisse" | successRate decoded, UNUSED (buggy in prod) | BLOCKED: /parties/{slug}.json successRate/proposals wrong | lane B fixes vite-data/parties.ts |
| Profil: proposals bar | segmented accepted/rejected, links to votes | proposals decoded, UNUSED | BLOCKED same as above | lane B |
| Profil: alignment list | logo + agreement bar + tooltip | alignments as StatBars | Near parity | keep, add per-row nav |
| Profil: donations | proportional bar + named list | list only, no proportional bar | Missing bar | add a segmented proportional bar above the list |
| Profil: demographics | Geschlecht + Alter pies | none | BLOCKED: demographics not in payload | lane B adds demographics{sex,age} |
| Profil: member list | "Alle n Abgeordneten" link | members decoded but garbled, skipped | BLOCKED: members[] garbled | lane B fixes parties.ts |
| Abstimmungen: fingerprint | FRAKTIONSLINIE stacked bar, tap filters list | none | Missing | Canvas/HStack stacked bar with toggle segments |
| Abstimmungen: filters | 2 pills (Fraktion stimmte, Ergebnis) | none | Missing | filter pills/Menu on votes[] |
| Abstimmungen: vote row | chip + title + cohesion callout (<0.95) + result | PartyVoteRow (chip + result + title) | Missing cohesion callout | add callout when cohesion < 0.95 |
| Verlauf tab | seat-share area chart + event strip | none | BLOCKED: no history data in /parties/{slug}.json | lane B adds a history payload |

Tabs + Abstimmungen fingerprint/filters buildable now; Profil success/proposals/demographics/members and Verlauf wait on lane B.

### Screen 7: Motion detail (MotionDetailView)
| Section | Web (AntragDetail) | iOS now | Delta | Native close |
|---|---|---|---|---|
| Reachability | from vote SponsorStrip, member Anträge, party proposals, motions list | deep-link sheet only (AppRoute.motion dead) | Cannot reach in-app | unblocked by lane B linkage (votes/members/parties -> antragId) |
| Header | Länder Landmark icon, type chip, official title, Drs. | type kicker, drucksache, title, status | Missing Länder icon + type chip + official title | render conditionals (initiativeFraktion, type present) |
| Timeline | Eingebracht/Ausschuss/Abstimmung/Verkündet stage dots + status stamp | plain linked-votes list, no stages | Missing procedural timeline | derive stages from beratungsstand + linkedVotes (present); draw a dotted stage row |
| deskriptor / sachgebiet chips | subject chips | decoded, UNUSED | Missing | render chip row (buildable now) |
| Linked votes | full hemicycle + donut result cards per vote | stamp + title + date rows | Missing viz | needs yes/no/abstain/absent on linkedVotes -> BLOCKED lane B (or fetch each vote detail) |
| Debate | DebateList (party summaries + reden) | none | Missing | reuse lane C DebateThread once debate is in /motions/{id}.json |
| Signatories | SponsorPile | horizontal avatar scroll | Near parity | keep |

Header + timeline + deskriptor chips buildable now; reachability, linked-vote viz, debate wait on lane B.

### Screen 8: Speeches / Reden search
Web = full-text search over ~16k speeches via 4 lazy shards + filters + Reader. iOS = none (deferred to v2 in iteration 1; shards are web-optimized and heavy). Decision holds: keep the global Reden search as v2. The valuable, cheap parts (Reader modal + DebateThread) ship inside vote detail and member detail in lanes C/D using the inline excerpts already in the detail JSONs.

### Screen 9: Settings
Parity acceptable. Web has full methodik/impressum/datenschutz views; iOS links out to the website. Keep. Optional: a native in-app methodology screen (lane E, low priority).

### Blocked on web JSON (lane B worklist, additive + invisible)
1. leanVotes (vite-data/votes.ts -> /api/votes.json): add voteType (unblocks type filter + namentlich default), topic (unblocks topic filter), summarySimplified + per-party partySummaries counts (removes the 80KB per-card fetch, unblocks card summary + donuts). Highest leverage.
2. fullVote (/votes/{id}.json): add antraege[{antragId, type, drucksache, signatories[]}] + sponsors. Unblocks SponsorStrip in vote detail AND motion reachability from votes.
3. /members/{id}.json: add initiatives[]. Unblocks member Anträge tab + motion reachability from members.
4. vite-data/parties.ts (/parties/{slug}.json): fix garbled members[], fix cohesion/attendance, fix successRate + proposals; add demographics{sex, age}; add a history payload (points + events). Unblocks party member list, success rate bar, proposals bar, demographics pies, Verlauf tab.
5. /motions/{id}.json: add yes/no/abstain/absent to linkedVotes (unblocks hemicycle result cards) and a debate[] array (unblocks motion debate). Optional /api/motions.json index for a browse surface.

### Prioritized build order
Lane C (Votes parity, do first, all C1-C4 buildable now):
- C1 Vote detail tabs: segmented Picker Ergebnis/Details/Reden, move existing sections into panels, header above. Closes gap (a).
- C2 Interactive Ergebnis: hemicycle legend toggles + donut-grid dimming + donut->party nav.
- C3 Shared Reader (Logic + .sheet) and DebateThread (buildDebateThread port) + horizontal party-summary strip + in-excerpt speech search. This is the Reden tab and is reused by D2.
- C4 Votes feed filters: floating button + .sheet(detents), auto-apply, VotesStore.filtered, ship result + proposer now. Closes gaps (b) and (c) for the buildable dims.
- C5 Header notices (official title, topic, inverted, petition) now; SponsorStrip after lane B.
Lane D (after C, reuses C3 components):
- D1 Member list: sex/age/mandate filters + sort control + demographics strip + richer card.
- D2 Member detail: votes-tab filters + result chip + majority wording; speech grouping + Reader (reuse C3); header subs.
- D3 Party detail tabs + Abstimmungen fingerprint/filters + cohesion callout + alignment nav.
- D4 Parties list Regierung/Opposition grouping + fraktionslos row.
- D5 Motion detail header + timeline + deskriptor chips (reachability/viz/debate after lane B).
Lane B (parallel, enables the blocked items above): worklist items 1-5, in that priority order.
Lane E (polish, last): party logos across the app, stamp grunge + typography/radius-0 audit, empty + error states, share sheet with OG cards, haptics + transitions.

## Iteration 2 enriched contract
Lane B shipped (2026-07-05, plumber). All changes are purely additive / value-correcting in `apps/bundestag/vite-data/*` + `vite.config.ts`; web pages untouched, tsc clean, existing lean fields unchanged. Generators verified against `db/machtblick.sqlite`. Code the iOS models against these exact shapes.

### /api/votes.json (leanVotes) — NEW fields per element (existing id/title/cleanTitle/date/result/initiator/yes/no/abstain/absent unchanged)
- `voteType`: `'namentlich' | 'handzeichen'` (hammelsprung is excluded from this list entirely).
- `topic`: `string | null` (16 distinct non-null values; most rows null).
- `summarySimplified`: `string | null` (FULL markdown, inline emphasis only, avg ~520 chars; iOS clamps to 4 lines like the web card — the JSON is not pre-clipped so the fitted clamp matches web).
- `partySummaries`: `Array<{ party: string; position: 'yes'|'no'|'abstain'|'mixed'; yes: number; no: number; abstain: number; absent: number }>`.
  - namentlich: real per-party counts.
  - handzeichen: `yes/no/abstain/absent` are all `0`; only `position` carries the info (render the donut as a solid position color). Same convention as fullVote's partySummaries.
- Existing top-level `yes/no/abstain/absent`: namentlich = real totals; handzeichen = seat-weighted totals with `absent: 0` (unchanged behavior).

### /api/members.json (leanMembers) — NEW fields per element (existing id/name/party/state/yearOfBirth/sex/mandateType unchanged)
- `attendance`: `number` (0..1). Share of the member's namentlich ballots that were cast (not `nicht_abgegeben`). Equals `/members/{id}.json` `attendance` exactly (same denominator, all non-procedural term-21 votes the member appears in).
- `loyalty`: `number | null` (0..1). Share of party-line-eligible ballots that matched the member's fraction majority; `null` when the member has no eligible ballots (fraktionslos / Bundesregierung-only span). Equals `/members/{id}.json` `loyalty` exactly. Enables the member-grid card attendance/loyalty bars and Anwesenheit/Linie sort without a per-member detail fetch. Payload stays lean (two numbers added, nothing else).

### /votes/{id}.json (fullVote) — NEW field (everything else unchanged)
- `antraege`: `Array<{ antragId: number; type: 'antrag'|'gesetzentwurf'; drucksache: string|null }>`, ordered by antragId. Every antragId is a published motion, so `/motions/{antragId}.json` always resolves (149/149 linked antraege publishable). Full signatory face-pile for the SponsorStrip lives in `/motions/{antragId}.json` (`signatories[]`); fetch it there instead of inlining.

### /motions/{id}.json (fullAntrag) — NEW fields on each `linkedVotes[]` element (existing id/date/title/cleanTitle/result/voteType unchanged)
- `yes` / `no` / `abstain` / `absent` / `totalMembers`: `number`. Per-linked-vote aggregate counts for the mini hemicycle/donut on motion linked-vote cards.
  - namentlich: real counts from the vote row (`absent` populated, `totalMembers` = full roster).
  - handzeichen: seat-weighted from `vote_party_summaries` positions (same convention as leanVotes/fullVote top-level totals); `absent` = 0, `totalMembers` = yes+no+abstain. 110/163 linked votes are handzeichen, so seat-weighting is required for the majority to render a donut.

### /members/{id}.json (fullMember) — NEW field (everything else unchanged)
- `initiatives`: `Array<{ antragId: number; title: string; cleanTitle: string|null; beratungsstand: string|null; introducedDate: string|null; drucksachePdfUrl: string|null; sachgebiet: string[]; signatoryCount: number; linkedVotes: Array<{ voteId: string; date: string; title: string; cleanTitle: string; result: 'angenommen'|'abgelehnt' }> }>`, ordered by introducedDate desc. Only published motions (each antragId resolves to `/motions/{id}.json`). Mirrors the web member Anträge tab (`MemberInitiativeRow`).

### /parties/{slug}.json (fullParty) — VALUE fixes, shapes unchanged
- `cohesion` / `attendance`: were contaminated by handzeichen rows (0-count summaries dragged them down, e.g. SPD 0.19). Now averaged over namentlich votes only, so they equal `/api/parties.json` exactly (SPD 0.9966 / 0.9365).
- `members[]`: WP20 garbage rows (numeric-prefix ids like `750-abdi`, name `Abdi 750`, empty state) removed by filtering to members with a term-21 ballot (same `hasVotes` criterion as leanMembers). SPD 436 → 120; every entry now has a non-empty `state`.
- `successRate` / `proposalsTotal` / `proposalsAccepted` / `proposals[]`: no code change; the old "looks wrong" was pre-`initiator`-backfill data. Now correct (e.g. CDU/CSU 17/17 accepted, AfD 43/0, SPD 0 — SPD governs via Bundesregierung-initiated bills).
- `history`: `{ points: Array<{ termNumber: number; year: number; seats: number; totalSeats: number; pctOfTotal: number; partyNameAtTime: string }>; events: Array<{ date: string; type: string; labelDe: string; side: 'inbound'|'outbound'|'self' }> }`. Ported verbatim from the web `getPartyHistory` server fn (seat-share series BT16-21 / 2005+, lineage trunk-walk incl. renames + mergers, events filtered to 2005+). Unblocks the Verlauf tab. Empty `{points:[],events:[]}` for lineages without seat data (e.g. fraktionslos). Sample: linke has 6 points + 2 events (2007 rename, 2024 BSW split_out); afd 3 points + founded event; spd/cdu-csu/gruene 6-7 points, 0 events.
- `demographics{sex,age}` is still NOT added (out of scope; the iOS Profil demographics pies stay computed client-side from `/api/members.json` filtered by party, as lane D already does).

### /api/motions.json (NEW lean list)
- `Array<{ id: number; type: 'antrag'|'gesetzentwurf'; title: string; cleanTitle: string|null; drucksache: string|null; initiativeFraktion: string|null; introducedDate: string|null; beratungsstand: string|null }>`, published WP21 motions, ordered introducedDate desc (943 rows). Enables a browse surface; detail still at `/motions/{id}.json`.

### Log (iteration 2, lane B)
- plumber: 2026-07-05 (lane B2, follow-up) shipped the three iOS-parity JSON gaps that were still data-blocked. All additive, tsc clean, web pages untouched, verified against `db/machtblick.sqlite`.
  - `/api/members.json` (leanMembers): + `attendance` + `loyalty` per member (batch-computed, byte-identical to `/members/{id}.json`; spot-checked 3 members incl. a null-loyalty case). Unblocks the member-grid card bars + Anwesenheit/Linie sort.
  - `/motions/{id}.json` (fullAntrag `linkedVotes[]`): + `yes/no/abstain/absent/totalMembers` (namentlich real, handzeichen seat-weighted via the now-exported `latestSeatsByParty`). Unblocks the linked-vote mini hemicycle/donut cards.
  - `/parties/{slug}.json` (fullParty): + `history{points,events}`, ported from `getPartyHistory` into new `vite-data/partyHistory.ts`. Unblocks the Verlauf tab. Nothing skipped this round; only party `demographics{sex,age}` stays deferred (iOS already computes it client-side).
- plumber: 2026-07-05 shipped lane B worklist 1-4 + the optional motions index. leanVotes gains voteType/topic/summarySimplified/partySummaries (removes the per-card 80KB fetch, unblocks namentlich default + topic filter + card donuts); fullVote gains antraege[] (vote→motion reachability + SponsorStrip via motion detail); fullMember gains initiatives[] (Anträge tab); fullParty cohesion/attendance/members fixed to be internally consistent with /api/parties.json; new /api/motions.json. NOT done: party demographics + Verlauf history payload, inline vote-signatories, motion linkedVotes counts/debate (worklist item 5) — left for a follow-up if the iOS lane needs them.

### Log (iteration 2, lane F)
- claude (lane F): 2026-07-05 lit up the three features that lane B2's web JSON enrichment unblocked. Field names verified against apps/bundestag/vite-data generators (members.ts, antraege.ts, partyHistory.ts), not guessed. Build via ios-build.yml.
  - Member grid cards (leanMembers gained attendance + loyalty): MemberListItem decodes attendance (non-optional Double) + loyalty (Double?). MemberCardView now renders the web MemberCard tail: "Anwesenheit" kicker + 3px success bar + percent, then "Linie" row with loyalty percent (or "-" when null). New MemberSort enum (name/attendance/loyalty, default dir asc for name else desc); MembersStore.filtered sorts by it; MembersFilterSheet gained a sort-key Picker + adaptive direction segmented (A-Z/Z-A for name, Aufsteigend/Absteigend otherwise) with .onChange resetting to the key's default direction. Anwesenheit/Linie sort no longer data-blocked.
  - Motion linked-vote cards (fullAntrag linkedVotes gained yes/no/abstain/absent/totalMembers, seat-weighted for handzeichen): the hemicycle already lit up via the decoded optional counts; added an aggregate VoteDonutView below it (reuses the votes donut Canvas). Dropped the never-shipped per-party partySummaries branch/field from MotionDetailPayload.LinkedVote (lane B2 ships only aggregate counts; per-party lean summaries are 0-count for the 110/163 handzeichen linked votes, so the seat-weighted aggregate donut is the only representation that renders for all vote types, matching the web AntragVoteResult hemicycle+donut structure).
  - Party Verlauf tab (fullParty gained history{points,events}): new PartyHistory/AnchoredEvent Logic (dedupe-by-term + web anchorEvents port + SF Symbol per event type) and PartyHistoryChart (Swift Charts, import Charts, iOS 16+ ok on the 26 target): AreaMark gradient 40->0 + monotone LineMark (party color, stroke-l) + PointMark with toFixed(1)-comma percent labels, x = termNumber ticks "{n}.", y = pctOfTotal*100 hidden axis domain 0..ceil(max)+1, event RuleMarks (fg opacity-m, dashed) with icon+labelDe annotations aligned by chart half. PartyHistoryPanel adds the "Anteil am Bundestag" / "{firstYear} - heute" header. Verlauf tab appears when history.chartPoints.count >= 2 (fraktionslos etc. with 0-1 points get no tab). PartyDetailPayload.history is optional so pre-deploy cache still decodes.

## Iteration 2 review

Lead high-level NO-SLOP verification (2026-07-05). Five parallel review agents (votes, members/parties, motions/speeches, conventions, correctness) + lead spot-checks of the Canvas/geometry, decoding, and filter code, cross-checked against LIVE production JSON and the `vite-data/*` generators. Verdict: NOT ship-worthy as-is because of one live decode crash (item 1); everything else is parity/polish. No fabricated data, no stubs, no "Coming soon", no English-where-German. The geometry ports and tab scaffolding are genuinely faithful.

Two agent claims were WRONG and are corrected here after checking live JSON:
- Votes-agent HIGH "list decodes `initiator` but web emits `proposingParty`": FALSE. Live `/api/votes.json` emits key `initiator` (vite-data/votes.ts:131); iOS is correct. `proposingParty` is only the fullVote detail key, which iOS also handles correctly.
- Votes-agent HIGH "`absent` non-optional will throw": OVERSTATED. vite-data/votes.ts always coerces absent to a number (namentlich real, handzeichen `absent:0`), and live JSON confirms absent is always numeric. Latent only (the TS type is `number|null`), not a live crash. Downgraded to LOW.

### CRITICAL (ship-blocker)
1. `apps/ios/src/Features/Members/Logic/MemberListItem.swift:11` — `let attendance: Double` is NON-optional, but LIVE `/api/members.json` currently returns only `{id,name,party,state,yearOfBirth,sex,mandateType}` (lane-B/F enrichment is NOT deployed yet, live-verified 2026-07-05). Decoding `[MemberListItem]` throws on the first member, `MembersStore.members` stays empty, `loadFailed` flips, and the **entire Members tab shows the error state on current production**. `loyalty` (added in the same commit) is correctly `Double?`; `attendance` was missed. One-char fix (`Double?`), but it breaks a core tab right now. Downstream reads at MembersStore.swift:33 (sort) tolerate optional.

### HIGH
2. Motion detail drops the ENTIRE debate + party-summaries section. `MotionDetailView.swift:8-33` renders header/timeline/subjects/summary/signatories/linkedVotes only; `MotionDetailPayload.swift:47-51` never decodes a `debate`/`debateSource` field. Web `AntragDetail` renders `<DebateList>`. iOS already has the whole DebatePanel/DebateThread machinery (used in votes + members) — motions silently omit it. Real feature gap.
3. "Ganze Rede lesen" reader is a dead-end. `ReaderView.swift:71` renders `Text(speech.excerpt)` as the body; the CTA (`SpeechEntry.swift:57` -> `Copy.readFullSpeech` "Ganze Rede lesen") promises the full speech, but there is NO full-text load anywhere in iOS (web uses `useSpeechBody`/`loadSpeechTexts`). Tapping the affordance opens a sheet showing the same truncated snippet. Affects vote, member, and (once wired) motion speeches. Misleading affordance = slop.
4. Handzeichen per-party donuts render BLANK. `VoteDonutView.swift` draws only from yes/no/abstain/absent counts and ignores `position`. Per the app's own contract, handzeichen `partySummaries` carry all-zero counts with only `position` set, so `VoteDonutGrid.swift` (vote-detail Ergebnis) and `PartyDonutRow.swift` (feed card) show party labels over empty white circles with no numbers for handzeichen votes. Web draws a solid position-color donut. Live now for handzeichen vote details; expands to the feed once leanVotes.partySummaries deploys (~half of votes).

### MEDIUM
5. Motion linked-vote card uses a single aggregate donut, not the web per-party grid. `MotionLinkedVoteCard.swift:18-30` = hemicycle + one `VoteDonutView`; web `AntragVoteResult` = hemicycle + `PartyDonutGrid` (one donut per party) + close-vote stamps + an interactive choice filter. iOS omits the per-party breakdown, stamps, and filter.
6. Motion linked-vote `absent` handling diverges. `MotionLinkedVoteCard.swift:21-26` passes `absent: vote.absent ?? 0` unconditionally; web suppresses absent for non-namentlich votes, so iOS renders a phantom absent slice/legend on handzeichen linked votes.
7. Votes feed defaults to `namentlich` (`VotesStore.swift:13`), hiding ALL handzeichen votes on first load and showing "Filter · 1" by default. The gap spec called for this, but the votes agent found web actually defaults to `null` (routes/votes/index.tsx:41 `type ?? null`). Product decision: confirm whether namentlich-default is intended; the web source contradicts the spec's claim.
8. Card drops the derived one-liner fallback. `VoteCardView.swift:12-14,36`: when `summarySimplified` is nil the card shows NO summary; web always falls back to `deriveDescription` ("Die Union stimmt dafür, ..."). Since enrichment isn't live, EVERY card is currently summary-less. No iOS equivalent of the generated dek exists.
9. Card donut row ordering diverges. `PartyDonutRow.swift:30-35` sorts by `yes/memberCount` and includes non-line parties; web `partiesByJaShare` filters to `hasPartyLine` and sorts by `(yes-no)/(yes+no+abstain)`. The detail grid is correct (`VoteDonutGrid` uses `PartyVoteOrder.byJaShare`); only the card re-implements it wrong and duplicates the Logic helper.
10. PieDonut resting state looks pre-selected. `PieDonutView.swift:11,60-65` defaults `activeIndex` to the largest slice, so at rest the largest wedge is exploded (pull 4) and all others dimmed to 0.3; web leaves `activeKey` null (all slices full opacity, no pull) until interaction. Every demographics donut renders as if already tapped.
11. Motion timeline omits the off-track status note. Web renders a `motionStatus[beratungsstand]` paragraph when `isOffTrackStatus` (Bundesrat / Vermittlungsverfahren / für erledigt erklärt, etc.); `MotionTimeline.swift` has no `isOffTrackStatus` equivalent, so that procedural context line is lost.
12. Motion detail decodes `deskriptor` (`MotionDetailPayload.swift:21`) but never renders it (dead field), and renders `sachgebiet` chips the web `AntragDetail` does not — a divergence in both directions.

### Conventions (spot-checked ~40 files; comments category CLEAN)
- Logic imports SwiftUI (1): `Features/Members/Logic/PieSlice.swift:1` (only to use `Color`). Real rule-2 violation.
- One-type-per-file (12): `RootTabView.swift`, `Core/UI/HemicycleLayout.swift`, `Votes/Logic/PartyVoteSummary.swift`, `Votes/UI/VoteDetailView.swift`, `Parties/UI/PartyDetailView.swift`, `Members/UI/MemberDetailView.swift`, `Members/Logic/MemberListItem.swift`, `Members/Logic/MemberSpeechGroup.swift`, `Members/Logic/PieSlice.swift`, `Speeches/Logic/ReaderItem.swift` (4 types), `Speeches/Logic/DebateThreadRow.swift`, `Motions/Logic/MotionTimeline.swift` (4 types). The private tab enums colocated in detail views are arguably pragmatic; the 4-types files are the clearest violations.
- UI-with-logic (~15): filtering/sorting/pagination inside Views — `MemberSpeechesPanel.swift:84-109` (search tokenize + filter + pager math), `DebatePanel.swift:70-91`, `MemberVotesPanel.swift:49-60`, `MemberInitiativesPanel.swift:39-42`, `PartyVotesPanel.swift:42-47`, `PartiesView.swift:73-95` (seat apportionment), `DonationsBar.swift:53-57`, `PartyLineFingerprint.swift:44-56`, `VoteDonutGrid.swift:31-35`, `PartyDonutRow.swift:30-35`, `PartyHistoryChart.swift:13`, `PartyProfilePanel.swift:28-30`. Plus two pure algorithms misplaced in `Core/UI`: `HemicycleLayout.swift` (largest-remainder apportionment) and `MarkdownText.swift:34-40` (markdown parser) — both belong in Logic.
- Magic numbers (design values, not the 4 documented-reserved carve-outs): opacity `0.3` at `VoteDonutView.swift:25` and `PieDonutView.swift:65` (tokens are 0.15/0.4/0.7); bar height `32` at `PartyLineFingerprint.swift:24`, `DonationsBar.swift:29`, `ProposalsBar.swift:22`; `padding(.vertical, 2)` at `ChoicePill.swift:15`, `TopicChip.swift:15`; font size `11` at `MemberVoteRow.swift:41`, `ChoicePill.swift:11`; plus many hardcoded frame/avatar sizes (72/44/440/112/96/48...). None break the build; they're token drift.

### LOW / latent
- `Core/Networking/HTTPClient.swift:24` — `URL(string: path, relativeTo: base)!` force-unwrap on interpolated network id/slug (ShareLink). Latent crash if an id ever contains a URL-illegal char; ids are normally safe.
- `Votes/Logic/VoteListItem.swift:13` + `VoteDetailPayload.swift:27` — `absent: Int` non-optional; generator type is `number|null` but always coerces to a number, and live JSON confirms numeric. Latent only.
- `Parties/Logic/PartyHistory.swift:32-33` — `pts.first!/last!` force-unwrap; guarded by the `chartPoints.count >= 2` tab gate. Fragile if the gate changes.
- Strict-enum decode fragility: `VoteResult`, `PartyPosition`, `BallotChoice`, `MotionDetailPayload.LinkedVote.result` decode closed enums; an unknown upstream value fails the whole payload -> error screen (not a crash). Acceptable given closed value sets.
- `Core/Theme/PartyStyle.swift:46-51` — `fraktionslos` falls through to the raw lowercase string; web renders "Fraktionslos" (surfaces on independent-member meta + fraktionslos party header).
- Party detail header drops the "% des Bundestags" share (`PartyDetailView.swift:65-71`); no `chamberSeats` in the payload, so unrecoverable. List card shows share, detail doesn't — internally inconsistent.
- Loyalty ascending sort floats `nil` first (`MembersStore.swift:34-36`); web keeps null last regardless of direction. Edge case.
- Debate: no pager (renders all rows; web paginates 15), excerpt-only search with no highlight, reader footer is numeric "i / n" and drops the web "Weiter: {nextName}" preview (`Copy.nextLabel` defined but unused).
- VoteDonutView has dimming but no explode-on-select pop (web offsets the active segment 4px); `ProposalsBar` segments non-interactive (web links each to its vote); party demographics omits the "Alle N Mitglieder ->" link.
- Vote detail replaces the web SponsorStrip (signatory face-pile) with navigable motion-link rows; each side has something the other lacks (SponsorStrip is blocked on inline signatories).

### Verified faithful (honest positives)
- Hemicycle geometry (`HemicycleLayout.swift`) is an exact port of `lib/hemicycle.ts` Hamilton largest-remainder (floor + remainder distribution, angle = pi - t*pi, centered t=(k+0.5)/count); seat coords, viewBox 320x165, and seatChoice ordering match `VoteHemicycle.tsx`.
- Donut arc math (`VoteDonutView`) matches the web distribution donut (start -pi/2, sweep = v/total*2pi, same color order, hole r=22). All Canvas geometry uniformly guards divide-by-zero (`max(...,1)`, `total>0`, empty-seat skip) — no NaN even for all-zero handzeichen counts.
- Vote detail tabs are REAL (not stubs): Ergebnis (source notice + interactive hemicycle legend with selection dimming + donut grid) / Details (gated on summaryDetail, AI notice + PDF link) / Reden (gated on debate) — availability logic matches `VoteDetail.tsx`.
- Member filters (party/state/sex/age/mandate) + sort + demographics strip, member detail tabs (Abstimmungen/Reden/Anträge with empty-tab hiding + loyalty null-split), party list Regierung/Opposition grouping (`isGoverning = [CDU/CSU, SPD]` matches web), party detail success/proposals/alignment/donations/fingerprint/cohesion-callout/Verlauf chart — all faithful. Age buckets exact vs `lib/ageBuckets.ts`.
- `DebateThreadBuilder` (`DebateThreadRow.swift`) is a faithful line-by-line port of web `buildDebateThread`: same `isPresidium` regex, floor-tracking, 2-turn lookahead, `compact = short && !nested`. Motion timeline stage derivation matches `AntragTimeline`. Reader index bounds are safe.
- Filters/sorts genuinely narrow/reorder in every store; no read-but-ignored filter field. Date parsing is fully defensive (no force-unwraps). Enriched vote/motion/member/party fields are all correctly optional (only `MemberListItem.attendance` slipped).

### Log (iteration 2, review)
- lead: 2026-07-05 ran the NO-SLOP verification above. One ship-blocker (Members attendance decode vs undeployed enrichment), three HIGH parity/slop items (motion debate, reader dead-end, handzeichen blank donuts), the rest MEDIUM/LOW polish. Corrected two false-positive HIGH claims (initiator key, absent nullability) against live JSON. Did not fix anything.

### Iteration 2 review fixes (2026-07-05)
Priority items 1-5 of the review fixed. Build via ios-build.yml.
1. SHIP-BLOCKER (item 1): `MemberListItem.attendance` -> `Double?` (was the only non-optional lane-B/F enrichment field; full Codable audit confirmed every other enrichment field already optional). `MembersStore` attendance sort uses `?? -1` (matches loyalty). `MemberCardView` gates the whole Anwesenheit bar + Linie row behind `if let attendance`, so the card degrades to photo+name+party when enrichment is absent instead of the tab throwing to the error state. `MemberDetailPayload.attendance`/`PartyDetailPayload.attendance` left non-optional (they predate lane B, always present in `/members/{id}.json` + `/api/parties.json`).
2. HIGH (item 2): motion debate wired. `MotionDetailPayload` gained optional `debate: [DebateEntry]?` + `debateSource: String?` (DebateEntry same field shape as fullVote's) and optional `partySummaries` on `LinkedVote` (positionSummary/keyPoints/dissentNote + counts). New `MotionDebateAdapter` maps entries -> `SpeechSummary` (choice nil; motion JSON has no per-speech ballots) and pulls party summaries from the first linkedVote that carries them (mirrors web `AntragDetail.tsx:51`). `MotionDetailView` renders the shared `DebatePanel` (thread + reader + party-summary strip) after linkedVotes when `debate` is non-empty. NB: `vite-data/antraege.ts` does NOT yet emit `debate`/`debateSource`/linkedVote `partySummaries` (the web route uses the `getAntrag` server fn, not the static JSON), so the section stays hidden on current production and lights up when a plumber lane ports the `getAntrag` debate/partySummaries/memberBallots build into `vite-data/antraege.ts` (SQL already exists at `src/server/antraege.ts:213-332`). Decoded optionally per the app's degrade-then-light-up convention; no crash in either state.
3. HIGH (item 3): reader dead-end resolved via option (b). Confirmed against live JSON that full speech text is NOT in any shipped payload (excerpts ~280 chars, `debateSource` is a `'direct'|'related'` type flag not a URL, no per-speech source link) and the search shards remain out of v1, so option (a) is genuinely impossible. Relabeled `Copy.readFullSpeech` "Ganze Rede lesen" -> "Auszug lesen": the reader body already shows the complete untruncated excerpt (the card clamps to 4 lines), so the affordance is now honest about what it opens (excerpt + speaker context + prev/next), no button that promises a full read it can't deliver.
4. HIGH (item 4): handzeichen per-party donuts render from position. `VoteDonutView` gained an optional `position: PartyPosition?`; when all four counts are 0 it fills a solid arc in the position color (yes->success, no->danger, abstain->yellow, mixed/split->fg opacity-m), then the hole, matching the enriched-contract convention ("handzeichen carry position only, render solid position color"). Legend `selected` dimming honored via `position.choice`. Wired through `VoteDonutGrid` (vote-detail Ergebnis, live now) and `PartyDonutRow` (feed card, lights up when leanVotes.partySummaries deploys). `MotionLinkedVoteCard`'s aggregate donut is seat-weighted so it keeps real counts (no position needed).
5. CONVENTIONS (item 5): moved `PieSlice.swift` (PieSlice + Demographics, imports SwiftUI for `Color`) from `Members/Logic/` to `Members/UI/` (git mv; pbxproj auto-syncs src/). Logic/ now has zero SwiftUI imports. Left the cosmetic multi-type-file and token-drift items (MEDIUM/LOW) untouched per scope.

### Log (iteration 2, lane E)
- claude (lane E): 2026-07-05 shipped app-wide polish on main.
  - Share: native `ShareLink` (new `Core/UI/ShareLinkButton.swift`) in the toolbar of vote, member, party detail. Shares the canonical page URL (`HTTPClient.page` -> /votes/{id}, /members/{id}, /parties/{slug}) with subject+message = title. Messengers render the rich OG card automatically from the page's og:image (which for votes IS /og/votes/{id}.png), so a shared vote looks identical to the web share without attaching the png as a second link.
  - Haptics via native `.sensoryFeedback` (no hand-rolled UIFeedbackGenerator): root TabView tab switch (`RootTabView` now selection-driven with a private RootTab enum), segmented detail-tab switches (vote/member/party), hemicycle legend toggle (trigger on `selected`), filter apply (trigger on `activeFilterCount`; members also `sortDescending`), pull-to-refresh complete (`.success` on a refreshTick), Reader open/prev/next (trigger on the reader index in DebatePanel + MemberSpeechesPanel).
  - Pull-to-refresh: `.refreshable` on the three catalog lists (votes feed, members grid, parties) calling a new `store.refresh(cache:)` that force-fetches through the SwiftData stale-while-revalidate cache (`fetchLatest` shared with `load`).
  - Empty/loading/error: every list and detail now has three explicit states. New `Core/UI/ErrorStateView.swift` (message + retry) shown when a store's new `loadFailed` flag is set and no cached data exists; ProgressView only while genuinely first-loading; existing empty copy (Keine Treffer / Keine Abgeordneten) kept. `loadFailed` added to all list + detail stores; detail stores reset it at load start so retry shows a spinner.
  - Navigation: verified NavigationStack-per-tab, cards/rows are NavigationLinks so push + interactive back-swipe work everywhere; MotionDetail sheet (deep link) unchanged. Switched the list roots that read as collections (members, parties) to `.large` titles; votes feed stays `.inline` (full-bleed media feed), detail screens stay `.inline`.
  - Typography/token audit (full sweep via Explore subagent; colors + font weights were already clean). New `ThemeTokens.Display` (poster 32 / hero 40) tokenises the recurring poster numerals (PosterStatBar, PartyCardView, VoteHemicycleView). Fixed drift: member photo credit 10->Text.s, TopicChip outlined 11->Text.s, PartyBadge opacity 0.18->Opacity.s, two speech-row `.padding(.leading, 4)`->Spacing.xs. Left intentional and documented as reserved micro-geometry: sub-11pt canvas donut/facepile captions, 2px bar-segment gaps, the 17pt debate-thread rail indent, and the bespoke StampView metrics (2.5 stroke, 0.85 opacity, 1.4 tracking = the stamp's identity, mirrors the web SVG stamp).
  - Icon + launch: AppIcon is a single 1024 universal asset (iOS downscales all sizes) with light/dark/tinted variants, confirmed present. Launch screen is generated; added a white `LaunchBackground` colorset + `INFOPLIST_KEY_UILaunchScreen_BackgroundColor` so dark-mode devices don't flash a dark screen before the white (light-only) app.
  - Did NOT touch apps/bundestag. Did NOT deploy TestFlight.

## Iteration 2 web deploy visibility

Pre-deploy visibility check for commit 4fd3956 (web changeset = 1f652bd + 5362935, "lane B/B2" JSON enrichment + party data fix; 4fd3956 itself is iOS-only). Full `npm run build -w @machtblick/bundestag` run (fresh dist, full prerender crawl, no errors besides one pre-existing unrelated photo 404 for `mast-katja`).

**Verdict: SHIP.**

1. `/api/motions.json`: static JSON file (943 valid `leanMotions` rows, confirmed parseable), written by `writeJsonEndpoints()` next to `votes.json`/`members.json`/`parties.json`. NOT wired into `DataCatalog` JSON-LD (`src/routes/__root.tsx`), NOT listed in `llms.txt`'s "JSON Data" section, NOT in `.well-known/api-catalog`. It's an orphan endpoint today: harmless (not indexed as HTML, not in sitemap, no route collision with the existing `/motions/` index page), but undiscoverable by design docs or crawlers. Logged as a non-blocking follow-up: add a `Dataset` entry (`/motions/`, `/api/motions.json`) to the DataCatalog block, plus lines in `llms.txt` and `api-catalog`.
2. Party data fix confirmed as a correctness improvement, verified in the fresh build: `apps/bundestag/dist/client/api/parties.json` shows SPD cohesion 0.9966 (fullParty's `avgCoh`/`avgAtt` now match the already-correct namentlich-only `leanParties` methodology instead of averaging over all vote types). `parties/spd.json` roster is 120 clean members, zero blank-state/garbled entries (the old `750-abdi`-style rows are gone because `fullParty` now filters `memberIds.has(m.id) && stateByMember.has(m.id)`). This member array feeds the page's own `PoliticalParty` JSON-LD `member[]` directly (`routes/parties/$id/route.tsx:48`), so the corrected data also cleans up structured data automatically, not just visible UI. Verified `/parties/spd/profile/index.html`: title, description ("120 Sitzen"), canonical, hreflang, OG/Twitter image (1200x630, alt text), and JSON-LD (`member` count 120, `numberOfEmployees.value` 120) all render correctly.
3. Other additive JSON fields (voteType/topic/summarySimplified/partySummaries on lean votes, antraege on fullVote, initiatives on fullMember, linkedVotes counts, party history) touch only `vite-data/*.ts` generator functions and `vite.config.ts`'s `writeJsonEndpoints()`/`writeFileSync` calls for JSON output; zero diff to any route file's `head()`, `seoMeta`, `jsonLd`, or view component between the prod baseline and this changeset (`git diff` scoped to `apps/bundestag/src` is empty for this range). Confirmed purely additive, no HTML meta/canonical/JSON-LD/visible-content change.
4. Sitemap/robots/llms.txt/api-catalog/_headers: zero diff in this changeset (confirmed via `git diff` on those exact files across the range). Sitemap contains only canonical `/parties/{slug}/profile/` URLs (not the bare `/parties/{slug}/` tab-router parent, which self-referencingly canonicalizes to `/profile/`), no `/api/*.json` entries, no query-string variants. No new HTML routes; `/motions/` index page and `/motions/{id}/` details are unchanged (`publishableAntragIds()` untouched).

Build: PASS. HTML metadata: PASS. Sharing previews: PASS. Crawler access: PASS (unchanged). AI discovery: PASS (unchanged; motions.json gap logged as follow-up, non-blocking). Favicons/manifest: unchanged. Sitemap/JSON alternates: PASS.

## Iteration 2 SHIPPED (2026-07-05)
Build 2 uploaded to TestFlight (run 28756737710). Web JSON enrichment live on prod (deploy 7d6063a3). All lanes done, review ship-blocker + 3 HIGH fixed, ios-build green at HEAD.
Deferred to a later iteration (graceful-degrade in app now): motion detail debate section (needs antraege.ts to emit debate + linkedVote partySummaries), /api/motions.json into DataCatalog/llms.txt, cosmetic iOS convention cleanup (multi-type files, token drift), member Verlauf-blocked sort. Speeches full-text (search shards too heavy) still v-next.

## Iteration 3: typography & stamp fidelity to web (2026-07-05)

User A/B'd iOS vote feed vs web: web "10x better" on details. Fidelity pass (layout already correct):
1. Proposer: dropped the gray PartyBadge box on the vote card + detail header kicker. Party proposers (CDU/CSU, SPD, AfD, B90/Grüne, Die Linke) now render the party LOGO (5 web SVGs bundled as `party-<slug>` imagesets, new `PartyLogo` view); non-party proposers (Bundesregierung, Länder, Sonstige) render plain uppercase caption text, one line, tail-truncated. New `ProposerKicker` view; `PartyStyle.hasLogo`. PartyBadge kept untouched where web also uses badges (Defectors, Speeches, Motions).
2. Stamp one-line: font 12->10 (web `text-[10px]`), tracking = 0.12em, `lineLimit(1)` + `fixedSize` so ANGENOMMEN/ABGELEHNT never wraps.
3. Kicker row = web grid `1fr auto 1fr`: proposer leading 1fr (truncates), stamp centered auto, date trailing 1fr.
4. Date: `Formatters.shortDate` `dd.MM.yyyy` -> `d. MMM yyyy` (spelled month, mirrors web `formatDateShort`), uppercased by the caption/kicker treatment app-wide.
5. Meta caption casing: hemicycle `legendLine` ("N Enthalten"/"N Abwesend") now uppercase + 0.08em tracking (matches `.caption`). JA/NEIN + party donut labels were already caption.
6. Filter pill: `safeAreaInset(.bottom)` reserve on the paging feed so cards end above the floating pill (no more donut overlap); pill given the web drop shadow, sits bottom-center above the tab bar.
7. Mastheads removed on all top-level lists: votes + parties hide the nav bar; members keeps `.searchable` but drops the large title (inline empty) so it opens at the search bar. Detail pages keep their contextual bars.
8. namentlich default: VotesStore already defaulted `voteTypeFilter='namentlich'`; removed the now-obsolete defensive `voteType==nil` bypass in `filtered` and the `hasVoteType` gate on `activeFilterCount` (field is live), so the feed shows only namentliche votes and the pill reads "Filter · 1" on launch, matching web.
9. Member detail tabs: stripped the `(count)` suffixes (web removed them) -> "Abstimmungen"/"Reden"/"Anträge". Party detail tabs were already count-free.
10. Stamp grunge (approximating web's feTurbulence `#stamp-grunge` + mixBlendMode multiply + 0.85 opacity): kept double border (2.5px inner + 1px outer offset) and muted ink (`color.mix(fg, 0.55)` = color-mix 45%), added 0.12em tracking, a deterministic Canvas speckle overlay via `.blendMode(.destinationOut)` inside a `compositingGroup` (worn/broken edges), then whole-stamp `.blendMode(.multiply)` + 0.85 opacity (ink-on-paper). True feTurbulence displacement isn't available in SwiftUI; this is the closest faithful approximation. Applies everywhere StampView renders (card, detail, speeches reader/entry, party summary strip, motions).

### Log
- lead: implementing, green-build loop via ios-build.yml, no TestFlight.

## Iteration 4: brand wordmark with scroll-to-eyes morph (2026-07-06)

Web parity for app identity. The top-level lists lost their big titles in Iteration 3; this restores the machtblick brand the way the website does it (sticky nav wordmark that morphs into the eyes logo on scroll).
- `Core/UI/EyesLogo.swift`: exact port of the web SVG (`ScrollEyeWordmark.tsx`, viewBox 0 0 82 36) into a `Canvas`. Two stroked eye paths + two stroked brows (fg, round caps, stroke 3/4), left pupil `ThemeColor.fg`, right pupil `ThemeColor.danger`, all as cubic beziers matching the web path data. `pupilDrift` nudges pupils down with scroll.
- `Core/UI/BrandWordmark.swift`: `progress`-driven crossfade. Fraunces `Machtblick` (`.display`, text-xl 22) fades/shrinks/shifts left (opacity 1->0, scale 1->0.72, x 0->-6) while the eyes fade/scale in (opacity 0->1, scale 0.78->1), same curve as the web CSS custom props. Respects `accessibilityReduceMotion` (locks to wordmark).
- Votes/Members/Parties lists: each holds `@State scrollProgress`, drives it via `onScrollGeometryChange` (contentOffset.y / 140, clamped 0..1), and renders `BrandWordmark(progress:)` in a `.topBarLeading` toolbar item. Votes + Parties dropped `.toolbar(.hidden)` and got an inline empty title (no redundant big title). Members keeps its `.searchable` + trailing filter, brand added leading.
- Simplification vs web: skipped the sinusoidal pupil jitter (web keys it off continuous window.scrollY; on the paging vote feed that reads as noise) and kept a clean progress-only downward pupil drift. Morph curve, geometry, and colors are otherwise faithful.
- lead: green-build loop via ios-build.yml, no TestFlight.

## Iteration 5 (2026-07-06, user batch, HOLD deploy until user says)
1. Votes list: thin light-gray divider between vote cards, NOT full screen width (inset), subtle.
2. Vote detail "Eingebracht von": show the AUTHOR/signatory people (member portraits + names), like the web AntragSignatoryStrip, NOT the party badge. Data: vote JSON antraege lack signatories; fetch the primary linked antrag's /motions/{id}.json (has signatories[]) and render the author strip. Reuse MotionDetailView signatory strip idiom.
3. Speeches tab party summaries (PartySummaryStrip): remove the card border; separate cards with a thin VERTICAL divider (same light-gray color as the vote-list divider) instead.
4. Party summaries: use the party LOGO instead of the party name text (where a logo exists).
5. FIX: Reader/expanded speech shows only the excerpt, must show FULL text. Web stores full text in sharded JSON /speeches-search-{shard}.json (de) and -en-; shard = abs(h) % 4 where h = (h*31 + id.charCodeAt(i)) | 0 over the speech id. Build a SpeechBodyService: for the Reader's ids, compute shard(s), fetch+cache /speeches-search-{shard}.json (map id->text_full), join, show full text (loading state). Restore "Ganze Rede lesen" affordance once full text loads.
6. Members grid: redesign the photo card, rounded-corner photo, bottom gradient/blur overlay with the member name (truncate if needed) over the blur, small party logo overlaid top-right. Cleaner, photo-forward.
7. Filter sheets (votes + members): drop the per-group section labels (redundant with the filter facet name), and add a relevant SF Symbol before each group/option.

### Investigation notes for implementer
- Speech shard: SHARD_COUNT=4, hash h=(h*31+charCode)|0 over id, shard=abs(h)%4, file /speeches-search-{shard}.json (de) / /speeches-search-en-{shard}.json (en), JSON map speechId->fullText. Merged speeches have multiple ids (join with blank line, see web joinSpeechTexts).
- Vote authors: /motions/{antragId}.json has signatories[] with portraits; vote detail antraege[0] gives the antragId.

### Log (iteration 5)
- lead: batch recorded, dispatching opus agent; deploy held per user
- opus: item 1 done. Inset bottom divider (ThemeColor.border, Stroke.s, horizontal Spacing.l inset) overlaid on each vote card except last in VotesFeedView; paging preserved (overlay adds no height).
- opus: item 2 done. Extracted AntragSignatoryStrip (Motions/UI) from MotionDetailView; VoteDetailStore now loads first antrag's /motions/{id}.json and exposes signatories; header shows the author strip (kicker Eingebracht von), degrades to hidden when none.
- opus: item 3 done. PartySummaryStrip card border removed; thin vertical ThemeColor.border divider inserted between cards (full-height Rectangle, Stroke.s width).
- opus: item 4 done. PartySummaryStrip shows PartyLogo (Icon.l) where PartyStyle.hasLogo, else party name text.
- opus: item 5 done. SpeechShard (Int32-wrapping hash matching JS (h*31+charCode)|0, abs%4) + SpeechBodyService actor (per-id shard fetch of /speeches-search-{shard}.json, in-memory cache, joins ids with blank line); ReaderView loads full text on open with ProgressView, falls back to excerpt; Copy.readFullSpeech restored to "Ganze Rede lesen".
- opus: item 6 done. MemberCardView redesigned photo-forward: 3:4 rounded photo, bottom dark gradient with one-line white name, party logo on white circle top-right (colored dot fallback), accessibility label preserved.
- opus: item 7 done. Votes + Members filter sheets: dropped Section header labels, each picker now uses a Label with an SF Symbol (doc.text/building.columns/checkmark.seal/tag; map/person.2/calendar/signature/arrow.up.arrow.down).

## Iteration 6 (2026-07-07, user polish batch, HOLD deploy until lead ships)

### Log (iteration 6)
- opus: item 1 (rounded search) done. New Core/UI/SearchField (magnifyingglass + TextField, RoundedRectangle Radius.s surface fill + border stroke, autocap never, autocorrect off); adopted in DebatePanel, MemberSpeechesPanel (keeps onChange page reset), MemberInitiativesPanel. MembersGridView left on native `.searchable` (already the rounded native search bar the item wants; swapping to inline would lose nav-bar integration) — flagged for lead.
- opus: item 2 (serif body = summary size) done. Bumped to serif Text.l: VoteDetail Details MarkdownText (bodySize Text.l), SpeechEntry excerpt, PartySummaryStrip card excerpt, ReaderView summary positionSummary. ReaderView speech body already Text.l. CompactTurnRow excerpt kept Text.m (inline with Text.m name; bumping only excerpt would misalign the single-line baseline).
- opus: item 3 (reader speech header) done. Removed X close button entirely (both cases; swipe/drag-indicator dismisses), removed onClose from ReaderView + call sites, removed date line, party logo now before name (PartyStyle.hasLogo -> PartyLogo Icon.m), dropped PartyBadge row; role kept to match SpeechEntry. Summary case unchanged except shared X removal.
- opus: item 4 (debate spine) done. Spine Rectangle gets .padding(.top, Spacing.xl + 18) so it begins at first avatar center instead of above it; still fills down to connect later avatars.
- opus: item 5 (search highlight) done. New Core/UI/Highlight `highlighted(_:terms:color:)` (case-insensitive String.range scan, concatenated AttributedString, matched segments get yellow@opacity-m backgroundColor + .stronglyEmphasized; empty terms -> plain). Threaded terms DebatePanel -> DebateThreadView -> SpeechEntry/CompactTurnRow, MemberSpeechesPanel -> MemberSpeechGroupRow (collapsed excerpt + expanded thread), and ReaderView speech body.
- opus: item 6 (party card two-column) done. PartyCardView restructured: left VStack (color dot + name, poster seat number), thin vertical ThemeColor.border divider (Stroke.s), right VStack (SITZE·% kicker + Geschlossenheit + Anwesenheit StatBars), horizontal ThemeColor.border divider (Stroke.s) below each row.

## Known issues (batch-fix later, user collecting)
1. Speech/agenda titles: member Reden tab (and web) shows the raw bundled Tagesordnungspunkt as the row title when a speech has no clean voteTitle (combined debates with many motions concatenated by "–"/":"/Drucksache). Real fix: ETL-generate clean short titles for debate agenda items via local LLM (like vote titles); improves app + website. Affects both platforms (not iOS-specific), no line clamp on either currently.

## Iteration 7: debate-as-conversation (2026-07-07, user idea, HOLD deploy)
Vote detail (and motion detail) Reden tab: add a button under the debate thread that opens a full-screen WhatsApp-style CHAT view of the whole debate.
- Button "Als Unterhaltung ansehen" under the DebatePanel debate thread.
- ConversationView (new, full-screen sheet or push): each speech = a party-colored chat bubble.
- Arrangement BY STANCE (user approved): speaker's ballot choice drives the side — ja/dafür = RIGHT, nein/dagegen = LEFT, enthalten/nicht_abgegeben/unknown = CENTER-ish (left is fine). Presidium/system rows = centered gray system chips (like WhatsApp date chips).
- Bubble: subtle party-color tint background, rounded corners (sanctioned chat exception), speaker name + small avatar + party logo, the stamp optional.
- Truncation: long bubble text clamps ~6 lines with an inline "Mehr anzeigen" that EXPANDS IN PLACE to the full speech text (load via SpeechBodyService.text(ids:)), NO collapse-back (expand-only, like WhatsApp).
- Zwischenfragen: nested/indented as replies under the speaker.
- Reuse: DebateThreadBuilder rows / DebatePanel speeches data, SpeechBodyService for full text, PartyStyle colors/logos, SpeakerAvatar.

### Log (iteration 7)
- claude: 2026-07-07 shipped the conversation view. DebatePanel gains a full-width secondary "Als Unterhaltung ansehen" button under the DebateThreadView (only when speeches exist) presenting ConversationView via .fullScreenCover. New Features/Speeches/UI files: ConversationView (NavigationStack + close X, GeometryReader for 78% max bubble width, rows from DebateThreadBuilder.rows(from: speeches)), ConversationBubble (party-tinted RoundedRectangle 16 chat bubble, side by ballot choice ja=trailing else leading, avatar 24 + name + party logo header mirrored per side, serif body clamped to 6 lines, inline "Mehr anzeigen" that loads full text via SpeechBodyService and expands in place with a tiny spinner, no collapse, expand hidden for contributionType == "short"), ConversationSystemChip (centered gray surface capsule for presidium/system rows). Nested Zwischenfragen get extra inset toward center. Copy keys viewAsConversation/conversation/showMore added (German; Copy.swift is single-locale). Expanded ids tracked in ConversationView @State Set.

## Iteration 8: member speeches as chats inbox (2026-07-07, user approved "full debate, member highlighted")
Member detail Reden tab -> a WhatsApp CHATS INBOX. Each debate the member spoke in (MemberSpeechGroup) = a chat row: debate/vote clean title (bold), preview = member's latest excerpt (one line secondary), date + "N Beiträge" count trailing, small leading glyph/avatar, divider between rows (first none), keep infinite scroll + search (filters chats). Tap a chat -> full-screen conversation:
- If the group has a linked voteId: fetch /votes/{voteId}.json debate (all speakers), render ConversationThread, HIGHLIGHT bubbles where speakerMemberId == this member's id (subtle accent ring/tint, clear "this is them").
- Else (no linked vote): render the member's own turns as the conversation (fallback).
Add `highlight: Bool` to ConversationBubble. Thread the member's id into MemberSpeechesPanel. Distinct from vote-detail (which is ONE conversation inline); member page is MANY chats each opening a conversation.

### Log (iteration 8)
- claude: 2026-07-07 shipped the chats inbox. MemberSpeechesPanel rewritten: SearchField (filters chats by title + main excerpt) + infinite scroll (visibleCount/batch 8) over a LazyVStack of new ChatInboxRow buttons; tap opens a `.fullScreenCover`. ChatInboxRow = 40pt bubble.left.and.bubble.right glyph on a Radius.m surface square + bold display-l title (lineLimit 2) + one-line serif secondary preview (group.main.excerpt) + shortDate + "N Beiträge" count, divider on index > 0. New MemberDebateConversation (NavigationStack, inline title = group.title, Schließen close button): voteId set -> VoteDetailStore.load(/votes/{id}.json) + ConversationThread(VoteDebateAdapter.speeches, highlightMemberId: memberId) with a ProgressView while loading; voteId nil -> ConversationThread(MemberSpeechGrouping.summaries(group.speeches)) fallback. ConversationBubble gained `highlight: Bool = false` (stronger party tint 0.22 + party@opacity-l ring, fg fallback); ConversationThread gained `highlightMemberId: String? = nil` and flags a bubble when speech.speakerMemberId == it. MemberDetailView passes id + cache into the panel. DebatePanel/vote-detail path unchanged (no highlight id). Deleted the now-unused MemberSpeechGroupRow.

## Iteration 9: debate/party/defector polish (2026-07-07, batch then deploy)
1. Member chat = FULL debate: MemberDebateConversation currently loads full debate only when group.voteId != nil, else shows only the member's own turns (the bug: user sees just their messages). Fix = reconstruct the full debate from the debate group via /speeches-meta.json (published array of ALL speeches meta: id, speakerName, speakerMemberId, party, debateGroupId, agendaItem, date, excerpt/snippet, choice, voteId). Filter by group.debateGroupId, sort by position, map to SpeechSummary, render ConversationThread(highlightMemberId: memberId). Fall back to own-turns only if debateGroupId AND voteId both nil. Cache the meta fetch (it's larger). No web change needed (file already published).
2. Speaker avatars/names CLICKABLE -> member page: in conversation bubbles (ConversationBubble) and SpeechEntry, wrap avatar+name in NavigationLink(value: AppRoute.member(speakerMemberId)) when speakerMemberId != nil.
3. Party detail: MOVE the pies/donuts (currently at the bottom, likely in PartyProfilePanel) UP to sit right below the two PosterStatBars and ABOVE the tabs picker, grouping all stats together.
4. REMOVE Erfolgsquote (SuccessRateBar) from party detail entirely (misleading). Delete SuccessRateBar.swift if unused.
5. Abweichler (DefectorsSection) REDESIGN: drop the heavy bordered box + PartyBadge; use the app's standardized row idiom (party logo, avatar+name left, choice as a small stamp on the right, thin dividers first-none, kicker header). Space-efficient, consistent, readable. Keep NavigationLink to member.

### Log (iteration 9)
- claude: 2026-07-07 shipped all five. (1) New Features/Speeches/Logic/SpeechMetaEntry.swift (DTO for /speeches-meta.json, choice domain ja/nein/enthalten/null, computed .summary) + DebateGroupService.swift (cache.cached-or-fetch of /speeches-meta.json, filter by debateGroupId, sort by position, map .summary). MemberSpeechGroup gained debateGroupId (first non-empty item's). MemberDebateConversation: debateGroupId != nil -> DebateGroupService full debate (ProgressView while loading, empty -> own-turns fallback); else voteId path; else own turns. Registered .appDestinations(cache:) on the sheet's NavigationStack so links push inside it. (2) ConversationBubble avatar+name grouped into a NavigationLink(.member) when speakerMemberId != nil (plain text otherwise), logo stays outside; SpeechEntry name+logo wrapped likewise. (3) DemographicsStrip pies moved out of PartyProfilePanel into PartyDetailView between the stat bars and the picker (one stats block); PartyProfilePanel lost its members arg. (4) SuccessRateBar removed + file deleted; orphaned Copy keys successRateLabel, resultsMatchedSuffix, membersCount removed. (5) DefectorsSection rebuilt: kicker header, per party PartyLogo (text fallback for logo-less) + "Mehrheit: X" kicker caption, member rows via new DefectorRow (MemberAvatar + name left, choice StampView right, first-none border divider, NavigationLink .member), no bordered box.

## Iteration 10: keyboard dismiss, pies, antraege/spenden interactivity (2026-07-07)
1. KEYBOARD dismiss on tap-outside app-wide: tapping anywhere outside a focused field closes the keyboard. Robust UIKit approach: install a UITapGestureRecognizer on the key window (from RootTabView.onAppear, once) with cancelsTouchesInView=false and a UIGestureRecognizerDelegate whose shouldReceive(touch) returns false when touch.view (walk superview chain) is a UITextField/UITextView/UIControl (so tapping INTO a field still focuses it), action = resignFirstResponder. Also add .scrollDismissesKeyboard(.interactively) to the main scroll views (votes feed, member/vote/party detail). MUST NOT break tapping into a SearchField to type.
2. DEMOGRAPHICS pies HALF-SCREEN each: on party detail, the two PieDonutView (Geschlecht, Alter) should each take half the width (bigger donuts). Give each .frame(maxWidth: .infinity) and scale the donut size up. DemographicsStrip / PieDonutView.
3. ANTRÄGE bar CLICKABLE -> linked votes: the ProposalsBar ("0/28 angenommen") should be tappable; open a sheet listing the party's proposals (PartyDetailPayload.proposals, each has voteId + cleanTitle/title + date + result) as rows, each a NavigationLink(value: AppRoute.vote(voteId)) to the vote detail. Use the standardized row idiom (title left, result stamp right, thin dividers).
4. GROSSSPENDEN CLICKABLE + tooltip, REMOVE list: the DonationsBar segmented bar should be tappable per segment showing a small popover/tooltip (.popover + .presentationCompactAdaptation(.popover)) with that donation's donor + amount (EUR) + date; DELETE the itemized donations list rows currently rendered below the bar. Data: PartyDetailPayload.donations (donor, amountEur, dateReceived).

### Log (iteration 10)
- claude: 2026-07-07 shipped all four.
  1. Core/UI/KeyboardDismisser.swift: single UITapGestureRecognizer on the key window (installed once from RootTabView.onAppear, static-flag guarded), cancelsTouchesInView=false, delegate shouldReceive walks touch.view superview chain and skips UITextField/UITextView/UIControl so tapping INTO a SearchField still focuses and types; action resignFirstResponder. Added .scrollDismissesKeyboard(.interactively) to votes feed, member/vote/party detail, parties list, members grid.
  2. PieDonutView gains a maxWidth param; DemographicsStrip passes .infinity + .frame(maxWidth: .infinity) per pie only when showFaction=false (party-detail 2-pie half-screen each); members-grid 3-pie keeps 130.
  3. ProposalsBar wrapped in a Button -> .sheet(ProposalsSheet): NavigationStack + LazyVStack of ProposalRow (cleanTitle ?? title display + shortDate + result StampView, first-none divider), each a NavigationLink(AppRoute.vote), .appDestinations(cache). Threaded cache through PartyProfilePanel.
  4. DonationsBar list rows deleted; each bar segment is now a DonationSegment with its own .popover(isPresented:) + .presentationCompactAdaptation(.popover) showing DonationTooltip (donor/euro/shortDate). Header + total + bar kept.
  Plus (coordinator, mid-batch): both filter toolbar icons (votes + members) forced to the plain line.3.horizontal.decrease, no active-state circle.fill. ios-build.yml GREEN (run 28892387624, commit 0acd454).

## Iteration 11: saved/seen vote flags + feed filters (2026-07-08)
User wants per-vote local flags with toolbar toggles + feed filtering (like a cloude pattern of multiple trailing toolbar icons with a separator).
- Persistence: new @Observable VoteFlagsStore (Features/Votes/Logic or Core), backed by UserDefaults (two Sets<String> of voteIds: saved, seen), methods isSaved/isSeen/toggleSaved/toggleSeen, persist on change. Create once in RootTabView and inject via .environment(); read via @Environment(VoteFlagsStore.self).
- Vote detail toolbar (VoteDetailView .topBarTrailing): add a bookmark toggle (bookmark / bookmark.fill) and a seen toggle (checkmark.circle / checkmark.circle.fill) alongside the existing ShareLinkButton, grouped with a separator (iOS 26 ToolbarSpacer / ToolbarItemGroup so the two toggles sit together and the share is separated). Toggles are MANUAL (no auto-seen). Filled icon when active.
- Feed filter: add a flag filter (none/saved/seen/unseen) to VotesStore + VotesFilterSheet (a segmented/menu control), and apply it in the feed using the flags store (inject flags into VotesStore or filter in VotesFeedView after store.filtered). "unseen" = not in seen set.

### Log (iteration 11)
- claude: 2026-07-08 shipped all three parts. VoteFlagsStore (Features/Votes/Logic, @Observable, two Set<String> persisted as JSON arrays under machtblick.savedVotes/machtblick.seenVotes, loaded in init, formSymmetricDifference toggle) created once in RootTabView as @State and injected via .environment(flagsStore) on the TabView. VoteDetailView reads @Environment(VoteFlagsStore.self); trailing toolbar now = ToolbarItemGroup(bookmark toggle + seen toggle) then ToolbarSpacer(.fixed) then the existing ShareLinkButton; bookmark.fill/checkmark.circle.fill when active; manual toggles only (no auto-seen); .sensoryFeedback(.selection) on each flag. VoteFlagFilter enum (all/saved/seen/unseen, label via Copy, .all reuses filterAll) added; VotesStore gains flagFilter (counts in activeFilterCount); VotesFilterSheet gains a bound Picker section (Copy.flagFilter "Markierung"). Filter applied in VotesFeedView via @Environment flags over a `visible` computed on store.filtered; empty-state uses visible. Copy adds flagFilter/flagSaved/flagSeen/flagUnseen (de). Build: ios-build.yml result below.
