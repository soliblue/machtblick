# iOS logo scroll to top

## Goal

Tapping the Machtblick wordmark or eyes in any root tab scrolls that tab to the top. Verify, commit, push, and upload a TestFlight build.

## Status

In progress.

## Contracts

- Keep the existing scroll-driven wordmark animation.
- Use one shared action across Votes, Members, Parties, and More.
- Preserve existing user changes.
- TestFlight only, no App Store submission.

## Open questions

None.

## Log

- 2026-07-20 root: Located the shared wordmark and four root scroll views. Selected SwiftUI `ScrollPosition` for native scroll-to-top behavior.
- 2026-07-20 explore: Confirmed the shared model is the smallest coherent iOS 26 implementation and identified the TestFlight workflow.
- 2026-07-20 root: Implemented the shared button, localized accessibility label, four scroll bindings, focused UI test, CI test step, and current TestFlight notes.
- 2026-07-20 root: First macOS build found the secondary party proposals feed call site. Added its local scroll model before rerunning the gate.
- 2026-07-20 root: Xcode 26.2 build, language and theme smoke tests, and the focused scroll UI test passed. Apple rejected the 1.3 upload because the approved train is closed, so the centralized version moved to 1.4.
