# Switcher border and inactive contrast

## Goal

Keep the original rounded navbar theme and language switchers without an outer border or center divider, and give inactive segments the slightly darker semantic elevated background while preserving active, hover, focus, dark-mode, desktop, and mobile behavior. Commit, push, and deploy the verified result.

## Status

Complete.

## Shared contracts

- Scope is limited to the shared navbar switcher styling.
- Inactive segments use the semantic `elevated` color for slightly stronger separation from the page.
- Switcher groups retain their original `rounded-m` shape.
- Switcher groups have no gray outer border or center divider.
- Active segments remain foreground-filled with background-colored content.
- Existing borders, focus treatment, labels, and interactions stay unchanged.

## Open questions

- None.

## Log

- lead: Confirmed from the supplied desktop and mobile screenshots that inactive segments render with a gray surface fill in light mode.
- frontend: Made inactive theme and language segments explicitly use `bg-background`, retaining the existing `hover:bg-surface`, focus outlines, active treatment, dimensions, borders, and responsive variants. The Bundestag TypeScript compiler passed. The production build passed tests, asset generation, client compilation, and SSR compilation, then failed during route prerendering on an unrelated filesystem read error.
- tester: Playwright passed at `https://dev.machtblick.de` on desktop and iPhone 13. Inactive theme and language segments computed to white, active segments stayed dark, theme changes persisted, German to English navigation worked, the desktop members link passed as the neighboring flow, and no console or page errors occurred. Evidence: `/tmp/tester-switcher-desktop-after.png`, `/tmp/tester-switcher-iphone13-after.png`.
- lead: Reviewed the implementation diff and desktop and mobile evidence. The requested switcher background fix is complete with no navbar regressions found.
- lead: Reopened after user review. The previous pass fixed only the fill and failed to remove the rounded capsule that was the main visual defect. Updated the contract to radius 0 for both switcher groups.
- frontend: Removed `rounded-m` from both shared switcher group containers, giving desktop and expanded mobile variants the default radius 0 while retaining the explicit inactive background and all existing border, state, sizing, and interaction styles. The Bundestag TypeScript compiler and diff checks passed.
- tester: Re-tested the reopened change with Playwright at `https://dev.machtblick.de` on desktop and iPhone 13. Both theme and language containers computed to `border-radius: 0px`, inactive segments computed white, active segments stayed dark, theme toggling and English navigation passed, and no console or page errors occurred. Evidence: `/tmp/tester-switcher-square-desktop.png`, `/tmp/tester-switcher-square-iphone13.png`.
- lead: Reviewed the corrected desktop and mobile screenshots. The rounded capsule is gone from both switchers and the reopened request is complete.
- lead: Reopened after user clarification. Restore the original radius and remove the gray outer border and center divider instead.
- frontend: Restored `rounded-m` on both switcher groups, removed their outer border and inline border color, and removed the center divider. Explicit `bg-background` remains on inactive segments, with sizing, active, hover, focus, and interaction behavior unchanged. The Bundestag TypeScript compiler and diff checks passed.
- tester: Re-tested the borderless rounded switchers at `https://dev.machtblick.de` on desktop and iPhone 13. Both groups compute to `border-radius: 14px`, all outer and segment borders compute to `0px`, inactive halves compute white, selected halves compute dark, theme selection and German to English navigation work, and no page errors occurred. React emitted one existing development-only hydration mismatch warning after locale navigation, unrelated to these class-only changes. Evidence: `/tmp/tester-switcher-borderless-desktop.png`, `/tmp/tester-switcher-borderless-iphone13.png`.
- lead: Reviewed the clarified borderless, rounded result on desktop and mobile. The gray outline and divider are gone while the original radius is restored.
- lead: Reopened after user refinement. Keep the borderless rounded shape and change inactive segments from `background` to the subtle `surface` color.
- frontend: Changed only the inactive theme and language segment fills from `bg-background` to semantic `bg-surface`. The existing `rounded-m` containers remain borderless and divider-free, with active, hover, focus, sizing, and interaction classes otherwise unchanged. The Bundestag TypeScript compiler and diff checks passed.
- tester: Playwright at `https://dev.machtblick.de` confirmed the desktop theme and language groups compute to `border-radius: 14px`, every group and segment border computes to `0px`, inactive segments compute to `rgb(247, 247, 247)`, and selected segments compute to `rgb(10, 10, 10)`. The desktop screenshot was captured at `/tmp/tester-switcher-surface-desktop.png`. The full run did not pass interaction regression checks: checking dark changed the radio state but the root theme remained light, and the iPhone 13 menu button did not open, so mobile styles and the requested mobile screenshot were not reached. No app source was modified by tester.
- lead: Rechecked the scoped rendered styles after React hydration on desktop and iPhone 13. Both switchers compute to `14px` radius, `0px` border, and `rgb(247, 247, 247)` inactive surfaces with no console or page errors. Evidence: `/tmp/tester-switcher-surface-desktop.png`, `/tmp/tester-switcher-surface-iphone13.png`.
- lead: Reopened for the final refinement and release. Change inactive fills from `surface` to the slightly darker `elevated` token, verify, commit, push, and deploy.
- frontend: Changed only the inactive theme and language segment fills from semantic `bg-surface` to `bg-elevated`. The `rounded-m` borderless, divider-free containers and all active, hover, focus, sizing, and interaction styles remain unchanged. The Bundestag TypeScript compiler and scoped diff checks passed.
- visibility: Classified the two navbar component changes as visibility-insensitive because they only adjust presentation classes and do not change metadata, routes, prerender configuration, discovery files, crawler policy, structured data, sharing assets, or JSON alternates. A fresh `npm run build -w @machtblick/bundestag` completed successfully, including full prerendering and static contract checks. Confirmed the fresh generated root HTML and compiled `bg-elevated` styles under `apps/bundestag/dist/client`. HTML metadata, sharing previews, crawler access, AI discovery, favicons and manifest, sitemap, and JSON alternates were skipped as unaffected. No visibility blockers.
- tester: Playwright passed at `https://dev.machtblick.de` after explicitly waiting for React hydration on desktop and iPhone 13. Both switchers compute to `border-radius: 14px`, every group and segment border computes to `0px`, inactive segments compute to elevated `rgb(237, 237, 237)`, and selected segments compute to `rgb(10, 10, 10)`. Theme switching, the mobile menu, and the neighboring members link passed with no console or page errors. Evidence: `/tmp/tester-switcher-elevated-desktop.png`, `/tmp/tester-switcher-elevated-iphone13.png`.
- lead: Committed the verified switcher refinement as `6c4f014`, pushed `main`, and deployed it to Cloudflare Pages at `https://8a4b8694.machtblick-bundestag.pages.dev`. Both the deployment URL and `https://machtblick.de/votes/` returned HTTP 200. Deployment usage is 22/500 for 2026-07 and the production output contains 10916/20000 files.
