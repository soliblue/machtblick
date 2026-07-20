# Shared stamp treatment

## Goal

Use one status-colored stamp border with matching text on web and iOS, fix the web radius to `radius-s`, verify both apps, commit, push, and upload a new TestFlight build.

## Status

Implemented, verified, pushed, and uploaded. Apple external TestFlight review is pending.

## Contracts

- Keep existing spacing, typography, opacity, texture, and rotation behavior.
- Use exactly one border and the sanctioned small radius on both platforms.
- Apply through the shared stamp components, not individual call sites.
- TestFlight only, no App Store submission.

## Open questions

None.

## Log

- 2026-07-20 root: Confirmed the reference treatment and located the shared web and iOS stamp components.
- 2026-07-20 root: Made border and text share the status color, removed the second ring, and kept both components on `radius-s`.
- 2026-07-20 audit: Confirmed the preferred treatment matches the older single-border style and that all call sites inherit the shared change.
- 2026-07-20 root: Added web and iOS contract checks for one border, direct status color, and unmodified `radius-s`.
- 2026-07-20 root: Verified the canonical web feed at 390x844 and 1440x900 with Playwright, no console errors, matching text and border colors, one border, and an 8px radius.
- 2026-07-20 root: Passed the full Bundestag production build and prerender plus iOS localization, parity, UI contract, and release-version checks.
- 2026-07-20 root: Pushed `5583124`; iOS build run `29740794986` passed compilation, German and English simulator smoke tests, theme switching, and logo scroll-to-top.
- 2026-07-20 root: TestFlight run `29741719708` uploaded the replacement build and verified the public link. Apple external availability verification remains active.
