# Machtblick iOS

Open `apps/ios/iOS.xcodeproj` in Xcode and run the `Machtblick` scheme. Simulator builds need no signing, team, or provisioning.

TestFlight uploads run through the `beta_local` lane in the root `fastlane/Fastfile` (`fastlane ios beta_local` from the repo root, or the `ios-testflight.yml` workflow). The lane requires `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_API_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_CONTENT`, and `TESTFLIGHT_PUBLIC_GROUP`, plus access to the `soli.Machtblick` app identifier (team `Q9U8224WWM`). Uploads and App Store releases are operator-only.

`apps/ios/scripts/` holds the localization and UI contract checks that must pass before release.
