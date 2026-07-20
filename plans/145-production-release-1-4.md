# Production release 1.4

## Goal

Deploy the current web app to Cloudflare Pages and submit the latest processed iOS 1.4 TestFlight build for App Store review through GitHub.

## Status

Complete.

## Contracts

- Ship current product code from `5583124`; the Abweichler image drafts are not implemented.
- Use the latest processed TestFlight build for version 1.4.
- Submit for App Store review with automatic release off.
- Deploy only `apps/bundestag` to the existing `machtblick-bundestag` Cloudflare Pages project.
- Verify the immutable Pages deployment and `https://machtblick.de`.

## Open questions

None.

## Log

- 2026-07-20 root: Confirmed the iOS build gate passed for `5583124` and its replacement TestFlight binary uploaded successfully.
- 2026-07-20 root: Confirmed the App Store workflow defaults to the latest TestFlight build for version 1.4 and keeps automatic release off.
- 2026-07-20 root: App Store submission run `29769296369` resolved build 45, then failed because version 1.4 had no editable App Store version.
- 2026-07-20 root: Added an idempotent App Store Connect preparation step that creates the missing 1.4 version with manual release before submission.
- 2026-07-20 root: App Store submission run `29769496243` created version 1.4 with manual release, selected build 45, and submitted it successfully for review.
- 2026-07-20 deployer: Production build and all bundled static contracts passed; deployed 9,936 files to `https://bcb2f356.machtblick-bundestag.pages.dev` with project-resolved Wrangler 4.112.0. Cloudflare usage is 28/500 deployments for 2026-07.
- 2026-07-20 deployer: Verified HTTP 200 at the immutable deployment and `https://machtblick.de/`. At 390x844 both rendered `Angenommen` with matching `rgb(122, 184, 122)` text and border, 8px radius, one border, and no `::after` outer ring.
