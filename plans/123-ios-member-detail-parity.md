# 123 iOS Member Detail Parity

## Goal

Apply every relevant website change made after the last deployed baseline to the native iOS app, with the current web member-detail implementation as the product source and native SwiftUI as the interaction source.

This plan now governs the native implementation against the committed website source.

## Status

- Last deployed baseline identified: done
- Website worktree diff audited: done
- Current iOS member detail audited: done
- Static iOS data-contract gap identified: done
- Recommended iOS information architecture: done
- Website source stabilized: done
- Implementation: done
- Static contract, TypeScript, and production-build verification: done
- macOS build, DTO contract, compiled localization contract, and initial bilingual process smoke: done
- Final labeled-tab simulator rerun: done on `a8e96fc`
- Production static deployment, canonical web QA, and postdeployment native data smoke: done on `21ed415`
- Public TestFlight distribution and exact-build verification: prepared, ready to dispatch

## Baseline and scope

- Last deployed baseline commit: `b402e4456440965d2a989167329a3fc15d005e59`.
- Committed website parity source: `d37533a409bd686ba9d5198a342bfa34135c78a2`.
- Local `HEAD`, the live GitHub `main` ref, and `origin/main` were verified equal at the parity source before native implementation started.
- At the planning boundary, production served the pre-overhaul member header, stat bars, voting filters, and simple vote ledger. Its index, member-shell, and voting-record asset hashes matched the local built output at the baseline, and its index contained the TestFlight prompt introduced by `b402e44`. The web member overhaul and its enriched German and English static app-data layer are now live on canonical production from `21ed415`.
- The relevant web work is recorded in `plans/120-web-donation-bars-only.md` and `plans/121-member-detail-page-overhaul.md`.
- The worktree also contains unrelated agent configuration changes. Implementation must preserve them.
- Plan 122 owns German and English app localization, locale-specific paths, and the app-wide language preference. This plan consumes those contracts and does not create a second locale system.

## Audited website delta

| Website change | Current iOS state | iOS plan |
|---|---|---|
| Party logo moves directly before the member name | Party appears as the first metadata line | Add the logo to the identity row and remove party from metadata |
| Photo credit becomes an overlaid info action | Credit is permanently shown below the portrait | Add a 44 point portrait info action and anchored attribution popover |
| Attendance and loyalty become centered values without bars | Both use `PosterStatBar` progress bars | Add a member-specific centered stat component and keep `PosterStatBar` for party screens |
| Defection count becomes informational | It is already informational on iOS | Preserve, restyle with the centered stat |
| Member navigation becomes Votes and Speeches only | Motions appears when initiatives exist | Remove member motions from navigation and payload use |
| Voting filters are removed | iOS already has no member-vote filters | No change |
| Full newest-first history remains | iOS already renders newest-first history | Preserve |
| Simple vote rows become compact vote cards | iOS has title, date, result, deviation text, and ballot stamp rows | Replace with the selected compact card |
| Compact card adds proposer and party distributions | Static iOS member JSON lacks both | Extend the static member history contract |
| Compact card omits date, summary, and hemicycle | iOS row shows date, while summary and hemicycle are absent | Remove date and keep summary and hemicycle absent |
| Member ballot and party-line relation become the main signal | Ballot is a trailing stamp and deviation is inline text | Add centered ballot status, semantic line state, connector, and highlighted party donut |
| Vote titles gain locale-aware hyphenation | iOS relies on default wrapping | Make long German and English titles explicitly locale-aware and verify hyphenation |
| Segmented-control inner corners become concentric | Native iOS segmented Picker already owns this | No change beyond reducing to two choices |
| Party donation rows are removed below the segmented bar | iOS already has the segmented bar without persistent donor rows | No change |
| Website member-motion routes redirect | iOS has no equivalent URL route | No iOS redirect; remove only the member motions tab |
| SEO descriptions stop advertising motions | iOS has no SEO metadata | No change |
| Speech-card redesign remains deferred | iOS already has search, batching, inbox rows, and full-screen debate | Preserve the existing iOS speeches panel |

## ASCII source of truth

Route: `AppRoute.member(id)`

The example person and values are fictional.

```text
+------------------------------------------+
| < Abgeordnete                     Teilen |
|                                          |
| (( PORTRAIT ))  [SPD] Erika Musterfrau   |
| ((       (i) ))       Niedersachsen      |
|                       Landesliste        |
|                       41 Jahre           |
|                                          |
|        86%                    94%         |
|    ANWESENHEIT           LINIENTREUE      |
|  8 VON 57 VERPASST     3 ABWEICHUNGEN    |
|                                          |
| [      Abstimmungen      |     Reden    ] |
|                                          |
| [GRUENE LOGO]                  ABGELEHNT  |
|                                          |
| Ein allgemeines Tempolimit von 130 km/h  |
| einführen                                |
|                                          |
|         STIMME [NEIN] · ABWEICHUNG       |
|                    |                     |
|                    +-- lightning -----+  |
|                                       v  |
|   (o)     (o)     (o)     (o)      ((o))|
| GRUENE   LINKE  CDU/CSU   AFD        SPD |
|                                          |
|       inset elevated divider             |
|                                          |
| [next compact vote]                      |
+------------------------------------------+
```

The screen emphasizes the member's ballot first, its relationship to the party majority second, and the chamber result as context.

## Header contract

- Keep the circular 112 point portrait.
- Overlay a 44 point info target at the portrait's lower trailing edge when attribution exists.
- Open a native anchored popover with the full author and licence. The source URL remains tappable and opens through the app's approved in-app web presentation.
- Put the party logo immediately before the member name. Use a quiet localized party-name fallback when no logo exists.
- Keep state, mandate, constituency, age, and education as the metadata stack. Do not repeat the party there.
- Replace member attendance and loyalty bars with two centered values using the 32 point poster numeral, caption label, and supporting count.
- Show `-` plus the existing no-data explanation when loyalty is unavailable.
- Keep defections informational, with danger semantics only when the value is greater than zero.

## Navigation contract

- Keep the native segmented `Picker`.
- The only member tabs are Votes and Speeches.
- Hide the picker when only one tab has content, matching current native behavior.
- Remove the member-specific Motions panel, DTOs, and rows. Keep global motion routes and motion access from votes and parties.
- Leave the existing Speeches panel, search, batching, inbox rows, and debate presentation unchanged.

## Compact member vote card contract

- Replace `MemberVoteRow` with one compact `MemberVoteCard` per history entry.
- Make the complete card a `NavigationLink` to the vote detail.
- Use an unframed `background` surface with `l` padding and an inset `elevated` divider between cards.
- Header: proposer logo or compact text at leading, unrotated chamber-result stamp at trailing, no date.
- Keep the proposer and donut row display-only so the card has one unambiguous navigation target.
- Title: `xl` display semibold, localized hyphenation, no summary, no hemicycle.
- Status: centered `STIMME`, semantic ballot badge, then `LINIE` or `ABWEICHUNG` when meaningful.
- Ballot colors: yes uses success, no uses danger, abstention uses yellow, not cast uses a neutral foreground fill.
- A matching vote draws one continuous party-majority-colored connector from the status row to the member's party donut.
- A deviation draws the member-choice color before a detached danger lightning break, then the party-majority color through the arrowhead.
- A not-cast ballot uses a neutral badge and omits the line-status word. When a party majority exists, the majority connector and highlighted donut remain available as context.
- Outline the member's party donut using the party-majority choice color. Do not add a majority caption.
- Keep all ballot states dimensionally stable.
- Render the connector as accessibility-hidden decoration. The card accessibility label states the title, member ballot, chamber result, and line or deviation in words.

## SwiftUI drawing contract

- Reproduce connector semantics rather than porting the React SVG and `ResizeObserver` implementation.
- Derive status and target anchors inside the card and draw one Canvas overlay from those anchors.
- Do not introduce a per-row observable model or geometry update loop.
- Extend the shared `PartyDonutRow` with an optional highlight contract while preserving its normal vote-card rendering.
- Use `PartyVoteOrder.byJaShare` for the shared ordering so normal and highlighted rows stay consistent.
- Keep the existing `VoteDonutView` drawing and semantic colors.

## Static member JSON contract

The iOS app consumes `apps/bundestag/vite-data/members.ts`, not the locale-aware web server function. That generator must be updated separately.

Each history entry gains:

```text
proposingParty: string or null
partySummaries: array of
  party: canonical string
  position: yes, no, abstain, or mixed
  members: integer
  yes: integer
  no: integer
  abstain: integer
  absent: integer
```

Contracts:

- Keep `choice`, `partyMajority`, `result`, party IDs, and position values as stable untranslated codes.
- Emit `proposingParty` even when null and `partySummaries` even when empty.
- Decode both new iOS fields optionally so an older cached payload still renders a reduced card until refresh.
- Reuse the existing `PartyVoteSummary` type rather than restating the nested structure in the Members feature.
- Stop emitting member `initiatives` after the member-specific Motions surface is removed. Older app builds already decode it optionally, and newer builds ignore the extra field in older caches.
- Fold the locale work into plan 122's German and English member generation. Do not implement a German-only intermediate contract.
- English and German artifacts keep identical keys and stable codes. Only display titles and speech text vary by locale.
- Close the existing visible metadata drift by emitting `education`, which the iOS DTO already expects.
- Type-check the static generator against the backend-owned member response type or a backend-owned pure contract.
- Clear both generated member directories before rebuilding. The current output contains stale member files beyond the current member ID set.

## Generation and payload safeguards

- Preload vote summaries once per build rather than querying all summaries for every member and locale.
- The new embedded summaries add about 20.9 MiB raw per locale across the current complete member artifact set. Measure raw and compressed output after generation.
- Keep individual member downloads within a reviewed size budget and record the largest generated member file.
- Verify current member-file count against the database after stale output cleanup.
- No database schema or ETL change is required.

## Planned file scope

### Website build data

- `apps/bundestag/vite-data/members.ts`
- `apps/bundestag/vite.config.ts`
- Backend-owned member response type only if required to prevent server and static drift

### iOS logic

- `apps/ios/src/Features/Members/Logic/MemberDetailPayload.swift`
- Member-detail store locale integration from plan 122
- Delete member initiative DTOs after static compatibility is verified

### iOS UI

- `apps/ios/src/Features/Members/UI/MemberDetailView.swift`
- `apps/ios/src/Features/Members/UI/MemberVotesPanel.swift`
- Replace `MemberVoteRow.swift` with `MemberVoteCard.swift`
- Add focused member portrait and centered stat components
- Delete `MemberInitiativesPanel.swift` and `MemberInitiativeRow.swift`
- Extend `apps/ios/src/Features/Votes/UI/PartyDonutRow.swift` without changing default callers
- Localization keys from plan 122, including singular Line and Deviation labels

### Preserve

- `PosterStatBar.swift`, because party detail still uses it
- Global motion routes and motion detail
- Existing member speeches UI and logic
- Donation bar UI, which already matches the new website behavior
- Native segmented-control styling

## Implementation order

1. Stabilize and commit the website batch so the selected web source cannot move during the native port.
2. Update the static German and English member generator contract, preload shared data, and clean stale member output.
3. Add backward-compatible Swift decoding for proposer and party summaries, then remove member-initiative use.
4. Refactor the member identity header, photo attribution, and centered stats.
5. Reduce member navigation to Votes and Speeches.
6. Extend the shared party donut row with optional member-party highlighting.
7. Replace the simple member vote row with the compact card and native connector drawing.
8. Apply and verify locale-aware title hyphenation on compact member cards and normal vote cards.
9. Add the final iOS ASCII mock beside the Member Detail view.
10. Run contract, build, accessibility, visual, and scrolling verification, then dispatch and verify TestFlight as explicitly authorized by the user.

## Verification contract

### Data

- Server, German static JSON, and English static JSON agree on top-level and nested member keys.
- All current member JSON files decode through the shipping Swift DTO.
- A pre-change cached member payload also decodes and renders without crashing.
- Generated member directories contain only current IDs.
- `proposingParty` and complete party summaries exist for representative member votes.
- Member initiatives are absent from the new payload and UI.
- German and English member artifacts share stable codes and differ only in localized content fields.

### UI states

- Party-logo and party-name fallback headers.
- Portrait with linked attribution, portrait with unlinked attribution, and no portrait.
- Loyalty value, missing loyalty, zero defections, and nonzero defections.
- Yes, no, abstention, and not-cast ballots.
- Matching party line, deviation, no party line, and missing older-cache enrichment.
- Five-party and six-party donut rows.
- Long German and English titles at compact widths and large Dynamic Type.
- Member with speeches and member without speeches.

### Interaction and accessibility

- Full vote cards navigate to the correct vote.
- Photo attribution has a 44 point target, an explicit accessibility label, and a tappable source.
- VoiceOver reads ballot, result, and party-line meaning without relying on connector geometry or color.
- Segmented navigation exposes only available Votes and Speeches panels.
- Share behavior and localized links follow plan 122.

### Performance and regression

- Member-detail scrolling remains smooth with a long voting history and all donuts visible.
- Connector geometry does not trigger repeated layout updates.
- Normal vote-feed donuts retain the existing 44 point drawing, semantic colors, label emphasis, and zero extra top padding when no highlight is supplied. Both contexts use the required shared `PartyVoteOrder.byJaShare` ordering and token `s` labels.
- Party donation presentation remains unchanged.
- Member speech search and full-screen debate remain unchanged.
- The macOS iOS build gate passes. Run an ETTrace comparison if the compact card causes measurable scrolling regression.

## Out of scope

- The deferred member speech-card redesign
- New member filters
- Restoring member-specific motions elsewhere
- Web hover behavior, desktop layout, SEO copy, and legacy URL redirects
- Reproducing the React connector implementation line for line
- App Store deployment

## Log

- 2026-07-11 user: requested a new plan applying every website improvement made since the last deployment to the iOS app, with special attention to the redesigned member detail page.
- 2026-07-11 lead: identified `b402e44` as `HEAD`, `origin/main`, and the deployed pre-overhaul source boundary; audited every changed and untracked website file against current iOS member detail.
- 2026-07-11 lead: verified the production index, member shell, and voting-record asset hashes exactly match the local baseline build, including the TestFlight URL added by the baseline commit.
- 2026-07-11 frontend: audited user-visible changes and identified native parity, missing work, and web-only behavior.
- 2026-07-11 backend: found that the web server contract changed but the separate static iOS generator did not; specified proposer and party-summary fields, locale parity, stale file cleanup, existing education drift, and payload-growth safeguards.
- 2026-07-11 designer: translated the selected compact web card and header into a native iOS mock, retained the current speeches panel, and excluded React geometry, web routing, and hover behavior.
- 2026-07-11 lead: waited for the website agent to finish testing, then verified commits `02e2e15` and `d37533a4` on GitHub `main` before touching implementation files.
- 2026-07-11 user: authorized full implementation of plans 122 and 123, commit, push, and a verified TestFlight workflow run.
- 2026-07-11 ios: replaced the member detail with the approved native composition: party identity before the name, anchored photo attribution, centered attendance and loyalty values, Votes and Speeches only, compact full-card navigation, proposer and result context, localized title typesetting, member ballot state, party donuts, highlighted party, and one anchor-driven Canvas connector.
- 2026-07-11 ios: removed member initiative DTO and UI use while preserving global motion access. New proposer and party-summary fields decode optionally for older caches.
- 2026-07-11 lead: verified 639 current member files per locale, 37,165 enriched history entries, no initiatives, education output, matching German and English schemas and stable identifiers, and raw and compressed payload budgets.
- 2026-07-11 lead: full Bundestag production build and TypeScript checks passed. The macOS Xcode build and TestFlight gates remain pending on the committed source SHA.
- 2026-07-11 tester: browser verification passed the redesigned member detail in German and English at desktop and 390 by 844 mobile, including header, stats, two tabs, photo dialog, compact vote cards, donuts, connectors, neighboring routes, redirects, and zero runtime errors.
- 2026-07-11 visibility: final predeploy visibility audit passed every affected route, bilingual JSON alternate, structured-data dataset, machine catalog, sitemap, and file-limit check.
- 2026-07-11 lead: audited the completed native port against every plan contract. Visible localized tab labels were restored, the member-only donut scaling stays isolated from default rows, and the explicitly required shared yes-share order remains consistent across normal and highlighted rows.
- 2026-07-11 lead: verified the web member overhaul is live, but the German static member JSON still lacks proposer, party summaries, and education and still contains initiatives. English app-data endpoints remain 404, confirming that the final bilingual static deployment is required before TestFlight.
- 2026-07-11 lead: the Xcode 26.2 gate compiles the app, decodes legacy and enriched member payloads, validates compiled German and English resources, and launches both locales. Public TestFlight delivery now verifies the exact processed build reaches the public external group rather than checking the invitation page alone.
- 2026-07-12 lead: GitHub run `29173216628` passed on `a8e96fc`, including persisted German and English second launches and visible localized root-tab labels. Native English data and enriched production member cards remain gated only by the undeployed static web layer.
- 2026-07-12 user: explicitly authorized production deployment of the bilingual static layer.
- 2026-07-12 deployer: built and deployed exact source `21ed415` to Cloudflare Pages. The production build prerendered 6,456 pages and passed all 1,930 bilingual artifact checks.
- 2026-07-12 lead: canonical production now serves matching German and English schemas and stable identifiers for all representative member, vote, party, motion, and speech artifacts. All 639 current members include education, omit initiatives, and expose 37,165 enriched history entries with proposer and party summaries.
- 2026-07-12 tester: canonical member-detail QA passed 46 of 46 checks in German and English at desktop and 390 by 844 mobile, including identity layout, centered stats, two tabs, 59 compact cards, 354 donuts, member highlights, connectors, full-card navigation, speeches, photo attribution, localized links, and clean runtime diagnostics.
- 2026-07-12 lead: postdeployment GitHub run `29180835348` passed the complete native build and persistent German and English relaunch gates on `21ed415`. Both locales loaded live production data, and original-resolution English screenshot review confirmed the long translated compact title and surrounding layout render completely.
