# Home Smart App Banner

## Goal

Prevent Safari's native App Store banner from interfering with the mobile vote feed while retaining it on every other page.

## Status

Complete.

## Shared contract

- `/` and `/en/` omit `apple-itunes-app` from server-rendered HTML.
- All other routes retain `apple-itunes-app` with App Store ID `6787755187`.
- The custom non-Safari iPhone prompt and footer link remain unchanged.

## Verification

- Inspect server-rendered metadata for both home routes and representative German and English detail routes.
- Verify the affected pages render without console or hydration errors.

## Log

- Lead: confirmed the issue is isolated to the snap-feed home routes and accepted route-scoped native banner removal.
- Frontend: confirmed child metadata cannot remove the inherited banner tag and identified the leaf route match as the correct scope.
- Visibility: confirmed existing prerender coverage and the German and English verification matrix.
- Lead: omitted the native banner from both home routes in initial HTML while retaining it elsewhere.
- Tester: verified all four routes on `dev.machtblick.de` with an iPhone viewport, correct banner counts, rendered content, canonical metadata, and zero console errors.
- Lead: updated the stale navigation contract fragment to match the previously shipped fixed-height navigation after it blocked the production build.
- Visibility: fresh production prerender generated correct German and English home and members HTML. Home routes omit the Apple banner, members routes retain it, and titles, descriptions, canonicals, language alternates, robots, Open Graph, and X metadata remain complete. The full production build passes after updating the stale navigation contract fragment.
