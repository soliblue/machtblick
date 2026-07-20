# Production release 1.4

## Goal

Deploy the current web app to Cloudflare Pages and submit the latest processed iOS 1.4 TestFlight build for App Store review through GitHub.

## Status

In progress.

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
