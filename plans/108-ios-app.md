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
