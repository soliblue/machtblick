# 110 App Store Submission

## Goal
Prepare and submit Machtblick iOS 1.0 for App Review using the existing TestFlight build.

## Status
- App Store Connect audit: done
- Simulator build and screenshot capture: done
- German metadata and compliance: in progress
- Build attachment and validation: todo
- App Review submission: todo

## Contracts
- App Store record: Machtblick, Apple ID 6787755187, iOS 1.0
- Shipping target: apps/ios/iOS.xcodeproj, scheme Machtblick
- Storefront language: German
- Support URL: https://machtblick.de/
- Privacy URL: https://machtblick.de/privacy/
- Submission uses the existing processed TestFlight build unless App Store Connect rejects it
- No legal, tax, trader, encryption, or content-rights declaration is inferred without repository or account evidence

## Screenshot Set
- Capture on the largest App Store Connect iPhone slot supported by the shipping target
- Present each real app screen inside a straight-on device frame with editorial headline copy
- Use a quiet neutral background, one semantic accent, Fraunces display type, and a subtle hemicycle pattern
- Omit the logo and sequence number so the headline, subtitle, and app screen use the full composition
- Size the subtitle for phone-scale App Store browsing rather than desktop inspection
- Show the vote feed, a vote result, party speech summaries, the related debate thread, the members explorer, and a party profile
- Use live public data and avoid transient loading or error states

## Log
- lead: 2026-07-11 confirmed clean main checkout and preserved feat-eu-x-laender WIP in stash@{0}
- lead: 2026-07-11 confirmed signed-in App Store Connect record at iOS 1.0 Prepare for Submission
- lead: 2026-07-11 captured four iPhone screenshots at 1284 x 2778 and three selected iPad screenshots at 2064 x 2752
- lead: 2026-07-11 prepared German product metadata, review notes, Fastlane asset upload lane, and GitHub workflow
- lead: 2026-07-11 prepared factual age questionnaire responses, calculated rating 13+, not saved pending action-time confirmation
- lead: 2026-07-11 first asset workflow resolved TestFlight build 1.0 (25), then stopped before upload because Fastlane required a string build number
- lead: 2026-07-11 user requested framed editorial screenshots with headline copy; raw captures moved to fastlane/screenshot-source and deterministic renderer added
- lead: 2026-07-11 Fastlane upload changed to checksum-based screenshot sync after Apple's initial processing delay caused each raw asset to be retried once
- lead: 2026-07-11 user approved the visual direction and requested two additional vote-related screenshots for speech summaries and the underlying speeches
- lead: 2026-07-11 user requested larger subtitles and removal of the top logo and sequence numbers across the complete screenshot set
- lead: 2026-07-11 captured live party-summary and debate-thread states from the vote Reden tab, rendered six iPhone and three iPad assets, and verified exact App Store dimensions
