# iOS result table width

## Goal

Make the shared vote and motion result table fill the available content width.

## Status

Complete. Native width checks and screenshots verified.

## Contracts

- The table, total background, and row rules fill the visible width when content fits.
- Columns distribute the spare width; wider tables retain horizontal scrolling.
- Preserve counts, unknown values, party links, typography, and shared tokens.
- Verify German/light and English/dark vote results and linked motion results with native screenshots and width assertions.
- Preserve unrelated work and the submitted 1.5 build 46.

## Ownership

- Results worker: shared result table layout and its cells.
- Tester: existing native parity tests and their layout assertions.
- Root: integration, isolated verification branch, native CI, screenshot review, and release status.

## Log

- Root: screenshot shows the horizontal ScrollView filling its parent while the Grid keeps its intrinsic content width. The original simulator screenshots also show the unused space; the width was missed in that review.
- Tester: added repeated native assertions for actual total and party last-cell right edges and party-row content span against the horizontal viewport in vote, Handzeichen, and linked-motion scenarios. Allow the existing 24pt trailing and 12pt leading insets plus 4pt tolerance. Existing geometry with rightmost count ending at 276pt inside a viewport ending at 386pt fails these assertions. Native CI and screenshot review remain required.
- Tester: native run caught clipped English absence and visible Handzeichen counts with incorrect accessibility hit bounds. Scoped column reveal to the horizontal viewport, require full count-cell bounds and hittability, and retain narrow geometry attachments on failures. Rollcall now reveals the last column before width checks and resets scrolling before party navigation. Width tolerances remain unchanged; the UI worker owns content measurement.
- Results: offer the shared Grid the observed ScrollView viewport width as its minimum and ideal width, letting its existing flexible cells share spare space. Header labels keep intrinsic widths; no maximum width limits horizontal overflow. Only VoteResultTable changed. Localization (182 keys), More UI, settings parity (232 fields), and source whitespace checks pass. Native width assertions and German/light, English/dark, linked-motion screenshots remain the macOS gate.
- Results: native artifacts showed Grid children and hit-test frames extending beyond its reported scroll width. Replaced Grid with a focused native Layout that caches widest intrinsic cell per column, reports max(viewport proposal, intrinsic width), shares only surplus width, and places full-width row rules. Existing cell padding, fonts, backgrounds, counts and identifiers stay intact. A dedicated layout is necessary to make rendering, scroll extent and hit-testing agree without duplicate hidden views or per-cell state. Localization, More UI, settings parity, and new-source whitespace checks pass; native fit/overflow tests remain required.
- Results: pass observed viewport directly as Layout.minimumWidth, removing the constraining frame wrapper. Non-finite maximum-size proposals use intrinsic/minimum width, keeping reported size finite. Native CI must confirm fits, trailing inset, full-width shading/rules and unknown-column hit-testing after scroll.
- Root: native run 37295161683 rejected the initial Grid frame approach. German fit cases passed, English last cells extended 3.67pt past the viewport, and Handzeichen overflow had incorrect hit bounds. Keep the original width tolerances and verify the actual measured layout next.
- Root: native run 37298415604 passed on d25f15f with Xcode 26.2 and iPhone 17 Pro. Build, data contracts, localization, launches, theme persistence, scroll-to-top, and all three result/motion test methods passed. German/light and English/dark screenshots confirm full-width total shading and row rules, retained trailing padding, and readable last columns, including unknown counts and unavailable absence. Reviewed vote and linked-motion results in both languages and both Handzeichen result states.
- Root: the verified width fix is on fix/ios-result-table-width-2026-10-05. App Store 1.5 build 46 predates this change; this task did not upload or replace a submitted build.
