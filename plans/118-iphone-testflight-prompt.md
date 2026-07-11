# iPhone TestFlight prompt

## Goal

Offer the Machtblick iOS beta once to visitors using Safari on an iPhone without affecting other visitors or repeatedly prompting the same browser profile.

## Status

Modal redesign, browser verification, production build, and operator review complete. Ready for release.

## Shared Contract

- Render a compact modal sheet after client hydration.
- Show only in Safari on iPhone after client hydration.
- Link to `https://testflight.apple.com/join/r7RVrgtr`.
- Persist the first impression in local storage so the modal appears only once per browser profile.
- Keep the modal absent from prerendered HTML and from non-iPhone or non-Safari browsers.
- Localize German and English visible copy.

## Verification

- Run TypeScript and the production Bundestag build.
- Browser-check visible, link, focus, and dismissal behavior with an iPhone Safari user agent.
- Browser-check absence on desktop and a non-Safari iPhone browser user agent.
- Run the diff-aware visibility gate before deployment.

## Log

- User: initially requested a dismissible iPhone Safari TestFlight banner, then chose a cleaner modal that never repeats for the same user.
- Lead: Apple recommends unobtrusive Smart App Banners for App Store promotion and advises using startup alerts sparingly. Smart App Banners require an App Store app ID and do not target a TestFlight public link, so this implementation uses a compact one-time sheet with a clear task and obvious dismissal.
- Lead: the prior inline implementation passed TypeScript, browser, and production-build checks but was replaced before commit or deployment.
- Lead: implemented the modal with Radix Dialog for focus containment, focus restoration, Escape and backdrop dismissal, accessible title and description, and a compact bottom-sheet presentation.
- Lead: Playwright passed German at 320px, English at 390px, exact TestFlight navigation, app icon loading, focus containment, immediate seen-marker persistence, no repeat after reload, close button, Escape, backdrop, and secondary dismissal. The prompt remained absent for iPhone Chrome and desktop.
- Lead: the full production build passed. The copied iOS app icon exists in generated output, while representative prerendered HTML contains no prompt copy, TestFlight URL, or icon reference.
- User: approved the modal on the iPhone dev preview and requested production deployment.
- Tester: independently passed iPhone Safari rendering, exact TestFlight link, contained focus, no overflow, dismissal persistence after reload, desktop absence, and console/page error checks.
- Visibility: passed the fresh build, German and English generated HTML, metadata, and sharing previews. Unaffected crawler, discovery, favicon, manifest, sitemap, and JSON-alternate categories were skipped.
