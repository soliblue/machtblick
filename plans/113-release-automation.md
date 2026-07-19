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
