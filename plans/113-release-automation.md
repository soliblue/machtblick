# Release Automation

## Goal

Eliminate manual App Store submission: a manually dispatched GitHub Action that submits an existing TestFlight build for full Apple review. Manual trigger only (`workflow_dispatch`), no push or schedule triggers. The operator releases the approved version by hand (`automatic_release: false`).

## Status

Done.

## Scope

- New Fastfile lane `release` submitting an existing TestFlight build via `upload_to_app_store`.
- New workflow `.github/workflows/ios-appstore-release.yml`.
- No changes to existing workflows, no triggers fired, nothing committed.

## Contracts

- Marketing version is centralized in `apps/ios/Config/Version.xcconfig` (enforced by `apps/ios/scripts/check-release-version.mjs`); the lane refuses to submit unless the dispatched `version` input matches it. CI never edits the version.
- `build_number` input is optional; empty means the latest TestFlight build for that version.
- Metadata and screenshots are owned by the `app_store_assets` lane and its workflow, so the release lane runs with `skip_metadata` and `skip_screenshots`.
- `ITSAppUsesNonExemptEncryption` is declared in `apps/ios/src/Info.plist`, so no `submission_information` block is needed.

## Log

### backend

- Studied `beta_local` and `app_store_assets` lanes, `ios-testflight.yml`, `ios-app-store-assets.yml`, and `check-release-version.mjs`; found the marketing version lives in `Version.xcconfig` (currently 1.2), not the pbxproj.
- Added the `release` lane: verifies the `version` option against `APP_VERSION`, resolves the build number (input or latest TestFlight for the version), exports `RELEASE_BUILD_NUMBER` to `GITHUB_ENV` in CI, then `upload_to_app_store` with `skip_binary_upload`, `submit_for_review: true`, `automatic_release: false`, `precheck_include_in_app_purchases: false`.
- Added `ios-appstore-release.yml`: `workflow_dispatch` only (required `version`, optional `build_number`), owner-gated like the other iOS workflows, `ios-appstore-release` concurrency group without cancel-in-progress, macos-15 runner, the shared release-version check, fastlane 2.237.0, the three `APP_STORE_CONNECT_API_*` secrets, and a summary step echoing version and submitted build number.
- Verified the workflow parses with `yaml.safe_load`, the Fastfile passes `ruby -c`, `check-release-version.mjs` still passes, and secret names match `ios-testflight.yml`.

### ios-polish (keyboard tap-through fix)

- Operator bug: with a search field focused, tapping content dismissed the keyboard but the same tap also navigated (e.g. member row). Desired: first tap only dismisses, second tap navigates.
- Inventory of text inputs: `.searchable` on `Features/Votes/UI/VotesFeedView.swift` and `Features/Members/UI/MembersGridView.swift`; custom `Core/UI/SearchField.swift` (plain `TextField`, no `@FocusState`) used by `Features/Members/UI/MemberVotesPanel.swift`, `Features/Members/UI/MemberSpeechesPanel.swift`, `Features/Speeches/UI/DebatePanel.swift`. No other TextFields.
- Root cause: `Core/UI/KeyboardDismisser.swift` (window-level `UITapGestureRecognizer` installed from `RootTabView`) had `cancelsTouchesInView = false`, deliberately letting the dismissing tap also reach content.
- Mechanism chosen: fix the existing central dismisser instead of five per-screen SwiftUI overlays. Tracks keyboard visibility via `keyboardWillShow`/`keyboardWillHide`; the tap recognizer only receives touches while the keyboard is up (`shouldReceive` returns `keyboardVisible`), keeps default `cancelsTouchesInView = true`, and adds `shouldBeRequiredToFailBy` returning `keyboardVisible` so SwiftUI's internal row/link recognizers must wait for the dismiss tap to fail, swallowing the first tap. Keyboard down means the recognizer never participates, so normal taps are untouched. Scroll pans fail the tap immediately, so `.scrollDismissesKeyboard(.interactively)` behavior is unchanged. Taps on text fields and UIControls (search-bar cancel, tab bar) still bypass, as before.
- Files touched: `apps/ios/src/Core/UI/KeyboardDismisser.swift` only. All four `apps/ios/scripts/*.mjs` contract checks green (`check-release-version.mjs` from repo root). Not committed; CI compiles on push.

### ios-polish (double x on search)

- Operator bug: active search (screenshot: "hashs", "Keine Treffer") showed two x buttons, the system in-field clear (`UISearchTextField`'s `clearButtonMode` circular filled xmark) plus the outer dismiss X from iOS 26 `.searchToolbarBehavior(.minimize)`. Wanted exactly one: keep the outer dismiss X, drop the in-field clear, and have dismissal also reset the query so reopening starts empty.
- Screen identified as `Features/Votes/UI/VotesFeedView.swift` (`copy.noResults` plus `.searchable` with minimize behavior); `Features/Members/UI/MembersGridView.swift` shares the same `.searchable` pattern. The custom `Core/UI/SearchField.swift` panels have no clear button or dismiss X, so they are untouched.
- New shared component `apps/ios/src/Core/UI/SearchDismiss.swift`: a `SearchClearButtonRemover` singleton (selector-based observer on `UITextField.textDidBeginEditingNotification`, same pattern as `KeyboardDismisser`) sets `clearButtonMode = .never` on any `UISearchTextField` the moment it begins editing, which kills the in-field clear without touching the custom `SearchField` TextFields; a `ViewModifier` reading `@Environment(\.isSearching)` sets the bound query to `""` whenever search deactivates, exposed as `.clearsQueryOnSearchDismiss($store.search)` and applied directly inside `.searchable` on both VotesFeedView and MembersGridView.
- Files touched: new `SearchDismiss.swift`, one modifier line each in `VotesFeedView.swift` and `MembersGridView.swift`. No new Copy keys, no pbxproj edits (filesystem-synchronized groups pick up the new file). All four `apps/ios/scripts/*.mjs` contract checks green (`check-release-version.mjs` from repo root). Not committed.

### plumber (HTML-entity pollution in stored text)

- Operator bug: vote `2026-07-10-1019-ablehnung-des-antrags-der-linken-39-krankenversicherte-entlasten-nicht` rendered a literal `&#39;` in its official title (iOS + web). Measured pollution: `votes.title` 1, `vote_documents.title` 1, `vote_translations.title` 1 (EN), `vote_polarity_decisions.original_title` 1, `antraege.abstract` 68 (`&#39;`/`&quot;`/`&ndash;` and friends, my earlier LIKE-based count of 38 undercounted), `antraege.abstract_plain` same 68 (derived). All other swept columns (speeches, summaries, party positions, all translation tables, agenda items) were clean.
- Root cause: every scrape decoded entities with hand-rolled partial replace chains. `text()` in `etl/bundestag/votes/import-namentlich.ts` handled only `&nbsp;/&amp;/&quot;`, so the bundestag.de list HTML's `&#39;` survived into `votes.title` (and its `39` leaked into the vote slug via `slugify`). Same class of gap in `detailBallots.ts`, `handzeichen/segment.mjs`, `backfillAgendaItem.ts`. DIP JSON abstracts arrive HTML-escaped and `etl/dip/buildAntraege.ts` never decoded them; `plainText()` in `db/materialize-derived-data.ts` strips tags but not entities, so `abstract_plain` inherited the pollution.
- Fix at entry: new shared decoder `etl/_shared/entities.mjs` (+ `entities.d.mts`), `decodeHtmlEntities` = single-pass named + numeric (dec/hex) entity decode; `&shy;`/`&#173;` drop, `&nbsp;`/`&#160;` to plain space, unknown entities left alone (no double-decode: `&amp;amp;` becomes `&amp;`). Wired into `import-namentlich.ts` `text()`, `detailBallots.ts` `htmlText()`, `handzeichen/segment.mjs` `extractText()`, `votes/backfillAgendaItem.ts` `textFromXml()`, and `etl/dip/buildAntraege.ts` (title + abstract). fast-xml-parser paths already decode via default `processEntities`.
- Repair: new idempotent sweep `db/decode-html-entities.ts` (`npm run db:decode-entities`), sqlite backed up to scratchpad first. Decoded: votes.title 1, vote_documents.title 1, antraege.abstract 68, vote_translations.title 1, vote_polarity_decisions.original_title 1; second run decodes 0 (converged). `db:materialize` re-derived the 68 `abstract_plain` rows; post-run entity counts are 0 everywhere. 15 speeches rows match the `&...;` shape but are genuine prose (`& Anwendung“.`), correctly untouched.
- Decision: the vote id/slug keeps the leaked `-39-` (`...der-linken-39-krankenversicherte...`). The URL is public and stable; changing ids breaks links and caches. Only the display fields were repaired.
- Derived pipeline for that vote checked: `clean_title` ("Keine höheren Kosten oder Leistungskürzungen für Krankenversicherte") and `vote_polarity_decisions.rewritten_title` were already clean; the polluted EN translation title was decoded in place and will also self-heal on the next `etl:translations` (source hash changed).
- Regenerated public endpoints (sitemap + votes feed + JSON endpoints, same generators the vite build runs). Isolated fix-only delta (regenerated from backup DB vs repaired DB, same code): 1449 files. 1260 member JSONs (630 x de/en: every sitting member's vote history carries the repaired namentlich title), 147 motion JSONs (68 decoded abstracts x locales plus list spillover), 26 vote JSONs, 12 party JSONs, 2 api/votes.json, 2 speeches-meta.json. `votes.xml`/`sitemap.xml` unchanged (feed uses clean_title). Zero entity patterns remain in public JSON.
- Guard: decode runs at ingest (see above) plus belt-and-braces `db:decode-entities` chained into `etl/bundestag/handzeichen/refresh.mjs` (after write, before proposers) and added as step 8 of the auto-refresh source list in `prompts/auto-refresh.md` (later steps renumbered). Quirk documented in `.claude/agents/plumber.md` under shared modules.
- `tsc --noEmit` green at root and in `apps/bundestag`. Nothing committed; lead ships.

### ios-polish (vote detail design drift: tab strip and notice boxes)

- Operator drift report: the vote detail tab strip (Ergebnis/Details/Reden) and the surface notice boxes diverged from the web reference.
- Tab strip: iOS used the native `Picker(.segmented)` in two places, `Features/Votes/UI/VoteDetailView.swift` `picker()` and `Features/Members/UI/MemberDetailTabs.swift` (member detail Votes/Speeches, mounted from `MemberDetailContent.swift`). Web reference (`views/voteDetail/VoteDetailTabs.tsx`, `views/memberDetail/MemberDetailTabs.tsx`): `rounded-m border border-fg/15 bg-surface p-xs`, active segment `bg-background font-semibold shadow-[0_1px_2px_rgba(10,10,10,0.08)]` with inner radius `calc(radius-m - spacing-xs)`, inactive `opacity-l`. New shared `apps/ios/src/Core/UI/SegmentedTabs.swift` mirrors it exactly: container `RoundedRectangle` Radius.m (14) with `ThemeColor.border` (fg @ Opacity.s = 0.15, the existing fg/15 convention) at Stroke.s, surface fill via `.background(_:in:)` so the active-segment shadow is not clipped, Spacing.xs inner padding and gap; active segment `RoundedRectangle` at Radius.m - Spacing.xs = 10, background fill, semibold, shadow 0x0A0A0A @ 0.08 radius 1 y 1; inactive regular at Opacity.l. Both call sites now use it. `MembersFilterSheet.swift`'s segmented sort-direction picker stays native: it lives in a native Form sheet, not the detail tab-strip pattern.
- Notice boxes: web renders all three (`officialDataNotice` in ResultTab.tsx, `aiSummaryNotice` in DetailTab.tsx, inverted/petition notices in VoteDetail.tsx) as `bg-surface p-m text-s`, sharp, borderless. Verified line by line that the three iOS counterparts in VoteDetailView.swift (lines 144, 167, 187) already render sharp: plain `.background(ThemeColor.surface)` on the padded Text, no clipShape/cornerRadius in the chain, no global appearance override, and the only rounding sites in `apps/ios/src` are unrelated (MemberBallotBadge, MemberCardView, StampView, SearchField). No change needed there. MotionDetailView and PartyDetailView have neither pattern.
- `check-more-ui-contract.mjs` asserts nothing about these views' tab or notice styling, so no contract fragment changes. No new Copy keys, no pbxproj edits (filesystem-synchronized groups). All four `apps/ios/scripts/*.mjs` contract checks green (`check-release-version.mjs` from repo root). Not committed.
