# iOS result table width

## Goal

Make the shared vote and motion result table fill the available content width.

## Status

Implementing the layout correction and native verification.

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
- Results: offer the shared Grid the observed ScrollView viewport width as its minimum and ideal width, letting its existing flexible cells share spare space. Header labels keep intrinsic widths; no maximum width limits horizontal overflow. Only VoteResultTable changed. Localization (182 keys), More UI, settings parity (232 fields), and source whitespace checks pass. Native width assertions and German/light, English/dark, linked-motion screenshots remain the macOS gate.
