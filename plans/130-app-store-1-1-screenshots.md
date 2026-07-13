# 130 App Store 1.1 Screenshots

## Goal

Prepare the Machtblick iOS 1.1 App Store draft with a stronger screenshot story, search-oriented localized metadata, and a repeatable capture, render, verify, and upload workflow.

## Status

- Sync updated main while preserving local App Store documentation commits: completed
- Audit the 1.1 app, existing screenshots, and metadata: completed
- Define the four-screen bilingual screenshot narrative and exact app states: completed
- Automate deterministic simulator navigation and raw screenshot capture: completed
- Automate framed rendering and App Store dimension checks: completed
- Capture and verify the final German and English screenshot sets: completed
- Audit the App Store Connect 1.1 draft: completed
- Save localized 1.1 metadata and subtitles in App Store Connect: completed
- Replace German and English screenshots in App Store Connect: pending workflow upload
- Verify the App Store draft and repository changes: completed
- Commit repository changes: completed
- Explore denser second-pass compositions: completed
- Render and verify the revised bilingual screenshot set: completed
- Commit the second-pass screenshot design: completed
- Select the party-list, replacement motion, and member-debate states: completed
- Capture and render the revised screenshot stories: completed
- Verify and commit the story revisions: completed

## Contracts

- The screenshot set uses real Machtblick 1.1 screens and current public Bundestag data.
- The first three screenshots communicate the product without relying on small body text.
- Screenshots cover distinct user value rather than adjacent states of the same vote.
- The set includes an interesting vote, a useful speech or summary state, and a member detail Votes tab.
- Each final image has one concise localized headline and no supporting subtitle.
- German remains the primary locale and English uses true English app UI captures.
- The rendering system is deterministic and token-based, with no hand-positioned edits.
- Raw capture states are addressable from launch arguments or stable UI-test navigation.
- Capture, framing, dimension validation, and upload remain separate commands that can run locally or in GitHub Actions.
- Store metadata is localized in German and English and keeps subtitle words out of the matching keyword list.
- App Store Connect changes remain a draft unless the user explicitly authorizes final App Review submission.

## Open Questions

- Confirm the repository push and GitHub Actions upload after the final commit.
- Keep App Review submission separate until the user explicitly authorizes it.

## Verification

- Build and launch the 1.1 app on the supported iPhone simulator.
- Capture every configured state twice and confirm stable pixels outside dynamic system chrome.
- Render all assets at the exact required App Store dimensions.
- Inspect each rendered asset at full scale and as a phone-size contact sheet.
- Run the repository iOS release checks and screenshot automation checks.
- Verify saved App Store Connect metadata, screenshot order, attached build, and draft status.

## Log

- 2026-07-12 user: requested a dramatically stronger 1.1 screenshot set, replacement of repetitive screenshots, more interesting vote and summary examples, a member-detail Votes screen, improved searchable metadata, reusable screenshot automation, App Store Connect updates, and a pull before work.
- 2026-07-12 lead: fetched remote main, found two local App Store plan commits against a substantially advanced remote, and rebased both cleanly onto the 1.1 release head without discarding changes.
- 2026-07-12 lead: confirmed the existing renderer frames tracked manual captures but does not automate simulator navigation, state selection, or raw capture.
- 2026-07-12 designer: defined a six-screen narrative covering a current decision, a three-way party split, a motion summary, party arguments from speeches, member voting behavior, and party comparison.
- 2026-07-12 visibility: set the German subtitle to `Bundestag-Abstimmungen` and replaced overlapping keywords with a 96-byte search-oriented list.
- 2026-07-12 lead: added deterministic debug launch scenarios, one UI test capture pass, manifest-driven framed rendering, exact-dimension validation, and one-command orchestration through `npm run ios:screenshots:all`.
- 2026-07-12 lead: replaced the party-split example with the 297 Ja, 130 Nein, 134 Enthaltungen vote on preventing abusive paternity acknowledgements, removing an unclear portrait license while strengthening the three-way story.
- 2026-07-12 lead: completed a clean repeatability pass. All six UI states were captured in 46 seconds, rendered, and verified at 1284 by 2778 pixels.
- 2026-07-13 user: clarified that quality matters more than screenshot count, requested distinct phone placements and highlighted headline words, then added English screenshots and App Store localization with German remaining primary.
- 2026-07-13 designer: replaced the six-screen storyboard with four distinct compositions: current decision, member accountability, paired summary and arguments, and party comparison.
- 2026-07-13 visibility: verified complete German and English metadata, improved both 1.1 release-note localizations, and confirmed field and keyword limits.
- 2026-07-13 lead: automated ten localized raw captures across five app states, rendered four final images per locale, and added exact source and output-set validation before App Store upload.
- 2026-07-13 user: removed marketing subtitles in favor of one concise display headline per image.
- 2026-07-13 lead: completed repeated bilingual capture passes, fixed the speech-card crop, verified all eight final assets at 1284 by 2778 pixels, and updated visible portrait credits.
- 2026-07-13 tester: passed all eight final images with no substantive findings, including headline legibility, distinct compositions, localized app UI, exact dimensions, manifest alignment, and metadata limits.
- 2026-07-13 lead: created and saved the editable 1.1 App Store version, localized the German and English version metadata and app subtitles, attached processed build 34, and kept the version in Prepare for Submission.
- 2026-07-13 lead: confirmed the integrated browser cannot upload local files. The checked-in GitHub Actions lane remains the upload path for synchronizing the four German and four English screenshots without submitting the version for review.
- 2026-07-13 designer: aligned the concise ASCII storyboard with the implemented routes, source states, localized headlines, renderer geometry, filenames, backgrounds, and callout styling.
- 2026-07-13 lead: passed screenshot dimensions, localized copy coverage, release-version consistency, native UI contracts, settings parity, script syntax, whitespace, and prohibited-dash checks.
- 2026-07-13 scribe: committed the verified App Store 1.1 bilingual screenshot automation and metadata change set.
- 2026-07-13 user: requested a stronger second design pass with larger phones and headlines, materially less unused space, and continued dimensional treatments such as elevated callouts.
- 2026-07-13 lead: reopened the screenshot design before upload and chose deterministic HTML and CSS concept variants so the real app UI and localized copy remain exact.
- 2026-07-13 designer: selected an editorial overscale direction with 12 to 16 percent larger phones, 18 to 25 percent larger headlines, tighter locale-specific spacing, and an 80 to 95 percent visual occupancy target.
- 2026-07-13 lead: rendered and inspected all eight second-pass assets at full resolution and in bilingual contact sheets. The German member image reduced its flat lower band from about 530 pixels to 210 pixels, while every composition now uses at least 92 percent of the canvas height.
- 2026-07-13 tester: passed all eight second-pass assets after original-resolution review and independent raster decoding, with no clipping, overlap, localization, color-channel, or composition findings.
- 2026-07-13 scribe: committed the verified second-pass App Store screenshot design.
- 2026-07-13 user: requested the party-list screen for party comparison, a more publicly interesting motion in the split composition, and direct member speeches instead of party-summary cards.
- 2026-07-13 lead: rebased the four local App Store commits onto remote main at `df87872` before taking new screenshots, with the active plan update restored cleanly from autostash.
- 2026-07-13 lead: selected the politician-insult offence proposal for the summary crop, the military-service modernization member timeline for the debate crop, and the party-list seat map with 328 government and 299 opposition seats for party comparison.
- 2026-07-13 lead: completed two fresh bilingual simulator passes on the rebased app, added a final deterministic scroll into the member timeline, and verified eight revised marketing assets at 1284 by 2778 pixels.
- 2026-07-13 tester: passed the revised bilingual story and composition with no clipping, overlap, stale party-detail claims, or party-summary cards; the English capture retains only official German source terms for Julia Klöckner's role and the Strafgesetzbuch.
- 2026-07-13 scribe: verified the third-pass App Store screenshot story revisions for commit.
