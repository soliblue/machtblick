# Web Donation Bars Only

## Status

Implemented and verified.

## Goal

Match the iOS party-detail donation presentation on the web by keeping the segmented, hoverable donation bar and removing the always-visible donor list beneath it.

## Scope

- Remove donor names, dates, and amounts rendered as rows below the web donation bar.
- Preserve the section label, donation count, total amount, proportional segments, accessibility labels, and hover tooltips.
- Update the party-detail ASCII contract to show the bar-only presentation.
- Do not change donation data loading or the iOS app.

## Verification

- `npm exec tsc -- -p apps/bundestag/tsconfig.json --pretty false`
- `npm run build -w @machtblick/bundestag`, 6,456 pages prerendered
- Playwright at 1440x900 confirmed 51 CDU/CSU donation segments, hover details, the correct aggregate total, and no persistent donor rows.
- Visibility review confirmed donation details remain available through accessible labels and party JSON.

## Agent Log

### Lead, 2026-07-11

- Located the web donation list in `DonationsBar.tsx` and confirmed the iOS implementation already exposes details through the segmented bar instead of persistent rows.
- Started the smallest presentation-only removal.
- Removed the persistent web donor rows and their now-unused formatting code.
- Updated the party-detail ASCII contract to retain only the hoverable segmented bar.
- Passed focused browser, TypeScript, production build, and visibility gates before release.
